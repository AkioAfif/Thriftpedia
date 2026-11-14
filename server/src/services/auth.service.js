const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');
const { sendPasswordResetEmail } = require('./email.service');

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
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    token,
  };
};

const getMe = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new AppError(404, 'User not found');
  }

  return { id: user._id, name: user.name, email: user.email, role: user.role };
};

const requestPasswordReset = async (email) => {
  const user = await User.findOne({
    email: email.trim().toLowerCase(),
  });

  // Jangan ungkap apakah email terdaftar atau tidak
  if (!user) return null;

  // Generate token acak
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Simpan hash token, bukan token aslinya
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

  await user.save();

  try {
    // Kirim link reset password ke email pengguna
    await sendPasswordResetEmail(user.email, resetToken);
  } catch (error) {
    // Hapus token jika pengiriman email gagal
    await User.updateOne(
      { _id: user._id, resetPasswordToken: hashedToken },
      {
        $unset: {
          resetPasswordToken: '',
          resetPasswordExpires: '',
        },
      }
    );

    throw error;
  }

  return null;
};

const resetPassword = async (token, newPassword) => {
  // Ubah token dari URL menjadi hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Cari user dengan token yang cocok dan belum kedaluwarsa
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new AppError(400, 'Invalid or expired reset token');
  }

  // Validasi password baru
  if (
    typeof newPassword !== 'string' ||
    newPassword.length < 8 ||
    !/\d/.test(newPassword)
  ) {
    throw new AppError(
      400,
      'Password must contain at least 8 characters and a number'
    );
  }

  // Hash password baru
  user.password = await bcrypt.hash(newPassword, 10);

  // Hapus token agar tidak bisa digunakan lagi
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return { message: 'Password reset successfully' };
};

module.exports = { registerUser, loginUser, getMe, requestPasswordReset, resetPassword };