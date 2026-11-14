'use client';

import { useEffect, useRef } from 'react';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { cn } from '@/lib/utils';

// Chip look is unchanged. Below md: the strip runs edge to edge with 16px side padding,
// snaps chip by chip, chips are 44px tall, and the right fade is hidden (md and up unchanged).
const chipBase =
  'px-4 py-2 min-h-11 md:min-h-[40px] max-md:snap-start rounded-xl font-medium whitespace-nowrap transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none';

export function CategoryTabs({ categories = [] }) {
  const { category, setCategory } = useCatalogFilters();
  const currentCategory = category || 'all';
  const stripRef = useRef(null);

  // Keep the active chip in view by scrolling the strip only, never the page.
  useEffect(() => {
    const strip = stripRef.current;
    const chip = strip?.querySelector('[aria-pressed="true"]');
    if (!strip || !chip) return;
    const left = chip.offsetLeft - strip.offsetLeft;
    const right = left + chip.offsetWidth;
    if (left < strip.scrollLeft) strip.scrollLeft = left - 16;
    else if (right > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = right - strip.clientWidth + 16;
  }, [currentCategory, categories.length]);

  return (
    <div className="relative w-full border-b border-[#E6DDD2]/60 pb-4">
      <div
        ref={stripRef}
        id="categories-scroll-container"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-sm scroll-smooth pr-10 max-md:-mx-4 max-md:snap-x max-md:scroll-px-4 max-md:px-4 max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden"
      >
        <button
          type="button"
          onClick={() => setCategory('all')}
          aria-pressed={currentCategory === 'all'}
          className={cn(
            chipBase,
            currentCategory === 'all'
              ? 'bg-[#2B2118] text-white'
              : 'bg-[#F1EBE1] text-[#4A3F35] hover:bg-[#EAE4DA]'
          )}
        >
          All
        </button>

        {categories.map((cat) => {
          const isActive = currentCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setCategory(cat.slug)}
              aria-pressed={isActive}
              className={cn(
                chipBase,
                isActive
                  ? 'bg-[#2B2118] text-white'
                  : 'bg-[#F1EBE1] text-[#4A3F35] hover:bg-[#EAE4DA]'
              )}
            >
              {cat.name}
            </button>
          );
        })}
      </div>
      {/* Right gradient fade overlay (md and up only; unchanged there) */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-4 hidden w-10 bg-gradient-to-l from-[#FAF7F2] to-transparent md:block" />
    </div>
  );
}
