const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: { type: String, required: [true, 'Password is required'], select: false },
    role: { type: String, enum: ['ADMIN', 'BUYER'], default: 'BUYER' },
  },
  { timestamps: true }
);

module.exports = model('User', userSchema);
