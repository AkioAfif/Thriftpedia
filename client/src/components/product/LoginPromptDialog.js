'use client';

import { useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { CloseIcon } from '@/components/ui/Icons';

const COPY = {
  buy: {
    title: 'Log in to buy this piece',
    body: 'Log in or create an account to continue. We’ll bring you straight back to checkout for this piece.',
  },
  wishlist: {
    title: 'Log in to save this piece',
    body: 'Log in or create an account to keep a wishlist. We’ll bring you back here and save it for you.',
  },
};

// Pop-up for logged-out buyers. returnTo already carries ?action=buy|wishlist so the
// product page can resume the action even if the login page only honours `redirect`.
export function LoginPromptDialog({ action, returnTo, onClose }) {
  const uid = useId();
  const dialogRef = useRef(null);
  const loginRef = useRef(null);
  const copy = COPY[action] ?? COPY.buy;
  const query = `redirect=${encodeURIComponent(returnTo)}&action=${action}`;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    loginRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('a[href], button:not([disabled])') ?? [];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/50 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-desc`}
        className="relative w-full max-w-[28rem] rounded-2xl bg-surface p-6 shadow-level-3 sm:p-7"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface-muted hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <h2 id={`${uid}-title`} className="pr-10 text-headline-sm font-semibold text-text">
          {copy.title}
        </h2>
        <p id={`${uid}-desc`} className="mt-2 text-body-md text-text-secondary">
          {copy.body}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            ref={loginRef}
            href={`/login?${query}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-5 text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Log in
          </Link>
          <Link
            href={`/register?${query}`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-5 text-body-md font-semibold text-text transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
