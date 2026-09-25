const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');
const validator = require('../validators/review.validator');
const controller = require('../controllers/review.controller');

const router = Router({ mergeParams: true });

router.get('/', validator.validateProductIdParam, controller.list);
router.post(
  '/',
  authenticate,
  authorize(ROLES.BUYER),
  validator.validateProductIdParam,
  validator.validateCreateReview,
  controller.create
);

module.exports = router;
