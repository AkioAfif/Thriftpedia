'use client';

import { useEffect } from 'react';
import { ErrorOutlineIcon } from '@/components/ui/Icons';

export default function CatalogError({ error, reset }) {
  useEffect(() => {
    console.error('Catalog page error:', error);
  }, [error]);

  const errorMessage =
    error?.message ||
    "We couldn't reach the catalog server. Please refresh the page or try again.";

  return (
    <main className="w-full flex-1 flex items-center justify-center px-4 py-16">
      <div
        id="error-state-view"
        className="bg-white rounded-2xl border border-[#E6DDD2] p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-3 shadow-card max-w-[28rem] w-full"
      >
        <div className="w-14 h-14 rounded-full bg-[#FFDAD6] flex items-center justify-center text-[#BA1A1A] mb-1">
          <ErrorOutlineIcon className="w-7 h-7 text-[#BA1A1A]" />
        </div>
        <h2 className="font-bold text-lg text-[#2B2118]">Failed to load products</h2>
        <p className="text-sm text-[#5C4D40] max-w-[28rem]">{errorMessage}</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-3 min-h-[40px] px-6 py-2.5 rounded-xl border border-[#B5532E] text-[#B5532E] hover:bg-[#FBEDE6] text-xs font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
