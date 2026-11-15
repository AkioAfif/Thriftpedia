const { rateLimit } = require('express-rate-limit');

const createLimiter = (limit) => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in 15 minutes.' },
});

module.exports = { loginLimiter: createLimiter(100), registerLimiter: createLimiter(50) };
