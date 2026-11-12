const AppError = require('../utils/AppError');
const { PRODUCT_CONDITION_VALUES } = require('../constants/productCondition');
const { PRODUCT_SIZE_VALUES } = require('../constants/productSize');

const ALLOWED_KEYS = [
  'q', 'category', 'tag', 'size', 'condition',
  'minPrice', 'maxPrice', 'hideSold', 'sort', 'page', 'limit',
];
const SORT_VALUES = ['newest', 'oldest', 'price_asc', 'price_desc'];

// "M,L" atau ?size=M&size=L -> ['M', 'L']
function toList(value) {
  const arr = Array.isArray(value) ? value : [value];
  return arr
    .flatMap((v) => String(v).split(','))
    .map((v) => v.trim())
    .filter(Boolean);
}

function toPrice(value, name) {
  const n = Number(value);
  if (value === '' || !Number.isFinite(n) || n < 0) {
    throw new AppError(400, `${name} must be a non-negative number`);
  }
  return n;
}

function toInt(value, name, min, max) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new AppError(400, `${name} must be an integer between ${min} and ${max}`);
  }
  return n;
}

function validateProductQuery(req, res, next) {
  try {
    const raw = req.query;

    for (const key of Object.keys(raw)) {
      if (!ALLOWED_KEYS.includes(key)) {
        throw new AppError(400, `Unknown query parameter: ${key}`);
      }
    }

    const parsed = {
      q: '',
      category: '',
      tag: '',
      size: [],
      condition: [],
      minPrice: null,
      maxPrice: null,
      hideSold: false,
      sort: 'newest',
      page: 1,
      limit: 12,
    };

    if (raw.q !== undefined) {
      parsed.q = String(raw.q).trim();
      if (parsed.q.length > 100) throw new AppError(400, 'q is too long (max 100 characters)');
    }

    if (raw.category !== undefined) parsed.category = String(raw.category).trim().toLowerCase();
    if (raw.tag !== undefined) parsed.tag = String(raw.tag).trim().toLowerCase();

    if (raw.size !== undefined) {
      parsed.size = toList(raw.size).map((s) => s.toUpperCase());
      const bad = parsed.size.find((s) => !PRODUCT_SIZE_VALUES.includes(s));
      if (bad) throw new AppError(400, `Invalid size: ${bad}`);
    }

    if (raw.condition !== undefined) {
      parsed.condition = toList(raw.condition).map((c) => c.toUpperCase());
      const bad = parsed.condition.find((c) => !PRODUCT_CONDITION_VALUES.includes(c));
      if (bad) throw new AppError(400, `Invalid condition: ${bad}`);
    }

    if (raw.minPrice !== undefined) parsed.minPrice = toPrice(raw.minPrice, 'minPrice');
    if (raw.maxPrice !== undefined) parsed.maxPrice = toPrice(raw.maxPrice, 'maxPrice');
    if (
      parsed.minPrice !== null &&
      parsed.maxPrice !== null &&
      parsed.minPrice > parsed.maxPrice
    ) {
      throw new AppError(400, 'minPrice cannot be greater than maxPrice');
    }

    if (raw.hideSold !== undefined) {
      if (raw.hideSold !== 'true' && raw.hideSold !== 'false') {
        throw new AppError(400, 'hideSold must be true or false');
      }
      parsed.hideSold = raw.hideSold === 'true';
    }

    if (raw.sort !== undefined) {
      if (!SORT_VALUES.includes(raw.sort)) {
        throw new AppError(400, `sort must be one of: ${SORT_VALUES.join(', ')}`);
      }
      parsed.sort = raw.sort;
    }

    if (raw.page !== undefined) parsed.page = toInt(raw.page, 'page', 1, 100000);
    if (raw.limit !== undefined) parsed.limit = toInt(raw.limit, 'limit', 1, 50);

    req.productQuery = parsed;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { validateProductQuery };