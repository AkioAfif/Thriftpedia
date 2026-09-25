// TEMPORARY (owner: Auth module) — replace with the owner's version at merge.
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'Authentication required'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: String(payload.id), role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}

module.exports = { authenticate };
