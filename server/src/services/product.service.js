const Product = require('../models/Product');
const AppError = require('../utils/AppError');

// Fields a client is ever allowed to set/edit. status is intentionally
// excluded: it is server-controlled (default on create; AVAILABLE -> SOLD
// is owned exclusively by services/order.service.js).
const CREATABLE_FIELDS = ['name', 'photos', 'size', 'condition', 'price'];
const EDITABLE_FIELDS = ['name', 'photos', 'size', 'condition', 'price'];

function pickFields(source, fields) {
  const result = {};
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) {
      result[field] = source[field];
    }
  }
  return result;
}

async function createProduct(data) {
  const payload = pickFields(data, CREATABLE_FIELDS);
  // status is never taken from input; the schema default (AVAILABLE) applies.
  return Product.create(payload);
}

async function getProducts() {
  return Product.find();
}

async function getProductById(id) {
  const product = await Product.findById(id);
  if (!product) throw new AppError(404, 'Product not found');
  return product;
}

async function updateProduct(id, data) {
  const updates = pickFields(data, EDITABLE_FIELDS);

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!product) throw new AppError(404, 'Product not found');
  return product;
}

async function deleteProduct(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new AppError(404, 'Product not found');
  return product;
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
