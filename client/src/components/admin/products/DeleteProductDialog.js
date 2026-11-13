'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { formatRupiah, getPhotoSrc as getPhoto } from '../../../lib/adminProducts';

export default function DeleteProductDialog({ product, busy = false, onConfirm, onCancel }) {
  const uid = useId();
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);
  const [imageFailed, setImageFailed] = useState(false);

  const photo = getPhoto(product);
  const showPhoto = photo.length > 0 && !imageFailed;

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        if (!busy) onCancel();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = [cancelRef.current, confirmRef.current].filter((el) => el && !el.disabled);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!focusable.includes(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onCancel]);

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2b1d14]/40 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-desc`}
        className="w-full max-w-[504px] rounded-[20px] bg-white p-7 shadow-2xl"
      >
        <h2 id={`${uid}-title`} className="text-[28px] font-semibold leading-tight text-[#2b1d14]">
          Delete this product?
        </h2>

        <div className="mt-6 flex items-center gap-4 rounded-xl bg-[#faf7f2] p-4">
          {showPhoto ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={photo}
              alt=""
              onError={() => setImageFailed(true)}
              className="h-16 w-16 shrink-0 rounded-lg bg-[#efe9e0] object-cover"
            />
          ) : (
            <span aria-hidden="true" className="block h-16 w-16 shrink-0 rounded-lg bg-[#efe9e0]" />
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-medium text-[#2b1d14]">{product?.name}</p>
            <p className="mt-1 text-sm text-[#6b5d52]">{formatRupiah(product?.price)}</p>
          </div>
        </div>

        <p id={`${uid}-desc`} className="mt-6 text-[15px] leading-relaxed text-[#6b5d52]">
          This permanently removes it from the catalog. This can’t be undone.
        </p>

        <div className="mt-10 flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="basis-1/3 rounded-[10px] border border-[#e8e1d8] bg-white px-5 py-3.5 text-sm font-medium text-[#2b1d14] hover:bg-[#faf7f2] focus:outline-none focus:ring-2 focus:ring-[#b4532a] focus:ring-offset-2 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-[10px] bg-[#9b2b2b] px-5 py-3.5 text-sm font-semibold text-white hover:bg-[#862323] focus:outline-none focus:ring-2 focus:ring-[#9b2b2b] focus:ring-offset-2 disabled:opacity-60"
          >
            {busy ? 'Deleting...' : 'Delete product'}
          </button>
        </div>
      </div>
    </div>
  );
}