'use client';

import { ORDER_SORT_OPTIONS } from '@/lib/adminOrders';
import FilterSelect from '@/components/ui/FilterSelect';
import { CloseIcon, SearchIcon } from '../icons';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1';
// Same label style as Product Management's filter bar.
const smallLabel = 'mb-1.5 block text-[13px] font-medium text-[#6F6358]';

const sortLabel = (value) => ORDER_SORT_OPTIONS.find((o) => o.value === value)?.label ?? value;

// Search submits on Enter (keyboard "search" key on mobile) or, from md, the Search button.
// `appliedQ` is the search the list currently uses (from the URL); chips show it, not the draft.
export default function OrderToolbar({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onSearchClear,
  sort,
  onSortChange,
  appliedQ = '',
  onResetFilters,
}) {
  // Status tabs are not chips; only search and a non-default sort are.
  const chips = [
    appliedQ && { key: 'q', text: `Search: ${appliedQ}`, onRemove: onSearchClear },
    sort !== 'newest' && { key: 'sort', text: `Sort: ${sortLabel(sort)}`, onRemove: () => onSortChange('newest') },
  ].filter(Boolean);

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
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
            <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6F6358]">
              <SearchIcon width={20} height={20} />
            </span>
            <input
              id="order-search"
              type="search"
              enterKeyHint="search"
              maxLength={100}
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              placeholder="Search order ID or buyer"
              className="h-12 w-full rounded-xl border-[1.5px] border-[#D9CFC1] bg-white pl-12 pr-12 text-[15px] text-[#2B2118] outline-none placeholder:text-[#6F6358] hover:border-[#B5A595] focus:border-[#B5532E] focus:shadow-[0_0_0_4px_#FBE6DC] md:pr-[8.75rem] [&::-webkit-search-cancel-button]:hidden"
            />
            <div className="absolute right-0.5 top-1/2 flex -translate-y-1/2 items-center gap-1 md:right-1.5">
              {searchInput && (
                <button
                  type="button"
                  onClick={onSearchClear}
                  aria-label="Clear search"
                  className={`flex size-11 items-center justify-center rounded-lg text-[#6F6358] hover:bg-[#F5F0E8] ${focusRing}`}
                >
                  <CloseIcon width={16} height={16} />
                </button>
              )}
              {/* Outline so it never outweighs the field; under md, Enter submits. */}
              <button
                type="submit"
                className={`hidden h-9 min-w-[84px] rounded-lg border-[1.5px] border-[#B5532E] bg-white px-4 text-sm font-semibold text-[#B5532E] transition-colors hover:bg-[#FBE6DC] md:inline-flex md:items-center md:justify-center ${focusRing}`}
              >
                Search
              </button>
            </div>
          </div>
        </form>

        <div className="w-full md:w-[220px] md:shrink-0">
          <span aria-hidden="true" className={smallLabel}>Sort by</span>
          <FilterSelect
            id="order-sort"
            label="Sort by"
            value={sort}
            defaultValue="newest"
            align="right"
            onChange={onSortChange}
            options={ORDER_SORT_OPTIONS}
          />
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <ul aria-label="Active filters" className="flex min-w-0 flex-wrap gap-2">
            {chips.map((chip) => (
              <li key={chip.key} className="min-w-0 max-w-full">
                <span className="inline-flex min-h-11 max-w-full items-center gap-1 rounded-full border border-[#EBC3AE] bg-[#FBE6DC] pl-3 text-[13px] font-semibold text-[#B5532E]">
                  <span className="truncate">{chip.text}</span>
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    aria-label={`Remove filter ${chip.text}`}
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[#F7D3C2] ${focusRing}`}
                  >
                    <CloseIcon width={14} height={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onResetFilters}
            className={`min-h-11 rounded-lg px-3 text-sm font-semibold text-[#B5532E] underline-offset-4 hover:underline ${focusRing}`}
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}
