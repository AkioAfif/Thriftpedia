'use client';

import { CONDITION_OPTIONS, SIZE_OPTIONS, SORT_OPTIONS } from '@/lib/adminProducts';
import { CloseIcon, SearchIcon } from '../icons';
import FilterSelect from './FilterSelect';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1';

// Search commits on Enter right away, or by itself after a short pause (handled by the page).
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

  return (
    <div className="rounded-2xl border border-[#E5DCCD] bg-[#F5F0E8] p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearchSubmit();
          }}
          className="relative sm:col-span-2 lg:col-span-1"
        >
          <label htmlFor="product-search" className="sr-only">
            Search products by name or brand
          </label>
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6F6358]">
            <SearchIcon width={18} height={18} />
          </span>
          <input
            id="product-search"
            type="search"
            value={searchValue}
            maxLength={100}
            enterKeyHint="search"
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or brand"
            className={`h-11 w-full rounded-xl border border-[#D9CFC1] bg-white pl-11 pr-12 text-sm text-[#2B2118] placeholder:text-[#6F6358] hover:border-[#B5532E] [&::-webkit-search-cancel-button]:hidden ${focusRing}`}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className={`absolute right-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#6F6358] hover:bg-[#F5F0E8] ${focusRing}`}
            >
              <CloseIcon width={16} height={16} />
            </button>
          )}
        </form>

        <FilterSelect
          id="filter-category"
          label="Category"
          emptyLabel="Category"
          value={filters.category}
          onChange={(category) => onChange({ category })}
          options={categoryOptions}
        />
        <FilterSelect
          id="filter-size"
          label="Size"
          emptyLabel="Size"
          value={filters.size}
          onChange={(size) => onChange({ size })}
          options={SIZE_OPTIONS}
        />
        <FilterSelect
          id="filter-condition"
          label="Condition"
          emptyLabel="Condition"
          value={filters.condition}
          onChange={(condition) => onChange({ condition })}
          options={CONDITION_OPTIONS}
        />
        <FilterSelect
          id="filter-sort"
          label="Sort by"
          value={filters.sort}
          defaultValue="newest"
          align="right"
          onChange={(sort) => onChange({ sort })}
          options={SORT_OPTIONS}
        />
      </div>

      {showReset && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className={`min-h-[44px] rounded-lg px-3 text-sm font-semibold text-[#B5532E] underline-offset-4 hover:underline ${focusRing}`}
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
