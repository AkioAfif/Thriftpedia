'use client';

import { useRef } from 'react';
import { formatNumber } from '../../../lib/adminProducts';

const SEGMENTS = [
  { value: '', label: 'All', key: 'total' },
  { value: 'AVAILABLE', label: 'Available', key: 'available' },
  { value: 'SOLD', label: 'Sold', key: 'sold' },
];

// Segmented control over the status filter: All = no status, Available, Sold.
// Still a radio group: role="radio" + aria-checked, roving tabindex, Arrow/Home/End move the
// selection and apply it. Clicking (or Space/Enter on) the selected Available/Sold segment
// clears the filter, as before. Numbers use proportional figures (no tabular-nums).
export default function ProductStatCards({ stats, activeStatus, onSelect }) {
  const refs = useRef([]);
  const selectedIndex = Math.max(0, SEGMENTS.findIndex((s) => s.value === activeStatus));

  function selectAt(index) {
    const segment = SEGMENTS[index];
    if (segment.value !== activeStatus) onSelect(segment.value);
    refs.current[index]?.focus();
  }

  function onKeyDown(e) {
    const last = SEGMENTS.length - 1;
    const next = {
      ArrowRight: selectedIndex === last ? 0 : selectedIndex + 1,
      ArrowDown: selectedIndex === last ? 0 : selectedIndex + 1,
      ArrowLeft: selectedIndex === 0 ? last : selectedIndex - 1,
      ArrowUp: selectedIndex === 0 ? last : selectedIndex - 1,
      Home: 0,
      End: last,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectAt(next);
  }

  const loading = stats.status === 'loading' && !stats.data;

  return (
    // 52px tall in total: 44px segments + 4px padding.
    <div
      role="radiogroup"
      aria-label="Filter products by status"
      onKeyDown={onKeyDown}
      className="grid w-full grid-cols-3 gap-1 rounded-[14px] border border-[#E5DCCD] bg-[#F5F0E8] p-1 md:max-w-[480px]"
    >
      {SEGMENTS.map((segment, i) => {
        const checked = i === selectedIndex;
        const number = stats.data ? formatNumber(stats.data[segment.key]) : null;
        const accessibleName = `${segment.label} products: ${number ?? (loading ? 'loading' : 'unavailable')}`;
        return (
          <button
            key={segment.label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={accessibleName}
            tabIndex={checked ? 0 : -1}
            onClick={() => onSelect(checked && segment.value ? '' : segment.value)}
            className={`flex h-11 min-w-0 items-center justify-center gap-2 rounded-[10px] px-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none ${
              checked ? 'bg-[#2B2118] text-white' : 'bg-transparent text-[#4A3F35] hover:bg-[#EDE5D8]'
            }`}
          >
            <span className="truncate">{segment.label}</span>
            {/* Hidden under 360px, where three labels plus numbers get tight. */}
            {loading ? (
              <span aria-hidden="true" className="h-4 w-5 shrink-0 animate-pulse rounded bg-[#E5DCCD] max-[359px]:hidden" />
            ) : (
              <span
                aria-hidden="true"
                className={`shrink-0 rounded-full px-2 py-0.5 text-[13px] font-semibold leading-tight max-[359px]:hidden ${
                  checked ? 'bg-white/20 text-white' : 'text-[#6F6358]'
                }`}
              >
                {number ?? '-'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
