const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { sendPasswordResetEmail } = require('../../src/services/email.service');

const ENV_KEYS = ['CLIENT_URL', 'RESEND_API_KEY', 'EMAIL_FROM'];
let savedEnv;

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  process.env.CLIENT_URL = 'https://shop.test/';
  process.env.RESEND_API_KEY = 're_test_key';
  process.env.EMAIL_FROM = 'Thriftpedia <onboarding@resend.dev>';
});

afterEach(() => {
  mock.restoreAll();
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) delete process.env[key];
    else process.env[key] = savedEnv[key];
  }
});

test('posts the reset link to Resend with the API key', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{"id":"1"}', { status: 200 }));

  await sendPasswordResetEmail('buyer@example.com', 'tok en');

  assert.equal(fetchMock.mock.callCount(), 1);
  const [url, init] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, 'https://api.resend.com/emails');
  assert.equal(init.method, 'POST');
  assert.equal(init.headers.Authorization, 'Bearer re_test_key');
  const body = JSON.parse(init.body);
  assert.equal(body.from, 'Thriftpedia <onboarding@resend.dev>');
  assert.equal(body.to, 'buyer@example.com');
  assert.match(body.text, /https:\/\/shop\.test\/reset-password\?token=tok%20en/);
});

test('throws when Resend rejects the email', async () => {
  mock.method(globalThis, 'fetch', async () => new Response('{"message":"invalid from"}', { status: 422 }));

  await assert.rejects(sendPasswordResetEmail('buyer@example.com', 'tok'), /Resend rejected the email \(422\)/);
});

test('throws before calling Resend when it is not configured', async () => {
  const fetchMock = mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 200 }));
  delete process.env.RESEND_API_KEY;

  await assert.rejects(sendPasswordResetEmail('buyer@example.com', 'tok'), /RESEND_API_KEY and EMAIL_FROM/);
  assert.equal(fetchMock.mock.callCount(), 0);
});
