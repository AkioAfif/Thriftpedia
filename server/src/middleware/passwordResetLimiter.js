const { rateLimit } = require('express-rate-limit');

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,

  message: {
    message: 'Too many password reset requests. Please try again in 15 minutes.',
  },
});

module.exports = passwordResetLimiter;