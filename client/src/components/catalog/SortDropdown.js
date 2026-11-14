'use client';

import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { SORT_OPTIONS } from '@/lib/constants';

export function SortDropdown() {
  const { sort, setSort } = useCatalogFilters();

  return (
    <div className="flex items-center gap-2 text-xs text-[#5C4D40]">
      <label htmlFor="sort-select" className="hidden sm:inline font-medium">
        Sort:
      </label>
      <div className="relative bg-white border border-[#E6DDD2] rounded-xl px-3 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
        <select
          id="sort-select"
          name="sort"
          data-layer="Toolbar/Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-transparent text-xs font-semibold text-text pr-6 py-0.5 border-0 focus:ring-0 focus:outline-none cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
