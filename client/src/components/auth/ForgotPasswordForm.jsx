'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function ForgotPasswordForm({
  onBack,
  onSubmit,
  loading = false,
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address');
      return;
    }

    setError('');
    onSubmit?.(normalizedEmail);
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-lg"
    >
      <div className="flex flex-col gap-sm">
        <label
          htmlFor="reset-email"
          className="label-md text-text-secondary"
        >
          Email
        </label>

        <input
          id="reset-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (error) setError('');
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'reset-email-error' : undefined}
          className="h-12 w-full rounded-md border border-border bg-surface px-md body-md text-text outline-none placeholder:text-text-muted focus:border-primary focus:ring-2 focus:ring-primary-tint"
        />

        {error && (
          <p
            id="reset-email-error"
            role="alert"
            className="body-sm text-error"
          >
            {error}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="h-12 w-full rounded-md shadow-none"
      >
        Send reset link
      </Button>

      <button
        type="button"
        onClick={onBack}
        className="body-md text-center font-semibold text-text hover:text-primary"
      >
        Back to Login
      </button>
    </form>
  );
}
