const test = require('node:test');
const assert = require('node:assert/strict');

const ROLES = require('../src/constants/roles');
const { authorize } = require('../src/middleware/role.middleware');
const wishlistValidator = require('../src/validators/wishlist.validator');
const reviewValidator = require('../src/validators/review.validator');

const VALID_ID = '507f1f77bcf86cd799439011';

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error));
  });
}

test('authorization rejects a request without an authenticated user', async () => {
  const error = await runMiddleware(authorize(ROLES.BUYER), {});
  assert.equal(error.statusCode, 401);
});

test('authorization rejects a user with the wrong role', async () => {
  const error = await runMiddleware(authorize(ROLES.ADMIN), {
    user: { id: VALID_ID, role: ROLES.BUYER },
  });
  assert.equal(error.statusCode, 403);
});

test('wishlist input does not accept a client-supplied buyer id', async () => {
  const error = await runMiddleware(wishlistValidator.validateAddWishlist, {
    body: { productId: VALID_ID, buyer: VALID_ID },
  });
  assert.equal(error.statusCode, 400);
});

test('wishlist accepts a valid product id as its only field', async () => {
  const error = await runMiddleware(wishlistValidator.validateAddWishlist, {
    body: { productId: VALID_ID },
  });
  assert.equal(error, undefined);
});

test('review rejects a rating outside the 1 to 5 range', async () => {
  const error = await runMiddleware(reviewValidator.validateCreateReview, {
    body: { rating: 6, comment: 'Invalid rating' },
  });
  assert.equal(error.statusCode, 400);
});

test('review input does not accept a client-supplied buyer id', async () => {
  const error = await runMiddleware(reviewValidator.validateCreateReview, {
    body: { rating: 5, buyer: VALID_ID },
  });
  assert.equal(error.statusCode, 400);
});

test('review accepts a valid rating and comment', async () => {
  const error = await runMiddleware(reviewValidator.validateCreateReview, {
    body: { rating: 5, comment: 'Sesuai deskripsi' },
  });
  assert.equal(error, undefined);
});
