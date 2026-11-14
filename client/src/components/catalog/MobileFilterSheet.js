'use client';

import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SizeChips } from './SizeChips';
import { PriceRangeInput } from './PriceRangeInput';
import { ConditionCheckboxes } from './ConditionCheckboxes';
import { Toggle } from '@/components/ui/Toggle';

export function MobileFilterSheet({ isOpen, onClose }) {
  const {
    sizes,
    conditions,
    minPrice,
    maxPrice,
    hideSold,
    activeGroupCount,
    setPriceRange,
    toggleSize,
    toggleCondition,
    toggleHideSold,
    resetAll,
  } = useCatalogFilters();

  const handleReset = () => {
    resetAll();
    onClose();
  };

  const footer = (
    <>
      <button
        type="button"
        onClick={handleReset}
        className="min-h-[44px] px-4 rounded-xl border border-[#E6DDD2] bg-white text-text font-semibold text-xs hover:bg-[#F1EBE1] transition-colors"
      >
        Reset all
      </button>
      <button
        type="button"
        onClick={onClose}
        className="flex-1 min-h-[44px] rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-sm shadow-sm transition-colors text-center"
      >
        Show results
      </button>
    </>
  );

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      badgeText={activeGroupCount > 0 ? `${activeGroupCount} active` : null}
      footer={footer}
    >
      {/* Size */}
      <SizeChips selectedSizes={sizes} onToggleSize={toggleSize} />

      {/* Price */}
      <PriceRangeInput
        minPrice={minPrice}
        maxPrice={maxPrice}
        onApply={(min, max) => setPriceRange(min, max)}
        isMobile
      />

      {/* Condition */}
      <ConditionCheckboxes
        selectedConditions={conditions}
        onToggleCondition={toggleCondition}
        isMobile
      />

      {/* Hide Sold */}
      <Toggle
        id="mobile-toggle-hide-sold"
        checked={hideSold}
        onChange={toggleHideSold}
        label="Hide sold items"
      />
    </BottomSheet>
  );
}
