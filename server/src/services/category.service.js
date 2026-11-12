const Category = require('../models/Category');

async function listCategories() {
  return Category.find().sort({ name: 1 }).select('name slug').lean();
}

module.exports = { listCategories };