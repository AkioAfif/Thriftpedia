const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');
const v = require('../validators/order.validator');
const controller = require('../controllers/order.controller');

const router = Router();

// Legacy PATCH /:orderId behaves exactly like PATCH /:orderId/status. Kept so older
// clients keep working; it advertises its successor and can be removed once nothing uses it.
const markDeprecated = (req, res, next) => {
  res.set('Deprecation', 'true');
  res.set('Link', `</api/orders/${req.params.orderId}/status>; rel="successor-version"`);
  next();
};

const updateStatusChain = [authorize(ROLES.ADMIN), v.validateOrderIdParam, v.validateUpdateStatus, controller.updateStatus];

router.use(authenticate); // every order endpoint requires a valid JWT

router.post('/', authorize(ROLES.BUYER), v.validateCreateOrder, controller.create);
router.get('/', authorize(ROLES.BUYER, ROLES.ADMIN), v.validateListQuery, controller.list);
router.get('/:orderId', authorize(ROLES.BUYER, ROLES.ADMIN), v.validateOrderIdParam, controller.getById);
router.patch('/:orderId/cancel', authorize(ROLES.BUYER), v.validateOrderIdParam, controller.cancel);
router.patch('/:orderId/status', ...updateStatusChain);
router.patch('/:orderId', markDeprecated, ...updateStatusChain); // deprecated alias

module.exports = router;
