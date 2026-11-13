const TOKEN_KEY = 'thriftpedia_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // penyimpanan tidak tersedia, abaikan
  }
}

export function clearToken() {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // penyimpanan tidak tersedia, abaikan
  }
}

// Mencoba beberapa bentuk response login yang umum.
export function extractToken(body) {
  const candidates = [
    body?.token,
    body?.accessToken,
    body?.data?.token,
    body?.data?.accessToken,
  ];
  return candidates.find((t) => typeof t === 'string' && t.length > 0) ?? null;
}

// Mencoba beberapa bentuk response /api/auth/me yang umum.
export function extractUser(body) {
  const raw = body?.data?.user ?? body?.data ?? body?.user ?? body ?? {};
  return {
    name: raw.name || raw.email || 'User',
    email: raw.email || '',
    role: String(raw.role ?? '').toUpperCase(),
  };
}