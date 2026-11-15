process.env.MIDTRANS_SERVER_KEY = 'test-server-key';
process.env.MIDTRANS_IS_PRODUCTION = 'false';

const { test, before, after, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const request = require('supertest');
require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, advanceOrder, newId } = require('../helpers/factories');
const app = require('../../src/app');
const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const ROLES = require('../../src/constants/roles');
const { PRODUCT_STATUS } = require('../../src/constants/product');
const { ORDER_STATUS, PAYMENT_STATUS } = require('../../src/constants/order');

const ADDRESS = {
  recipientName: 'Budi Santoso',
  phone: '081234567890',
  address: 'Jl. Merdeka No. 1',
  city: 'Bandung',
  postalCode: '40111',
};

let fetchMock;
const snapReply = (status = 201, body = { token: 'snap-token', redirect_url: 'https://snap.test/pay' }) =>
  (fetchMock = mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(body), { status })));

before(db.connect);
after(db.disconnect);
beforeEach(async () => {
  await db.clear();
  snapReply();
});
afterEach(() => mock.restoreAll());

async function order(buyer, body = {}) {
  const product = await createProduct();
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({ productId: String(product._id), shippingAddress: { ...ADDRESS }, ...body });
  assert.equal(res.status, 201, res.body.message);
  return { order: res.body.data, product };
}

const pay = (token, orderId) => {
  const req = request(app).post(`/api/payments/${orderId}`);
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

function notification(orderDoc, fields = {}) {
  const body = {
    order_id: String(orderDoc._id),
    status_code: '200',
    gross_amount: `${orderDoc.total}.00`,
    transaction_status: 'settlement',
    fraud_status: 'accept',
    ...fields,
  };
  body.signature_key ??= crypto
    .createHash('sha512')
    .update(`${body.order_id}${body.status_code}${body.gross_amount}test-server-key`)
    .digest('hex');
  return body;
}
const notify = (body) => request(app).post('/api/payments/notification').send(body);
const reload = (id) => Order.findById(id).lean();
const productStatus = async (id) => (await Product.findById(id)).status;

// ---------- Snap token ----------

test('P1: owner gets a Snap token for a PENDING order; it is saved', async () => {
  const buyer = await createUser();
  const { order: o } = await order(buyer);

  const res = await pay(buyer.token, o._id);

  assert.equal(res.status, 201);
  assert.deepEqual(res.body.data, { token: 'snap-token', redirectUrl: 'https://snap.test/pay' });
  assert.equal(fetchMock.mock.callCount(), 1);
  const [url, init] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, 'https://app.sandbox.midtrans.com/snap/v1/transactions');
  assert.equal(init.headers.Authorization, `Basic ${Buffer.from('test-server-key:').toString('base64')}`);
  const sent = JSON.parse(init.body);
  assert.equal(sent.transaction_details.order_id, String(o._id));
  assert.equal(sent.transaction_details.gross_amount, o.total);
  assert.equal(sent.item_details[0].price, o.total);

  const saved = await reload(o._id);
  assert.equal(saved.paymentToken, 'snap-token');
  assert.equal(saved.paymentRedirectUrl, 'https://snap.test/pay');
  assert.equal(saved.paymentStatus, PAYMENT_STATUS.UNPAID);
});

test('P2: second request returns the same token without calling Midtrans again', async () => {
  const buyer = await createUser();
  const { order: o } = await order(buyer);
  await pay(buyer.token, o._id);

  const res = await pay(buyer.token, o._id);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.token, 'snap-token');
  assert.equal(fetchMock.mock.callCount(), 1);
});

test('P3: auth, ownership, role, not found and bad id', async () => {
  const owner = await createUser();
  const other = await createUser();
  const admin = await createUser(ROLES.ADMIN);
  const { order: o } = await order(owner);

  assert.equal((await pay(null, o._id)).status, 401);
  assert.equal((await pay(other.token, o._id)).status, 403);
  assert.equal((await pay(admin.token, o._id)).status, 403);
  assert.equal((await pay(owner.token, newId())).status, 404);
  assert.equal((await pay(owner.token, 'abc')).status, 400);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('P4: order without shipping address cannot be paid', async () => {
  const buyer = await createUser();
  const product = await createProduct();
  const created = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({ productId: String(product._id) });
  assert.equal(created.status, 201, 'shippingAddress stays optional at checkout');

  const res = await pay(buyer.token, created.body.data._id);
  assert.equal(res.status, 400);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('P5: cancelled or already paid orders return 409', async () => {
  const buyer = await createUser();
  const admin = await createUser(ROLES.ADMIN);
  const { order: cancelled } = await order(buyer);
  await advanceOrder(app, admin, cancelled._id, ORDER_STATUS.CANCELLED);
  assert.equal((await pay(buyer.token, cancelled._id)).status, 409);

  const { order: paid } = await order(buyer);
  await Order.updateOne({ _id: paid._id }, { paymentStatus: PAYMENT_STATUS.PAID });
  assert.equal((await pay(buyer.token, paid._id)).status, 409);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('P6: Midtrans error returns 502 and saves no token', async () => {
  const buyer = await createUser();
  const { order: o } = await order(buyer);
  snapReply(500, { error_messages: ['boom'] });
  mock.method(console, 'error', () => {});

  const res = await pay(buyer.token, o._id);

  assert.equal(res.status, 502);
  assert.equal((await reload(o._id)).paymentToken, null);
});

test('P7: missing server key returns 503', async (t) => {
  const buyer = await createUser();
  const { order: o } = await order(buyer);
  delete process.env.MIDTRANS_SERVER_KEY;
  t.after(() => (process.env.MIDTRANS_SERVER_KEY = 'test-server-key'));

  assert.equal((await pay(buyer.token, o._id)).status, 503);
});

// ---------- Webhook ----------

test('W1: invalid or missing signature returns 403 and changes nothing', async () => {
  const buyer = await createUser();
  const { order: o } = await order(buyer);

  assert.equal((await notify(notification(o, { signature_key: 'f'.repeat(128) }))).status, 403);
  assert.equal((await notify(notification(o, { signature_key: 'short' }))).status, 403);
  const { signature_key, ...unsigned } = notification(o);
  assert.equal((await notify(unsigned)).status, 400);
  // Signed with a different gross amount than the one sent.
  const tampered = { ...notification(o), gross_amount: '1.00' };
  assert.equal((await notify(tampered)).status, 403);

  assert.equal((await reload(o._id)).paymentStatus, PAYMENT_STATUS.UNPAID);
});

test('W2: settlement marks PAID and moves the order to PROCESSING', async () => {
  const buyer = await createUser();
  const { order: o, product } = await order(buyer);

  const res = await notify(notification(o));

  assert.equal(res.status, 200);
  const saved = await reload(o._id);
  assert.equal(saved.paymentStatus, PAYMENT_STATUS.PAID);
  assert.equal(saved.status, ORDER_STATUS.PROCESSING);
  const last = saved.statusHistory.at(-1);
  assert.equal(last.status, ORDER_STATUS.PROCESSING);
  assert.equal(last.by, null);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('W3: capture+accept pays; capture+challenge and pending change nothing', async () => {
  const buyer = await createUser();
  const { order: challenged } = await order(buyer);
  assert.equal((await notify(notification(challenged, { transaction_status: 'capture', fraud_status: 'challenge' }))).status, 200);
  assert.equal((await notify(notification(challenged, { transaction_status: 'pending', status_code: '201' }))).status, 200);
  assert.equal((await reload(challenged._id)).paymentStatus, PAYMENT_STATUS.UNPAID);
  assert.equal((await reload(challenged._id)).status, ORDER_STATUS.PENDING);

  const { order: accepted } = await order(buyer);
  await notify(notification(accepted, { transaction_status: 'capture', fraud_status: 'accept' }));
  assert.equal((await reload(accepted._id)).paymentStatus, PAYMENT_STATUS.PAID);
});

test('W4: expire cancels the order and releases the product for another buyer', async () => {
  const buyer = await createUser();
  const other = await createUser();
  const { order: o, product } = await order(buyer);

  const res = await notify(notification(o, { transaction_status: 'expire', status_code: '407' }));

  assert.equal(res.status, 200);
  const saved = await reload(o._id);
  assert.equal(saved.paymentStatus, PAYMENT_STATUS.EXPIRED);
  assert.equal(saved.status, ORDER_STATUS.CANCELLED);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);

  const rebuy = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${other.token}`)
    .send({ productId: String(product._id) });
  assert.equal(rebuy.status, 201);
});

test('W5: deny marks FAILED and releases the product', async () => {
  const buyer = await createUser();
  const { order: o, product } = await order(buyer);

  await notify(notification(o, { transaction_status: 'deny', fraud_status: 'deny', status_code: '202' }));

  const saved = await reload(o._id);
  assert.equal(saved.paymentStatus, PAYMENT_STATUS.FAILED);
  assert.equal(saved.status, ORDER_STATUS.CANCELLED);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
});

test('W6: repeated and late notifications are idempotent', async () => {
  const buyer = await createUser();
  const { order: o, product } = await order(buyer);

  assert.equal((await notify(notification(o))).status, 200);
  assert.equal((await notify(notification(o))).status, 200);
  assert.equal((await notify(notification(o, { transaction_status: 'expire', status_code: '407' }))).status, 200);

  const saved = await reload(o._id);
  assert.equal(saved.paymentStatus, PAYMENT_STATUS.PAID);
  assert.equal(saved.status, ORDER_STATUS.PROCESSING);
  assert.equal(saved.statusHistory.filter((e) => e.status === ORDER_STATUS.PROCESSING).length, 1);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('W7: amount mismatch returns 400; unknown order returns 404', async () => {
  const buyer = await createUser();
  const { order: o } = await order(buyer);

  assert.equal((await notify(notification(o, { gross_amount: '1.00' }))).status, 400);
  assert.equal((await notify(notification({ _id: newId(), total: o.total }))).status, 404);
  assert.equal((await notify(notification({ _id: 'TP-0001', total: o.total }))).status, 404);
  assert.equal((await reload(o._id)).paymentStatus, PAYMENT_STATUS.UNPAID);
});

test('W8: payment after an admin cancel records PAID but keeps the order cancelled', async () => {
  const buyer = await createUser();
  const admin = await createUser(ROLES.ADMIN);
  const { order: o, product } = await order(buyer);
  await advanceOrder(app, admin, o._id, ORDER_STATUS.CANCELLED);
  const warn = mock.method(console, 'warn', () => {});

  assert.equal((await notify(notification(o))).status, 200);

  const saved = await reload(o._id);
  assert.equal(saved.paymentStatus, PAYMENT_STATUS.PAID);
  assert.equal(saved.status, ORDER_STATUS.CANCELLED);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
  assert.equal(warn.mock.callCount(), 1);
});

test('W9: MIDTRANS_SIGNATURE_KEY, when set, is the only key accepted for webhook signatures', async (t) => {
  process.env.MIDTRANS_SIGNATURE_KEY = 'test-signature-key';
  t.after(() => delete process.env.MIDTRANS_SIGNATURE_KEY);
  const buyer = await createUser();
  const { order: o } = await order(buyer);
  const signedWith = (key) => {
    const body = notification(o, { signature_key: 'placeholder' });
    body.signature_key = crypto
      .createHash('sha512')
      .update(`${body.order_id}${body.status_code}${body.gross_amount}${key}`)
      .digest('hex');
    return body;
  };

  assert.equal((await notify(signedWith('test-server-key'))).status, 403, 'server key no longer signs');
  assert.equal((await reload(o._id)).paymentStatus, PAYMENT_STATUS.UNPAID);

  assert.equal((await notify(signedWith('test-signature-key'))).status, 200);
  assert.equal((await reload(o._id)).paymentStatus, PAYMENT_STATUS.PAID);
});

// ---------- Order creation with shippingAddress ----------

test('O1: shippingAddress is stored trimmed; invalid shapes return 400', async () => {
  const buyer = await createUser();
  const { order: o } = await order(buyer, { shippingAddress: { ...ADDRESS, city: '  Bandung  ' } });
  assert.equal((await reload(o._id)).shippingAddress.city, 'Bandung');

  const product = await createProduct();
  const bad = [
    'Jl. Merdeka',
    [],
    null,
    { ...ADDRESS, city: undefined },
    { ...ADDRESS, extra: 'x' },
    { ...ADDRESS, postalCode: '4011' },
    { ...ADDRESS, phone: 'call me' },
    { ...ADDRESS, recipientName: '   ' },
  ];
  for (const shippingAddress of bad) {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({ productId: String(product._id), shippingAddress });
    assert.equal(res.status, 400, JSON.stringify(shippingAddress));
  }
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
});
