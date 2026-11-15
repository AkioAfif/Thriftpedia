const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const { JSDOM } = require('jsdom');

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const key of ['document', 'HTMLElement', 'MutationObserver']) global[key] = dom.window[key];
global.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom's window.location and window.open cannot be replaced, so the code under test sees a
// window whose `open` and `location` are fakes and everything else is jsdom's.
const fakes = { open: null, location: null };
global.window = new Proxy(dom.window, {
  get(target, key) {
    if (key in fakes && fakes[key]) return fakes[key];
    const value = Reflect.get(target, key, target);
    return typeof value === 'function' && !/^[A-Z]/.test(String(key)) ? value.bind(target) : value;
  },
});

// Compile the app's .js/.jsx with Next's own SWC, as in buyer.test.cjs.
const source = path.resolve(__dirname, '../../src');
const originalLoad = Module._load;
Module._load = function (request, parent, main) {
  if (request === 'react-hot-toast') return { __esModule: true, default: Object.assign(() => {}, { error() {} }) };
  if (request.startsWith('@/')) request = path.join(source, request.slice(2));
  return originalLoad.call(this, request, parent, main);
};
const originalJs = Module._extensions['.js'];
const { transformSync } = require('next/dist/build/swc');
Module._extensions['.js'] = function (module, filename) {
  if (!filename.startsWith(`${source}${path.sep}`)) return originalJs(module, filename);
  const result = transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' }, module: { type: 'commonjs' },
  });
  module._compile(result.code, filename);
};
Module._extensions['.jsx'] = Module._extensions['.js'];

const { renderHook, act, cleanup } = require('@testing-library/react');
const { useOrderPayment } = require('../../src/components/orders/useOrderPayment');

const ORDER = { _id: 'order-1', status: 'PENDING', paymentStatus: 'UNPAID', shippingAddress: {} };
const REDIRECT = 'https://app.sandbox.midtrans.com/snap/v4/redirection/abc';
let opened;
let assigned;

function fakeTab() {
  return { closed: false, opener: {}, document: {}, location: { href: '' }, close() { this.closed = true; } };
}

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY; // hosted page, no Snap popup
  opened = [];
  assigned = null;
  fakes.open = (url, target) => {
    const tab = fakeTab();
    opened.push({ url, target, tab });
    return tab;
  };
  fakes.location = { assign: (url) => { assigned = url; } };
  global.fetch = async () => new Response(JSON.stringify({ data: { token: 'snap-token', redirectUrl: REDIRECT } }), {
    status: 201, headers: { 'content-type': 'application/json' },
  });
});
afterEach(cleanup);

const renderPayment = () => renderHook(() => useOrderPayment({ order: ORDER, token: 'jwt', refresh: () => {} }));

test('Pay now opens Midtrans in a new tab and keeps this page', async () => {
  const { result } = renderPayment();

  await act(() => result.current.pay());

  assert.equal(opened.length, 1);
  assert.equal(opened[0].target, '_blank');
  assert.equal(opened[0].tab.opener, null, 'the payment tab cannot reach back into the shop');
  assert.equal(opened[0].tab.location.href, REDIRECT);
  assert.equal(assigned, null, 'the shop tab does not navigate away');
  assert.equal(result.current.busy, false);
});

test('the tab is opened before the token request, so it counts as part of the click', async () => {
  let openedBeforeFetch = null;
  global.fetch = async () => {
    openedBeforeFetch = opened.length === 1;
    return new Response(JSON.stringify({ data: { token: 't', redirectUrl: REDIRECT } }), { status: 201 });
  };
  const { result } = renderPayment();

  await act(() => result.current.pay());

  assert.equal(openedBeforeFetch, true);
});

test('the blank tab is closed again when the payment cannot start', async () => {
  global.fetch = async () => new Response(JSON.stringify({ message: 'Order is no longer payable' }), { status: 409 });
  const { result } = renderPayment();

  await act(() => result.current.pay());

  assert.equal(opened.length, 1);
  assert.equal(opened[0].tab.closed, true);
  assert.equal(assigned, null);
});

test('with popups blocked it falls back to this tab', async () => {
  fakes.open = () => null;
  const { result } = renderPayment();

  await act(() => result.current.pay());

  assert.equal(assigned, REDIRECT);
});
