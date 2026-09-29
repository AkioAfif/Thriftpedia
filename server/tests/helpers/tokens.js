// Must be required before src/app: auth.service throws at load time without JWT_SECRET.
process.env.JWT_SECRET ??= 'test-secret';

const jwt = require('jsonwebtoken');

function signToken({ id, role }, secret = process.env.JWT_SECRET) {
  return jwt.sign({ id: String(id), role }, secret, { expiresIn: '1h' });
}

module.exports = { signToken };
