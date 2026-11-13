'use client';

import { useRef, useState } from 'react';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { apiClient } from '@/lib/api';

export function BuyerLoginDialog({ productName, onClose, onSuccess }) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await apiClient('/auth/login', { method: 'POST', body: JSON.stringify({ email: form.get('email').trim(), password: form.get('password') }) });
      if (!result?.data?.token || !result.data.user) throw new Error('Unable to sign in. Please try again.');
      await onSuccess(result.data.token, result.data.user);
    } catch (err) { setError(err.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <ActionDialog title="Log in to your account" busy={busy} onRequestClose={onClose}>
    <p className="body-md mb-lg text-text-secondary">{productName ? `Log in to save ${productName}. We’ll continue your save after login.` : 'Log in to see your saved pieces.'}</p>
    <form onSubmit={submit} className="space-y-md">
      <label className="block label-md">Email<input name="email" type="email" autoComplete="email" required disabled={busy} className="buyer-input mt-sm" /></label>
      <label className="block label-md">Password<input name="password" type="password" autoComplete="current-password" required disabled={busy} className="buyer-input mt-sm" /></label>
      {error && <p role="alert" className="body-sm text-error">! {error}</p>}
      <button type="submit" disabled={busy} className="buyer-primary w-full">{busy ? 'Signing in…' : productName ? 'Log in & save' : 'Log in'}</button>
    </form>
  </ActionDialog>;
}
