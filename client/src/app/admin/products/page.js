'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ActiveFilterChips from '../../../components/admin/products/ActiveFilterChips';
import AddProductFab from '../../../components/admin/AddProductFab';
import DeleteProductDialog from '../../../components/admin/products/DeleteProductDialog';
import ProductFilters from '../../../components/admin/products/ProductFilters';
import ProductPagination from '../../../components/admin/products/ProductPagination';
import ProductStatCards from '../../../components/admin/products/ProductStatCards';
import ProductTable from '../../../components/admin/products/ProductTable';
import { useAuth } from '@/context/AuthContext';
import {
  DEFAULT_FILTERS,
  EMPTY_META,
  deleteProduct,
  fetchCategories,
  fetchProductStats,
  fetchProducts,
  formatNumber,
  hasActiveFilters,
  parseProductFilters,
  productFiltersToSearch,
} from '../../../lib/adminProducts';

const SEARCH_DEBOUNCE_MS = 400;

function PlusIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ProductManagement() {
  const router = useRouter();
  // Clears token, user and thriftpedia_token together, so the Navbar is logged out too.
  const { logout } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The URL is the single source of truth for filters, search, sort and page.
  const filters = useMemo(() => parseProductFilters(searchParams), [searchParams]);
  const filterKey = productFiltersToSearch(filters);

  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState({ key: null, items: [], meta: EMPTY_META, error: '' });
  const [stats, setStats] = useState({ status: 'loading', data: null });
  const [categories, setCategories] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const resultsRef = useRef(null);

  // Search box text, re-synced whenever the URL's q changes (e.g. browser back).
  const [search, setSearch] = useState({ value: filters.q, from: filters.q });
  if (search.from !== filters.q) setSearch({ value: filters.q, from: filters.q });

  const queryKey = `${filterKey}#${refreshTick}`;
  const loading = result.key !== queryKey;

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status !== 401) return false;
      logout();
      router.replace('/login');
      return true;
    },
    [router, logout]
  );

  const navigate = useCallback(
    (next, { replace = false } = {}) => {
      const qs = productFiltersToSearch(next);
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [pathname, router]
  );

  // Any change other than paging starts again at page 1.
  const updateFilters = useCallback(
    (changes) => navigate({ ...filters, ...changes, page: changes.page ?? 1 }),
    [filters, navigate]
  );

  useEffect(() => {
    const q = search.value.trim();
    if (q === filters.q) return undefined;
    const timer = setTimeout(() => updateFilters({ q }), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search.value, filters.q, updateFilters]);

  useEffect(() => {
    let active = true;
    fetchProducts(filters)
      .then((data) => {
        if (!active) return;
        setResult({ key: queryKey, items: data.items, meta: data.meta, error: '' });
        // Page past the end (e.g. after deleting the last item): go to the last real page.
        if (data.items.length === 0 && filters.page > 1 && data.meta.totalPages > 0) {
          navigate({ ...filters, page: data.meta.totalPages }, { replace: true });
        }
      })
      .catch((err) => {
        if (!active || handleAuthError(err)) return;
        setResult({ key: queryKey, items: [], meta: EMPTY_META, error: err.message || 'Request failed' });
      });
    return () => {
      active = false;
    };
  }, [filters, queryKey, navigate, handleAuthError]);

  useEffect(() => {
    let active = true;
    fetchProductStats()
      .then((data) => {
        if (active) setStats({ status: 'ready', data });
      })
      .catch((err) => {
        if (!active || handleAuthError(err)) return;
        setStats({ status: 'error', data: null });
      });
    return () => {
      active = false;
    };
  }, [refreshTick, handleAuthError]);

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch(() => {}); // the Category filter just stays empty
    return () => {
      active = false;
    };
  }, []);

  const refresh = () => {
    setStats((s) => (s.status === 'error' ? { status: 'loading', data: null } : s));
    setRefreshTick((t) => t + 1);
  };

  function resetFilters() {
    setSearch({ value: '', from: filters.q });
    navigate({ ...DEFAULT_FILTERS });
  }

  // Clears one filter from its chip; the search box is cleared with it, like Reset does.
  function removeFilter(key) {
    if (key === 'q') setSearch({ value: '', from: filters.q });
    updateFilters({ [key]: key === 'sort' ? 'newest' : '' });
  }

  function changePage(nextPage) {
    updateFilters({ page: nextPage });
    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      if (!handleAuthError(err)) {
        // e.g. 409 when the product has orders or was just bought.
        toast.error(err.message);
        setDeleteTarget(null);
        refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const { total, page, limit, totalPages } = result.meta;
  const showMeta = !result.error && result.items.length > 0;
  const from = (page - 1) * limit + 1;
  const to = from + result.items.length - 1;
  const filtered = hasActiveFilters(filters);

  return (
    // pb-[88px] below md: the last row and the pagination stay reachable above the floating button.
    <div className="min-w-0 pb-[88px] md:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[32px] font-semibold leading-tight text-[#2B2118] sm:text-[40px]">Product Management</h1>
          <p className="mt-2 text-[15px] text-[#6F6358]">Status updates automatically when buyers order.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="hidden min-h-[44px] w-full shrink-0 md:inline-flex items-center justify-center gap-2 rounded-xl bg-[#B5532E] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#9C4425] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 sm:w-auto"
        >
          <PlusIcon />
          Add Product
        </Link>
      </div>

      {/* Below md: the segmented status control above the filters (unchanged). */}
      <div className="mt-6 md:hidden">
        <ProductStatCards stats={stats} activeStatus={filters.status} onSelect={(status) => updateFilters({ status })} />
      </div>

      {/* From md the status tabs sit inside the toolbar card (row 2, left). */}
      <div className="mt-4 md:mt-6">
        <ProductFilters
          statusSlot={
            <ProductStatCards
              variant="tabs"
              stats={stats}
              activeStatus={filters.status}
              onSelect={(status) => updateFilters({ status })}
            />
          }
          searchValue={search.value}
          onSearchChange={(value) => setSearch((s) => ({ ...s, value }))}
          onSearchSubmit={() => updateFilters({ q: search.value.trim() })}
          filters={filters}
          categories={categories}
          onChange={updateFilters}
          showReset={filtered}
          onReset={resetFilters}
        />
      </div>

      {/* md and up: summary left, Reset right, active chips below (16px under the toolbar). */}
      {(filtered || showMeta) && (
        <div className="mt-4 hidden md:block">
          <div className="flex min-h-11 items-center justify-between gap-4">
            <p className="text-[13px] text-[#6F6358]">
              {showMeta ? (
                <>
                  Showing {formatNumber(from)}–{formatNumber(to)} of{' '}
                  <span className="font-semibold text-[#2B2118]">{formatNumber(total)}</span> products
                </>
              ) : null}
            </p>
            {filtered && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-11 rounded-lg px-3 text-sm font-semibold text-[#B5532E] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2"
              >
                Reset filters
              </button>
            )}
          </div>
          {filtered && (
            <div className="mt-2">
              <ActiveFilterChips filters={filters} categories={categories} onRemove={removeFilter} />
            </div>
          )}
        </div>
      )}

      {/* Below md: unchanged summary + chips row. */}
      {(filtered || showMeta) && (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:hidden">
          <p className="text-sm text-[#6F6358]" aria-live="polite">
            {showMeta ? (
              <>
                Showing {formatNumber(from)}–{formatNumber(to)} of{' '}
                <span className="font-semibold text-[#2B2118]">{formatNumber(total)}</span> products
              </>
            ) : null}
          </p>
          <ActiveFilterChips filters={filters} categories={categories} onRemove={removeFilter} />
        </div>
      )}

      {/* Paging moves focus here so keyboard and screen reader users land at the top of the list. */}
      <div ref={resultsRef} tabIndex={-1} aria-label="Products list" className="mt-4 scroll-mt-6 focus:outline-none md:mt-3">
        <ProductTable
          items={result.items}
          initialLoading={loading && result.items.length === 0}
          refreshing={loading && result.items.length > 0}
          error={loading ? '' : result.error}
          filtered={filtered}
          onRetry={refresh}
          onResetFilters={resetFilters}
          onDelete={setDeleteTarget}
        />
      </div>

      {showMeta && (
        <div className="mt-5 flex justify-center sm:justify-end">
          <ProductPagination page={page} totalPages={totalPages} onChange={changePage} />
        </div>
      )}

      {deleteTarget && (
        <DeleteProductDialog
          product={deleteTarget}
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <AddProductFab />
    </div>
  );
}

// useSearchParams needs a Suspense boundary.
export default function ProductManagementPage() {
  return (
    <Suspense fallback={<div aria-busy="true" className="h-10 w-72 animate-pulse rounded-lg bg-[#efe9e0]" />}>
      <ProductManagement />
    </Suspense>
  );
}
