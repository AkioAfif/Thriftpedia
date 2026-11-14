const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');
const { validateOrderIdParam } = require('../validators/order.validator');
const controller = require('../controllers/payment.controller');

const router = Router();

// Public: Midtrans has no JWT. Trust comes from the signature_key check in the service.
router.post('/notification', controller.notification);
router.post('/:orderId', authenticate, authorize(ROLES.BUYER), validateOrderIdParam, controller.createSnapToken);

module.exports = router;
