'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import { apiFetch } from '../../lib/adminApi';
import { clearToken, extractUser, getToken } from '../../lib/adminAuth';

function FullScreenMessage({ title, message, children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-6">
      <div className="max-w-[28rem] text-center">
        <h1 className="text-2xl font-bold text-[#2b1d14]">{title}</h1>
        <p className="mt-3 text-sm text-[#6b5d52]">{message}</p>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('checking'); // checking | ready | denied | error
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const logout = useCallback(() => {
    clearToken();
    router.replace('/login');
  }, [router]);

  useEffect(() => {
    let active = true;

    async function check() {
      if (!getToken()) {
        router.replace('/login');
        return;
      }
      try {
        const body = await apiFetch('/auth/me');
        if (!active) return;
        const me = extractUser(body);
        setUser(me);
        setStatus(me.role === 'ADMIN' ? 'ready' : 'denied');
      } catch (err) {
        if (!active) return;
        if (err.status === 401) {
          clearToken();
          router.replace('/login');
          return;
        }
        setErrorMessage(err.message);
        setStatus('error');
      }
    }

    check();
    return () => {
      active = false;
    };
  }, [router]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-[#faf7f2] p-10">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-[#efe9e0]" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-[20px] bg-[#efe9e0]" />
          <div className="h-72 animate-pulse rounded-[20px] bg-[#efe9e0]" />
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <FullScreenMessage
        title="Akses ditolak"
        message="Halaman ini khusus admin."
      >
        <button
          type="button"
          onClick={logout}
          className="rounded-lg bg-[#b4532a] px-5 py-2 text-sm font-medium text-white"
        >
          Log out
        </button>
      </FullScreenMessage>
    );
  }

  if (status === 'error') {
    return (
      <FullScreenMessage title="Gagal memuat halaman" message={errorMessage}>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#b4532a] px-5 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
      </FullScreenMessage>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf7f2] text-[#2b1d14] lg:flex-row">
      <Sidebar user={user} onLogout={logout} />
      <main className="min-w-0 flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}