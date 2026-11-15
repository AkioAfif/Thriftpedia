const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('../helpers/tokens');

const APP_PATH = require.resolve('../../src/app');
const saved = process.env.TRUST_PROXY_HOPS;

// app.js reads TRUST_PROXY_HOPS when it is first required, so load a fresh copy per case.
function loadApp(hops) {
  if (hops === undefined) delete process.env.TRUST_PROXY_HOPS;
  else process.env.TRUST_PROXY_HOPS = hops;
  delete require.cache[APP_PATH];
  return require(APP_PATH);
}

afterEach(() => {
  if (saved === undefined) delete process.env.TRUST_PROXY_HOPS;
  else process.env.TRUST_PROXY_HOPS = saved;
  delete require.cache[APP_PATH];
});

// Behind Vercel + Railway, X-Forwarded-For arrives as "visitor, vercel-edge" and the socket
// peer is the Railway edge.
async function resetLimitedFor(app, visitorIp) {
  let res;
  for (let i = 0; i < 6; i += 1) {
    res = await request(app)
      .post('/api/auth/forgot-password')
      .set('X-Forwarded-For', `${visitorIp}, 10.0.0.1`)
      .send({});
  }
  return res.status === 429;
}

test('with TRUST_PROXY_HOPS=2, the reset limiter counts each visitor separately', async () => {
  const app = loadApp('2');

  assert.equal(app.get('trust proxy'), 2);
  assert.equal(await resetLimitedFor(app, '203.0.113.1'), true);
  // A different visitor behind the same proxies still has their own quota.
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .set('X-Forwarded-For', '203.0.113.2, 10.0.0.1')
    .send({});
  assert.notEqual(res.status, 429);
});

test('without TRUST_PROXY_HOPS, proxy headers are not trusted', () => {
  const app = loadApp(undefined);

  assert.equal(app.get('trust proxy'), false);
});
