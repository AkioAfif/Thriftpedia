'use client';

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const EMPTY = JSON.stringify([null, null]);

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
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser ?? null));
    notify();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    notify();
  }, []);

  const value = useMemo(
    () => ({ token, user, isLoggedIn: Boolean(token), ready, login, logout }),
    [token, user, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}