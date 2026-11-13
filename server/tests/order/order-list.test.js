const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, placeOrder, advanceOrder } = require('../helpers/factories');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Order = require('../../src/models/Order');
const ROLES = require('../../src/constants/roles');
const { ORDER_STATUS } = require('../../src/constants/order');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const list = (token, query = '') =>
  request(app).get(`/api/orders${query}`).set('Authorization', `Bearer ${token}`);

// 6 orders: TP-0001..TP-0006, ascending createdAt and price, two buyers.
async function seed() {
  const admin = await createUser(ROLES.ADMIN);
  const maya = await createUser();
  const rafi = await createUser();
  await User.updateOne({ _id: maya.id }, { name: 'Maya Putri', email: 'maya@thrift.dev' });
  await User.updateOne({ _id: rafi.id }, { name: 'Rafi Akbar', email: 'rafi@thrift.dev' });

  const plan = [
    [maya, 100000, ORDER_STATUS.PENDING],
    [rafi, 200000, ORDER_STATUS.PROCESSING],
    [maya, 300000, ORDER_STATUS.SHIPPED],
    [rafi, 400000, ORDER_STATUS.COMPLETED],
    [maya, 500000, ORDER_STATUS.CANCELLED],
    [rafi, 600000, ORDER_STATUS.PENDING],
  ];
  const orders = [];
  for (const [i, [buyer, price, status]] of plan.entries()) {
    const order = await placeOrder(app, buyer, (await createProduct({ price }))._id);
    await Order.updateOne({ _id: order._id }, { $set: { createdAt: new Date(Date.UTC(2026, 10, 1 + i)) } }, { timestamps: false });
    await advanceOrder(app, admin, order._id, status);
    orders.push(order);
  }
  return { admin, maya, rafi, orders };
}

test('L1: response is {items, meta, counts} with default page 1, limit 10', async () => {
  const { admin } = await seed();

  const res = await list(admin.token);

  assert.equal(res.status, 200);
  assert.deepEqual(Object.keys(res.body.data).sort(), ['counts', 'items', 'meta']);
  assert.deepEqual(res.body.data.meta, { total: 6, page: 1, limit: 10, totalPages: 1 });
  assert.deepEqual(res.body.data.counts, { ALL: 6, PENDING: 2, PROCESSING: 1, SHIPPED: 1, COMPLETED: 1, CANCELLED: 1 });
  assert.ok(res.body.data.items.every((o) => !('statusHistory' in o)), 'list stays light');
});

test('L2: pagination', async () => {
  const { admin } = await seed();

  const p1 = (await list(admin.token, '?page=1&limit=4')).body.data;
  const p2 = (await list(admin.token, '?page=2&limit=4')).body.data;
  const p3 = (await list(admin.token, '?page=3&limit=4')).body.data;

  assert.deepEqual(p1.meta, { total: 6, page: 1, limit: 4, totalPages: 2 });
  assert.equal(p1.items.length, 4);
  assert.equal(p2.items.length, 2);
  assert.equal(p3.items.length, 0);
  const ids = [...p1.items, ...p2.items].map((o) => o._id);
  assert.equal(new Set(ids).size, 6, 'no overlap between pages');
});

test('L3: status filter narrows items and meta but not counts', async () => {
  const { admin } = await seed();

  const res = (await list(admin.token, '?status=PENDING')).body.data;

  assert.equal(res.items.length, 2);
  assert.ok(res.items.every((o) => o.status === ORDER_STATUS.PENDING));
  assert.equal(res.meta.total, 2);
  assert.equal(res.counts.ALL, 6, 'tabs keep their totals');
});

test('L4: q searches orderNumber, buyer name and buyer email (case-insensitive); counts follow q', async () => {
  const { admin } = await seed();

  const byNumber = (await list(admin.token, '?q=tp-0004')).body.data;
  const byName = (await list(admin.token, '?q=maya')).body.data;
  const byEmail = (await list(admin.token, '?q=RAFI@THRIFT')).body.data;
  const combined = (await list(admin.token, '?q=maya&status=SHIPPED')).body.data;
  const regexChars = await list(admin.token, '?q=.*');

  assert.deepEqual(byNumber.items.map((o) => o.orderNumber), ['TP-0004']);
  assert.equal(byName.items.length, 3);
  assert.deepEqual(byName.counts, { ALL: 3, PENDING: 1, PROCESSING: 0, SHIPPED: 1, COMPLETED: 0, CANCELLED: 1 });
  assert.equal(byEmail.items.length, 3);
  assert.equal(combined.items.length, 1);
  assert.equal(combined.counts.ALL, 3);
  assert.equal(regexChars.body.data.items.length, 0, 'q is matched literally');
});

test('L5: sort newest, oldest, total_desc, total_asc', async () => {
  const { admin } = await seed();
  const numbers = async (sort) => (await list(admin.token, `?sort=${sort}`)).body.data.items.map((o) => o.orderNumber);
  const asc = ['TP-0001', 'TP-0002', 'TP-0003', 'TP-0004', 'TP-0005', 'TP-0006'];

  assert.deepEqual(await numbers('oldest'), asc);
  assert.deepEqual(await numbers('newest'), [...asc].reverse());
  assert.deepEqual(await numbers('total_asc'), asc);
  assert.deepEqual(await numbers('total_desc'), [...asc].reverse());
  assert.deepEqual(
    (await list(admin.token, '')).body.data.items.map((o) => o.orderNumber),
    [...asc].reverse(),
    'default is newest'
  );
});

test('L6: buyers get the same shape, scoped to their own orders', async () => {
  const { maya } = await seed();

  const res = (await list(maya.token, '?q=rafi')).body.data;
  const own = (await list(maya.token)).body.data;

  assert.equal(res.items.length, 0, 'cannot search into other buyers');
  assert.equal(own.counts.ALL, 3);
  assert.equal(own.meta.total, 3);
});

test('L7: invalid query parameters return 400', async () => {
  const { admin } = await seed();
  const bad = [
    '?foo=1',
    '?page=0',
    '?page=abc',
    '?page=1.5',
    '?limit=0',
    '?limit=51',
    '?limit=',
    '?sort=price_asc',
    '?status=DELIVERED',
    '?status=PENDING&status=SHIPPED',
    '?status[]=PENDING',
    `?q=${'x'.repeat(101)}`,
  ];
  for (const query of bad) {
    assert.equal((await list(admin.token, query)).status, 400, query);
  }
  assert.equal((await list(admin.token, '?limit=50')).status, 200, 'limit 50 is the maximum');
  assert.equal((await list(admin.token, '?q=')).status, 200, 'empty q means no search');
});
