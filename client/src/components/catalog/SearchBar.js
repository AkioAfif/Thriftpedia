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
      className="w-full md:w-[440px] shrink-0 relative flex items-center bg-white border border-[#E6DDD2] rounded-full px-3.5 py-1.5 shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all"
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
        className="w-full bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-text text-sm placeholder:text-[#8C7E72] py-1 px-0"
      />
      {searchTerm && (
        <button
          type="button"
          id="search-clear-btn"
          aria-label="Clear search"
          onClick={handleClear}
          className="min-w-[32px] min-h-[32px] rounded-full text-[#6E5D4F] hover:text-text flex items-center justify-center shrink-0 mr-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      )}
      <button
        type="submit"
        className="min-h-[36px] px-4 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold shrink-0 transition-colors ml-1 shadow-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        Search
      </button>
    </form>
  );
}
