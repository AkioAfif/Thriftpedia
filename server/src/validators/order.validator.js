const AppError = require('../utils/AppError');
const { ORDER_STATUS, ADMIN_SETTABLE_STATUSES } = require('../constants/order');

// Strict 24-hex check. Do NOT use mongoose.isValidObjectId: it accepts any 12-char string.
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const isObjectIdString = (v) => typeof v === 'string' && OBJECT_ID_RE.test(v);

function validateCreateOrder(req, res, next) {
  const body = req.body ?? {};
  if (!isObjectIdString(body.productId)) {
    return next(new AppError(400, 'productId is required and must be a valid id'));
  }
  next();
}

function validateOrderIdParam(req, res, next) {
  if (!isObjectIdString(req.params.orderId)) {
    return next(new AppError(400, 'orderId must be a valid id'));
  }
  next();
}

function validateListQuery(req, res, next) {
  const { status } = req.query;
  if (status !== undefined && !Object.values(ORDER_STATUS).includes(status)) {
    return next(new AppError(400, `status must be one of ${Object.values(ORDER_STATUS).join(', ')}`));
  }
  next();
}

function validateUpdateStatus(req, res, next) {
  const body = req.body ?? {};
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'status') {
    return next(new AppError(400, 'Only the "status" field can be updated'));
  }
  if (!ADMIN_SETTABLE_STATUSES.includes(body.status)) {
    return next(new AppError(400, `status must be one of ${ADMIN_SETTABLE_STATUSES.join(', ')}`));
  }
  next();
}

module.exports = { validateCreateOrder, validateOrderIdParam, validateListQuery, validateUpdateStatus };
