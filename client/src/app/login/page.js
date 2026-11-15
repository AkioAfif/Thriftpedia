'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/adminApi';
import { extractToken } from '../../lib/adminAuth';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const body = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const token = extractToken(body);
      if (!token) throw new Error('Token tidak ditemukan pada respons login.');
      const user = body?.data?.user;
      login(token, user);
      const returnTo = new URLSearchParams(window.location.search).get('returnTo');
      const safeReturn = returnTo?.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\');
      router.replace(safeReturn ? returnTo : String(user?.role).toUpperCase() === 'ADMIN' ? '/admin/dashboard' : '/catalog');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-primary';

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 text-text">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[24rem] rounded-2xl border border-border bg-surface p-8"
      >
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="mt-3 text-sm">Belum punya akun? <Link href="/register" className="underline">Daftar</Link></p>

        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className={inputClass}
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </label>

        {error && (
          <p role="alert" className="mt-4 text-sm text-error">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-[10px] bg-primary py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}
