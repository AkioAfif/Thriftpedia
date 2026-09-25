const test = require('node:test');
const assert = require('node:assert/strict');

const Wishlist = require('../src/models/Wishlist');
const Review = require('../src/models/Review');

function hasUniqueBuyerProductIndex(model) {
  return model.schema.indexes().some(([fields, options]) =>
    fields.buyer === 1 && fields.product === 1 && options.unique === true
  );
}

test('Wishlist prevents the same product from being saved twice by one buyer', () => {
  assert.equal(hasUniqueBuyerProductIndex(Wishlist), true);
});

test('Review permits only one review per buyer and product', () => {
  assert.equal(hasUniqueBuyerProductIndex(Review), true);
});
