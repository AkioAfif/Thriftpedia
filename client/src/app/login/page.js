'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '../../lib/adminApi';
import { extractToken, setToken } from '../../lib/adminAuth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const token = extractToken(body);
      if (!token) throw new Error('Token tidak ditemukan pada respons login.');
      setToken(token);
      router.replace('/admin/dashboard');
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-[#e8e1d8] bg-white px-3 py-3 text-sm outline-none focus:border-[#b4532a]';

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf7f2] px-6 text-[#2b1d14]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-[#e8e1d8] bg-white p-8"
      >
        <h1 className="text-2xl font-bold">Log in</h1>

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
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-[10px] bg-[#a3452a] py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Log in'}
        </button>
      </form>
    </div>
  );
}