'use client';

import { useEffect, useRef } from 'react';
import { ORDER_STATUS_ORDER, statusMeta } from '@/lib/orderView';

// Order status filter as a row of chips, shared by the buyer order history and admin orders.
//
// mode="nav" (buyer):  <nav> + buttons with aria-current="page".
// mode="tabs" (admin): role="tablist", role="tab" with aria-selected / aria-controls, ids
//                      "order-tab-<STATUS|ALL>", roving tabindex and Arrow/Home/End keys.
//
// Active chips use the shared status palette; inactive chips use surface and border.
const ACTIVE = {
  '': 'border-text bg-text text-on-primary',
  PENDING: 'border-badge-warning bg-badge-warning text-text',
  PROCESSING: 'border-primary-tint bg-primary-tint text-primary',
  SHIPPED: 'border-badge-info bg-badge-info text-text',
  COMPLETED: 'border-badge-success bg-badge-success text-text',
  CANCELLED: 'border-border bg-border text-text',
};

const CHIPS = [{ value: '', label: 'All', countKey: 'ALL' }, ...ORDER_STATUS_ORDER.map((s) => ({ value: s, label: statusMeta(s).label, countKey: s }))];

// 40px tall chip; ::before adds 2px above and below so the hit area is 44px.
const chipBase =
  "relative flex h-10 shrink-0 snap-start items-center gap-1.5 whitespace-nowrap rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors duration-150 before:absolute before:inset-x-0 before:-inset-y-0.5 before:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none";

export default function StatusChips({
  value = '',
  counts,
  onSelect,
  mode = 'nav',
  ariaLabel = 'Filter orders by status',
  panelId,
  placeholderCount = false, // admin: show "–" until counts arrive
  formatCount = (n) => n, // admin: thousands separators (formatNumber)
}) {
  const stripRef = useRef(null);
  const refs = useRef([]);
  const activeIndex = Math.max(0, CHIPS.findIndex((c) => c.value === value));
  const tabs = mode === 'tabs';

  // Keep the active chip in view by scrolling the strip only, never the page. Re-run when
  // counts arrive: they widen every chip and can push the active one out again.
  useEffect(() => {
    const strip = stripRef.current;
    const chip = refs.current[activeIndex];
    if (!strip || !chip) return;
    const left = chip.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < strip.scrollLeft + 16) strip.scrollLeft = left - 16;
    else if (right > strip.scrollLeft + strip.clientWidth - 16) strip.scrollLeft = right - strip.clientWidth + 16;
  }, [activeIndex, counts]);

  function onKeyDown(e) {
    if (!tabs) return;
    const last = CHIPS.length - 1;
    const next = {
      ArrowRight: activeIndex === last ? 0 : activeIndex + 1,
      ArrowLeft: activeIndex === 0 ? last : activeIndex - 1,
      Home: 0,
      End: last,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onSelect(CHIPS[next].value);
    refs.current[next]?.focus();
  }

  const chips = CHIPS.map((chip, i) => {
    const active = i === activeIndex;
    const raw = counts?.[chip.countKey];
    const count = typeof raw === 'number' ? formatCount(raw) : placeholderCount && !counts ? '–' : null;
    const dim = !active && raw === 0;
    const a11y = tabs
      ? {
          role: 'tab',
          id: `order-tab-${chip.value || 'ALL'}`,
          'aria-selected': active,
          'aria-controls': panelId,
          tabIndex: active ? 0 : -1,
        }
      : { 'aria-current': active ? 'page' : undefined };
    const button = (
      <button
        key={tabs ? chip.countKey : undefined}
        ref={(el) => {
          refs.current[i] = el;
        }}
        type="button"
        onClick={() => onSelect(chip.value)}
        className={`${chipBase} ${
          active ? ACTIVE[chip.value] : `border-border bg-surface hover:bg-surface-muted ${dim ? 'text-text-secondary' : 'text-text'}`
        }`}
        {...a11y}
      >
        {chip.label}
        {count !== null && <span className="tabular-nums">{count}</span>}
      </button>
    );
    return tabs ? button : <li key={chip.countKey} className="flex">{button}</li>;
  });

  // Below md: one scrolling row, 16px side padding, no visible scrollbar. From md: wraps.
  const stripClass =
    'relative -mx-4 flex snap-x gap-2 overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:snap-none md:flex-wrap md:overflow-visible md:px-0';

  if (tabs) {
    return (
      <div ref={stripRef} role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown} className={stripClass}>
        {chips}
      </div>
    );
  }
  return (
    <nav ref={stripRef} aria-label={ariaLabel} className="relative -mx-4 snap-x overflow-x-auto px-4 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:snap-none md:overflow-visible md:px-0">
      <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">{chips}</ul>
    </nav>
  );
}
