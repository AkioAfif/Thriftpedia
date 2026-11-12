const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, createProduct } = require('../helpers/factories');
const Order = require('../../src/models/Order');
const Counter = require('../../src/models/Counter');
const User = require('../../src/models/User');
const { ORDER_STATUS } = require('../../src/constants/order');
const { migrateOrders, isLocalUri } = require('../../scripts/migrate-orders');
const { findActiveOrderDuplicates } = require('../../scripts/check-active-order-duplicates');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

// Raw insert: legacy orders only had buyer, product, status and timestamps.
async function insertLegacyOrder({ buyer, product, status, createdAt }) {
  const doc = { buyer: new mongoose.Types.ObjectId(buyer), product: product._id, status, createdAt, updatedAt: createdAt, __v: 0 };
  const { insertedId } = await Order.collection.insertOne(doc);
  return insertedId;
}

test('M1: migration backfills legacy orders oldest first', async () => {
  const buyer = await createUser();
  const [p1, p2] = [await createProduct({ price: 290000 }), await createProduct({ price: 820000 })];
  const older = await insertLegacyOrder({ buyer: buyer.id, product: p1, status: ORDER_STATUS.COMPLETED, createdAt: new Date('2026-01-01') });
  const newer = await insertLegacyOrder({ buyer: buyer.id, product: p2, status: ORDER_STATUS.PENDING, createdAt: new Date('2026-02-01') });

  const stats = await migrateOrders();
  assert.equal(stats.scanned, 2);
  assert.equal(stats.updated, 2);
  assert.equal(stats.orderNumbers, 2);

  const a = await Order.findById(older).lean();
  const b = await Order.findById(newer).lean();
  assert.equal(a.orderNumber, 'TP-0001');
  assert.equal(b.orderNumber, 'TP-0002');
  assert.equal(a.total, 290000);
  assert.equal(a.productSnapshot.name, p1.name);
  assert.equal(a.buyerSnapshot.email, (await User.findById(buyer.id)).email);
  assert.deepEqual(a.statusHistory.map((h) => h.status), [ORDER_STATUS.PENDING, ORDER_STATUS.COMPLETED]);
  assert.deepEqual(b.statusHistory.map((h) => h.status), [ORDER_STATUS.PENDING]);
  assert.equal(a.trackingNumber, null);
  assert.equal((await Counter.findById('order')).seq, 2);
});

test('M2: running the migration twice changes nothing the second time', async () => {
  const buyer = await createUser();
  await insertLegacyOrder({ buyer: buyer.id, product: await createProduct(), status: ORDER_STATUS.CANCELLED, createdAt: new Date() });

  await migrateOrders();
  const snapshot = await Order.find().lean();
  const second = await migrateOrders();

  assert.deepEqual(second, { scanned: 0, updated: 0, orderNumbers: 0, missingBuyer: 0, missingProduct: 0 });
  assert.deepEqual(await Order.find().lean(), snapshot);
  assert.equal((await Counter.findById('order')).seq, 1);
});

test('M3: dry run reports work but writes nothing', async () => {
  const buyer = await createUser();
  await insertLegacyOrder({ buyer: buyer.id, product: await createProduct(), status: ORDER_STATUS.PENDING, createdAt: new Date() });

  const stats = await migrateOrders({ dryRun: true });

  assert.equal(stats.updated, 1);
  assert.equal((await Order.findOne().lean()).orderNumber, undefined);
  assert.equal(await Counter.countDocuments(), 0);
});

test('M4: deleted buyer or product is reported and stored as null', async () => {
  const buyer = await createUser();
  const product = await createProduct();
  const id = await insertLegacyOrder({ buyer: buyer.id, product, status: ORDER_STATUS.PENDING, createdAt: new Date() });
  await User.deleteOne({ _id: buyer.id });
  await product.deleteOne();

  const stats = await migrateOrders();
  const order = await Order.findById(id).lean();

  assert.equal(stats.missingBuyer, 1);
  assert.equal(stats.missingProduct, 1);
  assert.deepEqual(order.buyerSnapshot, { name: null, email: null });
  assert.equal(order.total, null);
  assert.ok(order.orderNumber);
});

test('M5: only local MongoDB URIs pass the remote guard', () => {
  assert.equal(isLocalUri('mongodb://localhost:27017/thrift'), true);
  assert.equal(isLocalUri('mongodb://user:pw@127.0.0.1:27017,localhost:27018/thrift?replicaSet=rs0'), true);
  assert.equal(isLocalUri('mongodb+srv://user:pw@cluster0.example.mongodb.net/thrift'), false);
  assert.equal(isLocalUri('mongodb://db.example.com:27017/thrift'), false);
  assert.equal(isLocalUri('mongodb://localhost:27017,db.example.com:27017/thrift'), false);
});

test('M6: duplicate check finds a product held by two active orders', async () => {
  const buyer = await createUser();
  const product = await createProduct();
  const clean = await createProduct();
  // Legacy data written without the index's protection (dropped for this test only).
  await Order.collection.dropIndex('uniq_active_order_per_product');
  try {
    await insertLegacyOrder({ buyer: buyer.id, product, status: ORDER_STATUS.PENDING, createdAt: new Date() });
    await insertLegacyOrder({ buyer: buyer.id, product, status: ORDER_STATUS.PROCESSING, createdAt: new Date() });
    await insertLegacyOrder({ buyer: buyer.id, product: clean, status: ORDER_STATUS.PENDING, createdAt: new Date() });
    await insertLegacyOrder({ buyer: buyer.id, product: clean, status: ORDER_STATUS.CANCELLED, createdAt: new Date() });

    const duplicates = await findActiveOrderDuplicates();

    assert.equal(duplicates.length, 1);
    assert.equal(String(duplicates[0]._id), String(product._id));
    assert.equal(duplicates[0].count, 2);
  } finally {
    await Order.deleteMany({});
    await Order.syncIndexes(); // restore the index for the remaining tests
  }
});
