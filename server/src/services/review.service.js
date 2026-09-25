const Review = require('../models/Review');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const { ORDER_STATUS } = require('../constants/order');
const { ensureProductExists } = require('./product-reference.service');

async function listProductReviews(productId) {
  await ensureProductExists(productId);

  return Review.find({ product: productId })
    .populate('buyer', 'name')
    .sort({ createdAt: -1 });
}

async function createReview({ buyerId, productId, rating, comment }) {
  await ensureProductExists(productId);

  const eligibleOrder = await Order.exists({
    buyer: buyerId,
    product: productId,
    status: ORDER_STATUS.COMPLETED,
  });

  if (!eligibleOrder) {
    throw new AppError(403, 'You can review only a product from a completed order');
  }

  const duplicate = await Review.exists({ buyer: buyerId, product: productId });
  if (duplicate) throw new AppError(409, 'You have already reviewed this product');

  try {
    return await Review.create({
      buyer: buyerId,
      product: productId,
      rating,
      comment: comment?.trim() ?? '',
    });
  } catch (err) {
    if (err?.code === 11000) {
      throw new AppError(409, 'You have already reviewed this product');
    }
    throw err;
  }
}

module.exports = { listProductReviews, createReview };
