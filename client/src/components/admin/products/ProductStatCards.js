'use client';

import { useRef } from 'react';
import { HangerIcon } from '@/components/ui/icons/HangerIcon';
import { CheckCircleIcon, ClipboardIcon } from '../icons';
import { formatNumber } from '../../../lib/adminProducts';

// Selected: full tint + 2px saturated border. Unselected: lighter tint + 1.5px soft border
// (padding is 0.5px larger so switching never shifts the layout). `ink` = saturated colour.
const CARDS = [
  {
    value: '',
    label: 'Total',
    key: 'total',
    action: 'Show all',
    Icon: HangerIcon,
    ink: 'text-[#4A3F35]',
    number: 'text-[#2B2118]',
    selected: 'bg-[#F5F0E8] border-[#4A3F35]',
    idle: 'bg-[#FAF7F2] border-[#E5DCCD] hover:border-[#4A3F35]',
    radio: 'border-[#4A3F35]',
    radioOn: 'bg-[#4A3F35]',
  },
  {
    value: 'AVAILABLE',
    label: 'Available',
    key: 'available',
    action: 'Show available',
    Icon: CheckCircleIcon,
    ink: 'text-[#3F6B3E]',
    number: 'text-[#3F6B3E]',
    selected: 'bg-[#E4EEE2] border-[#3F6B3E]',
    idle: 'bg-[#F1F6F0] border-[#CADDC6] hover:border-[#3F6B3E]',
    radio: 'border-[#3F6B3E]',
    radioOn: 'bg-[#3F6B3E]',
  },
  {
    value: 'SOLD',
    label: 'Sold',
    key: 'sold',
    action: 'Show sold',
    Icon: ClipboardIcon,
    ink: 'text-[#B5532E]',
    number: 'text-[#B5532E]',
    selected: 'bg-[#FBE6DC] border-[#B5532E]',
    idle: 'bg-[#FDF2EC] border-[#EBC3AE] hover:border-[#B5532E]',
    radio: 'border-[#B5532E]',
    radioOn: 'bg-[#B5532E]',
  },
];

// Lift 2px + soft shadow on hover, scale .99 when pressed, 2px focus ring (keyboard only).
// Only transform, box-shadow and border-color animate; reduced motion keeps cards still.
const cardFx =
  'cursor-pointer transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(43,33,24,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100';

// Radio mark beside the label: 16px below sm, 20px from sm. Filled with a white dot when selected.
function RadioMark({ checked, ring, fill }) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 sm:size-5 ${ring} ${
        checked ? fill : 'bg-white'
      }`}
    >
      {checked && <span className="size-1.5 rounded-full bg-white sm:size-2" />}
    </span>
  );
}

// stats: { status: 'loading' | 'ready' | 'error', data: { total, available, sold } | null }
// A radio group over the status filter: Total = no status, Available, Sold.
// Clicking (or Space/Enter on) the selected Available/Sold card still clears the filter,
// as before. Arrow keys, Home and End move the selection and apply it right away.
export default function ProductStatCards({ stats, activeStatus, onSelect }) {
  const refs = useRef([]);
  const selectedIndex = Math.max(0, CARDS.findIndex((c) => c.value === activeStatus));

  function selectAt(index) {
    const card = CARDS[index];
    if (card.value !== activeStatus) onSelect(card.value);
    refs.current[index]?.focus();
  }

  function onKeyDown(e) {
    const last = CARDS.length - 1;
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

  return (
    <div role="radiogroup" aria-label="Filter products by status" onKeyDown={onKeyDown} className="grid grid-cols-3 gap-2 sm:gap-4">
      {CARDS.map((card, i) => {
        const { value, label, key, action, Icon, ink, number: numberTone } = card;
        const checked = i === selectedIndex;
        const showSkeleton = stats.status === 'loading' && !stats.data;
        // Big numbers use proportional figures on purpose: tabular-nums (tnum) swaps in a footed "1".
        const number = stats.data ? formatNumber(stats.data[key]) : null;
        const accessibleName = `${label} products: ${number ?? (showSkeleton ? 'loading' : 'unavailable')}. ${action}`;
        return (
          <button
            key={label}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={accessibleName}
            tabIndex={checked ? 0 : -1}
            onClick={() => onSelect(checked && value ? '' : value)}
            // Two columns: content (left, top-aligned) and, from sm, a 40px icon tile (right).
            // Unselected cards have a 1.5px border and 0.5px more padding, so nothing shifts.
            className={`relative grid min-h-[44px] min-w-0 grid-cols-[minmax(0,1fr)] content-start items-start gap-x-3 rounded-2xl text-left sm:grid-cols-[minmax(0,1fr)_auto] ${cardFx} ${
              checked
                ? `border-2 p-3 sm:p-[18px] ${card.selected}`
                : `border-[1.5px] p-[12.5px] sm:p-[18.5px] ${card.idle}`
            }`}
          >
            <span className="min-w-0">
              {/* Radio + label on one line (gap 10px). Number and action are indented by
                  radio + gap (30px from sm) so they line up with the label, not the radio. */}
              <span className="flex items-center gap-2.5">
                <RadioMark checked={checked} ring={card.radio} fill={card.radioOn} />
                <span className="min-w-0 truncate text-sm font-semibold text-[#6F6358]">{label}</span>
              </span>
              {showSkeleton ? (
                <span aria-hidden="true" className="mt-1.5 block h-8 w-16 animate-pulse rounded-md bg-white sm:ml-[30px]" />
              ) : (
                <span className={`mt-1 block font-sans text-[24px] font-semibold leading-tight sm:pl-[30px] sm:text-[32px] ${numberTone}`}>
                  {number ?? (
                    <>
                      <span aria-hidden="true">-</span>
                      <span className="sr-only">unavailable</span>
                    </>
                  )}
                </span>
              )}
              <span className={`mt-1 hidden pl-[30px] text-[13px] font-semibold sm:block ${ink}`}>{action}</span>
            </span>
            <span aria-hidden="true" className={`hidden size-10 shrink-0 items-center justify-center rounded-xl bg-white sm:flex ${ink}`}>
              <Icon width={20} height={20} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
