'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import OrderStatusTabs from './OrderStatusTabs';
import OrderToolbar from './OrderToolbar';
import OrderTable from './OrderTable';
import ProductPagination from '../products/ProductPagination';
import { clearToken } from '@/lib/adminAuth';
import { EMPTY_ORDER_META, fetchOrders, orderQueryToSearch, parseOrderQuery } from '@/lib/adminOrders';
import { formatNumber } from '@/lib/adminProducts';

const PANEL_ID = 'orders-panel';

export default function OrdersView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rawSearch = searchParams.toString();

  // The URL is the single source of truth for status, q, sort and page.
  const query = useMemo(() => parseOrderQuery(new URLSearchParams(rawSearch)), [rawSearch]);
  const search = orderQueryToSearch(query);

  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState({ key: null, items: [], meta: EMPTY_ORDER_META, counts: null, error: null });

  // Keep the search box in step with the URL (back/forward, reset, tab links).
  const [searchInput, setSearchInput] = useState(query.q);
  const [syncedQ, setSyncedQ] = useState(query.q);
  if (syncedQ !== query.q) {
    setSyncedQ(query.q);
    setSearchInput(query.q);
  }

  const requestKey = `${search}#${refreshTick}`;
  const loading = result.key !== requestKey;

  const go = useCallback(
    (nextQuery, { replace = false } = {}) => {
      const qs = orderQueryToSearch(nextQuery);
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (replace) router.replace(url, { scroll: false });
      else router.push(url, { scroll: false });
    },
    [pathname, router]
  );

  const update = (changes) => go({ ...query, ...changes, page: changes.page ?? 1 });

  // Hand-edited URLs with invalid values are rewritten to what is actually shown.
  useEffect(() => {
    if (rawSearch !== search) go(query, { replace: true });
  }, [rawSearch, search, query, go]);

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status !== 401) return false;
      clearToken();
      router.replace('/login');
      return true;
    },
    [router]
  );

  useEffect(() => {
    let active = true;
    fetchOrders(query)
      .then((data) => {
        if (!active) return;
        setResult({ key: requestKey, ...data, error: null });
        // A page that no longer exists (e.g. after a status change) falls back to the last one.
        if (data.items.length === 0 && query.page > 1 && data.meta.totalPages > 0) {
          go({ ...query, page: data.meta.totalPages }, { replace: true });
        }
      })
      .catch((err) => {
        if (!active || handleAuthError(err)) return;
        setResult((prev) => ({ ...prev, key: requestKey, items: [], meta: EMPTY_ORDER_META, error: err }));
      });
    return () => {
      active = false;
    };
  }, [query, requestKey, handleAuthError, go]);

  const { total, page, limit, totalPages } = result.meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = total === 0 ? 0 : from + result.items.length - 1;
  const showSummary = !result.error && !(loading && result.items.length === 0) && total > 0;
  const hasActiveFilters = Boolean(query.status || query.q);

  return (
    <div>
      <div>
        <h1 className="text-3xl font-semibold sm:text-4xl">Order Management</h1>
        <p className="mt-2 text-sm text-[#6E5D4F]">
          Move each order from pending to completed. Products are marked sold and released automatically.
        </p>
      </div>

      <div className="mt-6">
        <OrderStatusTabs
          counts={result.counts}
          active={query.status}
          panelId={PANEL_ID}
          onSelect={(status) => update({ status })}
        />
      </div>

      <div className="mt-4">
        <OrderToolbar
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={() => update({ q: searchInput.trim() })}
          onSearchClear={() => {
            setSearchInput('');
            if (query.q) update({ q: '' });
          }}
          sort={query.sort}
          onSortChange={(sort) => update({ sort })}
        />
      </div>

      <div className="mt-4">
        <OrderTable
          panelId={PANEL_ID}
          labelledBy={`order-tab-${query.status || 'ALL'}`}
          items={result.items}
          initialLoading={loading && result.items.length === 0}
          refreshing={loading && result.items.length > 0}
          error={loading ? null : result.error}
          noOrdersAtAll={!query.q && result.counts?.ALL === 0}
          hasActiveFilters={hasActiveFilters}
          detailHref={(order) => `/admin/orders/${order._id}${search ? `?back=${encodeURIComponent(search)}` : ''}`}
          onRetry={() => setRefreshTick((t) => t + 1)}
          onResetFilters={() => go({ ...query, status: '', q: '', page: 1 })}
        />
      </div>

      <div className="mt-5 flex min-h-10 flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#6E5D4F]" aria-live="polite">
          {showSummary ? `Showing ${from}–${to} of ${formatNumber(total)} orders` : ''}
        </p>
        <ProductPagination page={page} totalPages={totalPages} onChange={(nextPage) => update({ page: nextPage })} />
      </div>
    </div>
  );
}
