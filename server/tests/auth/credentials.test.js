const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('../helpers/tokens'); // sets a test JWT_SECRET before src/app loads
const db = require('../helpers/db');
const app = require('../../src/app');
const ROLES = require('../../src/constants/roles');
const User = require('../../src/models/User');
const crypto = require('crypto');

before(db.connect);
after(db.disconnect);
beforeEach(db.clear);

const register = (body) => request(app).post('/api/auth/register').send(body);
const login = (body) => request(app).post('/api/auth/login').send(body);
const valid = { name: 'Maya Lestari', email: 'maya@test.dev', password: 'secret123' };

test('A1: login rejects an operator object as email with 400', async () => {
  await register(valid);

  const res = await login({ email: { $ne: null }, password: valid.password });

  assert.equal(res.status, 400);
  assert.equal(res.body.message, 'Email and password are required');
  assert.equal(res.body.data, undefined);
});

test('A2: register and login reject non-string fields with 400', async () => {
  for (const body of [
    { ...valid, email: { $gt: '' } },
    { ...valid, password: 12345678 },
    { ...valid, name: ['Maya'] },
  ]) {
    const res = await register(body);
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.deepEqual(Object.keys(res.body), ['message']);
  }
  assert.equal((await login({ email: 'maya@test.dev', password: { $ne: null } })).status, 400);
});

test('A3: register enforces name and password length', async () => {
  assert.equal((await register({ ...valid, name: 'x'.repeat(101) })).status, 400);
  assert.equal((await register({ ...valid, password: 'short1' })).status, 400);
  assert.equal((await register({ ...valid, password: 'a1'.repeat(37) })).status, 400);
  assert.equal((await register({ ...valid, password: 'a'.repeat(72) })).status, 400);
  assert.equal((await register({ ...valid, password: 'é'.repeat(36) + '1' })).status, 400);
  assert.equal((await register({ ...valid, password: 'a'.repeat(71) + '1' })).status, 201);
});

test('A4: email is trimmed and lower-cased; duplicate stays 400; role is always BUYER', async () => {
  const created = await register({ ...valid, email: '  Maya@Test.DEV ', role: ROLES.ADMIN });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.email, 'maya@test.dev');
  assert.equal(created.body.data.role, ROLES.BUYER);

  const dup = await register({ ...valid, email: 'MAYA@test.dev' });
  assert.equal(dup.status, 400);
  assert.equal(dup.body.message, 'Email is already registered');

  const res = await login({ email: ' MAYA@TEST.dev ', password: valid.password });
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.data.token, 'string');
  assert.equal(res.body.data.user.email, 'maya@test.dev');
});

test('password reset revokes old JWTs and consumes the reset token only once', async () => {
  await register(valid);
  const session = await login(valid);
  const resetToken = 'a'.repeat(64);
  await User.updateOne({ email: valid.email }, { $set: {
    resetPasswordToken: crypto.createHash('sha256').update(resetToken).digest('hex'),
    resetPasswordExpires: new Date(Date.now() + 60000),
  } });
  const body = { token: resetToken, password: 'newsecret123' };
  const results = await Promise.all([
    request(app).post('/api/auth/reset-password').send(body),
    request(app).post('/api/auth/reset-password').send(body),
  ]);
  assert.deepEqual(results.map((res) => res.status).sort(), [200, 400]);
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${session.body.data.token}`);
  assert.equal(me.status, 401);
  assert.equal((await login(valid)).status, 401);
  const renewed = await login({ ...valid, password: body.password });
  assert.equal(renewed.status, 200);
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${renewed.body.data.token}`)).status, 200);
});
