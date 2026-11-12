'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useTransition } from 'react';
import { buildQueryString, cleanQueryParams } from '@/lib/utils';
import { DEFAULT_PAGE, DEFAULT_SORT } from '@/lib/constants';

export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentFilters = useMemo(() => {
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const sizeRaw = searchParams.get('size') || '';
    const conditionRaw = searchParams.get('condition') || '';
    const minPriceRaw = searchParams.get('minPrice') || '';
    const maxPriceRaw = searchParams.get('maxPrice') || '';
    const hideSold = searchParams.get('hideSold') === 'true';
    const sort = searchParams.get('sort') || DEFAULT_SORT;
    const page = parseInt(searchParams.get('page') || '1', 10) || DEFAULT_PAGE;

    return {
      q,
      category,
      sizes: sizeRaw ? sizeRaw.split(',').filter(Boolean) : [],
      conditions: conditionRaw ? conditionRaw.split(',').filter(Boolean) : [],
      minPrice: minPriceRaw !== '' ? Number(minPriceRaw) : null,
      maxPrice: maxPriceRaw !== '' ? Number(maxPriceRaw) : null,
      hideSold,
      sort,
      page,
    };
  }, [searchParams]);

  const activeGroupCount = useMemo(() => {
    let count = 0;
    if (currentFilters.sizes.length > 0) count += 1;
    if (currentFilters.minPrice !== null || currentFilters.maxPrice !== null) count += 1;
    if (currentFilters.conditions.length > 0) count += 1;
    if (currentFilters.hideSold) count += 1;
    return count;
  }, [currentFilters]);

  const applyFilters = useCallback(
    (updates, resetPage = true, scrollToTop = false) => {
      const merged = {
        q: currentFilters.q,
        category: currentFilters.category,
        size: currentFilters.sizes.join(','),
        condition: currentFilters.conditions.join(','),
        minPrice: currentFilters.minPrice,
        maxPrice: currentFilters.maxPrice,
        hideSold: currentFilters.hideSold,
        sort: currentFilters.sort,
        page: resetPage ? 1 : currentFilters.page,
        ...updates,
      };

      const qs = buildQueryString(merged);
      const targetUrl = qs ? `${pathname}?${qs}` : pathname;

      startTransition(() => {
        router.push(targetUrl, { scroll: scrollToTop });
      });
    },
    [currentFilters, pathname, router]
  );

  const setSearch = useCallback(
    (q) => applyFilters({ q: (q || '').slice(0, 100).trim() }),
    [applyFilters]
  );

  const setCategory = useCallback(
    (slug) => applyFilters({ category: slug === 'all' || !slug ? '' : slug }),
    [applyFilters]
  );

  const toggleSize = useCallback(
    (size) => {
      const next = currentFilters.sizes.includes(size)
        ? currentFilters.sizes.filter((s) => s !== size)
        : [...currentFilters.sizes, size];
      applyFilters({ size: next.join(',') });
    },
    [currentFilters.sizes, applyFilters]
  );

  const toggleCondition = useCallback(
    (condition) => {
      const next = currentFilters.conditions.includes(condition)
        ? currentFilters.conditions.filter((c) => c !== condition)
        : [...currentFilters.conditions, condition];
      applyFilters({ condition: next.join(',') });
    },
    [currentFilters.conditions, applyFilters]
  );

  const setPriceRange = useCallback(
    (min, max) => {
      applyFilters({
        minPrice: min !== null && min !== '' ? min : null,
        maxPrice: max !== null && max !== '' ? max : null,
      });
    },
    [applyFilters]
  );

  const toggleHideSold = useCallback(
    (checked) => applyFilters({ hideSold: checked }),
    [applyFilters]
  );

  const setSort = useCallback(
    (sort) => applyFilters({ sort }),
    [applyFilters]
  );

  const setPage = useCallback(
    (page) => applyFilters({ page }, false, true),
    [applyFilters]
  );

  const removeFilterGroup = useCallback(
    (groupKey) => {
      if (groupKey === 'size') applyFilters({ size: '' });
      if (groupKey === 'price') applyFilters({ minPrice: null, maxPrice: null });
      if (groupKey === 'condition') applyFilters({ condition: '' });
      if (groupKey === 'hideSold') applyFilters({ hideSold: false });
    },
    [applyFilters]
  );

  const resetAll = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  return {
    ...currentFilters,
    activeGroupCount,
    isPending,
    setSearch,
    setCategory,
    toggleSize,
    toggleCondition,
    setPriceRange,
    toggleHideSold,
    setSort,
    setPage,
    removeFilterGroup,
    resetAll,
  };
}
