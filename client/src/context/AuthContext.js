'use client';

import { getCurrentUser } from '@/lib/services/authApi';
import { clearAllDrafts } from '@/hooks/usePersistedForm';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';

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
  const [verifiedToken, setVerifiedToken] = useState(null);
  const [sessionError, setSessionError] = useState(false);
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
    // Simpan sesi utama untuk semua pengguna
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser ?? null));

    // Remove the legacy duplicate token; all roles share one session.
    localStorage.removeItem('thriftpedia_token');
    setVerifiedToken(newToken);
    setSessionError(false);

    notify();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('thriftpedia_token');
    localStorage.removeItem(USER_KEY);
    setVerifiedToken(null);
    setSessionError(false);
    clearAllDrafts(); // unsaved form drafts belong to the account that wrote them
    notify();
  }, []);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout);
    return () => window.removeEventListener('auth:unauthorized', logout);
  }, [logout]);

  useEffect(() => {
    if (!token || !isTokenValid(token)) return;
    let active = true;
    getCurrentUser(token).then((response) => {
      if (!active) return;
      if (!['ADMIN', 'BUYER'].includes(response.data?.role)) { logout(); return; }
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      setVerifiedToken(token);
      setSessionError(false);
      notify();
    }).catch((error) => {
      if (!active) return;
      if (error.status === 401 || error.status === 404) logout();
      else setSessionError(true);
    });
    return () => { active = false; };
  }, [token, logout]);

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
      token: verifiedToken === token ? token : null,
      user,
      isLoggedIn: verifiedToken === token && isTokenValid(token),
      ready: ready && (!token || verifiedToken === token),
      login,
      logout,
    }),
    [token, user, ready, login, logout, verifiedToken]
  );

  return <AuthContext.Provider value={value}>{sessionError ? (
    <div role="alert" className="p-8 text-center">
      <p>Sesi belum dapat diverifikasi. Periksa koneksi ke server.</p>
      <button onClick={() => window.location.reload()} className="mt-4 underline">Coba lagi</button>
    </div>
  ) : children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
