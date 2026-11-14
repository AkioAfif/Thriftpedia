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
// variant="segmented" (default): the cream segmented control, used below md.
// variant="tabs": underlined tabs for the desktop toolbar card (56px tall, 24px apart).
export default function ProductStatCards({ stats, activeStatus, onSelect, variant = 'segmented' }) {
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
  const tabs = variant === 'tabs';

  return (
    // 52px tall in total: 44px segments + 4px padding.
    <div
      role="radiogroup"
      aria-label="Filter products by status"
      onKeyDown={onKeyDown}
      className={
        tabs
          ? 'flex h-14 items-stretch gap-6'
          : 'grid w-full grid-cols-3 gap-1 rounded-[14px] border border-[#E5DCCD] bg-[#F5F0E8] p-1 md:max-w-[480px]'
      }
    >
      {SEGMENTS.map((segment, i) => {
        const checked = i === selectedIndex;
        const number = stats.data ? formatNumber(stats.data[segment.key]) : null;
        const isZero = stats.data ? Number(stats.data[segment.key]) === 0 : false;
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
            className={
              tabs
                ? `group flex h-14 shrink-0 items-center gap-2 border-b-[3px] text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none ${
                    checked ? 'border-[#B5532E] text-[#B5532E]' : 'border-transparent text-[#6F6358] hover:text-[#2B2118]'
                  }`
                : `flex h-11 min-w-0 items-center justify-center gap-2 rounded-[10px] px-2 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none ${
                    checked ? 'bg-[#2B2118] text-white' : 'bg-transparent text-[#4A3F35] hover:bg-[#EDE5D8]'
                  }`
            }
          >
            <span className="truncate">{segment.label}</span>
            {/* Hidden under 360px, where three labels plus numbers get tight. */}
            {loading ? (
              <span aria-hidden="true" className={tabs ? 'size-6 shrink-0 animate-pulse rounded-full bg-[#EFE7DA]' : 'h-4 w-5 shrink-0 animate-pulse rounded bg-[#E5DCCD] max-[359px]:hidden'} />
            ) : (
              <span
                aria-hidden="true"
                className={
                  tabs
                    ? // Count pill: 24px tall, min 24px wide, 8px side padding. Active #B5532E/white;
                      // idle #EFE7DA/#2B2118 (#E5DCCD on hover); zero #F5F0E8/#776B5F (4.6:1).
                      `inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-2 text-[13px] font-semibold leading-none transition-colors duration-150 motion-reduce:transition-none ${
                        checked
                          ? 'bg-[#B5532E] text-white'
                          : isZero
                            ? 'bg-[#F5F0E8] text-[#776B5F]'
                            : 'bg-[#EFE7DA] text-[#2B2118] group-hover:bg-[#E5DCCD]'
                      }`
                    : `shrink-0 rounded-full px-2 py-0.5 text-[13px] font-semibold leading-tight max-[359px]:hidden ${
                        checked ? 'bg-white/20 text-white' : 'text-[#6F6358]'
                      }`
                }
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
