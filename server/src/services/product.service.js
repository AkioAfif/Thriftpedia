const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { PRODUCT_STATUS } = require('../constants/product');
const { productHasOrders } = require('./order.service');

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
  return Product.findOneAndDelete({
    _id: id,
    status: PRODUCT_STATUS.AVAILABLE,
  });
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};