const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');

async function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Authentication required'));
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!/^[a-f0-9]{24}$/i.test(payload.id ?? '')) return next(new AppError(401, 'Invalid token'));
    const user = await User.findById(payload.id).select('role +tokenVersion').lean();
    if (!user || (payload.tokenVersion ?? 0) !== (user.tokenVersion ?? 0)) {
      return next(new AppError(401, 'Account or session no longer valid'));
    }
    req.user = { id: String(user._id), role: user.role };
    next();
  } catch (error) {
    next(['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)
      ? new AppError(401, 'Invalid or expired token') : error);
  }
}

module.exports = { authenticate };
