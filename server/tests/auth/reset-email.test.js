const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { sendPasswordResetEmail, parseSender } = require('../../src/services/email.service');

const ENV_KEYS = ['CLIENT_URL', 'BREVO_API_KEY', 'EMAIL_FROM'];
let savedEnv;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  process.env.CLIENT_URL = 'https://shop.test/';
  process.env.BREVO_API_KEY = ' xkeysib-test ';
  process.env.EMAIL_FROM = 'Thriftpedia <owner@gmail.com>';
});

afterEach(() => {
  mock.restoreAll();
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

test('posts the reset link to Brevo with the API key and parsed sender', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{"messageId":"1"}', { status: 201 }));

  await sendPasswordResetEmail('buyer@example.com', 'tok en');

  assert.equal(fetchMock.mock.callCount(), 1);
  const [url, init] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers['api-key'], 'xkeysib-test');
  const body = JSON.parse(init.body);
  assert.deepEqual(body.sender, { name: 'Thriftpedia', email: 'owner@gmail.com' });
  assert.deepEqual(body.to, [{ email: 'buyer@example.com' }]);
  assert.match(body.textContent, /https:\/\/shop\.test\/reset-password\?token=tok%20en/);
});

test('throws when Brevo rejects the email', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('{"code":"unauthorized"}', { status: 401 }));

  await assert.rejects(sendPasswordResetEmail('buyer@example.com', 'tok'), /Brevo rejected the email \(401\)/);
});

test('throws before calling Brevo when it is not configured', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 201 }));
  delete process.env.BREVO_API_KEY;

  await assert.rejects(sendPasswordResetEmail('buyer@example.com', 'tok'), /BREVO_API_KEY and EMAIL_FROM/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('parseSender accepts "Name <email>", quoted names and bare addresses', () => {
  assert.deepEqual(parseSender('Thriftpedia <a@b.com>'), { name: 'Thriftpedia', email: 'a@b.com' });
  assert.deepEqual(parseSender('"Thrift Pedia" <a@b.com>'), { name: 'Thrift Pedia', email: 'a@b.com' });
  assert.deepEqual(parseSender('<a@b.com>'), { email: 'a@b.com' });
  assert.deepEqual(parseSender('a@b.com'), { email: 'a@b.com' });
  assert.equal(parseSender('not an email'), null);
  assert.equal(parseSender(''), null);
});
