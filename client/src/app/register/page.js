'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/ui/AuthForm';
import { registerUser, loginUser } from '@/lib/services/authApi';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(values) {
    if (pending) return;
    setPending(true);
    setError('');
    try {
      await registerUser(values);
      try {
        const response = await loginUser(values);
        login(response.data.token, response.data.user);
        router.replace('/catalog');
      } catch {
        router.replace('/login?registered=1');
      }
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }
  return (
    <main className="mx-auto w-full max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">Create account</h1>
      <AuthForm mode="register" formId="register-form" onValidSubmit={submit} />
      {error && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      <button type="submit" form="register-form" disabled={pending} className="w-full rounded-lg bg-primary p-3 text-on-primary disabled:opacity-50">
        {pending ? 'Creating account...' : 'Create account'}
      </button>
      <p className="mt-4">Sudah punya akun? <Link href="/login" className="underline">Log in</Link></p>
    </main>
  );
}
