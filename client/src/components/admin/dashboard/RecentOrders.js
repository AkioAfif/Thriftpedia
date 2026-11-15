import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { HangerIcon } from '@/components/ui/icons/HangerIcon';
import { formatRupiah } from '@/lib/adminProducts';
import { formatOrderDateTime, orderItem, orderLabel } from '@/lib/orderView';
import { cn } from '@/lib/utils';
import { focusRing, panel, SectionError } from './shared';
import { StatusText } from './StatusText';

function Thumb({ src, size = 'size-10 rounded-[10px]' }) {
  if (!src) {
    return (
      <span className={cn('flex shrink-0 items-center justify-center bg-surface-muted text-text-secondary', size)}>
        <HangerIcon width={18} height={18} />
      </span>
    );
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt="" loading="lazy" className={cn('shrink-0 bg-surface-muted object-cover', size)} />;
}

const totalOf = (order) => (order.total == null ? '—' : formatRupiah(order.total));
const hrefOf = (order) => `/admin/orders/${order._id}`;

// md and up: a compact list without column headers; each 64px row is one link.
function DesktopList({ orders }) {
  return (
    <ul className="hidden divide-y divide-border md:block">
      {orders.map((order) => {
        const item = orderItem(order);
        return (
          <li key={order._id}>
            <Link
              href={hrefOf(order)}
              className="-mx-3 flex min-h-16 items-center gap-3 rounded-xl px-3 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
              <Thumb src={item.photo} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-text">{item.name}</span>
                <span className="block truncate text-[13px] tabular-nums text-text-secondary">
                  {orderLabel(order)} · {formatOrderDateTime(order.createdAt)}
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="text-[15px] font-semibold tabular-nums text-text">{totalOf(order)}</span>
                <StatusText status={order.status} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// Below md: the existing stacked cards, with the status as text + icon.
function MobileList({ orders }) {
  return (
    <ul className="-mx-4 divide-y divide-border md:hidden">
      {orders.map((order) => {
        const item = orderItem(order);
        return (
          <li key={order._id} className="even:bg-canvas">
            <Link href={hrefOf(order)} className={cn('block p-4 hover:bg-surface-muted', focusRing)}>
              <span className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-semibold tabular-nums text-text">{orderLabel(order)}</span>
                <StatusText status={order.status} />
              </span>
              <span className="mt-2 flex items-center gap-3">
                <Thumb src={item.photo} size="size-11 rounded-[10px]" />
                <span className="min-w-0 flex-1 truncate text-sm text-text">{item.name}</span>
              </span>
              <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="text-sm font-semibold tabular-nums text-text">{totalOf(order)}</span>
                <span className="text-[13px] tabular-nums text-text-secondary">{formatOrderDateTime(order.createdAt)}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex min-h-16 items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-[10px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-3.5 w-1/3 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20 rounded" />
            <Skeleton className="ml-auto h-3.5 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentOrders({ section }) {
  const orders = section.data?.items ?? [];
  return (
    <section aria-labelledby="recent-orders-title" className={cn(panel, 'min-w-0 overflow-hidden p-4 md:p-6')}>
      <h2 id="recent-orders-title" className="text-lg font-semibold text-text">Recent orders</h2>
      <div className="mt-3">
        {section.status === 'loading' && <ListSkeleton />}
        {section.status === 'error' && <SectionError message={section.error} onRetry={section.retry} />}
        {section.status === 'ready' && orders.length === 0 && (
          <p className="py-4 text-sm text-text-secondary">No orders yet. Orders appear here when buyers check out.</p>
        )}
        {section.status === 'ready' && orders.length > 0 && (
          <>
            <DesktopList orders={orders} />
            <MobileList orders={orders} />
          </>
        )}
      </div>
      <div className="mt-3 border-t border-border pt-2">
        <Link
          href="/admin/orders"
          className={cn('inline-flex min-h-11 items-center gap-1.5 rounded-md text-sm font-semibold text-primary hover:underline', focusRing)}
        >
          View all orders
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
