'use client';

import { SIZES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function SizeChips({ selectedSizes = [], onToggleSize }) {
  return (
    <div className="space-y-3 pb-6 border-b border-[#E6DDD2]" data-layer="Filter/Size">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#2B2118] font-sans">
          Size
        </span>
        {selectedSizes.length > 0 && (
          <span
            id="size-selected-count"
            className="text-xs font-semibold text-[#2B2118] font-sans"
          >
            {selectedSizes.length} SELECTED
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 text-xs font-sans" id="size-button-group">
        {SIZES.map((size) => {
          const isSelected = selectedSizes.includes(size);
          return (
            <button
              key={size}
              type="button"
              data-size={size}
              aria-pressed={isSelected}
              onClick={() => onToggleSize(size)}
              className={cn(
                'min-h-[40px] py-1.5 rounded-lg font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none',
                isSelected
                  ? 'bg-[#B5532E] border border-[#B5532E] text-white font-bold shadow-sm'
                  : 'bg-[#FAF7F2] border border-[#E6DDD2] text-[#2B2118] hover:bg-[#F1EBE1] shadow-xs'
              )}
            >
              {size}
            </button>
          );
        })}
      </div>
    </div>
  );
}
