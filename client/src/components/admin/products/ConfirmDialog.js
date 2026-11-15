'use client';

import { useEffect } from 'react';

export default function ConfirmDialog({ title, message, confirmLabel, busy, onConfirm, onCancel }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !busy) onCancel();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/35 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-[28rem] rounded-2xl bg-surface p-6 shadow-xl"
      >
        <h2 id="confirm-title" className="text-xl font-semibold text-text">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-text-secondary">
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-[10px] border border-border bg-surface px-5 py-2.5 text-sm font-medium text-text disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {busy ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
