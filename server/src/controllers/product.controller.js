const productService = require('../services/product.service');
const AppError = require('../utils/AppError');

async function create(req, res) {
  const product = await productService.createProduct(req.body);
  res.status(201).json({
    message: 'Product created',
    data: product,
  });
}

async function getAll(req, res) {
  const { items, meta } = await productService.listProducts(req.productQuery);
  res.status(200).json({
    message: 'Products retrieved',
    data: items,
    meta,
  });
}

async function getById(req, res) {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({
    message: 'Product retrieved',
    data: product,
  });
}

async function update(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({
    message: 'Product updated',
    data: product,
  });
}

async function remove(req, res) {
  await productService.deleteProduct(req.params.id);
  res.status(200).json({
    message: 'Product deleted',
  });
}

async function uploadPhotos(req, res) {
  if (!req.files || req.files.length === 0) {
    throw new AppError(400, 'No photos uploaded (field name: photos)');
  }
  const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const urls = req.files.map((f) => `${base}/uploads/products/${f.filename}`);
  res.status(201).json({
    message: 'Photos uploaded',
    data: { urls },
  });
}

module.exports = {
  create,
  getAll,
  getById,
  update,
  remove,
  uploadPhotos,
};