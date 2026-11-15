'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/BuyerContext';
import { getOrdersPage } from '@/lib/services/orderService';
import { ORDER_STATUS_ORDER } from '@/lib/orderView';
import { BackToCatalogLink } from '@/components/orders/BackToCatalogLink';
import { OrderCard } from '@/components/orders/OrderCard';
import StatusChips from '@/components/ui/StatusChips';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorOutlineIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;
const PAGE = 'mx-auto w-full max-w-[1120px] flex-1 px-margin-mobile py-lg md:px-margin-tablet lg:py-xl';
const CARD = 'rounded-2xl border border-border bg-surface p-md sm:p-lg';

export default function OrdersPage() {
  return (
    <main className={PAGE}>
      <BackToCatalogLink />
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
      <StatusChips value={status} counts={counts} onSelect={(next) => go({ status: next, page: 1 })} />

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
          <EmptyCard title={status ? 'No orders in this status' : 'No orders on this page'}>
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
            {data.items.map((order) => <OrderCard key={order._id} order={order} />)}
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
        <div key={i} className="rounded-2xl border border-[#D9CFC1] bg-white p-4 md:p-5">
          <div className="hidden items-center gap-5 md:flex">
            <Skeleton className="size-[72px] rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/2 rounded" />
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
            <Skeleton className="h-11 w-24 rounded" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-11 w-32 rounded-xl" />
          </div>
          <div className="md:hidden">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="mt-3 flex gap-3">
              <Skeleton className="size-14 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3.5 w-1/2 rounded" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[#EAE4DA] pt-3">
              <Skeleton className="h-5 w-24 rounded" />
              <Skeleton className="h-11 w-32 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
