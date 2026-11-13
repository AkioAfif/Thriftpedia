'use client';

import { useEffect, useId, useRef } from 'react';

// Native modal dialogs trap focus, make the background inert, and restore focus
// to the triggering control. The owner decides whether a dirty draft may close.
export function ActionDialog({ title, onRequestClose, busy = false, children }) {
  const ref = useRef(null);
  const callback = useRef(onRequestClose);
  const busyRef = useRef(busy);
  const id = useId();
  useEffect(() => { callback.current = onRequestClose; busyRef.current = busy; });
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <dialog ref={ref} data-buyer-dialog aria-labelledby={id} aria-busy={busy}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[90dvh] w-full max-w-none overflow-y-auto rounded-t-xl border border-border bg-surface p-md text-text shadow-level-3 md:inset-0 md:m-auto md:max-w-[560px] md:rounded-xl md:p-lg"
      onCancel={(event) => { event.preventDefault(); if (!busyRef.current) callback.current(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busyRef.current) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) callback.current();
      }}>
      <div className="mb-lg flex items-start justify-between gap-md">
        <h2 id={id} className="headline-sm">{title}</h2>
        <button type="button" aria-label="Close dialog" disabled={busy} onClick={onRequestClose}
          className="buyer-control flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-canvas disabled:opacity-50">×</button>
      </div>
      {children}
    </dialog>
  );
}
