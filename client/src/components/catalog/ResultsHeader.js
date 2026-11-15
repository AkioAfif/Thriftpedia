'use client';

import { useState } from 'react';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { SortDropdown } from './SortDropdown';
import { ActiveFilters } from './ActiveFilters';
import { MobileFilterSheet } from './MobileFilterSheet';

export function ResultsHeader({ meta }) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { activeGroupCount } = useCatalogFilters();

  const total = meta?.total ?? 0;
  const page = meta?.page ?? 1;
  const limit = meta?.limit ?? 12;

  // Same text as before ("Showing 0 products" / "Showing a–b of n products"); the total is
  // wrapped so it can be emphasised below md. From md it inherits the heading's bold dark style.
  const totalText = <span className="max-md:font-semibold max-md:text-[#2B2118]">{total}</span>;
  let showingText = 'Showing 0 products';
  if (total > 0) {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    showingText = (
      <>
        Showing {start}–{end} of {totalText} products
      </>
    );
  }

  return (
    <>
      <div
        data-layer="Toolbar"
        className="w-full flex flex-col gap-3 pb-3 border-b border-[#E6DDD2]"
      >
        {/* Below md: the count is its own line, then Filters + Sort share one row (flex-1 each).
            From md: count left, Sort right, both aligned to the bottom (Sort has a label above). */}
        <div className="flex flex-col items-stretch gap-3 min-h-[40px] md:flex-row md:items-end md:justify-between md:gap-4">
          {/* Count Heading */}
          <div className="relative flex min-w-0 items-baseline gap-2 md:pb-2.5">
            <h2
              id="product-count-label"
              data-layer="Toolbar/Total"
              className="text-[13px] font-normal text-[#6F6358] md:text-base md:font-bold md:text-[#2B2118] md:tracking-tight"
            >
              {showingText}
            </h2>
          </div>

          <div className="flex items-end gap-3">
            {/* Filters trigger (bottom sheet) below lg, where the sidebar is hidden */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              aria-label={activeGroupCount > 0 ? `Filters, ${activeGroupCount} active` : 'Filters'}
              className={`lg:hidden inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none ${
                activeGroupCount > 0
                  ? 'border-[#EBC3AE] bg-[#FBE6DC] text-[#B5532E]'
                  : 'border-[#D9CFC1] bg-white text-[#2B2118] hover:bg-[#F5F0E8]'
              }`}
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <path d="M4 5h16l-6 7.5V19l-4-2v-4.5L4 5Z" />
              </svg>
              <span className="truncate">Filters</span>
              {activeGroupCount > 0 && (
                <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#B5532E] text-xs font-semibold text-white">
                  {activeGroupCount}
                </span>
              )}
            </button>

            {/* Sort Dropdown */}
            <SortDropdown />
          </div>
        </div>

        {/* Active Filters */}
        <ActiveFilters />
      </div>

      {/* Mobile Filter Bottom Sheet */}
      <MobileFilterSheet
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
      />
    </>
  );
}
