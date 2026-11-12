require('../helpers/tokens');

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const db = require('../helpers/db');
const Product = require('../../src/models/Product');
const { createProduct } = require('../helpers/factories');
const { mockCloudinary, IMAGES } = require('../helpers/cloudinaryMock');
const { reportLegacyPhotos, isLegacyPhoto, isLocalUri } = require('../../scripts/report-legacy-photos');

test.before(() => db.connect());
test.after(() => db.disconnect());
test.afterEach(() => db.clear());

function tempUploads(t, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-photos-'));
  for (const [name, buf] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), buf);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

async function seed() {
  const local = await createProduct({ name: 'Local photos', photos: [
    'http://localhost:5000/uploads/products/kept.png',
    'https://placehold.co/600x600.png',
    'http://127.0.0.1:5000/uploads/products/gone.jpg',
  ] });
  const clean = await createProduct({ name: 'Already fine', photos: ['https://res.cloudinary.com/test-cloud/image/upload/v1/thriftpedia/products/a.jpg'] });
  const relative = await createProduct({ name: 'Relative path', photos: ['/uploads/products/gone2.webp'] });
  return { local, clean, relative };
}

test('LG1: dry run reports legacy photos and changes nothing', async (t) => {
  const cloud = mockCloudinary(t);
  const { local, relative } = await seed();
  const dir = tempUploads(t, { 'kept.png': IMAGES.png });
  const before = await Product.find().lean();

  const report = await reportLegacyPhotos({ uploadsDir: dir });

  assert.deepEqual(report.map((r) => r.id).sort(), [String(local._id), String(relative._id)].sort());
  const row = report.find((r) => r.id === String(local._id));
  assert.equal(row.legacyPhotos, 2);
  assert.equal(row.movable, 1);
  assert.deepEqual(row.needsReupload, ['http://127.0.0.1:5000/uploads/products/gone.jpg']);
  assert.equal(cloud.uploads.length, 0);
  assert.deepEqual(await Product.find().lean(), before);
});

test('LG2: --apply moves files that still exist, keeps order, and is idempotent', async (t) => {
  const cloud = mockCloudinary(t);
  const { local } = await seed();
  const dir = tempUploads(t, { 'kept.png': IMAGES.png });

  const first = await reportLegacyPhotos({ apply: true, uploadsDir: dir });
  const saved = await Product.findById(local._id).lean();

  assert.equal(first.find((r) => r.id === String(local._id)).migrated, 1);
  assert.equal(cloud.uploads.length, 1);
  assert.match(saved.photos[0], /^https:\/\/res\.cloudinary\.com\/test-cloud\//);
  assert.equal(saved.photos[1], 'https://placehold.co/600x600.png');
  assert.equal(saved.photos[2], 'http://127.0.0.1:5000/uploads/products/gone.jpg', 'missing file left for re-upload');
  assert.equal(saved.photoAssets[0].publicId, 'thriftpedia/products/photo-0');

  const second = await reportLegacyPhotos({ apply: true, uploadsDir: dir });
  assert.equal(cloud.uploads.length, 1, 'nothing uploaded twice');
  assert.equal(second.find((r) => r.id === String(local._id)).migrated, 0);
});

test('LG3: helpers', () => {
  assert.equal(isLegacyPhoto('http://localhost:5000/uploads/products/a.jpg'), true);
  assert.equal(isLegacyPhoto('https://api.example.com/uploads/products/a.jpg'), true);
  assert.equal(isLegacyPhoto('/uploads/products/a.jpg'), true);
  assert.equal(isLegacyPhoto('https://res.cloudinary.com/x/image/upload/v1/a.jpg'), false);
  assert.equal(isLegacyPhoto('https://placehold.co/600x600.png'), false);
  assert.equal(isLocalUri('mongodb://localhost:27017/thriftpedia'), true);
  assert.equal(isLocalUri('mongodb+srv://user:pw@cluster0.example.mongodb.net/db'), false);
});
