// TEMPORARY (owner: Auth + Security) — replace with the owner's version at merge.
const AppError = require('../utils/AppError');

const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new AppError(403, 'Forbidden'));

module.exports = { authorize };
