const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { signToken } = require('../helpers/tokens');
const db = require('../helpers/db');
const { createUser, newId } = require('../helpers/factories');
const app = require('../../src/app');
const ROLES = require('../../src/constants/roles');

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

test('B3-5: token for a deleted user returns 404', async () => {
  const res = await getMe(signToken({ id: newId(), role: ROLES.BUYER }));
  assert.equal(res.status, 404);
  assert.equal(res.body.message, 'User not found');
});
