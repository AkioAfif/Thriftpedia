const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const passwordResetLimiter = require('../middleware/passwordResetLimiter');

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  authController.forgotPassword
);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.me);

module.exports = router;