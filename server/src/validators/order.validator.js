const AppError = require('../utils/AppError');
const { ORDER_STATUS, ADMIN_SETTABLE_STATUSES } = require('../constants/order');

// Strict 24-hex check. Do NOT use mongoose.isValidObjectId: it accepts any 12-char string.
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const isObjectIdString = (v) => typeof v === 'string' && OBJECT_ID_RE.test(v);

const ADDRESS_RULES = {
  recipientName: { max: 100 },
  phone: { max: 20, re: /^\+?\d{8,15}$/, hint: '8-15 digits, optional leading +' },
  address: { max: 500 },
  city: { max: 100 },
  postalCode: { max: 10, re: /^\d{5}$/, hint: '5 digits' },
};

// Returns an error message, or null after trimming the values in place.
function checkShippingAddress(addr) {
  if (typeof addr !== 'object' || addr === null || Array.isArray(addr)) {
    return 'shippingAddress must be an object';
  }
  const unknown = Object.keys(addr).filter((key) => !(key in ADDRESS_RULES));
  if (unknown.length > 0) return `Unknown shippingAddress field: ${unknown.join(', ')}`;
  for (const [key, { max, re, hint }] of Object.entries(ADDRESS_RULES)) {
    const value = addr[key];
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
      return `shippingAddress.${key} is required (max ${max} characters)`;
    }
    if (re && !re.test(value.trim())) return `shippingAddress.${key} must be ${hint}`;
  }
  for (const key of Object.keys(ADDRESS_RULES)) addr[key] = addr[key].trim();
  return null;
}

function validateCreateOrder(req, res, next) {
  const body = req.body ?? {};
  if (!isObjectIdString(body.productId)) {
    return next(new AppError(400, 'productId is required and must be a valid id'));
  }
  if (body.shippingAddress !== undefined) {
    const error = checkShippingAddress(body.shippingAddress);
    if (error) return next(new AppError(400, error));
  }
  next();
}

function validateOrderIdParam(req, res, next) {
  if (!isObjectIdString(req.params.orderId)) {
    return next(new AppError(400, 'orderId must be a valid id'));
  }
  next();
}

const LIST_QUERY_KEYS = ['page', 'limit', 'status', 'q', 'sort'];
const LIST_SORTS = ['newest', 'oldest', 'total_desc', 'total_asc'];
const MAX_LIMIT = 50;

function toInt(value, name, min, max) {
  const n = Number(value);
  if (value === '' || !Number.isInteger(n) || n < min || n > max) {
    throw new AppError(400, `${name} must be an integer between ${min} and ${max}`);
  }
  return n;
}

// Parses GET /api/orders query into req.orderQuery. Unknown or repeated keys are rejected.
function validateListQuery(req, res, next) {
  try {
    const raw = req.query ?? {};
    for (const key of Object.keys(raw)) {
      if (!LIST_QUERY_KEYS.includes(key)) throw new AppError(400, `Unknown query parameter: ${key}`);
      if (typeof raw[key] !== 'string') throw new AppError(400, `${key} must be a single value`);
    }

    const parsed = { page: 1, limit: 10, status: undefined, q: '', sort: 'newest' };

    if (raw.page !== undefined) parsed.page = toInt(raw.page, 'page', 1, 100000);
    if (raw.limit !== undefined) parsed.limit = toInt(raw.limit, 'limit', 1, MAX_LIMIT);

    if (raw.status !== undefined) {
      if (!Object.values(ORDER_STATUS).includes(raw.status)) {
        throw new AppError(400, `status must be one of ${Object.values(ORDER_STATUS).join(', ')}`);
      }
      parsed.status = raw.status;
    }

    if (raw.q !== undefined) {
      parsed.q = raw.q.trim();
      if (parsed.q.length > 100) throw new AppError(400, 'q is too long (max 100 characters)');
    }

    if (raw.sort !== undefined) {
      if (!LIST_SORTS.includes(raw.sort)) throw new AppError(400, `sort must be one of ${LIST_SORTS.join(', ')}`);
      parsed.sort = raw.sort;
    }

    req.orderQuery = parsed;
    next();
  } catch (err) {
    next(err);
  }
}

const UPDATE_STATUS_FIELDS = ['status', 'trackingNumber', 'courier', 'note'];
const SHIPPING_FIELDS = ['trackingNumber', 'courier'];
const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const isTrimmedString = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max;

function validateUpdateStatus(req, res, next) {
  const body = req.body ?? {};
  if (typeof body !== 'object' || Array.isArray(body)) {
    return next(new AppError(400, 'Request body must be a JSON object'));
  }

  const unknown = Object.keys(body).filter((key) => !UPDATE_STATUS_FIELDS.includes(key));
  if (unknown.length > 0) return next(new AppError(400, `Unknown field: ${unknown.join(', ')}`));

  if (!ADMIN_SETTABLE_STATUSES.includes(body.status)) {
    return next(new AppError(400, `status must be one of ${ADMIN_SETTABLE_STATUSES.join(', ')}`));
  }

  if (body.status === ORDER_STATUS.SHIPPED) {
    if (!isTrimmedString(body.trackingNumber, 50)) {
      return next(new AppError(400, 'trackingNumber is required when status is SHIPPED (max 50 characters)'));
    }
    if (has(body, 'courier') && body.courier !== null && !isTrimmedString(body.courier, 50)) {
      return next(new AppError(400, 'courier must be a non-empty string (max 50 characters) or null'));
    }
  } else {
    const misplaced = SHIPPING_FIELDS.filter((key) => has(body, key));
    if (misplaced.length > 0) {
      return next(new AppError(400, `${misplaced.join(', ')} is only allowed when status is SHIPPED`));
    }
  }

  if (has(body, 'note') && body.note !== null && !isTrimmedString(body.note, 500)) {
    return next(new AppError(400, 'note must be a non-empty string (max 500 characters) or null'));
  }

  // Normalise once so the service stores trimmed values.
  if (typeof body.trackingNumber === 'string') body.trackingNumber = body.trackingNumber.trim();
  if (typeof body.courier === 'string') body.courier = body.courier.trim();
  if (typeof body.note === 'string') body.note = body.note.trim();
  next();
}

module.exports = { validateCreateOrder, validateOrderIdParam, validateListQuery, validateUpdateStatus };
