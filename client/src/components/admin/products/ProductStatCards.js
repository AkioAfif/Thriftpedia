'use client';

import { BoxIcon, CheckCircleIcon, ClipboardIcon } from '../icons';
import { formatNumber } from '../../../lib/adminProducts';

const CARDS = [
  { value: '', label: 'Total', key: 'total', Icon: BoxIcon, iconBox: 'bg-[#efe9e0] text-[#6b5d52]' },
  { value: 'AVAILABLE', label: 'Available', key: 'available', Icon: CheckCircleIcon, iconBox: 'bg-[#dff0e0] text-[#2f6b3a]' },
  { value: 'SOLD', label: 'Sold', key: 'sold', Icon: ClipboardIcon, iconBox: 'bg-[#e8e1d8] text-[#6b5d52]' },
];

export default function ProductStatCards({ stats, activeStatus, onSelect }) {
  return (
    <div role="radiogroup" aria-label="Filter by status" className="grid gap-4 md:grid-cols-3">
      {CARDS.map(({ value, label, key, Icon, iconBox }) => {
        const selected = activeStatus === value;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(value)}
            className={`flex items-center gap-4 rounded-2xl border-2 p-5 text-left transition-colors ${
              selected
                ? 'border-[#b4532a] bg-[#f8ebe4]'
                : 'border-[#e8e1d8] bg-white hover:border-[#d9cfc2]'
            }`}
          >
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconBox}`}>
              <Icon />
            </span>
            <span className="flex-1">
              <span className="block text-sm text-[#6b5d52]">{label}</span>
              <span className="block text-3xl font-semibold text-[#2b1d14]">
                {stats ? formatNumber(stats[key]) : '–'}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                selected ? 'border-[#b4532a]' : 'border-[#6b5d52]'
              }`}
            >
              {selected && <span className="h-3 w-3 rounded-full bg-[#b4532a]" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}