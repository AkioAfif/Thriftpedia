'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/BuyerContext';
import { getOrdersPage } from '@/lib/services/orderService';
import { ORDER_STATUS_ORDER, formatOrderDateTime, orderItem, orderLabel, statusMeta } from '@/lib/orderView';
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';
import OrderStatusBadge from '@/components/admin/orders/OrderStatusBadge';
import { OrderThumb } from '@/components/orders/OrderThumb';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorOutlineIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;
const PAGE = 'mx-auto w-full max-w-[1120px] flex-1 px-margin-mobile py-lg md:px-margin-tablet lg:py-xl';
const CARD = 'rounded-2xl border border-border bg-surface p-md sm:p-lg';
const TABS = [{ value: '', label: 'All', countKey: 'ALL' }, ...ORDER_STATUS_ORDER.map((s) => ({ value: s, label: statusMeta(s).label, countKey: s }))];

export default function OrdersPage() {
  return (
    <main className={PAGE}>
      <h1 className="text-headline-mobile font-semibold text-text md:text-headline-lg">My orders</h1>
      <div className="mt-lg">
        <Suspense fallback={<ListSkeleton />}>
          <OrdersView />
        </Suspense>
      </div>
    </main>
  );
}

// URL -> sanitised filter. Unknown values fall back to defaults instead of a 400.
function readQuery(searchParams) {
  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page'));
  return {
    status: ORDER_STATUS_ORDER.includes(status) ? status : '',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

function OrdersView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status, page } = readQuery(searchParams);
  const { token, user, ready, logout } = useAuth();
  const { requestLogin } = useWishlist();
  const buyer = Boolean(token) && user?.role?.toUpperCase() === 'BUYER';
  const query = useQuery({
    queryKey: ['orders-page', token, status, page],
    queryFn: () => getOrdersPage(token, { status, page, limit: PAGE_SIZE }),
    enabled: ready && buyer,
    retry: false,
    placeholderData: keepPreviousData, // keeps tabs and list steady while the next page loads
  });
  // Expired/invalid session: clear it once; the new (null) token disables the query, so this runs once.
  const unauthorized = query.isError && query.error?.status === 401;

  useEffect(() => {
    if (unauthorized) logout();
  }, [unauthorized, logout]);

  function go(next) {
    const params = new URLSearchParams();
    if (next.status) params.set('status', next.status);
    if (next.page > 1) params.set('page', String(next.page));
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (!ready) return <ListSkeleton />;
  if (!token || unauthorized) {
    return (
      <EmptyCard title="Log in to see your orders">
        <button type="button" className="buyer-primary w-full sm:w-[200px]" onClick={requestLogin}>Log in</button>
      </EmptyCard>
    );
  }
  if (!buyer) return <EmptyCard title="Order history is available for buyer accounts." />;

  const data = query.data;
  const counts = data?.counts;
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-lg">
      <nav aria-label="Filter orders by status" className="-mx-margin-mobile overflow-x-auto px-margin-mobile md:mx-0 md:px-0">
        <ul className="flex min-w-max border-b border-border">
          {TABS.map((tab) => {
            const active = tab.value === status;
            const count = counts?.[tab.countKey];
            return (
              <li key={tab.countKey}>
                <button
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => go({ status: tab.value, page: 1 })}
                  className={cn(
                    'buyer-control -mb-px flex min-h-11 items-center gap-1.5 rounded-t-md border-b-2 px-md text-body-md transition-colors',
                    active ? 'border-primary font-semibold text-primary' : 'border-transparent text-text-secondary hover:text-text'
                  )}
                >
                  {tab.label}
                  {typeof count === 'number' && <span className="text-body-sm tabular-nums text-text-muted">{count}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {query.isPending ? (
        <ListSkeleton />
      ) : query.isError ? (
        <div role="alert" className={`${CARD} flex flex-col items-center gap-md py-xl text-center`}>
          <ErrorOutlineIcon className="h-7 w-7 text-error" />
          <p className="text-title-md font-semibold text-text">Couldn’t load your orders</p>
          <p className="text-body-md text-text-secondary">{query.error.message}</p>
          <button type="button" className="buyer-secondary w-full sm:w-[200px]" onClick={() => query.refetch()}>Retry</button>
        </div>
      ) : data.items.length === 0 ? (
        status || page > 1 ? (
          <EmptyCard title={status ? `No ${statusMeta(status).label.toLowerCase()} orders` : 'No orders on this page'}>
            <button type="button" className="buyer-secondary w-full sm:w-[200px]" onClick={() => go({ status: '', page: 1 })}>
              Show all orders
            </button>
          </EmptyCard>
        ) : (
          <EmptyCard title="No orders yet">
            <Link href="/catalog" className="buyer-primary w-full sm:w-[200px]">Browse catalog</Link>
          </EmptyCard>
        )
      ) : (
        <>
          <ul aria-busy={query.isFetching} className={cn('flex flex-col gap-md transition-opacity', query.isPlaceholderData && 'opacity-60')}>
            {data.items.map((order) => <OrderRow key={order._id} order={order} />)}
          </ul>
          {meta.totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-between gap-md">
              <button
                type="button"
                className="buyer-secondary min-w-[96px]"
                disabled={page <= 1}
                onClick={() => go({ status, page: page - 1 })}
              >
                Previous
              </button>
              <p className="text-body-md tabular-nums text-text-secondary" aria-live="polite">
                Page {meta.page} of {meta.totalPages}
              </p>
              <button
                type="button"
                className="buyer-secondary min-w-[96px]"
                disabled={page >= meta.totalPages}
                onClick={() => go({ status, page: page + 1 })}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

function OrderRow({ order }) {
  const item = orderItem(order);
  const label = orderLabel(order);
  return (
    <li className={`${CARD} grid grid-cols-[64px_minmax(0,1fr)] gap-x-md gap-y-md sm:grid-cols-[80px_minmax(0,1fr)_auto]`}>
      <OrderThumb src={item.photo} alt={item.name} sizes="80px" className="h-20 w-16 sm:h-[100px] sm:w-20" />
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="break-words text-title-md font-semibold text-text">{item.name}</h2>
        {item.size && <p className="text-body-md text-text-secondary">Size {sizeLabel(item.size)}</p>}
        <p className="mt-auto text-body-sm tabular-nums text-text-secondary">
          {label} · <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
        </p>
      </div>
      <div className="col-span-2 flex items-end justify-between gap-md border-t border-border pt-md sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
        <div className="sm:text-right">
          <p className="text-body-sm text-text-secondary">Total</p>
          <p className="text-headline-sm font-semibold tabular-nums text-text">{formatRupiah(order.total ?? item.price)}</p>
        </div>
        <div className="flex items-center gap-md">
          <OrderStatusBadge status={order.status} />
          <Link
            href={`/orders/${order._id}`}
            aria-label={`View order ${label}`}
            className="buyer-control inline-flex min-h-11 items-center rounded-md px-1 text-body-md font-semibold text-primary hover:text-primary-hover"
          >
            View
          </Link>
        </div>
      </div>
    </li>
  );
}

function EmptyCard({ title, children }) {
  return (
    <div className={`${CARD} flex flex-col items-center gap-lg py-xl text-center`}>
      <p className="text-headline-sm font-semibold text-text">{title}</p>
      {children}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading orders" className="flex flex-col gap-md">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${CARD} flex gap-md`}>
          <Skeleton className="h-20 w-16 rounded-lg sm:h-[100px] sm:w-20" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
          </div>
          <Skeleton className="hidden h-6 w-28 rounded sm:block" />
        </div>
      ))}
    </div>
  );
}
