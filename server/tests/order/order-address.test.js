const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, placeOrder, advanceOrder, newId } = require('../helpers/factories');
const app = require('../../src/app');
const Order = require('../../src/models/Order');
const ROLES = require('../../src/constants/roles');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../src/constants/order');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const VALID = {
  recipientName: 'Budi Santoso',
  phone: '081234567890',
  address: 'Jl. Merdeka No. 1',
  city: 'Bandung',
  postalCode: '40111',
};

const saveAddress = (token, orderId, body = { shippingAddress: VALID }) => {
  const req = request(app).patch(`/api/orders/${orderId}/address`);
  return (token ? req.set('Authorization', `Bearer ${token}`) : req).send(body);
};
const reload = (id) => Order.findById(id).lean();

async function setup() {
  const buyer = await createUser();
  const product = await createProduct();
  const order = await placeOrder(app, buyer, product._id); // checkout without an address
  return { buyer, product, order };
}

test('A1: owner saves an address on a PENDING, unpaid order; data matches GET /orders/:id', async () => {
  const { buyer, order } = await setup();

  const res = await saveAddress(buyer.token, order._id, {
    shippingAddress: { ...VALID, recipientName: '  Budi Santoso  ', city: ' Bandung ' },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.message, 'Address saved');
  assert.deepEqual(res.body.data.shippingAddress, VALID, 'values are trimmed');
  assert.deepEqual((await reload(order._id)).shippingAddress, VALID);

  const detail = await request(app).get(`/api/orders/${order._id}`).set('Authorization', `Bearer ${buyer.token}`);
  assert.deepEqual(res.body.data, detail.body.data, 'same shape as GET /api/orders/:orderId');
  assert.ok(res.body.data.statusHistory.every((entry) => !('by' in entry)), 'buyer never sees who changed the status');
  assert.deepEqual(res.body.data.allowedTransitions, []);
  assert.equal(res.body.data.status, ORDER_STATUS.PENDING);
  assert.equal(res.body.data.paymentStatus, PAYMENT_STATUS.UNPAID);
});

test('A2: replacing an existing address works', async () => {
  const { buyer, order } = await setup();
  assert.equal((await saveAddress(buyer.token, order._id)).status, 200);

  const next = { ...VALID, address: 'Jl. Asia Afrika No. 8', city: 'Yogyakarta', postalCode: '55281' };
  const res = await saveAddress(buyer.token, order._id, { shippingAddress: next });

  assert.equal(res.status, 200);
  assert.deepEqual((await reload(order._id)).shippingAddress, next);
});

test('A3: invalid bodies and unknown fields return 400 and change nothing', async () => {
  const { buyer, order } = await setup();
  const bad = [
    {},
    { shippingAddress: null },
    { shippingAddress: 'Jl. Merdeka' },
    { shippingAddress: [] },
    { shippingAddress: {} },
    { shippingAddress: VALID, note: 'extra' },
    { shippingAddress: { ...VALID, country: 'ID' } },
    { shippingAddress: { ...VALID, recipientName: '   ' } },
    { shippingAddress: { ...VALID, recipientName: 'x'.repeat(101) } },
    { shippingAddress: { ...VALID, phone: '0812' } },
    { shippingAddress: { ...VALID, phone: '0812-3456-7890' } },
    { shippingAddress: { ...VALID, phone: '1234567890123456' } },
    { shippingAddress: { ...VALID, address: 'x'.repeat(501) } },
    { shippingAddress: { ...VALID, city: 'x'.repeat(101) } },
    { shippingAddress: { ...VALID, postalCode: '4011' } },
    { shippingAddress: { ...VALID, postalCode: '40A11' } },
    { shippingAddress: { ...VALID, postalCode: 40111 } },
  ];
  for (const body of bad) {
    const res = await saveAddress(buyer.token, order._id, body);
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80));
  }
  assert.equal((await reload(order._id)).shippingAddress, undefined);

  // The same rules as checkout: a leading + and 15 digits are fine.
  assert.equal(
    (await saveAddress(buyer.token, order._id, { shippingAddress: { ...VALID, phone: '+628123456789012' } })).status,
    200
  );
});

test('A4: bad id 400, no token 401, admin 403, not the owner 403, unknown order 404', async () => {
  const { buyer, order } = await setup();
  const other = await createUser();
  const admin = await createUser(ROLES.ADMIN);

  assert.equal((await saveAddress(buyer.token, 'abc')).status, 400);
  assert.equal((await saveAddress(null, order._id)).status, 401);
  assert.equal((await saveAddress(admin.token, order._id)).status, 403);
  assert.equal((await saveAddress(other.token, order._id)).status, 403);
  assert.equal((await saveAddress(buyer.token, newId())).status, 404);

  assert.equal((await reload(order._id)).shippingAddress, undefined);
});

test('A5: status other than PENDING returns 409', async () => {
  const admin = await createUser(ROLES.ADMIN);
  for (const target of [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED]) {
    const { buyer, order } = await setup();
    await advanceOrder(app, admin, order._id, target);

    const res = await saveAddress(buyer.token, order._id);
    assert.equal(res.status, 409, target);
    assert.match(res.body.message, /Address can no longer be changed/);
    assert.equal((await reload(order._id)).shippingAddress, undefined);
  }
});

test('A6: paymentStatus other than UNPAID returns 409', async () => {
  for (const paymentStatus of [PAYMENT_STATUS.PAID, PAYMENT_STATUS.EXPIRED, PAYMENT_STATUS.FAILED]) {
    const { buyer, order } = await setup();
    await Order.updateOne({ _id: order._id }, { paymentStatus }); // still PENDING

    assert.equal((await saveAddress(buyer.token, order._id)).status, 409, paymentStatus);
    assert.equal((await reload(order._id)).shippingAddress, undefined);
  }
});

test('A7: an existing payment token returns 409 and keeps the old address', async () => {
  const { buyer, order } = await setup();
  assert.equal((await saveAddress(buyer.token, order._id)).status, 200);
  await Order.updateOne({ _id: order._id }, { paymentToken: 'snap-token' });

  const res = await saveAddress(buyer.token, order._id, { shippingAddress: { ...VALID, city: 'Jakarta' } });

  assert.equal(res.status, 409);
  assert.equal((await reload(order._id)).shippingAddress.city, 'Bandung');
});

test('A8: a legacy order without paymentStatus counts as UNPAID', async () => {
  const { buyer, order } = await setup();
  await Order.collection.updateOne({ _id: new mongoose.Types.ObjectId(order._id) }, { $unset: { paymentStatus: '' } });

  assert.equal((await saveAddress(buyer.token, order._id)).status, 200);
  assert.deepEqual((await reload(order._id)).shippingAddress, VALID);
});
