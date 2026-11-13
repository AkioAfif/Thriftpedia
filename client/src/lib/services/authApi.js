import { apiClient } from '@/lib/api';

// Mengirim data registrasi ke backend
export async function registerUser({ name, email, password }) {
  return apiClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

// Mengirim email dan password untuk login
export async function loginUser({ email, password }) {
  return apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

// Mengambil data pengguna yang sedang login
export async function getCurrentUser(token) {
  return apiClient('/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
