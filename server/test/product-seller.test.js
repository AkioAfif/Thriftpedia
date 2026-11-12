const test = require('node:test');
const assert = require('node:assert/strict');

const productValidator = require('../src/validators/product.validator');

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error));
  });
}

const baseBody = {
  name: 'Vintage Jacket',
  photos: ['https://example.com/jacket.jpg'],
  size: 'M',
  condition: 'LIKE_NEW',
  price: 150000,
};

test('product accepts valid sellerName and sellerRating', async () => {
  const error = await runMiddleware(productValidator.validateCreateProduct, {
    body: { ...baseBody, sellerName: 'vintagestudio', sellerRating: 4.9 },
  });
  assert.equal(error, undefined);
});

test('product rejects sellerRating above 5', async () => {
  const error = await runMiddleware(productValidator.validateCreateProduct, {
    body: { ...baseBody, sellerRating: 6 },
  });
  assert.equal(error.statusCode, 400);
});

test('product rejects a non-numeric sellerRating', async () => {
  const error = await runMiddleware(productValidator.validateCreateProduct, {
    body: { ...baseBody, sellerRating: '4.9' },
  });
  assert.equal(error.statusCode, 400);
});

test('product rejects a sellerName longer than 50 characters', async () => {
  const error = await runMiddleware(productValidator.validateCreateProduct, {
    body: { ...baseBody, sellerName: 'a'.repeat(51) },
  });
  assert.equal(error.statusCode, 400);
});