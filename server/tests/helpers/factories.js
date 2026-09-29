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
    photos: ['https://example.com/photo.jpg'],
    size: 'L',
    condition: 'Bekas baik',
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

const newId = () => new mongoose.Types.ObjectId().toString();

module.exports = { createUser, createProduct, placeOrder, newId };
