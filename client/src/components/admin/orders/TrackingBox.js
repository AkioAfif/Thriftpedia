'use client';

import toast from 'react-hot-toast';
import { detailFocusRing } from './DetailCard';

function CopyIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

// Tracking number + courier on a badge-info tile; Copy uses the browser clipboard only.
export default function TrackingBox({ trackingNumber, courier }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(trackingNumber);
      toast.success('Tracking number copied');
    } catch {
      toast.error('Couldn’t copy. Select the number and copy it manually.');
    }
  }

  return (
    <dl className="rounded-2xl bg-badge-info p-4">
      <dt className="text-[13px] font-medium text-text-secondary">Tracking number</dt>
      <dd className="mt-1 flex items-center justify-between gap-2">
        <span className="min-w-0 break-all text-base font-semibold tabular-nums text-text">{trackingNumber}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy tracking number"
          className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[#B7D3E0] bg-white px-3 text-sm font-semibold text-[#1F4B66] hover:bg-[#F5F9FB] ${detailFocusRing}`}
        >
          <CopyIcon />
          Copy
        </button>
      </dd>
      {courier && (
        <>
          <dt className="mt-3 text-[13px] font-medium text-text-secondary">Courier</dt>
          <dd className="mt-1 break-words text-sm font-medium text-text">{courier}</dd>
        </>
      )}
    </dl>
  );
}
