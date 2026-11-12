require('../helpers/tokens');

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const ROLES = require('../../src/constants/roles');
const { createUser, createProduct, newId } = require('../helpers/factories');

const validBody = () => ({
  name: 'Denim Jacket',
  brand: "Levi's",
  description: 'Small fade on the left sleeve.',
  photos: ['https://example.com/a.jpg'],
  size: 'M',
  condition: 'LIKE_NEW',
  price: 250000,
});

test.before(() => db.connect());
test.after(() => db.disconnect());
test.afterEach(() => db.clear());

test('admin can create a product with brand and description', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(validBody());
  assert.equal(res.status, 201);
  assert.equal(res.body.data.description, 'Small fade on the left sleeve.');
  assert.equal(res.body.data.status, 'AVAILABLE');
});

test('create without brand is rejected', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const body = validBody();
  delete body.brand;
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${admin.token}`)
    .send(body);
  assert.equal(res.status, 400);
});

test('description longer than 1000 characters is rejected', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ ...validBody(), description: 'x'.repeat(1001) });
  assert.equal(res.status, 400);
});

test('status field is rejected on create', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const res = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ ...validBody(), status: 'SOLD' });
  assert.equal(res.status, 400);
});

test('buyer cannot create and anonymous gets 401', async () => {
  const buyer = await createUser(ROLES.BUYER);
  const forbidden = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send(validBody());
  assert.equal(forbidden.status, 403);
  const anon = await request(app).post('/api/products').send(validBody());
  assert.equal(anon.status, 401);
});

test('admin can update an available product', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const product = await createProduct();
  const res = await request(app)
    .patch(`/api/products/${product._id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ price: 199000 });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.price, 199000);
});

test('updating a sold product is rejected with 409', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const product = await createProduct({ status: 'SOLD' });
  const res = await request(app)
    .patch(`/api/products/${product._id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ price: 1000 });
  assert.equal(res.status, 409);
});

test('updating a missing product returns 404', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const res = await request(app)
    .patch(`/api/products/${newId()}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ price: 1000 });
  assert.equal(res.status, 404);
});