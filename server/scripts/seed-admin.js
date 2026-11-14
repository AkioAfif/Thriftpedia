const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const ROLES = require('../src/constants/roles');

async function seedAdmin() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      'MONGO_URI, ADMIN_EMAIL, dan ADMIN_PASSWORD wajib diisi di server/.env'
    );
  }

  if (ADMIN_PASSWORD.length < 8 || ADMIN_PASSWORD.length > 72) {
    throw new Error('Password minimal 8 karakter');
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();

  console.log('Memulai koneksi MongoDB...');

  await mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
  });

  console.log('MongoDB berhasil terhubung!');

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.log('Akun dengan email tersebut sudah ada. Tidak ada perubahan.');
    return;
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await User.create({
    name: 'Thriftpedia Admin',
    email,
    password: hashedPassword,
    role: ROLES.ADMIN,
  });

  console.log('Akun ADMIN demo berhasil dibuat!');
}

seedAdmin()
  .catch((error) => {
    console.error('Gagal membuat ADMIN:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
