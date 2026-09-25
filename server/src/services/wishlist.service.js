const Wishlist = require('../models/Wishlist');
const AppError = require('../utils/AppError');
const { ensureProductExists } = require('./product-reference.service');

async function addToWishlist({ buyerId, productId }) {
  await ensureProductExists(productId);

  const duplicate = await Wishlist.exists({ buyer: buyerId, product: productId });
  if (duplicate) throw new AppError(409, 'Product is already in your wishlist');

  try {
    return await Wishlist.create({ buyer: buyerId, product: productId });
  } catch (err) {
    // The database unique index remains authoritative under concurrent calls.
    if (err?.code === 11000) {
      throw new AppError(409, 'Product is already in your wishlist');
    }
    throw err;
  }
}

async function getBuyerWishlist(buyerId) {
  return Wishlist.find({ buyer: buyerId })
    .populate('product')
    .sort({ createdAt: -1 });
}

async function removeFromWishlist({ buyerId, productId }) {
  const removed = await Wishlist.findOneAndDelete({
    buyer: buyerId,
    product: productId,
  });

  if (!removed) throw new AppError(404, 'Product is not in your wishlist');
  return removed;
}

module.exports = { addToWishlist, getBuyerWishlist, removeFromWishlist };
