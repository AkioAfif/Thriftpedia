'use client';

import { CONDITION_OPTIONS, SIZE_OPTIONS, SORT_OPTIONS } from '@/lib/adminProducts';
import { ChevronDownIcon, CloseIcon, SearchIcon } from '../icons';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1';

function SelectField({ id, label, value, onChange, emptyLabel, options, defaultValue = '' }) {
  const active = value !== defaultValue;
  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-12 w-full cursor-pointer appearance-none truncate rounded-xl border pl-4 pr-10 text-sm transition-colors hover:border-[#B5532E] ${focusRing} ${
          active ? 'border-[#B5532E] bg-[#FBEDE6] font-semibold text-[#8F3B23]' : 'border-[#e8e1d8] bg-white text-[#4A3F35]'
        }`}
      >
        {emptyLabel && <option value="">{emptyLabel}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 ${active ? 'text-[#B5532E]' : 'text-[#6E5D4F]'}`}
      >
        <ChevronDownIcon width={16} height={16} />
      </span>
    </div>
  );
}

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
    <div>
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
          <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6E5D4F]">
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
            className={`h-12 w-full rounded-xl border border-[#e8e1d8] bg-white pl-11 pr-12 text-sm text-[#2B2118] placeholder:text-[#6E5D4F] [&::-webkit-search-cancel-button]:hidden ${focusRing}`}
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className={`absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#6E5D4F] hover:bg-[#f1ebe1] ${focusRing}`}
            >
              <CloseIcon width={16} height={16} />
            </button>
          )}
        </form>

        <SelectField
          id="filter-category"
          label="Category"
          emptyLabel="Category"
          value={filters.category}
          onChange={(category) => onChange({ category })}
          options={categoryOptions}
        />
        <SelectField
          id="filter-size"
          label="Size"
          emptyLabel="Size"
          value={filters.size}
          onChange={(size) => onChange({ size })}
          options={SIZE_OPTIONS}
        />
        <SelectField
          id="filter-condition"
          label="Condition"
          emptyLabel="Condition"
          value={filters.condition}
          onChange={(condition) => onChange({ condition })}
          options={CONDITION_OPTIONS}
        />
        <SelectField
          id="filter-sort"
          label="Sort by"
          value={filters.sort}
          defaultValue="newest"
          onChange={(sort) => onChange({ sort })}
          options={SORT_OPTIONS}
        />
      </div>

      {showReset && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={onReset}
            className={`min-h-[44px] rounded-lg px-3 text-sm font-semibold text-[#8F3B23] underline-offset-4 hover:underline ${focusRing}`}
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
