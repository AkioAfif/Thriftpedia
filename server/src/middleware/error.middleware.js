const AppError = require('../utils/AppError');

function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });

  let status = err.statusCode ?? 500;
  let message = err.message;
  let details = err.details;

  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
    details = Object.values(err.errors).map((item) => item.message);
  } else if (err.code === 11000) {
    status = 409;
    message = 'Resource already exists';
  }

  if (status >= 500) console.error(err);
  // Unexpected 5xx errors stay generic; an AppError's message was written for the client
  // (e.g. "Photo upload is not configured", "Uploading photos to storage failed").
  const exposeMessage = status < 500 || err instanceof AppError;
  res.status(status).json({
    message: exposeMessage ? message : 'Internal server error',
    ...(details && status < 500 ? { details } : {}),
  });
}

module.exports = { errorHandler };
