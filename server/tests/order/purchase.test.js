const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signToken } = require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, newId } = require('../helpers/factories');
const app = require('../../src/app');
const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const ROLES = require('../../src/constants/roles');
const { PRODUCT_STATUS } = require('../../src/constants/product');
const { ORDER_STATUS } = require('../../src/constants/order');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const buy = (token, body) => {
  const req = request(app).post('/api/orders');
  if (token) req.set('Authorization', `Bearer ${token}`);
  return body === undefined ? req : req.send(body);
};
const productStatus = async (id) => (await Product.findById(id)).status;

test('T1: buyer buys an AVAILABLE product', async () => {
  const buyer = await createUser();
  const product = await createProduct();

  const res = await buy(buyer.token, { productId: String(product._id) });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.status, ORDER_STATUS.PENDING);
  assert.equal(res.body.data.buyer, buyer.id);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('T2: buying a SOLD product returns 409 and creates no order', async () => {
  const [first, second] = [await createUser(), await createUser()];
  const product = await createProduct();
  await buy(first.token, { productId: String(product._id) });

  const res = await buy(second.token, { productId: String(product._id) });

  assert.equal(res.status, 409);
  assert.equal(await Order.countDocuments({ product: product._id }), 1);
});

test('T3: buying a non-existent product returns 404', async () => {
  const buyer = await createUser();
  const res = await buy(buyer.token, { productId: newId() });
  assert.equal(res.status, 404);
});

test('T4: invalid productId returns 400', async () => {
  const buyer = await createUser();
  for (const body of [{}, { productId: 'abc' }, { productId: 123 }, { productId: 'aaaaaaaaaaaa' }]) {
    const res = await buy(buyer.token, body);
    assert.equal(res.status, 400, `body ${JSON.stringify(body)}`);
  }
  assert.equal((await buy(buyer.token)).status, 400, 'no body');
  const malformed = await buy(buyer.token).set('Content-Type', 'application/json').send('{bad');
  assert.equal(malformed.status, 400, 'malformed JSON');
  assert.equal(await Order.countDocuments(), 0);
});

test('T5: missing, malformed or wrongly signed token returns 401', async () => {
  const buyer = await createUser();
  const product = await createProduct();
  const body = { productId: String(product._id) };
  const wrongSecret = signToken({ id: buyer.id, role: ROLES.BUYER }, 'wrong-secret');

  assert.equal((await buy(null, body)).status, 401);
  assert.equal((await buy('not-a-jwt', body)).status, 401);
  assert.equal((await buy(wrongSecret, body)).status, 401);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
});

test('T6: admin cannot create an order', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const product = await createProduct();
  const res = await buy(admin.token, { productId: String(product._id) });
  assert.equal(res.status, 403);
});

test('T7: client-supplied buyer and status are ignored', async () => {
  const [buyer, other] = [await createUser(), await createUser()];
  const product = await createProduct();

  const res = await buy(buyer.token, {
    productId: String(product._id),
    buyer: other.id,
    status: ORDER_STATUS.COMPLETED,
  });

  assert.equal(res.status, 201);
  const saved = await Order.findById(res.body.data._id);
  assert.equal(String(saved.buyer), buyer.id);
  assert.equal(saved.status, ORDER_STATUS.PENDING);
});

test('T8: only one of 10 concurrent purchases succeeds', async () => {
  const product = await createProduct();
  const buyers = await Promise.all(Array.from({ length: 10 }, () => createUser()));

  const responses = await Promise.all(
    buyers.map((b) => buy(b.token, { productId: String(product._id) }))
  );

  const codes = responses.map((r) => r.status);
  assert.equal(codes.filter((c) => c === 201).length, 1, `codes: ${codes}`);
  assert.equal(codes.filter((c) => c === 409).length, buyers.length - 1, `codes: ${codes}`);
  assert.equal(await Order.countDocuments({ product: product._id }), 1);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('T9: same buyer double-submitting concurrently gets one 201 and one 409', async () => {
  const buyer = await createUser();
  const product = await createProduct();

  const codes = (await Promise.all([
    buy(buyer.token, { productId: String(product._id) }),
    buy(buyer.token, { productId: String(product._id) }),
  ])).map((r) => r.status).sort();

  assert.deepEqual(codes, [201, 409]);
  assert.equal(await Order.countDocuments({ product: product._id }), 1);
});

test('failed order creation releases the claimed product', async (t) => {
  const buyer = await createUser();
  const product = await createProduct();
  t.mock.method(Order, 'create', async () => { throw new Error('simulated write failure'); });
  t.mock.method(console, 'error', () => {});

  const res = await buy(buyer.token, { productId: String(product._id) });

  assert.equal(res.status, 500);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
});
