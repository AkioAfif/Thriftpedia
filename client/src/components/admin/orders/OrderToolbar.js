'use client';

import { ORDER_SORT_OPTIONS } from '@/lib/adminOrders';
import { ChevronDownIcon, CloseIcon, SearchIcon } from '../icons';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export default function OrderToolbar({ searchInput, onSearchInputChange, onSearchSubmit, onSearchClear, sort, onSortChange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
        className="min-w-0 flex-1"
      >
        <label htmlFor="order-search" className="sr-only">
          Search by order ID, buyer name or email
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6E5D4F]">
            <SearchIcon width={18} height={18} />
          </span>
          <input
            id="order-search"
            type="search"
            enterKeyHint="search"
            maxLength={100}
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            placeholder="Search by order ID or buyer"
            className={`h-12 w-full rounded-xl border border-[#e6ddd2] bg-white pl-11 pr-[8.5rem] text-sm text-text placeholder:text-[#8C7E72] [&::-webkit-search-cancel-button]:hidden ${focusRing}`}
          />
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {searchInput && (
              <button
                type="button"
                onClick={onSearchClear}
                aria-label="Clear search"
                className={`flex h-9 w-9 items-center justify-center rounded-lg text-[#6E5D4F] hover:bg-[#F1EBE1] ${focusRing}`}
              >
                <CloseIcon width={14} height={14} />
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

      <div className="relative sm:w-56">
        <label htmlFor="order-sort" className="sr-only">
          Sort orders
        </label>
        <select
          id="order-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className={`h-12 w-full cursor-pointer appearance-none rounded-xl border border-[#e6ddd2] bg-white pl-4 pr-10 text-sm text-[#4A3F35] transition-colors hover:border-primary ${focusRing}`}
        >
          {ORDER_SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6E5D4F]">
          <ChevronDownIcon width={16} height={16} />
        </span>
      </div>
    </div>
  );
}
