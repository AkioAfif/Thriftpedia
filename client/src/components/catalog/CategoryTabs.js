'use client';

import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { cn } from '@/lib/utils';

export function CategoryTabs({ categories = [] }) {
  const { category, setCategory } = useCatalogFilters();
  const currentCategory = category || 'all';

  return (
    <div className="relative w-full border-b border-[#E6DDD2]/60 pb-4">
      <div
        id="categories-scroll-container"
        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-sm scroll-smooth pr-10"
      >
        <button
          type="button"
          onClick={() => setCategory('all')}
          className={cn(
            'px-4 py-2 min-h-[40px] rounded-xl font-medium whitespace-nowrap transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none',
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
              className={cn(
                'px-4 py-2 min-h-[40px] rounded-xl font-medium whitespace-nowrap transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none',
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
      {/* Right gradient fade overlay */}
      <div className="pointer-events-none absolute right-0 top-0 bottom-4 w-10 bg-gradient-to-l from-[#FAF7F2] to-transparent" />
    </div>
  );
}
