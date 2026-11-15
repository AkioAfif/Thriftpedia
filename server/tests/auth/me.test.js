const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signToken } = require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, newId } = require('../helpers/factories');
const app = require('../../src/app');
const ROLES = require('../../src/constants/roles');
const User = require('../../src/models/User');
const jwt = require('jsonwebtoken');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const getMe = (token) => {
  const req = request(app).get('/api/auth/me');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
};

test('B3-1: valid token returns the current user', async () => {
  const buyer = await createUser();

  const res = await getMe(buyer.token);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.id, buyer.id);
  assert.equal(res.body.data.role, ROLES.BUYER);
  assert.match(res.body.data.email, /@test\.dev$/);
  assert.deepEqual(Object.keys(res.body.data).sort(), ['email', 'id', 'name', 'role']);
});

test('B3-2: returns the admin role for an admin token', async () => {
  const admin = await createUser(ROLES.ADMIN);
  const res = await getMe(admin.token);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.role, ROLES.ADMIN);
});

test('B3-3: missing token returns 401', async () => {
  const res = await getMe();
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Authentication required');
});

test('B3-4: invalid token returns 401', async () => {
  assert.equal((await getMe('not-a-jwt')).status, 401);
  assert.equal((await getMe(signToken({ id: newId(), role: ROLES.BUYER }, 'wrong-secret'))).status, 401);
});

test('B3-5: token for a deleted user returns 401', async () => {
  const res = await getMe(signToken({ id: newId(), role: ROLES.BUYER }));
  assert.equal(res.status, 401);
});

test('authorization uses the database role after an admin is demoted', async () => {
  const admin = await createUser(ROLES.ADMIN);
  await User.updateOne({ _id: admin.id }, { $set: { role: ROLES.BUYER } });
  assert.equal((await getMe(admin.token)).body.data.role, ROLES.BUYER);
  const res = await request(app).get('/api/dashboard/summary').set('Authorization', `Bearer ${admin.token}`);
  assert.equal(res.status, 403);
});

test('expired tokens and tokens with invalid user ids return 401', async () => {
  const expired = jwt.sign({ id: newId(), role: ROLES.ADMIN }, process.env.JWT_SECRET, { expiresIn: -1 });
  assert.equal((await getMe(expired)).status, 401);
  assert.equal((await getMe(signToken({ id: 'bad-id', role: ROLES.ADMIN }))).status, 401);
});

test('incrementing tokenVersion revokes an existing session', async () => {
  const buyer = await createUser();
  await User.updateOne({ _id: buyer.id }, { $inc: { tokenVersion: 1 } });
  assert.equal((await getMe(buyer.token)).status, 401);
});
