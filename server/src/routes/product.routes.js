const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');
const v = require('../validators/product.validator');
const controller = require('../controllers/product.controller');

const router = Router();

// Public browsing routes — no authentication required.
router.get('/', controller.getAll);
router.get('/:id', v.validateProductId, controller.getById);

// Admin-only routes.
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
