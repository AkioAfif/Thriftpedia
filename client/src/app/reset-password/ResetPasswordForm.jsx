'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '@/lib/services/authApi';

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setError('Invalid reset link. Please request a new one.');
      return;
    }

    if (
      password.length < 8 ||
      password.length > 72 ||
      !/\d/.test(password)
    ) {
      setError(
        'Password must be 8–72 characters and include a number.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ token, password });
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(
        err?.message || 'Unable to reset password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--canvas)] px-4 py-12">
      <div
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8"
        style={{ width: '100%', maxWidth: '448px' }}
      >
        {success ? (
          <>
            <h1 className="text-2xl font-bold text-[var(--text)]">
              Password Updated!
            </h1>

            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Your password has been reset successfully.
              You can now log in with your new password.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block text-primary underline"
            >
              Back to Home
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[var(--text)]">
              Reset Password
            </h1>

            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Create a new password for your Thriftpedia account.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-sm font-medium text-[var(--text)]"
                >
                  New Password
                </label>

                <input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  maxLength={72}
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)]"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-[var(--text)]"
                >
                  Confirm Password
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-4 py-3 text-[var(--text)]"
                  placeholder="Confirm new password"
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-lg bg-[var(--primary)] px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
