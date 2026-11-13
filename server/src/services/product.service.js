const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const { PRODUCT_STATUS } = require('../constants/product');
const { productHasOrders } = require('./order.service');
const photoStorage = require('./photoStorage.service');

const CREATABLE_FIELDS = [
  'name', 'photos', 'brand', 'description', 'category', 'tags',
  'size', 'condition', 'price',
];
const EDITABLE_FIELDS = [
  'name', 'photos', 'brand', 'description', 'category', 'tags',
  'size', 'condition', 'price',
];

const SORT_MAP = {
  newest: { createdAt: -1, _id: -1 },
  oldest: { createdAt: 1, _id: 1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: 1 },
};

function pickFields(source, fields) {
  const result = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }
  }
  return result;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function normalizeCatalogFields(payload) {
  if (typeof payload.name === 'string') payload.name = payload.name.trim();
  if (typeof payload.brand === 'string') payload.brand = payload.brand.trim();
  if (typeof payload.description === 'string') payload.description = payload.description.trim();
  if (Array.isArray(payload.tags)) {
    payload.tags = [...new Set(payload.tags.map((t) => t.trim().toLowerCase()))];
  }
  if (payload.category) {
    const exists = await Category.exists({ _id: payload.category });
    if (!exists) throw new AppError(400, 'category not found');
  }
  return payload;
}

async function createProduct(data) {
  const payload = await normalizeCatalogFields(pickFields(data, CREATABLE_FIELDS));
  payload.photoAssets = photoStorage.photoAssetsFor(payload.photos);
  return Product.create(payload);
}

async function getProducts() {
  return Product.find();
}

async function listProducts(query) {
  const {
    q, category, tag, size, condition, minPrice, maxPrice, hideSold, status, sort, page, limit,
  } = query;

  const filter = {};

  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { brand: regex }];
  }

  if (category) {
    const found = await Category.findOne({ slug: category }).select('_id').lean();
    if (!found) {
      return { items: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
    filter.category = found._id;
  }

  if (tag) filter.tags = tag;
  if (size.length) filter.size = { $in: size };
  if (condition.length) filter.condition = { $in: condition };

  if (minPrice !== null || maxPrice !== null) {
    filter.price = {};
    if (minPrice !== null) filter.price.$gte = minPrice;
    if (maxPrice !== null) filter.price.$lte = maxPrice;
  }

  if (status) filter.status = status;
  else if (hideSold) filter.status = PRODUCT_STATUS.AVAILABLE;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(SORT_MAP[sort])
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category', 'name slug')
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

async function getProductById(id) {
  const product = await Product.findById(id).populate('category', 'name slug');
  if (!product) throw new AppError(404, 'Product not found');
  return product;
}

async function updateProduct(id, data) {
  const updates = await normalizeCatalogFields(pickFields(data, EDITABLE_FIELDS));
  const replacingPhotos = Object.prototype.hasOwnProperty.call(updates, 'photos');
  if (replacingPhotos) updates.photoAssets = photoStorage.photoAssetsFor(updates.photos);

  // 'before' tells us which Cloudinary files the new photo list dropped.
  const previous = await Product.findOneAndUpdate(
    { _id: id, status: PRODUCT_STATUS.AVAILABLE },
    { $set: updates },
    { returnDocument: 'before', runValidators: true, projection: { photos: 1 } }
  );
  if (!previous) {
    const exists = await Product.exists({ _id: id });
    if (!exists) throw new AppError(404, 'Product not found');
    throw new AppError(409, 'Sold products cannot be edited');
  }

  if (replacingPhotos) {
    const kept = new Set(updates.photoAssets.map((p) => p.publicId).filter(Boolean));
    const dropped = photoStorage.photoAssetsFor(previous.photos).map((p) => p.publicId).filter((pid) => pid && !kept.has(pid));
    releasePhotos(dropped);
  }
  return Product.findById(id);
}

async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, 'Product not found');
  if (await productHasOrders(id)) {
    throw new AppError(409, 'Product has orders and cannot be deleted');
  }
  const deleted = await Product.findOneAndDelete({
    _id: id,
    status: PRODUCT_STATUS.AVAILABLE,
  });
  if (!deleted) {
    throw new AppError(409, 'Product has just been purchased and cannot be deleted');
  }
  releasePhotos(photoStorage.photoAssetsFor(deleted.photos).map((p) => p.publicId));
  return deleted;
}

// Removes Cloudinary files that no product references any more. Runs after the DB change
// has succeeded and never fails the request: errors are only logged.
function releasePhotos(publicIds) {
  const ids = [...new Set(publicIds.filter(Boolean))];
  if (ids.length === 0) return Promise.resolve();
  const task = Product.distinct('photoAssets.publicId', { 'photoAssets.publicId': { $in: ids } })
    .then((stillUsed) => photoStorage.destroyPhotos(ids.filter((pid) => !stillUsed.includes(pid))))
    .catch((err) => console.warn('[product] photo cleanup skipped:', err.message));
  pendingCleanups.add(task);
  task.finally(() => pendingCleanups.delete(task));
  return task;
}

// Lets tests (and graceful shutdown) wait for background photo cleanup.
const pendingCleanups = new Set();
const settlePhotoCleanups = () => Promise.allSettled([...pendingCleanups]);

module.exports = {
  createProduct,
  getProducts,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  settlePhotoCleanups,
};