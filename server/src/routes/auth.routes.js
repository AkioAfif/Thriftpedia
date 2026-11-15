const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const passwordResetLimiter = require('../middleware/passwordResetLimiter');
const { loginLimiter, registerLimiter } = require('../middleware/authLimiter');

const router = Router();

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post(
  '/forgot-password',
  passwordResetLimiter,
  authController.forgotPassword
);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
