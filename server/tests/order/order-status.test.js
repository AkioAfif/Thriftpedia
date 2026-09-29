const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct, placeOrder, newId } = require('../helpers/factories');
const app = require('../../src/app');
const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const ROLES = require('../../src/constants/roles');
const { PRODUCT_STATUS } = require('../../src/constants/product');
const { ORDER_STATUS } = require('../../src/constants/order');
const { hasCompletedPurchase, productHasOrders } = require('../../src/services/order.service');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const patch = (token, orderId, body) => {
  const req = request(app).patch(`/api/orders/${orderId}`);
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

test('T17: admin completes a PENDING order and the product stays SOLD', async () => {
  const { admin, product, order } = await seed();

  const res = await patch(admin.token, order._id, { status: ORDER_STATUS.COMPLETED });

  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, ORDER_STATUS.COMPLETED);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('T18: admin cancels a PENDING order and the product can be bought again', async () => {
  const { admin, product, order } = await seed();

  const res = await patch(admin.token, order._id, { status: ORDER_STATUS.CANCELLED });

  assert.equal(res.status, 200);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.AVAILABLE);
  const other = await createUser();
  await placeOrder(app, other, product._id);
  assert.equal(await productStatus(product._id), PRODUCT_STATUS.SOLD);
});

test('T19: terminal orders cannot change status', async () => {
  const { admin, buyer, order } = await seed();
  await patch(admin.token, order._id, { status: ORDER_STATUS.COMPLETED });
  assert.equal((await patch(admin.token, order._id, { status: ORDER_STATUS.CANCELLED })).status, 409);

  const cancelled = await placeOrder(app, buyer, (await createProduct())._id);
  await patch(admin.token, cancelled._id, { status: ORDER_STATUS.CANCELLED });
  assert.equal((await patch(admin.token, cancelled._id, { status: ORDER_STATUS.COMPLETED })).status, 409);
});

test('T20: invalid PATCH bodies return 400', async () => {
  const { admin, order } = await seed();
  const bodies = [
    { status: ORDER_STATUS.PENDING },
    { status: 'SHIPPED' },
    { status: ORDER_STATUS.COMPLETED, buyer: newId() },
    {},
  ];
  for (const body of bodies) {
    assert.equal((await patch(admin.token, order._id, body)).status, 400, JSON.stringify(body));
  }
  assert.equal((await patch(admin.token, order._id)).status, 400, 'no body');
  assert.equal((await patch(admin.token, 'abc', { status: ORDER_STATUS.COMPLETED })).status, 400, 'invalid id');
  assert.equal((await Order.findById(order._id)).status, ORDER_STATUS.PENDING);
});

test('PATCH on an unknown order returns 404', async () => {
  const { admin } = await seed();
  assert.equal((await patch(admin.token, newId(), { status: ORDER_STATUS.COMPLETED })).status, 404);
});

test('T21: buyer cannot update order status', async () => {
  const { buyer, order } = await seed();
  assert.equal((await patch(buyer.token, order._id, { status: ORDER_STATUS.CANCELLED })).status, 403);
  assert.equal((await patch(null, order._id, { status: ORDER_STATUS.CANCELLED })).status, 401);
});

test('T22: concurrent COMPLETED and CANCELLED updates, exactly one wins', async () => {
  const { admin, product, order } = await seed();

  const responses = await Promise.all([
    patch(admin.token, order._id, { status: ORDER_STATUS.COMPLETED }),
    patch(admin.token, order._id, { status: ORDER_STATUS.CANCELLED }),
  ]);

  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409]);
  const final = (await Order.findById(order._id)).status;
  const expected = final === ORDER_STATUS.CANCELLED ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.SOLD;
  assert.equal(await productStatus(product._id), expected);
});

test('T23: hasCompletedPurchase and productHasOrders helpers', async () => {
  const { admin, buyer, product, order } = await seed();
  const untouched = await createProduct();

  assert.equal(await hasCompletedPurchase(buyer.id, product._id), false);
  await patch(admin.token, order._id, { status: ORDER_STATUS.COMPLETED });
  assert.equal(await hasCompletedPurchase(buyer.id, product._id), true);

  const cancelledProduct = await createProduct();
  const cancelled = await placeOrder(app, buyer, cancelledProduct._id);
  await patch(admin.token, cancelled._id, { status: ORDER_STATUS.CANCELLED });
  assert.equal(await hasCompletedPurchase(buyer.id, cancelledProduct._id), false);

  assert.equal(await productHasOrders(product._id), true);
  assert.equal(await productHasOrders(cancelledProduct._id), true);
  assert.equal(await productHasOrders(untouched._id), false);
});
