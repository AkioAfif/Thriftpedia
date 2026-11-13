const mongoose = require('mongoose');
const request = require('supertest');
const User = require('../../src/models/User');
const Product = require('../../src/models/Product');
const ROLES = require('../../src/constants/roles');
const { signToken } = require('./tokens');

let seq = 0;

async function createUser(role = ROLES.BUYER) {
  const n = ++seq;
  const user = await User.create({
    name: `User ${n}`,
    email: `user${n}@test.dev`,
    password: 'not-a-real-hash',
    role,
  });
  return { id: String(user._id), token: signToken({ id: user._id, role }) };
}

async function createProduct(overrides = {}) {
  return Product.create({
    name: `Jaket ${++seq}`,
    brand: 'Test Brand',
    photos: ['https://example.com/photo.jpg'],
    size: 'L',
    condition: 'GOOD_VINTAGE',
    price: 150000,
    ...overrides,
  });
}

async function placeOrder(app, buyer, productId) {
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${buyer.token}`)
    .send({ productId: String(productId) });
  if (res.status !== 201) throw new Error(`placeOrder failed with ${res.status}`);
  return res.body.data;
}

// Legal path from PENDING to each target status.
const PATH_FROM_PENDING = {
  PENDING: [],
  PROCESSING: ['PROCESSING'],
  SHIPPED: ['PROCESSING', 'SHIPPED'],
  COMPLETED: ['PROCESSING', 'SHIPPED', 'COMPLETED'],
  CANCELLED: ['CANCELLED'],
};

const statusBody = (status) =>
  status === 'SHIPPED' ? { status, trackingNumber: 'JNE0001', courier: 'JNE' } : { status };

// Walks a PENDING order to `target` through PATCH /api/orders/:id/status.
async function advanceOrder(app, admin, orderId, target) {
  let res;
  for (const status of PATH_FROM_PENDING[target]) {
    res = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send(statusBody(status));
    if (res.status !== 200) throw new Error(`advanceOrder to ${status} failed with ${res.status}: ${res.body?.message}`);
  }
  return res?.body.data;
}

const newId = () => new mongoose.Types.ObjectId().toString();

module.exports = { createUser, createProduct, placeOrder, advanceOrder, statusBody, newId };
