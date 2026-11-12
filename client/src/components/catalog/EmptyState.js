'use client';

import { SearchOffIcon } from '@/components/ui/Icons';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';

export function EmptyState() {
  const { resetAll } = useCatalogFilters();

  return (
    <div
      id="empty-state-view"
      className="bg-white rounded-2xl border border-[#E6DDD2] p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-3 shadow-card my-6"
    >
      <div className="w-14 h-14 rounded-full bg-[#FBEDE6] flex items-center justify-center text-[#B5532E] mb-1">
        <SearchOffIcon className="w-7 h-7 text-[#B5532E]" />
      </div>
      <h4 className="font-bold text-lg text-[#2B2118]">No matching products</h4>
      <p className="text-sm text-[#5C4D40] max-w-[28rem]">
        Try adjusting your size, price range, or categories to find more vintage pieces.
      </p>
      <button
        type="button"
        onClick={resetAll}
        className="mt-3 min-h-[40px] px-6 py-2.5 rounded-xl bg-[#B5532E] hover:bg-[#9C4425] text-white text-xs font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none"
      >
        Reset filters
      </button>
    </div>
  );
}
