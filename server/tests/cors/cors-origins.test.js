const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
require('../helpers/tokens');

const APP_PATH = require.resolve('../../src/app');
const savedOrigins = process.env.CORS_ORIGINS;

// app.js reads CORS_ORIGINS when it is first required, so load a fresh copy per case.
function loadApp(corsOrigins) {
  if (corsOrigins === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = corsOrigins;
  delete require.cache[APP_PATH];
  return require(APP_PATH);
}

afterEach(() => {
  if (savedOrigins === undefined) delete process.env.CORS_ORIGINS;
  else process.env.CORS_ORIGINS = savedOrigins;
  delete require.cache[APP_PATH];
});

test('allows an origin listed in CORS_ORIGINS', async () => {
  const app = loadApp('https://thriftpedia.vercel.app/, http://localhost:3000');

  const res = await request(app).get('/api/health').set('Origin', 'https://thriftpedia.vercel.app');

  assert.equal(res.headers['access-control-allow-origin'], 'https://thriftpedia.vercel.app');
});

test('does not allow an origin missing from CORS_ORIGINS', async () => {
  const app = loadApp('https://thriftpedia.vercel.app');

  const res = await request(app).get('/api/health').set('Origin', 'https://evil.vercel.app');

  assert.equal(res.headers['access-control-allow-origin'], undefined);
});

test('allows no cross-origin access when CORS_ORIGINS is unset', async () => {
  const app = loadApp(undefined);

  const res = await request(app).get('/api/health').set('Origin', 'http://localhost:3000');

  assert.equal(res.status, 200);
  assert.equal(res.headers['access-control-allow-origin'], undefined);
});
