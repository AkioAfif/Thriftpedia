const reviewService = require('../services/review.service');

async function list(req, res) {
  const reviews = await reviewService.listProductReviews(req.params.productId);
  res.status(200).json({ message: 'Reviews retrieved', data: reviews });
}

async function create(req, res) {
  const review = await reviewService.createReview({
    buyerId: req.user.id,
    productId: req.params.productId,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  res.status(201).json({ message: 'Review created', data: review });
}

module.exports = { list, create };
