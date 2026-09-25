const AppError = require('../utils/AppError');

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

module.exports = { validateCreateOrder };
