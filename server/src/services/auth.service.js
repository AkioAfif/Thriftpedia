const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is missing. Check your .env file!");
}

const JWT_EXPIRES_IN = '1d';

const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email }).lean();
  if (existingUser) {
    throw new AppError(400, 'Email is already registered');
  }

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: ROLES.BUYER, 
  });

  const userResponse = user.toObject();
  delete userResponse.password;

  return userResponse;
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AppError(401, 'Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
    expiresIn: '1d',
  });

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token,
  };
};

module.exports = { registerUser, loginUser };