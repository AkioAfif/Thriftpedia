const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const { PRODUCT_STATUS } = require('../constants/product');
const { productHasOrders } = require('./order.service');

const CREATABLE_FIELDS = [
  'name', 'photos', 'brand', 'category', 'tags',
  'sellerName', 'sellerRating', 'size', 'condition', 'price',
];
const EDITABLE_FIELDS = [
  'name', 'photos', 'brand', 'category', 'tags',
  'sellerName', 'sellerRating', 'size', 'condition', 'price',
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
  if (typeof payload.brand === 'string') payload.brand = payload.brand.trim();
  if (Array.isArray(payload.tags)) {
    payload.tags = [...new Set(payload.tags.map((t) => t.trim().toLowerCase()))];
  }
  if (payload.category) {
    const exists = await Category.exists({ _id: payload.category });
    if (!exists) throw new AppError(400, 'category not found');
  }
    if (typeof payload.brand === 'string') payload.brand = payload.brand.trim();
  if (typeof payload.sellerName === 'string') {
    payload.sellerName = payload.sellerName.trim().replace(/^@+/, '');
  }
  return payload;
}

async function createProduct(data) {
  const payload = await normalizeCatalogFields(pickFields(data, CREATABLE_FIELDS));
  return Product.create(payload);
}

async function getProducts() {
  return Product.find();
}

async function listProducts(query) {
  const { q, category, tag, size, condition, minPrice, maxPrice, hideSold, sort, page, limit } =
    query;

  const filter = {};

  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: regex }, { brand: regex }];
  }

  if (category) {
    const found = await Category.findOne({ slug: category }).select('_id').lean();
    if (!found) {
      // Slug tidak dikenal -> hasil kosong, bukan error.
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

  if (hideSold) filter.status = PRODUCT_STATUS.AVAILABLE;

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
  const product = await Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  );
  if (!product) throw new AppError(404, 'Product not found');
  return product;
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
  return deleted;
}

module.exports = {
  createProduct,
  getProducts,
  listProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};