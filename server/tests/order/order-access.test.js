const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, placeOrder, newId } = require('../helpers/factories');
const app = require('../../src/app');
const ROLES = require('../../src/constants/roles');
const { ORDER_STATUS } = require('../../src/constants/order');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const get = (token, url) => {
  const req = request(app).get(url);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

async function seed() {
  const admin = await createUser(ROLES.ADMIN);
  const [a, b] = [await createUser(), await createUser()];
  const orderA1 = await placeOrder(app, a, (await createProduct())._id);
  const orderA2 = await placeOrder(app, a, (await createProduct())._id);
  const orderB = await placeOrder(app, b, (await createProduct())._id);
  await request(app)
    .patch(`/api/orders/${orderA2._id}`)
    .set('Authorization', `Bearer ${admin.token}`)
    .send({ status: ORDER_STATUS.COMPLETED });
  return { admin, a, b, orderA1, orderA2, orderB };
}

test('T10: buyer lists only their own orders', async () => {
  const { a, b } = await seed();

  const listA = await get(a.token, '/api/orders');
  const listB = await get(b.token, '/api/orders');

  assert.equal(listA.status, 200);
  assert.equal(listA.body.data.length, 2);
  assert.ok(listA.body.data.every((o) => o.buyer._id === a.id));
  assert.equal(listB.body.data.length, 1);
  assert.ok(listB.body.data.every((o) => o.buyer._id === b.id));
});

test('T11: admin lists all orders, optionally filtered by status', async () => {
  const { admin } = await seed();

  const all = await get(admin.token, '/api/orders');
  const pending = await get(admin.token, `/api/orders?status=${ORDER_STATUS.PENDING}`);
  const completed = await get(admin.token, `/api/orders?status=${ORDER_STATUS.COMPLETED}`);

  assert.equal(all.body.data.length, 3);
  assert.equal(pending.body.data.length, 2);
  assert.ok(pending.body.data.every((o) => o.status === ORDER_STATUS.PENDING));
  assert.equal(completed.body.data.length, 1);
});

test('T12: invalid status filter returns 400', async () => {
  const { a, admin } = await seed();
  assert.equal((await get(a.token, '/api/orders?status=INVALID')).status, 400);
  assert.equal((await get(admin.token, '/api/orders?status=pending')).status, 400);
});

test('T13: buyer gets their own order', async () => {
  const { a, orderA1 } = await seed();
  const res = await get(a.token, `/api/orders/${orderA1._id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data._id, orderA1._id);
});

test("T14: buyer cannot get another buyer's order", async () => {
  const { b, orderA1, admin } = await seed();
  assert.equal((await get(b.token, `/api/orders/${orderA1._id}`)).status, 403);
  assert.equal((await get(admin.token, `/api/orders/${orderA1._id}`)).status, 200);
});

test('T15: unknown order returns 404, invalid id returns 400', async () => {
  const { a, admin } = await seed();
  assert.equal((await get(admin.token, `/api/orders/${newId()}`)).status, 404);
  assert.equal((await get(a.token, '/api/orders/abc')).status, 400);
  assert.equal((await get(a.token, '/api/orders/aaaaaaaaaaaa')).status, 400);
});

test('T16: responses never contain password fields', async () => {
  const { admin, orderA1 } = await seed();

  const list = await get(admin.token, '/api/orders');
  const detail = await get(admin.token, `/api/orders/${orderA1._id}`);

  assert.doesNotMatch(JSON.stringify([list.body, detail.body]), /password/i);
  assert.deepEqual(Object.keys(detail.body.data.buyer).sort(), ['_id', 'email', 'name']);
});

test('order endpoints require authentication', async () => {
  const { orderA1 } = await seed();
  assert.equal((await get(null, '/api/orders')).status, 401);
  assert.equal((await get(null, `/api/orders/${orderA1._id}`)).status, 401);
});
