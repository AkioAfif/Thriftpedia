import { getToken } from './adminAuth';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// path tanpa awalan /api, misalnya '/auth/me'
export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  let res;
  try {
    res = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Pastikan backend berjalan.', 0);
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    // respons bukan JSON
  }

  if (!res.ok) {
    throw new ApiError(body?.message || `Permintaan gagal (status ${res.status})`, res.status);
  }
  return body;
}