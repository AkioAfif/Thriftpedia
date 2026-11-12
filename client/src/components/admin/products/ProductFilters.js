'use client';

import { CONDITION_OPTIONS, SIZE_OPTIONS } from '@/lib/adminProducts';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]';

function SearchIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SelectField({ id, label, value, onChange, allLabel, options, defaultValue = '' }) {
  const isActive = value !== defaultValue;

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-[#6E5D4F]">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 w-full cursor-pointer appearance-none rounded-xl border pl-4 pr-10 text-sm transition-colors hover:border-[#B5532E] ${focusRing} ${
            isActive
              ? 'border-[#B5532E] bg-[#FBEDE6] font-semibold text-[#8F3B23]'
              : 'border-[#CFBEAE] bg-white text-[#4A3F35]'
          }`}
        >
          {allLabel !== null && <option value="">{allLabel}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${
            isActive ? 'text-[#B5532E]' : 'text-[#6E5D4F]'
          }`}
        >
          <ChevronIcon />
        </span>
      </div>
    </div>
  );
}

export default function ProductFilters({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  filters,
  categories = [],
  onChange,
}) {
  const categoryOptions = categories.map((cat) => ({ value: cat.slug, label: cat.name }));

  function handleSubmit(e) {
    e.preventDefault();
    onSearchSubmit();
  }

  function handleClear() {
    onSearchInputChange('');
    if (filters.q) onChange({ q: '' });
  }

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-[#e6ddd2] bg-white p-4 sm:p-5">
      <form onSubmit={handleSubmit} role="search" className="w-full max-w-[640px]">
        <label htmlFor="product-search" className="sr-only">
          Search products by name or brand
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6E5D4F]">
            <SearchIcon />
          </span>
          <input
            id="product-search"
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search by name or brand"
            className={`h-12 w-full rounded-xl border border-[#e6ddd2] bg-[#FAF7F2] pl-11 pr-[8.5rem] text-sm text-[#2B2118] placeholder:text-[#8C7E72] ${focusRing}`}
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {searchInput && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#6E5D4F] hover:bg-[#F1EBE1] ${focusRing}`}
              >
                <ClearIcon />
              </button>
            )}
            <button
              type="submit"
              className={`h-9 min-w-[84px] rounded-lg bg-[#b4532a] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#a3452a] ${focusRing}`}
            >
              Search
            </button>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-x-4 gap-y-4 border-t border-[#e6ddd2] pt-5 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          id="filter-category"
          label="Category"
          value={filters.category || ''}
          onChange={(value) => onChange({ category: value })}
          allLabel="All categories"
          options={categoryOptions}
        />
        <SelectField
          id="filter-size"
          label="Size"
          value={filters.size || ''}
          onChange={(value) => onChange({ size: value })}
          allLabel="All sizes"
          options={SIZE_OPTIONS}
        />
        <SelectField
          id="filter-condition"
          label="Condition"
          value={filters.condition || ''}
          onChange={(value) => onChange({ condition: value })}
          allLabel="Any condition"
          options={CONDITION_OPTIONS}
        />
        <SelectField
          id="filter-sort"
          label="Sort by"
          value={filters.sort || 'newest'}
          defaultValue="newest"
          onChange={(value) => onChange({ sort: value })}
          allLabel={null}
          options={SORT_OPTIONS}
        />
      </div>
    </div>
  );
}