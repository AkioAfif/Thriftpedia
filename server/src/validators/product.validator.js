const AppError = require('../utils/AppError');
const { PRODUCT_CONDITION_VALUES } = require('../constants/productCondition');
const { PRODUCT_SIZE_VALUES } = require('../constants/productSize');

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const PRODUCT_FIELDS = [
  'name',
  'photos',
  'brand',
  'description',
  'category',
  'tags',
  'size',
  'condition',
  'price',
];

const isObjectIdString = (v) => typeof v === 'string' && OBJECT_ID_RE.test(v);
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isHttpUrl = (v) => {
  try {
    return ['http:', 'https:'].includes(new URL(v).protocol);
  } catch {
    return false;
  }
};
const isValidPhotos = (v) =>
  Array.isArray(v) &&
  v.length >= 1 &&
  v.length <= 5 &&
  v.every((photo) => isNonEmptyString(photo) && isHttpUrl(photo));
const isValidPrice = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
const isValidSize = (v) => PRODUCT_SIZE_VALUES.includes(v);
const isValidCondition = (v) => PRODUCT_CONDITION_VALUES.includes(v);
const getUnknownFields = (body) => Object.keys(body).filter((field) => !PRODUCT_FIELDS.includes(field));

const SIZE_MESSAGE = `size must be one of: ${PRODUCT_SIZE_VALUES.join(', ')}`;
const CONDITION_MESSAGE = `condition must be one of: ${PRODUCT_CONDITION_VALUES.join(', ')}`;
const PHOTOS_MESSAGE = 'photos must be 1-5 valid image URLs';
const BRAND_MESSAGE = 'brand is required (max 100 characters)';
const DESCRIPTION_MESSAGE = 'description must be a string (max 1000 characters)';

function getCatalogFieldError(body) {
  if ('brand' in body && !(isNonEmptyString(body.brand) && body.brand.trim().length <= 100)) {
    return BRAND_MESSAGE;
  }
  if ('description' in body && !(typeof body.description === 'string' && body.description.trim().length <= 1000)) {
    return DESCRIPTION_MESSAGE;
  }
  if ('category' in body && body.category !== null && !isObjectIdString(body.category)) {
    return 'category must be a valid category id or null';
  }
  if (
    'tags' in body &&
    !(Array.isArray(body.tags) && body.tags.length <= 20 && body.tags.every((t) => isNonEmptyString(t)))
  ) {
    return 'tags must be an array of non-empty strings (max 20)';
  }
  return null;
}

function validateProductId(req, res, next) {
  if (!isObjectIdString(req.params.id)) return next(new AppError(400, 'Invalid product id'));
  next();
}

function validateCreateProduct(req, res, next) {
  const body = req.body ?? {};
  const unknownFields = getUnknownFields(body);

  if (Object.prototype.hasOwnProperty.call(body, 'status')) return next(new AppError(400, 'status cannot be set by client'));
  if (unknownFields.length > 0) return next(new AppError(400, `Unknown field: ${unknownFields.join(', ')}`));
  if (!isNonEmptyString(body.name)) return next(new AppError(400, 'name is required'));
  if (!isNonEmptyString(body.brand)) return next(new AppError(400, BRAND_MESSAGE));
  if (!isValidPhotos(body.photos)) return next(new AppError(400, PHOTOS_MESSAGE));
  if (!isNonEmptyString(body.size)) return next(new AppError(400, 'size is required'));
  if (!isValidSize(body.size)) return next(new AppError(400, SIZE_MESSAGE));
  if (!isNonEmptyString(body.condition)) return next(new AppError(400, 'condition is required'));
  if (!isValidCondition(body.condition)) return next(new AppError(400, CONDITION_MESSAGE));
  if (!isValidPrice(body.price)) return next(new AppError(400, 'price is required and must be a number >= 0'));

  const catalogError = getCatalogFieldError(body);
  if (catalogError) return next(new AppError(400, catalogError));

  next();
}

function validateUpdateProduct(req, res, next) {
  const body = req.body ?? {};
  const unknownFields = getUnknownFields(body);

  if (Object.prototype.hasOwnProperty.call(body, 'status')) return next(new AppError(400, 'status cannot be changed through Product API'));
  if (unknownFields.length > 0) return next(new AppError(400, `Unknown field: ${unknownFields.join(', ')}`));

  const providedFields = PRODUCT_FIELDS.filter((field) => Object.prototype.hasOwnProperty.call(body, field));

  if (providedFields.length === 0) return next(new AppError(400, 'At least one editable field must be provided'));
  if ('name' in body && !isNonEmptyString(body.name)) return next(new AppError(400, 'name must be a non-empty string'));
  if ('photos' in body && !isValidPhotos(body.photos)) return next(new AppError(400, PHOTOS_MESSAGE));
  if ('size' in body && !isValidSize(body.size)) return next(new AppError(400, SIZE_MESSAGE));
  if ('condition' in body && !isValidCondition(body.condition)) return next(new AppError(400, CONDITION_MESSAGE));
  if ('price' in body && !isValidPrice(body.price)) return next(new AppError(400, 'price must be a number >= 0'));

  const catalogError = getCatalogFieldError(body);
  if (catalogError) return next(new AppError(400, catalogError));

  next();
}

module.exports = {
  isObjectIdString,
  validateProductId,
  validateCreateProduct,
  validateUpdateProduct,
};