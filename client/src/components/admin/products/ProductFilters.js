'use client';

import { useCallback, useRef, useState } from 'react';
import { CONDITION_OPTIONS, SIZE_OPTIONS, SORT_OPTIONS } from '@/lib/adminProducts';
import { CloseIcon, SearchIcon } from '../icons';
import FilterSelect from '@/components/ui/FilterSelect';
import FilterSheet, { EMPTY_DRAFT } from './FilterSheet';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1';
const smallLabel = 'mb-1.5 block text-[13px] font-medium text-[#6F6358]';

function FunnelIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h16l-6 7.5V19l-4-2v-4.5L4 5Z" />
    </svg>
  );
}

// Search commits on Enter right away, or by itself after a short pause (handled by the page).
// From md: search + Sort on one row, Category/Size/Condition below. Under md: search, then
// a Filters button (bottom sheet) next to Sort. Both layouts are rendered; CSS picks one.
export default function ProductFilters({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  filters,
  categories = [],
  onChange,
  showReset,
  onReset,
}) {
  const categoryOptions = categories.map((cat) => ({ value: cat.slug, label: cat.name }));
  const filtersButtonRef = useRef(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  // Search and Sort have their own controls, so the badge counts only the sheet's filters.
  const sheetCount = [filters.category, filters.size, filters.condition].filter(Boolean).length;

  function openSheet() {
    setDraft({ category: filters.category, size: filters.size, condition: filters.condition });
    setSheetOpen(true);
  }

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    filtersButtonRef.current?.focus();
  }, []);

  function applySheet() {
    onChange(draft);
    closeSheet();
  }

  const sortSelect = (id) => (
    <FilterSelect
      id={id}
      label="Sort by"
      value={filters.sort}
      defaultValue="newest"
      align="right"
      onChange={(sort) => onChange({ sort })}
      options={SORT_OPTIONS}
    />
  );

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="relative min-w-0 flex-1"
        >
          <label htmlFor="product-search" className="sr-only">
            Search products by name or brand
          </label>
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6F6358]">
            <SearchIcon width={20} height={20} />
          </span>
          <input
            id="product-search"
            type="search"
            value={searchValue}
            maxLength={100}
            enterKeyHint="search"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or brand"
            className="h-12 w-full rounded-xl border-[1.5px] border-[#D9CFC1] bg-white pl-12 pr-12 text-[15px] text-[#2B2118] outline-none placeholder:text-[#6F6358] hover:border-[#B5A595] focus:border-[#B5532E] focus:shadow-[0_0_0_4px_#FBE6DC] [&::-webkit-search-cancel-button]:hidden"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className={`absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#6F6358] hover:bg-[#F5F0E8] ${focusRing}`}
            >
              <CloseIcon width={16} height={16} />
            </button>
          )}
        </form>

        {/* md and up: Sort sits at the right end of the search row. */}
        <div className="hidden w-[220px] shrink-0 md:block">
          <span aria-hidden="true" className={smallLabel}>Sort by</span>
          {sortSelect('filter-sort')}
        </div>

        {/* Under md: Filters button + Sort side by side. */}
        <div className="grid grid-cols-2 gap-3 md:hidden">
          <button
            ref={filtersButtonRef}
            type="button"
            onClick={openSheet}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold ${focusRing} ${
              sheetCount > 0 ? 'border-[#EBC3AE] bg-[#FBE6DC] text-[#B5532E]' : 'border-[#D9CFC1] bg-white text-[#2B2118]'
            }`}
          >
            <FunnelIcon />
            Filters
            {sheetCount > 0 && (
              <span className="flex size-6 items-center justify-center rounded-full bg-[#B5532E] text-xs font-semibold text-white">
                {sheetCount}
                <span className="sr-only"> active</span>
              </span>
            )}
          </button>
          {sortSelect('filter-sort-mobile')}
        </div>
      </div>

      {/* md and up: second row with labelled selects. */}
      <div className="mt-4 hidden grid-cols-3 gap-3 md:grid">
        <div className="min-w-0">
          <span aria-hidden="true" className={smallLabel}>Category</span>
          <FilterSelect
            id="filter-category"
            label="Category"
            emptyLabel="All"
            value={filters.category}
            onChange={(category) => onChange({ category })}
            options={categoryOptions}
          />
        </div>
        <div className="min-w-0">
          <span aria-hidden="true" className={smallLabel}>Size</span>
          <FilterSelect
            id="filter-size"
            label="Size"
            emptyLabel="All"
            value={filters.size}
            onChange={(size) => onChange({ size })}
            options={SIZE_OPTIONS}
          />
        </div>
        <div className="min-w-0">
          <span aria-hidden="true" className={smallLabel}>Condition</span>
          <FilterSelect
            id="filter-condition"
            label="Condition"
            emptyLabel="All"
            align="right"
            value={filters.condition}
            onChange={(condition) => onChange({ condition })}
            options={CONDITION_OPTIONS}
          />
        </div>
      </div>

      {showReset && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold text-[#B5532E] underline-offset-4 hover:underline ${focusRing}`}
          >
            Reset filters
          </button>
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        draft={draft}
        onDraftChange={setDraft}
        categories={categories}
        onApply={applySheet}
        onClose={closeSheet}
      />
    </div>
  );
}
