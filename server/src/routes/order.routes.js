const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');
const v = require('../validators/order.validator');
const controller = require('../controllers/order.controller');

const router = Router();

router.use(authenticate); // every order endpoint requires a valid JWT

router.post('/', authorize(ROLES.BUYER), v.validateCreateOrder, controller.create);

module.exports = router;
