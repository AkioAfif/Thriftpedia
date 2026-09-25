const AppError = require('../utils/AppError');
const { isObjectIdString, hasOnlyKeys } = require('./common.validator');

function validateProductIdParam(req, res, next) {
  if (!isObjectIdString(req.params.productId)) {
    return next(new AppError(400, 'productId must be a valid id'));
  }

  next();
}

function validateCreateReview(req, res, next) {
  const body = req.body ?? {};

  if (!hasOnlyKeys(body, ['rating', 'comment'])) {
    return next(new AppError(400, 'Only rating and comment may be submitted'));
  }

  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
    return next(new AppError(400, 'rating is required and must be an integer from 1 to 5'));
  }

  if (
    body.comment !== undefined &&
    (typeof body.comment !== 'string' || body.comment.trim().length > 1000)
  ) {
    return next(new AppError(400, 'comment must be a string with at most 1000 characters'));
  }

  next();
}

module.exports = { validateProductIdParam, validateCreateReview };
