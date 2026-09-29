const AppError = require('../utils/AppError');
const { isObjectIdString, hasOnlyKeys } = require('./common.validator');

function validateAddWishlist(req, res, next) {
  const body = req.body ?? {};

  if (!hasOnlyKeys(body, ['productId'])) {
    return next(new AppError(400, 'Only productId may be submitted'));
  }

  if (!isObjectIdString(body.productId)) {
    return next(new AppError(400, 'productId is required and must be a valid id'));
  }

  next();
}

function validateProductIdParam(req, res, next) {
  if (!isObjectIdString(req.params.productId)) {
    return next(new AppError(400, 'productId must be a valid id'));
  }

  next();
}

module.exports = { validateAddWishlist, validateProductIdParam };
