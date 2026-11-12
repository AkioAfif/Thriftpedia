require('../helpers/tokens'); // harus dimuat sebelum src/app (JWT_SECRET)
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const db = require('../helpers/db');
const { createProduct } = require('../helpers/factories');
const app = require('../../src/app');
const { PRODUCT_STATUS } = require('../../src/constants/product');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const list = (query = '') => request(app).get(`/api/products${query}`);

async function seedThree() {
  await createProduct();
  await createProduct();
  await createProduct({ status: PRODUCT_STATUS.SOLD });
}

test('P1: status=SOLD returns only sold products', async () => {
  await seedThree();
  const res = await list('?status=SOLD');

  assert.equal(res.status, 200);
  assert.equal(res.body.meta.total, 1);
  assert.equal(res.body.data[0].status, PRODUCT_STATUS.SOLD);
});

test('P2: status=AVAILABLE returns only available products', async () => {
  await seedThree();
  const res = await list('?status=AVAILABLE');

  assert.equal(res.status, 200);
  assert.equal(res.body.meta.total, 2);
  assert.ok(res.body.data.every((p) => p.status === PRODUCT_STATUS.AVAILABLE));
});

test('P3: without status, all products are returned', async () => {
  await seedThree();
  const res = await list();

  assert.equal(res.status, 200);
  assert.equal(res.body.meta.total, 3);
});

test('P4: invalid status returns 400', async () => {
  const res = await list('?status=PENDING');
  assert.equal(res.status, 400);
});

test('P5: hideSold with status=SOLD returns 400', async () => {
  const res = await list('?hideSold=true&status=SOLD');
  assert.equal(res.status, 400);
});

test('P6: hideSold=true still works without status', async () => {
  await seedThree();
  const res = await list('?hideSold=true');

  assert.equal(res.status, 200);
  assert.equal(res.body.meta.total, 2);
});