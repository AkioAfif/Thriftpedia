const authService = require('../services/auth.service');

const isString = (value) => typeof value === 'string';
const normalizeEmail = (email) => email.trim().toLowerCase();

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {};

    if (!isString(name) || !isString(email) || !isString(password) || !name.trim() || !email.trim() || !password) {
      return res.status(400).json({
        message: 'Name, email, and password are required',
      });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ message: 'Name must be at most 100 characters' });
    }
    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: 'Password must be 8 to 72 characters' });
    }

    const user = await authService.registerUser({ name, email: normalizeEmail(email), password });

    res.status(201).json({
      message: 'User registered successfully',
      data: user,
    });
  } catch (error) {
    next(error); 
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};

    // Strings only: an object such as {"$ne": null} would otherwise become a query operator.
    if (!isString(email) || !isString(password) || !email.trim() || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const { user, token } = await authService.loginUser({ email: normalizeEmail(email), password });

    res.status(200).json({
      message: 'Login successful',
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);

    res.status(200).json({
      message: 'User retrieved',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body ?? {};

    if (!isString(email) || !email.trim()) {
      return res.status(400).json({
        message: 'Email is required',
      });
    }

    await authService.requestPasswordReset(normalizeEmail(email));

    return res.status(200).json({
      message: 'If the email is registered, a password reset link will be sent.',
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body ?? {};

    // Validasi input
    if (
      !isString(token) ||
      !token.trim() ||
      !isString(password)
    ) {
      return res.status(400).json({
        message: 'Token and new password are required',
      });
    }

    // Token reset berupa 64 karakter hexadecimal
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: 'Invalid reset token',
      });
    }

    // Samakan aturan password dengan registrasi
    if (
      password.length < 8 ||
      password.length > 72 ||
      !/\d/.test(password)
    ) {
      return res.status(400).json({
        message: 'Password must be 8–72 characters and include a number',
      });
    }

    await authService.resetPassword(token, password);

    return res.status(200).json({
      message: 'Password reset successfully. Please log in.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, me, forgotPassword, resetPassword };