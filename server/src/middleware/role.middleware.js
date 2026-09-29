const AppError = require('../utils/AppError');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new AppError(403, 'Forbidden'));
  next();
};

module.exports = { authorize };
