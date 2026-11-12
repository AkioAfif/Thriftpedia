require('../helpers/tokens'); // harus dimuat sebelum src/app (JWT_SECRET)
const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const db = require('../helpers/db');
const { createUser, createProduct, placeOrder } = require('../helpers/factories');
const app = require('../../src/app');
const Order = require('../../src/models/Order');
const ROLES = require('../../src/constants/roles');
const { ORDER_STATUS } = require('../../src/constants/order');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const getSummary = (token) => {
  const req = request(app).get('/api/dashboard/summary');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

test('D1: request without token returns 401', async () => {
  const res = await getSummary();
  assert.equal(res.status, 401);
});

test('D2: buyer cannot read the dashboard summary (403)', async () => {
  const buyer = await createUser(ROLES.BUYER);
  const res = await getSummary(buyer.token);
  assert.equal(res.status, 403);
});

test('D3: admin gets zeros on an empty database', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const res = await getSummary(admin.token);

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, {
    products: { total: 0, available: 0, sold: 0 },
    orders: { pending: 0, completed: 0, cancelled: 0 },
  });
});

test('D4: admin gets correct product and order counts', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const buyer = await createUser(ROLES.BUYER);
  const [p1, p2, p3] = [await createProduct(), await createProduct(), await createProduct()];
  await createProduct(); // tetap AVAILABLE

  const o1 = await placeOrder(app, buyer, p1._id); // tetap PENDING
  const o2 = await placeOrder(app, buyer, p2._id);
  const o3 = await placeOrder(app, buyer, p3._id);
  await Order.updateOne({ _id: o2._id }, { status: ORDER_STATUS.COMPLETED });
  await Order.updateOne({ _id: o3._id }, { status: ORDER_STATUS.CANCELLED });
  assert.ok(o1._id);

  const res = await getSummary(admin.token);

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, {
    products: { total: 4, available: 1, sold: 3 },
    orders: { pending: 1, completed: 1, cancelled: 1 },
  });
});