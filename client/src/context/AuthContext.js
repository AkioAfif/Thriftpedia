'use client';

import { clearToken, setToken } from '@/lib/adminAuth';
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const EMPTY = JSON.stringify([null, null]);
function isTokenValid(token) {
  if (!token || typeof token !== 'string') return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload JWT (Base64URL)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    // exp menggunakan satuan detik, Date.now() milidetik
    if (typeof payload.exp !== 'number') return false;

    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

const listeners = new Set();

function subscribe(callback) {
  listeners.add(callback);
  window.addEventListener('storage', callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', callback);
  };
}

function notify() {
  listeners.forEach((callback) => callback());
}

function getSnapshot() {
  try {
    return JSON.stringify([localStorage.getItem(TOKEN_KEY), localStorage.getItem(USER_KEY)]);
  } catch {
    return EMPTY;
  }
}

const getServerSnapshot = () => EMPTY;

// true hanya di browser, supaya Navbar tidak berkedip "logged out" saat load
const subscribeNoop = () => () => {};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribeNoop, () => true, () => false);

  const { token, user } = useMemo(() => {
    const [t, u] = JSON.parse(raw);
    let parsedUser = null;
    try {
      parsedUser = u ? JSON.parse(u) : null;
    } catch {
      parsedUser = null;
    }
    return { token: t, user: parsedUser };
  }, [raw]);

  const login = useCallback((newToken, newUser) => {
    const isAdmin = String(newUser?.role ?? '').toUpperCase() === 'ADMIN';

    // Simpan sesi utama untuk semua pengguna
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser ?? null));

    // Token khusus admin hanya disimpan untuk role ADMIN
    if (isAdmin) {
      setToken(newToken);
    } else {
      clearToken();
    }

    notify();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('thriftpedia_token');
    localStorage.removeItem(USER_KEY);
    clearToken(); // also end the admin session stored by adminAuth
    notify();
  }, []);

  useEffect(() => {
    if (!token) return;

    // Jika token sudah expired atau formatnya tidak valid
    if (!isTokenValid(token)) {
      logout();
      return;
    }

    const payload = JSON.parse(
      atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    const expiresIn = payload.exp * 1000 - Date.now();

    const timeout = setTimeout(() => {
      logout();
    }, Math.min(expiresIn, 2147483647));

    return () => clearTimeout(timeout);
  }, [token, logout]);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoggedIn: isTokenValid(token),
      ready,
      login,
      logout,
    }),
    [token, user, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
