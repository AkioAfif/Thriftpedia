'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '../icons';

function getPageItems(page, total) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, 4, 'gap-end', total];
  if (page >= total - 2) return [1, 'gap-start', total - 3, total - 2, total - 1, total];
  return [1, 'gap-start', page - 1, page, page + 1, 'gap-end', total];
}

const box =
  'flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1 sm:h-10 sm:min-w-10';

export default function ProductPagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={`${box} border-[#e8e1d8] bg-white text-[#2b1d14] hover:bg-[#faf7f2] disabled:cursor-not-allowed disabled:text-[#c9c0b5] disabled:hover:bg-white`}
      >
        <ChevronLeftIcon width={16} height={16} />
      </button>

      {getPageItems(page, totalPages).map((item) =>
        typeof item === 'string' ? (
          <span key={item} aria-hidden="true" className="px-1 text-sm text-[#6b5d52]">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            aria-label={`Page ${item}`}
            aria-current={item === page ? 'page' : undefined}
            onClick={() => item !== page && onChange(item)}
            className={`${box} ${
              item === page
                ? 'border-[#a3452a] bg-[#a3452a] font-semibold text-white'
                : 'border-[#e8e1d8] bg-white text-[#2b1d14] hover:bg-[#faf7f2]'
            }`}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        aria-label="Next page"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={`${box} border-[#e8e1d8] bg-white text-[#2b1d14] hover:bg-[#faf7f2] disabled:cursor-not-allowed disabled:text-[#c9c0b5] disabled:hover:bg-white`}
      >
        <ChevronRightIcon width={16} height={16} />
      </button>
    </nav>
  );
}
