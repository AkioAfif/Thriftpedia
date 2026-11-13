require('../helpers/tokens');

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const ROLES = require('../../src/constants/roles');
const Product = require('../../src/models/Product');
const { settlePhotoCleanups } = require('../../src/services/product.service');
const { publicIdFromUrl, PRODUCT_PHOTO_FOLDER } = require('../../src/services/photoStorage.service');
const { createUser } = require('../helpers/factories');
const { mockCloudinary, cloudUrl, IMAGES } = require('../helpers/cloudinaryMock');

test.before(() => db.connect());
test.after(() => db.disconnect());
test.afterEach(() => db.clear());

const id = (n) => `${PRODUCT_PHOTO_FOLDER}/existing-${n}`;
const body = (photos) => ({ name: 'Denim Jacket', brand: "Levi's", photos, size: 'M', condition: 'LIKE_NEW', price: 250000 });

const upload = (token, files) => {
  const req = request(app).post('/api/products/upload');
  if (token) req.set('Authorization', `Bearer ${token}`);
  for (const [buffer, filename, contentType] of files) req.attach('photos', buffer, { filename, contentType });
  return req;
};
const createProduct = (token, photos) =>
  request(app).post('/api/products').set('Authorization', `Bearer ${token}`).send(body(photos));
const patchPhotos = (token, productId, photos) =>
  request(app).patch(`/api/products/${productId}`).set('Authorization', `Bearer ${token}`).send({ photos });

// ---------- upload ----------

test('UP1: admin uploads JPG/PNG/WEBP to Cloudinary folder; response has url + publicId', async (t) => {
  const cloud = mockCloudinary(t);
  const admin = await createUser(ROLES.ADMIN);

  const res = await upload(admin.token, [
    [IMAGES.jpg, 'a.jpg', 'image/jpeg'],
    [IMAGES.png, 'b.png', 'image/png'],
    [IMAGES.webp, 'c.webp', 'image/webp'],
  ]);

  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.equal(cloud.uploads.length, 3);
  assert.ok(cloud.uploads.every((u) => u.options.folder === 'thriftpedia/products' && u.options.resource_type === 'image'));
  assert.equal(res.body.data.urls.length, 3);
  assert.ok(res.body.data.urls.every((u) => u.startsWith('https://res.cloudinary.com/test-cloud/')));
  assert.deepEqual(res.body.data.photos.map((p) => p.publicId), [0, 1, 2].map((n) => `thriftpedia/products/photo-${n}`));
});

test('UP2: missing Cloudinary env gives a clear 503, not a crash', async (t) => {
  const cloud = mockCloudinary(t, { env: null });
  t.mock.method(console, 'error', () => {});
  const admin = await createUser(ROLES.ADMIN);

  const res = await upload(admin.token, [[IMAGES.png, 'a.png', 'image/png']]);

  assert.equal(res.status, 503);
  assert.match(res.body.message, /not configured.*CLOUDINARY_CLOUD_NAME/);
  assert.equal(cloud.uploads.length, 0);
  assert.equal((await request(app).get('/api/health')).status, 200, 'server still up');
});

test('UP3: wrong type, spoofed content, oversize and no file are rejected with 400 before upload', async (t) => {
  const cloud = mockCloudinary(t);
  const admin = await createUser(ROLES.ADMIN);

  const cases = [
    [[[Buffer.from('GIF89a........'), 'a.gif', 'image/gif']], /JPG, PNG, or WEBP/],
    [[[Buffer.from('<?php echo 1; ?> not an image'), 'evil.png', 'image/png']], /not a valid JPG, PNG, or WEBP/],
    [[[Buffer.concat([IMAGES.png, Buffer.alloc(5 * 1024 * 1024)]), 'big.png', 'image/png']], /5 MB/],
    [Array.from({ length: 6 }, (_, i) => [IMAGES.png, `p${i}.png`, 'image/png']), /Maximum 5 photos/],
    [[], /No photos uploaded/],
  ];
  for (const [files, message] of cases) {
    const res = await upload(admin.token, files);
    assert.equal(res.status, 400, `${message}: ${JSON.stringify(res.body)}`);
    assert.match(res.body.message, message);
  }
  assert.equal(cloud.uploads.length, 0, 'nothing reached Cloudinary');
});

test('UP4: if one upload fails, the others are removed again and the request returns 502', async (t) => {
  const cloud = mockCloudinary(t, { failUploadAt: 1 });
  t.mock.method(console, 'error', () => {});
  const admin = await createUser(ROLES.ADMIN);

  const res = await upload(admin.token, [
    [IMAGES.png, 'a.png', 'image/png'],
    [IMAGES.png, 'b.png', 'image/png'],
    [IMAGES.png, 'c.png', 'image/png'],
  ]);

  assert.equal(res.status, 502);
  assert.match(res.body.message, /storage failed/);
  assert.deepEqual(cloud.destroyed.sort(), ['thriftpedia/products/photo-0', 'thriftpedia/products/photo-2']);
});

test('UP5: only admins can upload', async (t) => {
  const cloud = mockCloudinary(t);
  const buyer = await createUser(ROLES.BUYER);
  assert.equal((await upload(buyer.token, [[IMAGES.png, 'a.png', 'image/png']])).status, 403);
  assert.equal((await upload(null, [[IMAGES.png, 'a.png', 'image/png']])).status, 401);
  assert.equal(cloud.uploads.length, 0);
});

// ---------- stored secure_url + public_id ----------

test('PH1: create stores secure_url and public_id; foreign URLs get publicId null', async (t) => {
  mockCloudinary(t);
  const admin = await createUser(ROLES.ADMIN);
  const photos = [
    cloudUrl(id(1)),
    'https://placehold.co/600x600.png',
    cloudUrl(id(2), 'someone-else'),
    'https://res.cloudinary.com/test-cloud/image/upload/v1/other-folder/x.jpg',
    'http://localhost:5000/uploads/products/old.jpg',
  ];

  const res = await createProduct(admin.token, photos);

  assert.equal(res.status, 201, JSON.stringify(res.body));
  assert.deepEqual(res.body.data.photos, photos, 'API contract unchanged');
  const saved = await Product.findById(res.body.data._id).lean();
  assert.deepEqual(saved.photoAssets.map((p) => p.publicId), [id(1), null, null, null, null]);
  assert.deepEqual(saved.photoAssets.map((p) => p.url), photos);
});

test('PH2: replacing photos deletes only the dropped Cloudinary files; reordering deletes nothing', async (t) => {
  const cloud = mockCloudinary(t);
  const admin = await createUser(ROLES.ADMIN);
  const created = (await createProduct(admin.token, [cloudUrl(id(1)), cloudUrl(id(2)), 'https://placehold.co/a.png'])).body.data;

  const reordered = await patchPhotos(admin.token, created._id, [cloudUrl(id(2)), cloudUrl(id(1)), 'https://placehold.co/a.png']);
  await settlePhotoCleanups();
  assert.equal(reordered.status, 200);
  assert.deepEqual(cloud.destroyed, []);

  const replaced = await patchPhotos(admin.token, created._id, [cloudUrl(id(2)), cloudUrl(id(3))]);
  await settlePhotoCleanups();
  assert.equal(replaced.status, 200);
  assert.deepEqual(replaced.body.data.photos, [cloudUrl(id(2)), cloudUrl(id(3))]);
  assert.deepEqual(cloud.destroyed, [id(1)]);
  const saved = await Product.findById(created._id).lean();
  assert.deepEqual(saved.photoAssets.map((p) => p.publicId), [id(2), id(3)]);
});

test('PH3: editing other fields never touches photos', async (t) => {
  const cloud = mockCloudinary(t);
  const admin = await createUser(ROLES.ADMIN);
  const created = (await createProduct(admin.token, [cloudUrl(id(1))])).body.data;

  const res = await request(app).patch(`/api/products/${created._id}`).set('Authorization', `Bearer ${admin.token}`).send({ price: 1000 });
  await settlePhotoCleanups();

  assert.equal(res.status, 200);
  assert.equal(res.body.data.price, 1000);
  assert.deepEqual(cloud.destroyed, []);
});

test('PH4: deleting a product deletes its Cloudinary files only', async (t) => {
  const cloud = mockCloudinary(t);
  const admin = await createUser(ROLES.ADMIN);
  const created = (await createProduct(admin.token, [cloudUrl(id(1)), 'https://placehold.co/a.png', cloudUrl(id(2))])).body.data;

  const res = await request(app).delete(`/api/products/${created._id}`).set('Authorization', `Bearer ${admin.token}`);
  await settlePhotoCleanups();

  assert.equal(res.status, 200);
  assert.deepEqual(cloud.destroyed.sort(), [id(1), id(2)]);
});

test('PH5: a Cloudinary outage never fails update or delete', async (t) => {
  mockCloudinary(t, { destroyThrows: true });
  t.mock.method(console, 'warn', () => {});
  const admin = await createUser(ROLES.ADMIN);
  const a = (await createProduct(admin.token, [cloudUrl(id(1)), cloudUrl(id(2))])).body.data;
  const b = (await createProduct(admin.token, [cloudUrl(id(3))])).body.data;

  const updated = await patchPhotos(admin.token, a._id, [cloudUrl(id(2))]);
  const deleted = await request(app).delete(`/api/products/${b._id}`).set('Authorization', `Bearer ${admin.token}`);
  await settlePhotoCleanups();

  assert.equal(updated.status, 200);
  assert.equal(deleted.status, 200);
  assert.equal(await Product.countDocuments({ _id: b._id }), 0);
});

test('PH6: a photo still used by another product is not deleted', async (t) => {
  const cloud = mockCloudinary(t);
  const admin = await createUser(ROLES.ADMIN);
  const a = (await createProduct(admin.token, [cloudUrl(id(1))])).body.data;
  await createProduct(admin.token, [cloudUrl(id(1))]);

  await request(app).delete(`/api/products/${a._id}`).set('Authorization', `Bearer ${admin.token}`);
  await settlePhotoCleanups();

  assert.deepEqual(cloud.destroyed, []);
});

test('PH7: without Cloudinary env, delete still succeeds and cleanup is skipped', async (t) => {
  const cloud = mockCloudinary(t);
  t.mock.method(console, 'warn', () => {});
  const admin = await createUser(ROLES.ADMIN);
  const created = (await createProduct(admin.token, [cloudUrl(id(1))])).body.data;
  delete process.env.CLOUDINARY_API_SECRET; // restored by the mock helper

  const res = await request(app).delete(`/api/products/${created._id}`).set('Authorization', `Bearer ${admin.token}`);
  await settlePhotoCleanups();

  assert.equal(res.status, 200);
  assert.deepEqual(cloud.destroyed, []);
});

test('PH8: publicIdFromUrl accepts only our cloud and folder', (t) => {
  mockCloudinary(t);
  assert.equal(publicIdFromUrl(cloudUrl(id(1))), id(1));
  assert.equal(publicIdFromUrl(`https://res.cloudinary.com/test-cloud/image/upload/${id(1)}.png`), id(1), 'no version segment');
  assert.equal(publicIdFromUrl(`http://res.cloudinary.com/test-cloud/image/upload/v1/${id(1)}.jpg`), null, 'http');
  assert.equal(publicIdFromUrl(`https://evil.example/test-cloud/image/upload/v1/${id(1)}.jpg`), null, 'other host');
  assert.equal(publicIdFromUrl('https://res.cloudinary.com/test-cloud/image/upload/v1/thriftpedia/products/../../x.jpg'), null, 'traversal');
  assert.equal(publicIdFromUrl('not a url'), null);
});
