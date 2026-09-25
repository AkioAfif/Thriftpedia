const AppError = require('../utils/AppError');

// Strict 24-hex check. Do NOT use mongoose.isValidObjectId: it accepts any 12-char string.
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const isObjectIdString = (v) => typeof v === 'string' && OBJECT_ID_RE.test(v);

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

const isValidPhotos = (v) =>
  Array.isArray(v) && v.length > 0 && v.every((photo) => isNonEmptyString(photo));

const isValidPrice = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

function validateProductId(req, res, next) {
  if (!isObjectIdString(req.params.id)) {
    return next(new AppError(400, 'Invalid product id'));
  }
  next();
}

function validateCreateProduct(req, res, next) {
  const body = req.body ?? {};

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    return next(new AppError(400, 'status cannot be set by client'));
  }

  if (!isNonEmptyString(body.name)) {
    return next(new AppError(400, 'name is required'));
  }
  if (!isValidPhotos(body.photos)) {
    return next(new AppError(400, 'photos is required and must be a non-empty array of strings'));
  }
  if (!isNonEmptyString(body.size)) {
    return next(new AppError(400, 'size is required'));
  }
  if (!isNonEmptyString(body.condition)) {
    return next(new AppError(400, 'condition is required'));
  }
  if (!isValidPrice(body.price)) {
    return next(new AppError(400, 'price is required and must be a number >= 0'));
  }

  next();
}

function validateUpdateProduct(req, res, next) {
  const body = req.body ?? {};

  if (Object.prototype.hasOwnProperty.call(body, 'status')) {
    return next(new AppError(400, 'status cannot be changed through Product API'));
  }

  const editableFields = ['name', 'photos', 'size', 'condition', 'price'];
  const providedFields = editableFields.filter((field) =>
    Object.prototype.hasOwnProperty.call(body, field)
  );

  if (providedFields.length === 0) {
    return next(new AppError(400, 'At least one editable field must be provided'));
  }

  if ('name' in body && !isNonEmptyString(body.name)) {
    return next(new AppError(400, 'name must be a non-empty string'));
  }
  if ('photos' in body && !isValidPhotos(body.photos)) {
    return next(new AppError(400, 'photos must be a non-empty array of strings'));
  }
  if ('size' in body && !isNonEmptyString(body.size)) {
    return next(new AppError(400, 'size must be a non-empty string'));
  }
  if ('condition' in body && !isNonEmptyString(body.condition)) {
    return next(new AppError(400, 'condition must be a non-empty string'));
  }
  if ('price' in body && !isValidPrice(body.price)) {
    return next(new AppError(400, 'price must be a number >= 0'));
  }

  next();
}

module.exports = {
  isObjectIdString,
  validateProductId,
  validateCreateProduct,
  validateUpdateProduct,
};
