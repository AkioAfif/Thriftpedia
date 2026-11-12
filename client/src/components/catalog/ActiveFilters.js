'use client';

import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { CloseIcon } from '@/components/ui/Icons';
import { CONDITIONS } from '@/lib/constants';
import { formatPriceShort } from '@/lib/utils';

export function ActiveFilters() {
  const {
    sizes,
    conditions,
    minPrice,
    maxPrice,
    hideSold,
    removeFilterGroup,
    resetAll,
  } = useCatalogFilters();

  const hasAnyFilter =
    sizes.length > 0 ||
    conditions.length > 0 ||
    minPrice !== null ||
    maxPrice !== null ||
    hideSold;

  if (!hasAnyFilter) return null;

  const conditionLabels = conditions.map((c) => {
    const found = CONDITIONS.find((item) => item.value === c);
    return found ? found.label : c;
  });

  return (
    <div
      id="active-filters-container"
      className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
    >
      {/* Size Chip */}
      {sizes.length > 0 && (
        <span
          data-filter-type="size"
          className="h-8 px-3 py-1.5 rounded-full bg-white text-[#2B2118] text-[13px] font-medium border border-[#E6DDD2] shadow-xs shrink-0 inline-flex items-center gap-1.5"
        >
          <span>Size: {sizes.join(', ')}</span>
          <button
            type="button"
            aria-label="Remove Size filter"
            onClick={() => removeFilterGroup('size')}
            className="w-5 h-5 rounded-full text-[#5C4D40] hover:text-[#B5532E] hover:bg-[#FAF7F2] flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-[#B5532E] focus-visible:outline-none -mr-1"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Price Chip */}
      {(minPrice !== null || maxPrice !== null) && (
        <span
          data-filter-type="price"
          className="h-8 px-3 py-1.5 rounded-full bg-white text-[#2B2118] text-[13px] font-medium border border-[#E6DDD2] shadow-xs shrink-0 inline-flex items-center gap-1.5"
        >
          <span>
            Price:{' '}
            {minPrice !== null ? `Rp ${formatPriceShort(minPrice)}` : 'Rp 0'}{' '}
            –{' '}
            {maxPrice !== null ? `Rp ${formatPriceShort(maxPrice)}` : 'Any'}
          </span>
          <button
            type="button"
            aria-label="Remove Price filter"
            onClick={() => removeFilterGroup('price')}
            className="w-5 h-5 rounded-full text-[#5C4D40] hover:text-[#B5532E] hover:bg-[#FAF7F2] flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-[#B5532E] focus-visible:outline-none -mr-1"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Condition Chip */}
      {conditions.length > 0 && (
        <span
          data-filter-type="condition"
          className="h-8 px-3 py-1.5 rounded-full bg-white text-[#2B2118] text-[13px] font-medium border border-[#E6DDD2] shadow-xs shrink-0 inline-flex items-center gap-1.5"
        >
          <span>Condition: {conditionLabels.join(', ')}</span>
          <button
            type="button"
            aria-label="Remove Condition filter"
            onClick={() => removeFilterGroup('condition')}
            className="w-5 h-5 rounded-full text-[#5C4D40] hover:text-[#B5532E] hover:bg-[#FAF7F2] flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-[#B5532E] focus-visible:outline-none -mr-1"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Hide Sold Chip */}
      {hideSold && (
        <span
          data-filter-type="hideSold"
          className="h-8 px-3 py-1.5 rounded-full bg-white text-[#2B2118] text-[13px] font-medium border border-[#E6DDD2] shadow-xs shrink-0 inline-flex items-center gap-1.5"
        >
          <span>Hide sold items</span>
          <button
            type="button"
            aria-label="Remove Hide sold filter"
            onClick={() => removeFilterGroup('hideSold')}
            className="w-5 h-5 rounded-full text-[#5C4D40] hover:text-[#B5532E] hover:bg-[#FAF7F2] flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-[#B5532E] focus-visible:outline-none -mr-1"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </span>
      )}

      {/* Reset all button */}
      <button
        type="button"
        onClick={resetAll}
        className="min-h-[32px] px-2 text-xs font-bold text-[#5C4D40] hover:text-[#B5532E] transition-colors ml-1 underline shrink-0 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none rounded"
      >
        Reset all
      </button>
    </div>
  );
}
