'use client';

import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { cn } from '@/lib/utils';

export function Pagination({ meta }) {
  const { setPage } = useCatalogFilters();
  const totalPages = meta?.totalPages ?? 1;
  const currentPage = meta?.page ?? 1;

  if (totalPages <= 1) return null;

  // Generate page numbers array
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  const handlePageClick = (p) => {
    if (p === currentPage) return;
    setPage(p);
  };

  return (
    <nav
      aria-label="Catalog navigation"
      id="catalog-pagination"
      data-layer="Pagination"
      className="my-8 flex items-center justify-center"
    >
      <div className="flex items-center gap-2 font-mono text-xs">
        {/* Previous Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => handlePageClick(currentPage - 1)}
          className="min-w-[40px] min-h-[40px] px-3.5 rounded-xl border border-[#E6DDD2] text-[#5C4D40] hover:text-text hover:bg-[#F1EBE1] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Previous
        </button>

        {/* Numeric Buttons */}
        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => handlePageClick(p)}
              className={cn(
                'min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                isActive
                  ? 'bg-primary text-white font-bold shadow-xs'
                  : 'border border-[#E6DDD2] text-text hover:bg-[#F1EBE1]'
              )}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => handlePageClick(currentPage + 1)}
          className="min-w-[40px] min-h-[40px] px-3.5 rounded-xl border border-[#E6DDD2] text-text hover:bg-[#F1EBE1] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Next
        </button>
      </div>
    </nav>
  );
}
