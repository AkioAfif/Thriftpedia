'use client';

import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { DEFAULT_SORT, SORT_OPTIONS } from '@/lib/constants';
import FilterSelect from '@/components/ui/FilterSelect';

// Same Sort as Product Management / Order Management: the shared FilterSelect (filter
// variant; peach when not "Newest"), a visible 13px "Sort by" label from sm, 220px wide
// from md and full width below. The value, options and setSort are unchanged.
export function SortDropdown() {
  const { sort, setSort } = useCatalogFilters();

  return (
    <div className="min-w-0 flex-1 md:w-[220px] md:flex-none">
      <span aria-hidden="true" className="mb-1.5 hidden text-[13px] font-medium text-[#6F6358] sm:block">
        Sort by
      </span>
      <FilterSelect
        id="sort-select"
        label="Sort by"
        value={sort}
        defaultValue={DEFAULT_SORT}
        includeEmpty={false}
        align="right"
        onChange={setSort}
        options={SORT_OPTIONS}
      />
    </div>
  );
}
