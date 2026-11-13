'use client';

import { BoxIcon, CheckCircleIcon, ClipboardIcon } from '../icons';
import { formatNumber } from '../../../lib/adminProducts';

const CARDS = [
  { value: '', label: 'Total', key: 'total', Icon: BoxIcon, iconBox: 'bg-[#efe9e0] text-[#6b5d52]' },
  { value: 'AVAILABLE', label: 'Available', key: 'available', Icon: CheckCircleIcon, iconBox: 'bg-[#dff0e0] text-[#2f6b3a]' },
  { value: 'SOLD', label: 'Sold', key: 'sold', Icon: ClipboardIcon, iconBox: 'bg-[#e8e1d8] text-[#6b5d52]' },
];

// stats: { status: 'loading' | 'ready' | 'error', data: { total, available, sold } | null }
// Each card filters the list by status; pressing the active card again goes back to all.
export default function ProductStatCards({ stats, activeStatus, onSelect }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
      {CARDS.map(({ value, label, key, Icon, iconBox }) => {
        const pressed = activeStatus === value;
        const showSkeleton = stats.status === 'loading' && !stats.data;
        const number = stats.data ? formatNumber(stats.data[key]) : null;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={pressed}
            onClick={() => onSelect(pressed && value ? '' : value)}
            className={`flex min-h-[44px] items-center gap-4 rounded-2xl border p-4 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 sm:p-5 ${
              pressed
                ? 'border-[#2b1d14] bg-[#f1ebe1]'
                : 'border-[#e8e1d8] bg-white hover:border-[#CFBEAE]'
            }`}
          >
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBox}`}>
              <Icon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-[#6b5d52]">{label}</span>
              {showSkeleton ? (
                <span aria-hidden="true" className="mt-1.5 block h-7 w-16 animate-pulse rounded-md bg-[#e8e1d8]" />
              ) : (
                <span className="block text-3xl font-semibold tabular-nums text-[#2b1d14]">
                  {number ?? (
                    <>
                      <span aria-hidden="true">-</span>
                      <span className="sr-only">unavailable</span>
                    </>
                  )}
                </span>
              )}
              {showSkeleton && <span className="sr-only">Loading</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
