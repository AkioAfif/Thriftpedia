'use client';

import { useState, useEffect } from 'react';
import { SearchIcon, CloseIcon } from '@/components/ui/Icons';
import { useCatalogFilters } from '@/hooks/useCatalogFilters';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchBar() {
  const { q, setSearch } = useCatalogFilters();
  const [prevQ, setPrevQ] = useState(q || '');
  const [searchTerm, setSearchTerm] = useState(q || '');
  const debouncedSearch = useDebounce(searchTerm, 400);

  if (prevQ !== (q || '')) {
    setPrevQ(q || '');
    setSearchTerm(q || '');
  }

  useEffect(() => {
    const trimmed = debouncedSearch.slice(0, 100).trim();
    if (trimmed !== (q || '')) {
      setSearch(trimmed);
    }
  }, [debouncedSearch, q, setSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.slice(0, 100).trim();
    setSearch(trimmed);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearch('');
  };

  return (
    <form
      id="catalog-search-form"
      onSubmit={handleSubmit}
      className="w-full md:w-[440px] shrink-0 relative flex items-center bg-white border border-[#E6DDD2] rounded-full px-3.5 py-1.5 shadow-sm max-md:py-0.5 max-md:pr-0.5 focus-within:border-[#B5532E] focus-within:ring-1 focus-within:ring-[#B5532E] transition-all"
    >
      <span className="text-[#6E5D4F] text-[20px] ml-1 mr-2 shrink-0 select-none">
        <SearchIcon className="w-5 h-5 text-[#6E5D4F]" />
      </span>
      <input
        id="catalog-search-input"
        name="q"
        type="text"
        value={searchTerm}
        maxLength={100}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search jackets, denim, hats..."
        className="w-full bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-[#2B2118] text-sm placeholder:text-[#8C7E72] py-1 px-0"
      />
      {searchTerm && (
        <button
          type="button"
          id="search-clear-btn"
          aria-label="Clear search"
          onClick={handleClear}
          className="min-w-[32px] min-h-[32px] max-md:min-w-11 max-md:min-h-11 rounded-full text-[#6E5D4F] hover:text-[#2B2118] flex items-center justify-center shrink-0 mr-1 focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}
      {/* Below md: a 44px round icon button so the field keeps its width; from md: unchanged. */}
      <button
        type="submit"
        aria-label="Search"
        className="flex min-h-[36px] items-center justify-center px-4 py-1.5 rounded-full bg-[#B5532E] hover:bg-[#9C4425] text-white text-xs font-semibold shrink-0 transition-colors ml-1 shadow-xs focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none max-md:size-11 max-md:px-0 max-md:py-0"
      >
        <SearchIcon className="w-5 h-5 text-white md:hidden" />
        <span className="hidden md:inline">Search</span>
      </button>
    </form>
  );
}
