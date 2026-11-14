'use client';

import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { Badge } from '@/components/ui/Badge';
import { Toggle } from '@/components/ui/Toggle';
import { SizeChips } from './SizeChips';
import { PriceRangeInput } from './PriceRangeInput';
import { ConditionCheckboxes } from './ConditionCheckboxes';

export function FilterSidebar() {
  const {
    sizes,
    conditions,
    minPrice,
    maxPrice,
    hideSold,
    activeGroupCount,
    toggleSize,
    toggleCondition,
    setPriceRange,
    toggleHideSold,
  } = useCatalogFilters();

  return (
    <aside
      id="desktop-sidebar"
      data-layer="Sidebar"
      // Side column from lg only (below lg: the "Filters" bottom sheet). pl-1 keeps focus rings and
      // borders at the left edge from being clipped by the scroll container.
      className="hidden lg:flex flex-col w-[260px] shrink-0 sticky max-h-[calc(100vh-100px)] overflow-y-auto pl-1 pr-3 gap-6 top-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E6DDD2]">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-text font-sans">
            Filters
          </span>
          {activeGroupCount > 0 && <Badge variant="count">{activeGroupCount}</Badge>}
        </div>
      </div>

      {/* Size Chips */}
      <SizeChips selectedSizes={sizes} onToggleSize={toggleSize} />

      {/* Price Range */}
      <PriceRangeInput
        minPrice={minPrice}
        maxPrice={maxPrice}
        onApply={(min, max) => setPriceRange(min, max)}
      />

      {/* Condition Checkboxes */}
      <ConditionCheckboxes
        selectedConditions={conditions}
        onToggleCondition={toggleCondition}
      />

      {/* Hide Sold Toggle */}
      <Toggle checked={hideSold} onChange={toggleHideSold} />
    </aside>
  );
}
