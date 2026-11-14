import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { HangerIcon } from '@/components/ui/icons/HangerIcon';
import { BagIcon } from '@/components/admin/icons';
import { formatRupiah } from '@/lib/adminProducts';
import { formatOrderDateTime, orderItem, orderLabel, statusMeta } from '@/lib/orderView';
import { cn } from '@/lib/utils';
import { focusRing, formatCount, panel, panelHeader, SectionError, SectionHeading } from './shared';

function Thumb({ src, size = 'size-10' }) {
  if (!src) {
    return (
      <span className={cn('flex shrink-0 items-center justify-center rounded-md bg-surface-muted text-text-secondary', size)}>
        <HangerIcon width={18} height={18} />
      </span>
    );
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt="" loading="lazy" className={cn('shrink-0 rounded-md bg-surface-muted object-cover', size)} />;
}

function StatusBadge({ status }) {
  const meta = statusMeta(status);
  return (
    <span className={cn('inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', meta.badge)}>
      {meta.label}
    </span>
  );
}

const total = (order) => (order.total == null ? '—' : formatRupiah(order.total));

// Under 768px each order is a stacked card; from md up, a table whose whole row is the link.
function OrderList({ orders }) {
  return (
    <>
      <ul className="divide-y divide-[#EAE4DA] md:hidden">
        {orders.map((order) => {
          const item = orderItem(order);
          return (
            <li key={order._id} className="even:bg-[#FBF8F3]">
              {/* Top: order + status. Middle: 44px photo + item. Bottom: total + date (wraps under 360px). */}
              <Link href={`/admin/orders/${order._id}`} className={cn('block p-4 hover:bg-[#F5F0E8]', focusRing)}>
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-semibold tabular-nums text-text">{orderLabel(order)}</span>
                  <StatusBadge status={order.status} />
                </span>
                <span className="mt-2 flex items-center gap-3">
                  <Thumb src={item.photo} size="size-11" />
                  <span className="min-w-0 flex-1 truncate text-sm text-text">{item.name}</span>
                </span>
                <span className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="text-sm font-semibold tabular-nums text-text">{total(order)}</span>
                  <span className="text-[13px] tabular-nums text-[#6F6358]">{formatOrderDateTime(order.createdAt)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-[#EAE4DA] text-sm text-[#4A3F35]">
          <tr>
            <th scope="col" className="px-5 py-3 font-semibold">Order</th>
            <th scope="col" className="px-3 py-3 font-semibold">Item</th>
            <th scope="col" className="min-w-[110px] px-3 py-3 font-semibold">Total</th>
            <th scope="col" className="px-3 py-3 font-semibold">Status</th>
            <th scope="col" className="px-5 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EAE4DA]">
          {orders.map((order) => {
            const item = orderItem(order);
            return (
              <tr key={order._id} className="relative even:bg-[#FBF8F3] hover:bg-[#F5F0E8]">
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/orders/${order._id}`}
                    className={cn('font-semibold tabular-nums text-text after:absolute after:inset-0 after:content-[""]', focusRing)}
                  >
                    {orderLabel(order)}
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <span className="flex items-center gap-3">
                    <Thumb src={item.photo} />
                    <span className="line-clamp-2 text-text">{item.name}</span>
                  </span>
                </td>
                <td className="min-w-[110px] whitespace-nowrap px-3 py-3 text-left font-semibold tabular-nums text-text">{total(order)}</td>
                <td className="px-3 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="whitespace-nowrap px-5 py-3 text-[13px] tabular-nums text-[#6F6358]">
                  {formatOrderDateTime(order.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

function ListSkeleton() {
  return (
    <>
      <div className="space-y-3 p-4 md:hidden" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
      <div className="hidden space-y-4 px-5 py-4 md:block" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <Skeleton className="h-4 flex-1 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </>
  );
}

// Completed / Cancelled as one quiet line, not as cards.
function ClosedSummary({ counts }) {
  return (
    <p className="flex flex-wrap gap-x-5 gap-y-1 border-t border-[#EAE4DA] px-4 py-3 text-[13px] text-[#6F6358] md:px-5">
      {['COMPLETED', 'CANCELLED'].map((status) => (
        <span key={status} className="inline-flex items-center gap-2">
          {statusMeta(status).label}
          <span className="font-semibold tabular-nums text-text">{formatCount(counts[status])}</span>
        </span>
      ))}
    </p>
  );
}

export function RecentOrders({ section }) {
  const orders = section.data?.items ?? [];
  const viewAll = (
    <Link href="/admin/orders" className={cn('inline-flex min-h-11 shrink-0 items-center rounded-md px-1 text-sm font-semibold text-primary hover:underline', focusRing)}>
      View all orders
    </Link>
  );

  return (
    <section aria-labelledby="recent-orders-title" className={cn(panel, 'min-w-0 overflow-hidden')}>
      <div className={panelHeader}>
        <SectionHeading id="recent-orders-title" title="Recent orders" icon={<BagIcon />} action={viewAll} />
      </div>
      <div>
        {section.status === 'loading' && <ListSkeleton />}
        {section.status === 'error' && <SectionError className="m-4 md:m-5" message={section.error} onRetry={section.retry} />}
        {section.status === 'ready' && orders.length === 0 && (
          <p className="px-4 py-6 text-sm text-[#6F6358] md:px-5">No orders yet. Orders appear here when buyers check out.</p>
        )}
        {section.status === 'ready' && orders.length > 0 && <OrderList orders={orders} />}
        {section.status === 'ready' && <ClosedSummary counts={section.data?.counts ?? {}} />}
      </div>
    </section>
  );
}
