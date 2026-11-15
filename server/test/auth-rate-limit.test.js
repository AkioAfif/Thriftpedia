const { test } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
process.env.JWT_SECRET ??= 'isolated-rate-limit-test-secret';
const app = require('../src/app');

test('login and registration limit repeated attempts independently', async () => {
  // Invalid input returns before a database operation; only the HTTP limiter is exercised.
  for (let attempt = 0; attempt < 100; attempt += 1) {
    assert.equal((await request(app).post('/api/auth/login').send({})).status, 400);
  }
  const blockedLogin = await request(app).post('/api/auth/login').send({});
  assert.equal(blockedLogin.status, 429);
  assert.ok(blockedLogin.headers['retry-after']);
  assert.equal((await request(app).post('/api/auth/register').send({})).status, 400);
  for (let attempt = 1; attempt < 50; attempt += 1) {
    assert.equal((await request(app).post('/api/auth/register').send({})).status, 400);
  }
  assert.equal((await request(app).post('/api/auth/register').send({})).status, 429);
});
