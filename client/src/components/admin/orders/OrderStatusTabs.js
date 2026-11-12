'use client';

import { useEffect, useRef } from 'react';
import { ORDER_STATUS_ORDER, statusMeta } from '@/lib/adminOrders';
import { formatNumber } from '@/lib/adminProducts';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]';

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
    else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = right - strip.clientWidth + 8;
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
    <div ref={stripRef} className="relative overflow-x-auto rounded-2xl border border-[#e6ddd2] bg-white p-1.5">
      <div role="tablist" aria-label="Filter orders by status" onKeyDown={onKeyDown} className="flex min-w-max gap-1">
        {tabs.map((tab, i) => {
          const selected = i === activeIndex;
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
              className={`relative flex min-h-[44px] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm transition-colors duration-150 ${focusRing} ${
                selected
                  ? 'bg-[#f1ebe1] font-semibold text-[#2b1d14]'
                  : 'font-medium text-[#4A3F35] hover:bg-[#faf7f2]'
              }`}
            >
              {tab.value && (
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${statusMeta(tab.value).dot}`} />
              )}
              {tab.label}
              <span
                className={`min-w-6 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                  selected ? 'bg-[#2b1d14] text-white' : 'bg-[#f1ebe1] text-[#5C4D40]'
                }`}
              >
                {counts ? formatNumber(tab.count ?? 0) : '–'}
              </span>
              {selected && (
                <span aria-hidden="true" className="absolute inset-x-4 bottom-1 h-0.5 rounded-full bg-[#2b1d14]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
