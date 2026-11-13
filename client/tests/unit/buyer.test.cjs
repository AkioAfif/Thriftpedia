const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const Module = require('node:module');
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
for (const key of ['window', 'document', 'HTMLElement', 'HTMLDialogElement', 'FormData', 'localStorage', 'MutationObserver']) global[key] = dom.window[key];
global.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
global.matchMedia = window.matchMedia;
HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };

// Run the existing Next .js/JSX modules with Next's own installed SWC compiler.
// Only Next navigation/image rendering is adapted; the API client and feature
// components are real. No HTTP listener, MongoDB daemon or browser is required.
const React = require('react');
const h = React.createElement;
const source = path.resolve(__dirname, '../../src');
const originalLoad = Module._load;
Module._load = function (request, parent, main) {
  if (request === 'next/image') return { __esModule: true, default: ({ fill, unoptimized, priority, ...props }) => h('img', props) };
  if (request === 'next/link') return { __esModule: true, default: ({ children, ...props }) => h('a', props, children) };
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
const { render, screen, fireEvent, waitFor, cleanup, act } = require('@testing-library/react');
const { useQueryClient } = require('@tanstack/react-query');
const { AuthProvider } = require('../../src/context/AuthContext');
const { BuyerProvider, useWishlist } = require('../../src/context/BuyerContext');
const { WishlistButton } = require('../../src/components/catalog/WishlistButton');
const { ProductReviews } = require('../../src/components/reviews/ProductReviews');
const WishlistPage = require('../../src/app/wishlist/page').default;
const toast = require('react-hot-toast').default;

const user = { _id: 'buyer-1', name: 'Nayla', role: 'BUYER' };
const product = { _id: '507f1f77bcf86cd799439011', name: 'Denim Trucker Jacket', size: 'M', condition: 'LIKE_NEW', status: 'SOLD', price: 680000, photos: [] };
let saved, reviews, requests, failNext;
function Inspector() {
  const queryClient = useQueryClient();
  React.useEffect(() => () => queryClient.clear(), [queryClient]);
  const { count } = useWishlist();
  return h('output', { 'data-testid': 'count' }, String(count));
}
function mount(child) { return render(h(AuthProvider, null, h(BuyerProvider, null, h(Inspector), child))); }
function authenticate() { localStorage.setItem('token', 'buyer-token'); localStorage.setItem('user', JSON.stringify(user)); }
const pause = () => new Promise((resolve) => setTimeout(resolve, 10));
beforeEach(() => {
  localStorage.clear(); saved = [{ product }]; reviews = []; requests = []; failNext = '';
  global.fetch = async (url, options = {}) => {
    const method = options.method || 'GET'; const route = String(url);
    requests.push({ method, route, headers: options.headers, body: options.body && JSON.parse(options.body) });
    await pause();
    const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
    if (`${method} ${route}` === failNext) { failNext = ''; return response({ message: 'Temporary failure' }, 500); }
    if (route === '/api/auth/login') return response({ data: { token: 'buyer-token', user } });
    if (route === '/api/wishlist' && method === 'GET') return response({ data: saved });
    if (route === '/api/wishlist' && method === 'POST') { saved = [{ product }]; return response({ data: { product: product._id } }, 201); }
    if (route.startsWith('/api/wishlist/') && method === 'DELETE') { saved = []; return response({ message: 'Removed' }); }
    if (route.endsWith('/reviews') && method === 'GET') return response({ data: reviews });
    if (route.endsWith('/reviews') && method === 'POST') { reviews = [{ _id: 'review-1', buyer: user, createdAt: '2026-11-13T08:00:00Z', ...JSON.parse(options.body) }]; return response({ data: reviews[0] }, 201); }
    if (route.startsWith('/api/orders')) return response({ data: [] });
    throw new Error(`Unexpected test request ${method} ${route}`);
  };
});
afterEach(async () => { await act(async () => { cleanup(); toast.remove(); }); });

test('wishlist failure keeps card and count; one retry removes final item with no duplicate request', async () => {
  authenticate(); mount(h(WishlistPage));
  await screen.findByRole('button', { name: 'Remove Denim Trucker Jacket from wishlist' });
  assert.equal(screen.getByTestId('count').textContent, '1');
  failNext = `DELETE /api/wishlist/${product._id}`;
  fireEvent.click(screen.getByRole('button', { name: 'Remove Denim Trucker Jacket from wishlist' }));
  await screen.findByText('Server error occurred. Please try again later.');
  assert.equal(screen.getByTestId('count').textContent, '1');
  const button = screen.getByRole('button', { name: 'Remove Denim Trucker Jacket from wishlist' });
  fireEvent.click(button); fireEvent.click(button);
  await screen.findByRole('link', { name: 'Explore catalog' });
  assert.equal(screen.getByTestId('count').textContent, '0');
  assert.equal(requests.filter((req) => req.method === 'DELETE').length, 2);
  assert.ok(requests.filter((req) => req.method === 'DELETE').every((req) => req.headers.Authorization === 'Bearer buyer-token'));
});

test('contextual login resumes guest save and synchronizes all hearts and badge', async () => {
  saved = []; mount(h(WishlistButton, { productId: product._id, productName: product.name, product, inline: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Save Denim Trucker Jacket to wishlist' }));
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'nayla@test.dev' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'TestPassword1!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Log in & save' }));
  await screen.findByRole('button', { name: 'Remove Denim Trucker Jacket from wishlist' });
  await waitFor(() => assert.equal(screen.getByTestId('count').textContent, '1'));
  const saves = requests.filter((req) => req.method === 'POST' && req.route === '/api/wishlist');
  assert.equal(saves.length, 1); assert.deepEqual(saves[0].body, { productId: product._id });
  assert.equal(saves[0].headers.Authorization, 'Bearer buyer-token');
  assert.equal(localStorage.getItem('thriftpedia_token'), 'buyer-token');
});

test('review validates, confirms dirty close, preserves failed draft and submits an integer once', async () => {
  authenticate(); mount(h(ProductReviews, { product, order: { status: 'COMPLETED', buyer: user } }));
  fireEvent.click(await screen.findByRole('button', { name: 'Write a review' }));
  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
  await screen.findByText('! Choose a rating from 1 to 5 stars.');
  fireEvent.click(screen.getByRole('radio', { name: '3 stars' }));
  fireEvent.change(screen.getByLabelText('Comment (optional)'), { target: { value: 'A beautiful vintage find.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await screen.findByRole('heading', { name: 'Discard this draft?' });
  fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
  assert.equal(screen.getByLabelText('Comment (optional)').value, 'A beautiful vintage find.');
  failNext = `POST /api/products/${product._id}/reviews`;
  fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
  await screen.findByText(/Your draft is still here/);
  assert.equal(screen.getByRole('radio', { name: '3 stars' }).checked, true);
  const submit = screen.getByRole('button', { name: 'Try again' });
  fireEvent.click(submit); fireEvent.click(submit);
  await screen.findByRole('heading', { name: 'Your review' });
  assert.equal(screen.queryByRole('button', { name: 'Write a review' }), null);
  const posts = requests.filter((req) => req.method === 'POST' && req.route.endsWith('/reviews'));
  assert.equal(posts.length, 2); assert.deepEqual(posts[1].body, { rating: 3, comment: 'A beautiful vintage find.' });
  assert.equal(posts[1].headers.Authorization, 'Bearer buyer-token');
});

test('all four ineligible order statuses omit write action; public reviews require no token', async () => {
  authenticate();
  for (const status of ['PENDING', 'PROCESSING', 'SHIPPED', 'CANCELLED']) {
    const view = mount(h(ProductReviews, { product, order: { status, buyer: user } }));
    await screen.findByText('No reviews yet');
    assert.equal(screen.queryByRole('button', { name: 'Write a review' }), null);
    await act(async () => view.unmount());
  }
  localStorage.clear(); reviews = [{ _id: 'public-review', buyer: user, rating: 5, comment: 'Public review text', createdAt: '2026-11-13T08:00:00Z' }];
  mount(h(ProductReviews, { product }));
  await screen.findByText('Public review text');
  const last = requests.filter((req) => req.route.endsWith('/reviews')).at(-1);
  assert.equal(last.headers.Authorization, undefined);
});
