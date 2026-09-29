const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// Product is owned by another module and may not yet be present while this
// feature branch is developed. Resolve it at request time after that module
// has registered its model.
function getProductModel() {
  try {
    return mongoose.model('Product');
  } catch {
    throw new AppError(503, 'Product module is not available yet');
  }
}

async function ensureProductExists(productId) {
  const Product = getProductModel();
  const exists = await Product.exists({ _id: productId });
  if (!exists) throw new AppError(404, 'Product not found');
}

module.exports = { getProductModel, ensureProductExists };
