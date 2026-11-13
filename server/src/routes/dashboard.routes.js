const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');
const controller = require('../controllers/dashboard.controller');

const router = Router();

router.get('/summary', authenticate, authorize(ROLES.ADMIN), controller.getSummary);

module.exports = router;