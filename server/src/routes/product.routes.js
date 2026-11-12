const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadProductPhotos } = require('../middleware/upload'); // BARU
const ROLES = require('../constants/roles');
const v = require('../validators/product.validator');
const { validateProductQuery } = require('../validators/productQuery.validator');
const controller = require('../controllers/product.controller');

const router = Router();

// Public browsing routes — no authentication required.
router.get('/', validateProductQuery, controller.getAll);

router.post(
  '/upload',
  authenticate,
  authorize(ROLES.ADMIN),
  uploadProductPhotos,
  controller.uploadPhotos
);

router.get('/:id', v.validateProductId, controller.getById);

// Admin-only routes
router.post('/', authenticate, authorize(ROLES.ADMIN), v.validateCreateProduct, controller.create);
router.patch(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  v.validateProductId,
  v.validateUpdateProduct,
  controller.update
);
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  v.validateProductId,
  controller.remove
);

module.exports = router;