const productService = require('../services/product.service');

async function create(req, res) {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ message: 'Product created', data: product });
}

async function getAll(req, res) {
  const products = await productService.getProducts();
  res.status(200).json({ data: products });
}

async function getById(req, res) {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json({ data: product });
}

async function update(req, res) {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({ message: 'Product updated', data: product });
}

async function remove(req, res) {
  await productService.deleteProduct(req.params.id);
  res.status(200).json({ message: 'Product deleted' });
}

module.exports = { create, getAll, getById, update, remove };
