const { Router } = require('express');
const controller = require('../controllers/category.controller');

const router = Router();

// Public: dipakai dropdown Category di katalog.
router.get('/', controller.getAll);

module.exports = router;