process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
process.env.MIDTRANS_IS_PRODUCTION = 'false';

const { test, before, after, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const request = require('supertest');
require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, placeOrder, advanceOrder, statusBody, newId } = require('../helpers/factories');
const app = require('../../src/app');
const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const ROLES = require('../../src/constants/roles');
const { PRODUCT_STATUS } = require('../../src/constants/product');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../src/constants/order');

let fetchMock;
const midtransReplies = (impl = async () => new Response('{}', { status: 200 })) =>
  (fetchMock = mock.method(globalThis, 'fetch', impl));

before(db.connect);
after(db.disconnect);
beforeEach(async () => {
  await db.clear();
  midtransReplies();
});
afterEach(() => mock.restoreAll());

const cancel = (token, orderId) => {
  const req = request(app).patch(`/api/orders/${orderId}/cancel`);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};
const reload = (id) => Order.findById(id).lean();
const productStatus = async (id) => (await Product.findById(id)).status;

async function setup() {
  const buyer = await createUser();
  const product = await createProduct();
  const order = await placeOrder(app, buyer, product._id);
  return { buyer, product, order };
}

test('C1: owner cancels a PENDING order; product is released for another buyer', async () => {
  const { buyer, product, order } = await setup();

  const res = await cancel(buyer.token, order._id);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, ORDER_STATUS.CANCELLED);
  const saved = await reload(order._id);
  assert.equal(saved.status, ORDER_STATUS.CANCELLED);
  assert.equal(saved.paymentStatus, PAYMENT_STATUS.UNPAID, 'kept UNPAID so a late payment is still recorded');
  const last = saved.statusHistory.at(-1);
  assert.equal(last.status, ORDER_STATUS.CANCELLED);
  assert.equal(String(last.by), buyer.id);
  assert.equal(last.note, 'Cancelled by buyer');
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
  assert.equal(fetchMock.mock.callCount(), 0, 'no Midtrans call without a payment token');

  const other = await createUser();
  await placeOrder(app, other, product._id); // throws unless 201
});

test('C2: auth, ownership, role, not found and bad id change nothing', async () => {
  const { product, order } = await setup();
  const other = await createUser();
  const admin = await createUser(ROLES.ADMIN);

  assert.equal((await cancel(null, order._id)).status, 401);
  assert.equal((await cancel(other.token, order._id)).status, 403);
  assert.equal((await cancel(admin.token, order._id)).status, 403);
  assert.equal((await cancel(other.token, newId())).status, 404);
  assert.equal((await cancel(other.token, 'abc')).status, 400);

  assert.equal((await reload(order._id)).status, ORDER_STATUS.PENDING);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('C3: only PENDING orders can be cancelled', async () => {
  const admin = await createUser(ROLES.ADMIN);
  for (const target of [ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.COMPLETED]) {
    const { buyer, product, order } = await setup();
    await advanceOrder(app, admin, order._id, target);

    assert.equal((await cancel(buyer.token, order._id)).status, 409, target);
    assert.equal((await reload(order._id)).status, target);
    assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
  }

  const { buyer, order } = await setup();
  assert.equal((await cancel(buyer.token, order._id)).status, 200);
  assert.equal((await cancel(buyer.token, order._id)).status, 409, 'second cancel');
  assert.equal((await reload(order._id)).statusHistory.length, 2);
});

test('C4: open Midtrans transaction is cancelled too', async () => {
  const { buyer, order } = await setup();
  await Order.updateOne({ _id: order._id }, { paymentToken: 'snap-token' });

  assert.equal((await cancel(buyer.token, order._id)).status, 200);

  assert.equal(fetchMock.mock.callCount(), 1);
  const [url, init] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, `https://api.sandbox.midtrans.com/v2/${order._id}/cancel`);
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, `Basic ${Buffer.from('test-server-key:').toString('base64')}`);
});

test('C5: a Midtrans failure never blocks the cancel', async () => {
  mock.method(console, 'warn', () => {});
  for (const impl of [async () => new Response('{}', { status: 500 }), async () => { throw new Error('offline'); }]) {
    const { buyer, product, order } = await setup();
    await Order.updateOne({ _id: order._id }, { paymentToken: 'snap-token' });
    midtransReplies(impl);

    assert.equal((await cancel(buyer.token, order._id)).status, 200);
    assert.equal((await reload(order._id)).status, ORDER_STATUS.CANCELLED);
    assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
  }
});

test('C6: payment arriving after a buyer cancel is recorded, order stays cancelled', async () => {
  const { buyer, product, order } = await setup();
  await cancel(buyer.token, order._id);
  const warn = mock.method(console, 'warn', () => {});

  const body = {
    order_id: String(order._id),
    status_code: '200',
    gross_amount: `${order.total}.00`,
    transaction_status: 'settlement',
  };
  body.signature_key = crypto
    .createHash('sha512')
    .update(`${body.order_id}${body.status_code}${body.gross_amount}test-server-key`)
    .digest('hex');
  assert.equal((await request(app).post('/api/payments/notification').send(body)).status, 200);

  const saved = await reload(order._id);
  assert.equal(saved.paymentStatus, PAYMENT_STATUS.PAID);
  assert.equal(saved.status, ORDER_STATUS.CANCELLED);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
  assert.equal(warn.mock.callCount(), 1);
});

test('C7: buyer cancel racing an admin update ends in exactly one consistent outcome', async () => {
  const admin = await createUser(ROLES.ADMIN);
  for (let i = 0; i < 5; i++) {
    const { buyer, product, order } = await setup();

    const [byBuyer, byAdmin] = await Promise.all([
      cancel(buyer.token, order._id),
      request(app)
        .patch(`/api/orders/${order._id}/status`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(statusBody(ORDER_STATUS.PROCESSING)),
    ]);

    assert.deepEqual([byBuyer.status, byAdmin.status].sort(), [200, 409]);
    const saved = await reload(order._id);
    const expected = byBuyer.status === 200 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.SOLD;
    assert.equal(saved.status, byBuyer.status === 200 ? ORDER_STATUS.CANCELLED : ORDER_STATUS.PROCESSING);
    assert.equal(await productStatus(product._id), expected);
  }
});
