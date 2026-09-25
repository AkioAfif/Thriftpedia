const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');
const validator = require('../validators/wishlist.validator');
const controller = require('../controllers/wishlist.controller');

const router = Router();

router.use(authenticate, authorize(ROLES.BUYER));

router.post('/', validator.validateAddWishlist, controller.add);
router.get('/', controller.list);
router.delete('/:productId', validator.validateProductIdParam, controller.remove);

module.exports = router;
