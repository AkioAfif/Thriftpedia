'use client';

import { useEffect, useRef } from 'react';
import { ORDER_STATUS_ORDER, statusMeta } from '@/lib/adminOrders';
import { formatNumber } from '@/lib/adminProducts';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B5532E]';

// Active tab: solid tint + 3px bottom border in the status's saturated colour (statusMeta dot).
const TAB_TONE = {
  '': { active: 'bg-[#F5F0E8] border-[#4A3F35]', pill: 'bg-[#E5DCCD] text-[#4A3F35]' },
  PENDING: { active: 'bg-[#FBF1D4] border-[#B07D12]' },
  PROCESSING: { active: 'bg-[#FBE6DC] border-[#B5532E]' },
  SHIPPED: { active: 'bg-[#DCEBF2] border-[#2E6A8F]' },
  COMPLETED: { active: 'bg-[#E4EEE2] border-[#2F7A3E]' },
  CANCELLED: { active: 'bg-[#EDE6DC] border-[#8A7A6B]' },
};

// Counts come straight from the list response (`counts`): they follow the search but
// ignore the active status, so every tab keeps showing its own total.
export default function OrderStatusTabs({ counts, active, onSelect, panelId }) {
  const refs = useRef([]);
  const tabs = [
    { value: '', label: 'All', count: counts?.ALL },
    ...ORDER_STATUS_ORDER.map((status) => ({ value: status, label: statusMeta(status).label, count: counts?.[status] })),
  ];
  const activeIndex = Math.max(0, tabs.findIndex((t) => t.value === active));

  // On narrow screens the tab strip scrolls; keep the selected tab in view (e.g. ?status=CANCELLED).
  // Re-run when counts arrive: they widen every tab and can push the selected one out again.
  // Scrolls only the strip, never the page.
  const stripRef = useRef(null);
  useEffect(() => {
    const strip = stripRef.current;
    const tab = refs.current[activeIndex];
    if (!strip || !tab) return;
    const left = tab.offsetLeft; // strip is `relative`, so this is already strip-relative
    const right = left + tab.offsetWidth;
    if (left < strip.scrollLeft) strip.scrollLeft = left - 8;
    else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = right - strip.clientWidth + 16;
  }, [activeIndex, counts]);

  function onKeyDown(e) {
    const last = tabs.length - 1;
    const next = {
      ArrowRight: activeIndex === last ? 0 : activeIndex + 1,
      ArrowLeft: activeIndex === 0 ? last : activeIndex - 1,
      Home: 0,
      End: last,
    }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    onSelect(tabs[next].value);
    refs.current[next]?.focus();
  }

  return (
    <div
      ref={stripRef}
      className="relative snap-x overflow-x-auto rounded-2xl border border-[#D9CFC1] bg-white p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* pr-4: the last tab stays visibly cut off on narrow screens, which hints that the strip scrolls. */}
      <div role="tablist" aria-label="Filter orders by status" onKeyDown={onKeyDown} className="flex min-w-max gap-1 pr-4 md:pr-0">
        {tabs.map((tab, i) => {
          const selected = i === activeIndex;
          const tone = TAB_TONE[tab.value];
          const pill = tone.pill ?? statusMeta(tab.value).badge;
          return (
            <button
              key={tab.label}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`order-tab-${tab.value || 'ALL'}`}
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(tab.value)}
              className={`flex min-h-11 flex-1 snap-start items-center justify-center gap-2 whitespace-nowrap rounded-t-xl rounded-b-md border-b-[3px] px-4 text-sm font-semibold transition-colors duration-150 ${focusRing} ${
                selected ? `${tone.active} text-[#2B2118]` : 'border-transparent text-[#4A3F35] hover:bg-[#FAF7F2]'
              }`}
            >
              {tab.label}
              <span className={`min-w-6 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums ${pill}`}>
                {counts ? formatNumber(tab.count ?? 0) : '–'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
