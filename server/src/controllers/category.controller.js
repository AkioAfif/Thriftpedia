const categoryService = require('../services/category.service');

async function getAll(req, res) {
  const data = await categoryService.listCategories();
  res.status(200).json({
    message: 'Categories retrieved',
    data,
  });
}

module.exports = { getAll };