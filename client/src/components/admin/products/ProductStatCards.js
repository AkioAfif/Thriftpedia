'use client';

import { HangerIcon } from '@/components/ui/icons/HangerIcon';
import { CheckCircleIcon, ClipboardIcon } from '../icons';
import { formatNumber } from '../../../lib/adminProducts';

// Solid tint per card; the pressed (filtering) card gets a 2px border in its saturated colour.
// The border is always 2px so pressing a card never shifts the layout.
const CARDS = [
  {
    value: '',
    label: 'Total',
    key: 'total',
    Icon: HangerIcon,
    tone: 'bg-[#F5F0E8] text-[#2B2118]',
    border: 'border-[#E5DCCD]',
    pressedBorder: 'border-[#4A3F35]',
  },
  {
    value: 'AVAILABLE',
    label: 'Available',
    key: 'available',
    Icon: CheckCircleIcon,
    tone: 'bg-[#E4EEE2] text-[#3F6B3E]',
    border: 'border-[#CADDC6]',
    pressedBorder: 'border-[#3F6B3E]',
  },
  {
    value: 'SOLD',
    label: 'Sold',
    key: 'sold',
    Icon: ClipboardIcon,
    tone: 'bg-[#FBE6DC] text-[#B5532E]',
    border: 'border-[#EBC3AE]',
    pressedBorder: 'border-[#B5532E]',
  },
];

// stats: { status: 'loading' | 'ready' | 'error', data: { total, available, sold } | null }
// Each card filters the list by status; pressing the active card again goes back to all.
export default function ProductStatCards({ stats, activeStatus, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      {CARDS.map(({ value, label, key, Icon, tone, border, pressedBorder }) => {
        const pressed = activeStatus === value;
        const showSkeleton = stats.status === 'loading' && !stats.data;
        const number = stats.data ? formatNumber(stats.data[key]) : null;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={pressed}
            onClick={() => onSelect(pressed && value ? '' : value)}
            className={`flex min-h-[44px] min-w-0 items-center gap-4 rounded-2xl border-2 p-3 text-left transition-colors duration-150 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 sm:p-5 ${tone} ${
              pressed ? pressedBorder : border
            }`}
          >
            <span aria-hidden="true" className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-white sm:flex">
              <Icon />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-[#6F6358]">{label}</span>
              {showSkeleton ? (
                <span aria-hidden="true" className="mt-1.5 block h-8 w-16 animate-pulse rounded-md bg-white" />
              ) : (
                <span className="block text-[26px] font-semibold leading-tight tabular-nums sm:text-[32px]">
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
