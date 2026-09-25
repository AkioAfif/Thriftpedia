// TEMPORARY (owner: Security module) — replace with the owner's version at merge.
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  const status = err.statusCode ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : err.message,
    ...(err.details && status < 500 ? { details: err.details } : {}),
  });
}

module.exports = { errorHandler };
