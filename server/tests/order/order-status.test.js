const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, placeOrder, advanceOrder, statusBody, newId } = require('../helpers/factories');
const app = require('../../src/app');
const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const ROLES = require('../../src/constants/roles');
const { PRODUCT_STATUS } = require('../../src/constants/product');
const { ORDER_STATUS, ORDER_TRANSITIONS } = require('../../src/constants/order');
const { hasCompletedPurchase, productHasOrders } = require('../../src/services/order.service');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const { PENDING, PROCESSING, SHIPPED, COMPLETED, CANCELLED } = ORDER_STATUS;

// New endpoint by default; pass legacy=true for the deprecated PATCH /:orderId alias.
const patch = (token, orderId, body, { legacy = false } = {}) => {
  const req = request(app).patch(`/api/orders/${orderId}${legacy ? '' : '/status'}`);
  if (token) req.set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
};
const productStatus = async (id) => (await Product.findById(id)).status;

async function seed() {
  const admin = await createUser(ROLES.ADMIN);
  const buyer = await createUser();
  const product = await createProduct();
  const order = await placeOrder(app, buyer, product._id);
  return { admin, buyer, product, order };
}

test('S1: full happy path PENDING -> PROCESSING -> SHIPPED -> COMPLETED', async () => {
  const { admin, product, order } = await seed();

  const processing = await patch(admin.token, order._id, { status: PROCESSING });
  const shipped = await patch(admin.token, order._id, { status: SHIPPED, trackingNumber: '  JNE0012345 ', courier: 'JNE' });
  const completed = await patch(admin.token, order._id, { status: COMPLETED, note: 'Diterima pembeli' });

  assert.deepEqual([processing.status, shipped.status, completed.status], [200, 200, 200]);
  assert.equal(shipped.body.data.trackingNumber, 'JNE0012345', 'trimmed');
  assert.equal(shipped.body.data.courier, 'JNE');
  const data = completed.body.data;
  assert.equal(data.status, COMPLETED);
  assert.deepEqual(data.statusHistory.map((h) => h.status), [PENDING, PROCESSING, SHIPPED, COMPLETED]);
  assert.equal(data.statusHistory.at(-1).note, 'Diterima pembeli');
  assert.equal(data.statusHistory.at(-1).by._id, admin.id);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('S2: PATCH response has the populated detail shape', async () => {
  const { admin, order } = await seed();

  const res = await patch(admin.token, order._id, { status: PROCESSING });

  assert.equal(res.status, 200);
  assert.equal(typeof res.body.data.buyer, 'object');
  assert.deepEqual(Object.keys(res.body.data.buyer).sort(), ['_id', 'email', 'name']);
  assert.equal(typeof res.body.data.product.name, 'string');
  assert.deepEqual(res.body.data.allowedTransitions, ORDER_TRANSITIONS[PROCESSING]);
});

test('S3: every transition not in the table returns 409 and changes nothing', async () => {
  for (const from of Object.values(ORDER_STATUS)) {
    for (const to of [PROCESSING, SHIPPED, COMPLETED, CANCELLED]) {
      if (ORDER_TRANSITIONS[from].includes(to)) continue;
      await db.clear();
      const { admin, order } = await seed();
      await advanceOrder(app, admin, order._id, from);

      const res = await patch(admin.token, order._id, statusBody(to));

      assert.equal(res.status, 409, `${from} -> ${to}`);
      assert.equal((await Order.findById(order._id)).status, from, `${from} -> ${to} left status unchanged`);
    }
  }
});

test('S4: cancelling from PENDING or PROCESSING releases the product', async () => {
  for (const from of [PENDING, PROCESSING]) {
    await db.clear();
    const { admin, product, order } = await seed();
    await advanceOrder(app, admin, order._id, from);

    const res = await patch(admin.token, order._id, { status: CANCELLED, note: 'Stok rusak' });

    assert.equal(res.status, 200, from);
    assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE, from);
    const other = await createUser();
    await placeOrder(app, other, product._id); // can be bought again
    assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
  }
});

test('S5: a SHIPPED order cannot be cancelled and keeps the product SOLD', async () => {
  const { admin, product, order } = await seed();
  await advanceOrder(app, admin, order._id, SHIPPED);

  assert.equal((await patch(admin.token, order._id, { status: CANCELLED })).status, 409);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('S6: trackingNumber is required for SHIPPED and rejected otherwise', async () => {
  const { admin, order } = await seed();
  await advanceOrder(app, admin, order._id, PROCESSING);

  const bad = [
    { status: SHIPPED },
    { status: SHIPPED, trackingNumber: '' },
    { status: SHIPPED, trackingNumber: '   ' },
    { status: SHIPPED, trackingNumber: 123 },
    { status: SHIPPED, trackingNumber: 'x'.repeat(51) },
    { status: SHIPPED, trackingNumber: 'JNE1', courier: '' },
    { status: CANCELLED, trackingNumber: 'JNE1' },
    { status: CANCELLED, courier: 'JNE' },
    { status: CANCELLED, note: 'x'.repeat(501) },
  ];
  for (const body of bad) {
    assert.equal((await patch(admin.token, order._id, body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await Order.findById(order._id)).status, PROCESSING);

  const ok = await patch(admin.token, order._id, { status: SHIPPED, trackingNumber: 'SICEPAT9', courier: null });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.data.courier, null);
});

test('T20: invalid PATCH bodies return 400', async () => {
  const { admin, order } = await seed();
  const bodies = [
    { status: PENDING },
    { status: 'DELIVERED' },
    { status: PROCESSING, buyer: newId() },
    { status: PROCESSING, orderNumber: 'TP-9999' },
    {},
  ];
  for (const body of bodies) {
    assert.equal((await patch(admin.token, order._id, body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await patch(admin.token, order._id)).status, 400, 'no body');
  assert.equal((await patch(admin.token, 'abc', { status: PROCESSING })).status, 400, 'invalid id');
  assert.equal((await Order.findById(order._id)).status, PENDING);
});

test('PATCH on an unknown order returns 404', async () => {
  const { admin } = await seed();
  assert.equal((await patch(admin.token, newId(), { status: PROCESSING })).status, 404);
});

test('T21: buyer cannot update order status', async () => {
  const { buyer, order } = await seed();
  assert.equal((await patch(buyer.token, order._id, { status: CANCELLED })).status, 403);
  assert.equal((await patch(null, order._id, { status: CANCELLED })).status, 401);
});

test('T22: concurrent SHIPPED and CANCELLED updates, exactly one wins', async () => {
  const { admin, product, order } = await seed();
  await advanceOrder(app, admin, order._id, PROCESSING);

  const responses = await Promise.all([
    patch(admin.token, order._id, statusBody(SHIPPED)),
    patch(admin.token, order._id, { status: CANCELLED }),
  ]);

  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const saved = await Order.findById(order._id);
  const expected = saved.status === CANCELLED ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.SOLD;
  assert.equal(await productStatus(product._id), expected);
  assert.equal(saved.statusHistory.length, 3, 'only the winner is recorded');
});

test('legacy PATCH /:orderId still works and is marked deprecated', async () => {
  const { admin, order } = await seed();

  const res = await patch(admin.token, order._id, { status: PROCESSING }, { legacy: true });

  assert.equal(res.status, 200);
  assert.equal(res.headers.deprecation, 'true');
  assert.match(res.headers.link, new RegExp(`/api/orders/${order._id}/status`));
  assert.equal(res.body.data.status, PROCESSING);
  assert.equal((await patch(admin.token, order._id, { status: PENDING }, { legacy: true })).status, 400);
});

test('T23: hasCompletedPurchase and productHasOrders helpers', async () => {
  const { admin, buyer, product, order } = await seed();
  const untouched = await createProduct();

  assert.equal(await hasCompletedPurchase(buyer.id, product._id), false);
  await advanceOrder(app, admin, order._id, SHIPPED);
  assert.equal(await hasCompletedPurchase(buyer.id, product._id), false, 'SHIPPED is not completed');
  await patch(admin.token, order._id, { status: COMPLETED });
  assert.equal(await hasCompletedPurchase(buyer.id, product._id), true);

  const cancelledProduct = await createProduct();
  const cancelled = await placeOrder(app, buyer, cancelledProduct._id);
  await advanceOrder(app, admin, cancelled._id, CANCELLED);
  assert.equal(await hasCompletedPurchase(buyer.id, cancelledProduct._id), false);

  assert.equal(await productHasOrders(product._id), true);
  assert.equal(await productHasOrders(cancelledProduct._id), true);
  assert.equal(await productHasOrders(untouched._id), false);
});
