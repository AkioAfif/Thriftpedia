'use client';

import { useState } from 'react';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { TuneIcon } from '@/components/ui/Icons';
import { SortDropdown } from './SortDropdown';
import { ActiveFilters } from './ActiveFilters';
import { MobileFilterSheet } from './MobileFilterSheet';

export function ResultsHeader({ meta }) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const { activeGroupCount } = useCatalogFilters();

  const total = meta?.total ?? 0;
  const page = meta?.page ?? 1;
  const limit = meta?.limit ?? 12;

  let showingText = 'Showing 0 products';
  if (total > 0) {
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    showingText = `Showing ${start}–${end} of ${total} products`;
  }

  return (
    <>
      <div
        data-layer="Toolbar"
        className="w-full flex flex-col gap-3 pb-3 border-b border-[#E6DDD2]"
      >
        <div className="flex items-center justify-between gap-3 min-h-[40px]">
          {/* Count Heading */}
          <div className="relative flex items-baseline gap-2">
            <h2
              id="product-count-label"
              data-layer="Toolbar/Total"
              className="text-sm sm:text-base font-bold text-[#2B2118] tracking-tight"
            >
              {showingText}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filters Trigger Button (< md) */}
            <button
              type="button"
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden inline-flex items-center gap-1.5 min-h-[40px] px-3.5 py-1.5 rounded-full bg-white border border-[#E6DDD2] text-xs font-semibold text-[#2B2118] hover:bg-[#F1EBE1] shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none"
            >
              <TuneIcon className="w-4 h-4 text-[#B5532E]" />
              <span>Filters {activeGroupCount > 0 ? `(${activeGroupCount})` : ''}</span>
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
