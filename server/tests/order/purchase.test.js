const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signToken } = require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, newId } = require('../helpers/factories');
const app = require('../../src/app');
const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');
const Counter = require('../../src/models/Counter');
const mongoose = require('mongoose');
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
  assert.equal((await Counter.findById('order')).seq, 1, 'losers did not consume order numbers');
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

test('failed order creation rolls back the product claim (transaction)', async (t) => {
  const buyer = await createUser();
  const product = await createProduct();
  t.mock.method(Order, 'create', async () => { throw new Error('simulated write failure'); });
  t.mock.method(console, 'error', () => {});

  const res = await buy(buyer.token, { productId: String(product._id) });

  assert.equal(res.status, 500);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
  assert.equal(await Order.countDocuments(), 0);
  assert.equal((await Counter.findById('order'))?.seq ?? 0, 0, 'order number not consumed');
});

test('C1: checkout stores orderNumber, snapshots, total and initial history', async () => {
  const buyer = await createUser();
  const product = await createProduct({ price: 290000, name: 'Suede Bucket Hat' });

  const res = await buy(buyer.token, { productId: String(product._id) });
  const saved = await Order.findById(res.body.data._id).lean();

  assert.equal(saved.orderNumber, 'TP-0001');
  assert.equal(saved.total, 290000);
  assert.deepEqual(saved.productSnapshot, {
    name: 'Suede Bucket Hat', brand: product.brand, photo: product.photos[0],
    size: product.size, condition: product.condition, price: 290000,
  });
  assert.equal(saved.buyerSnapshot.email, (await User.findById(buyer.id)).email);
  assert.equal(saved.statusHistory.length, 1);
  assert.equal(saved.statusHistory[0].status, ORDER_STATUS.PENDING);
  assert.equal(String(saved.statusHistory[0].by), buyer.id);
  assert.equal(saved.trackingNumber, null);
});

test('C2: rejected checkouts do not consume order numbers', async () => {
  const [first, second] = [await createUser(), await createUser()];
  const product = await createProduct();
  await buy(first.token, { productId: String(product._id) });
  await buy(second.token, { productId: String(product._id) }); // 409

  const next = await buy(second.token, { productId: String((await createProduct())._id) });

  assert.equal(next.body.data.orderNumber, 'TP-0002');
});

test('C3: 10 concurrent checkouts of different products get 10 unique order numbers', async () => {
  const products = await Promise.all(Array.from({ length: 10 }, () => createProduct()));
  const buyers = await Promise.all(products.map(() => createUser()));

  const responses = await Promise.all(products.map((p, i) => buy(buyers[i].token, { productId: String(p._id) })));

  assert.ok(responses.every((r) => r.status === 201), responses.map((r) => r.status).join(','));
  const numbers = responses.map((r) => r.body.data.orderNumber).sort();
  assert.equal(new Set(numbers).size, 10);
  assert.deepEqual(numbers, Array.from({ length: 10 }, (_, i) => `TP-${String(i + 1).padStart(4, '0')}`));
});

test('C4: DB index rejects a second ACTIVE order for the same product', async () => {
  const [a, b] = [await createUser(), await createUser()];
  const product = await createProduct();
  const res = await buy(a.token, { productId: String(product._id) });

  for (const status of [ORDER_STATUS.PENDING, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED]) {
    await assert.rejects(
      Order.collection.insertOne({ buyer: new mongoose.Types.ObjectId(b.id), product: product._id, status }),
      (err) => err.code === 11000,
      status
    );
  }

  // Terminal orders do not hold the product, so history rows are allowed.
  await Order.updateOne({ _id: res.body.data._id }, { status: ORDER_STATUS.CANCELLED });
  await Order.collection.insertOne({ buyer: new mongoose.Types.ObjectId(b.id), product: product._id, status: ORDER_STATUS.CANCELLED });
  await Order.collection.insertOne({ buyer: new mongoose.Types.ObjectId(b.id), product: product._id, status: ORDER_STATUS.PENDING });
  assert.equal(await Order.countDocuments({ product: product._id }), 3);
});

test('C5: index violation during checkout surfaces as 409, not 500', async () => {
  const [a, b] = [await createUser(), await createUser()];
  const product = await createProduct();
  // Simulate inconsistent legacy data: an active order exists but the product says AVAILABLE.
  await Order.collection.insertOne({ buyer: new mongoose.Types.ObjectId(a.id), product: product._id, status: ORDER_STATUS.PROCESSING });

  const res = await buy(b.token, { productId: String(product._id) });

  assert.equal(res.status, 409);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE, 'claim rolled back');
});

test('C6: a deleted buyer account cannot check out', async () => {
  const buyer = await createUser();
  const product = await createProduct();
  await User.deleteOne({ _id: buyer.id });

  const res = await buy(buyer.token, { productId: String(product._id) });

  assert.equal(res.status, 401);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
});
