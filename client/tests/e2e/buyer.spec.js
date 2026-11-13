import { test, expect } from '@playwright/test';

const api = 'http://127.0.0.1:5000';
let fixture;
test.beforeEach(async ({ request }) => { fixture = await (await request.post(`${api}/__test/reset`)).json(); });
async function login(page) {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token); localStorage.setItem('thriftpedia_token', token); localStorage.setItem('user', JSON.stringify(user));
  }, fixture);
}

test('wishlist uses real API, retains failed removal, blocks double clicks, and keeps sold detail readable', async ({ page, request }) => {
  await login(page); await page.goto('/wishlist');
  await expect(page.getByText('3 items', { exact: true })).toBeVisible();
  for (const width of [1440, 834, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `test-results/wishlist-${width}.png`, fullPage: true });
  }
  const card = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Denim Trucker Jacket' }) });
  await card.getByRole('link', { name: 'View details' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Denim Trucker Jacket' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buy now', exact: true })).toHaveCount(0);
  await page.goto('/wishlist');
  await request.post(`${api}/__test/fail`, { data: { method: 'DELETE', path: `/api/wishlist/${fixture.ids[0]}` } });
  await page.getByRole('button', { name: 'Remove Denim Trucker Jacket from wishlist' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Server error' })).toBeVisible();
  await expect(page.getByText('3 items', { exact: true })).toBeVisible();
  const control = page.getByRole('button', { name: 'Remove Denim Trucker Jacket from wishlist' });
  await control.evaluate((button) => { button.click(); button.click(); });
  await expect(page.getByText('2 items', { exact: true })).toBeVisible();
  const stats = await (await request.get(`${api}/__test/stats`)).json();
  expect(stats[`DELETE /api/wishlist/${fixture.ids[0]}`]).toBe(2); // failure + exactly one retry
  await page.getByRole('button', { name: 'Remove Harrington Jacket from wishlist' }).click();
  await expect(page.getByText('1 item', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Corduroy Pants from wishlist' }).click();
  await expect(page.getByRole('link', { name: 'Explore catalog' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wishlist, 0 items' })).toBeVisible();
});

test('guest login resumes the exact product save and updates shared navbar count', async ({ page, request }) => {
  await request.delete(`${api}/api/wishlist/${fixture.ids[1]}`, { headers: { Authorization: `Bearer ${fixture.token}` } });
  await page.goto(`/catalog/${fixture.ids[1]}`);
  await page.getByRole('button', { name: 'Save Harrington Jacket to wishlist' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Log in to save Harrington Jacket');
  await dialog.getByLabel('Email', { exact: true }).fill('nayla@test.dev');
  await dialog.getByLabel('Password', { exact: true }).fill('TestPassword1!');
  await dialog.getByRole('button', { name: 'Log in & save' }).click();
  await expect(page.getByRole('button', { name: 'Remove Harrington Jacket from wishlist' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wishlist, 3 items' })).toBeVisible();
});

test('review validates, retains draft on failure, confirms discard, and publishes only once', async ({ page, request }) => {
  await login(page); await page.setViewportSize({ width: 390, height: 980 });
  await page.goto(`/orders/${fixture.orderId}`);
  await page.getByRole('button', { name: 'Write a review' }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Submit review', exact: true }).click();
  await expect(dialog.getByText('! Choose a rating from 1 to 5 stars.')).toBeVisible();
  await dialog.getByRole('radio', { name: '3 stars', exact: true }).focus();
  await dialog.getByRole('radio', { name: '3 stars', exact: true }).press('Space');
  const comment = 'Exactly as pictured. The denim fits perfectly.';
  await dialog.getByLabel('Comment (optional)').fill(comment);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog.getByRole('heading', { name: 'Discard this draft?' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Keep editing' }).click();
  await expect(dialog.getByLabel('Comment (optional)')).toHaveValue(comment);
  await request.post(`${api}/__test/fail`, { data: { method: 'POST', path: `/api/products/${fixture.ids[0]}/reviews` } });
  await dialog.getByRole('button', { name: 'Submit review' }).click();
  await expect(dialog.getByRole('alert').filter({ hasText: 'Your draft is still here' })).toBeVisible();
  await expect(dialog.getByRole('radio', { name: '3 stars', exact: true })).toBeChecked();
  await expect(dialog.getByLabel('Comment (optional)')).toHaveValue(comment);
  await page.screenshot({ path: 'test-results/review-error-mobile.png', fullPage: true });
  await dialog.getByRole('button', { name: 'Try again' }).evaluate((button) => { button.click(); button.click(); });
  await expect(page.getByRole('heading', { name: 'Your review', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Write a review' })).toHaveCount(0);
  const reviews = await (await request.get(`${api}/api/products/${fixture.ids[0]}/reviews`)).json();
  expect(reviews.data).toHaveLength(1); expect(reviews.data[0].rating).toBe(3); expect(reviews.data[0].comment).toBe(comment);
  const stats = await (await request.get(`${api}/__test/stats`)).json();
  expect(stats[`POST /api/products/${fixture.ids[0]}/reviews`]).toBe(2);
  await page.screenshot({ path: 'test-results/review-success-mobile.png', fullPage: true });
  // A fresh guest context can read the published review without authentication.
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(`/catalog/${fixture.ids[0]}`);
  await expect(page.getByText(comment, { exact: true })).toBeVisible();
});

test('unfinished and cancelled orders cannot open the review form', async ({ page, request }) => {
  await login(page);
  for (const status of ['PENDING', 'PROCESSING', 'SHIPPED', 'CANCELLED']) {
    await request.post(`${api}/__test/status`, { data: { status } });
    await page.goto(`/orders/${fixture.orderId}`);
    await expect(page.getByText(status, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Write a review' })).toHaveCount(0);
    const result = await request.post(`${api}/api/products/${fixture.ids[0]}/reviews`, { headers: { Authorization: `Bearer ${fixture.token}` }, data: { rating: 5 } });
    expect(result.status()).toBe(403);
  }
});
