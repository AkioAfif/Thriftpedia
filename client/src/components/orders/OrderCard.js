'use client';

import Link from 'next/link';
import { rememberOrdersQuery } from './ordersReturn';
import OrderStatusBadge from '@/components/admin/orders/OrderStatusBadge';
import { OrderThumb } from '@/components/orders/OrderThumb';
import { formatOrderDateTime, orderItem, orderLabel, statusMeta } from '@/lib/orderView';
import { conditionLabel, formatRupiah, sizeLabel } from '@/lib/adminProducts';

function Arrow() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Decorative: the whole card is the link, so this only looks like a button.
function ViewDetails() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border-[1.5px] border-[#B5532E] bg-white px-4 text-sm font-semibold text-[#B5532E] transition-colors duration-150 group-hover:bg-[#FBE6DC] motion-reduce:transition-none"
    >
      View details
      <Arrow />
    </span>
  );
}

// One card = one link to the order. From md: photo | details | total, status, button.
// Below md: order + status / photo + details / total + button.
export function OrderCard({ order }) {
  const item = orderItem(order);
  const label = orderLabel(order);
  const total = formatRupiah(order.total ?? item.price);
  const details = [item.size ? `Size ${sizeLabel(item.size)}` : null, item.condition ? conditionLabel(item.condition) : null]
    .filter(Boolean)
    .join(' · ');
  const placed = <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>;

  return (
    <li>
      <Link
        href={`/orders/${order._id}`}
        // Lets the detail page link back to this tab and page.
        onClick={() => rememberOrdersQuery(window.location.search.replace(/^\?/, ''))}
        aria-label={`Order ${label}, ${item.name}, ${statusMeta(order.status).label}, total ${total}. View details`}
        className="group block rounded-2xl border border-[#D9CFC1] bg-white p-4 transition-colors duration-150 hover:border-[#B5532E] hover:bg-[#FBF8F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none md:p-5"
      >
        {/* md and up */}
        <span className="hidden grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-5 md:grid">
          <OrderThumb src={item.photo} alt="" sizes="72px" className="size-[72px] rounded-xl" />
          <span className="min-w-0">
            <span className="block break-words text-base font-semibold text-[#2B2118]">{item.name}</span>
            {details && <span className="mt-0.5 block text-[13px] text-[#6F6358]">{details}</span>}
            <span className="mt-1 block text-[13px] tabular-nums text-[#6F6358]">
              {label} · {placed}
            </span>
          </span>
          <span className="flex items-center gap-5">
            <span className="text-right">
              <span className="block text-[13px] text-[#6F6358]">Total</span>
              <span className="block text-[20px] font-semibold leading-tight tabular-nums text-[#2B2118]">{total}</span>
            </span>
            <OrderStatusBadge status={order.status} />
            <ViewDetails />
          </span>
        </span>

        {/* below md */}
        <span className="block md:hidden">
          <span className="flex items-center justify-between gap-3">
            <span className="min-w-0 truncate text-sm font-semibold tabular-nums text-[#2B2118]">{label}</span>
            <OrderStatusBadge status={order.status} className="min-w-0 shrink-0" />
          </span>
          <span className="mt-3 flex gap-3">
            <OrderThumb src={item.photo} alt="" sizes="56px" className="size-14 rounded-xl" />
            <span className="min-w-0 flex-1">
              <span className="block break-words text-[15px] font-semibold text-[#2B2118]">{item.name}</span>
              {details && <span className="block truncate text-[13px] text-[#6F6358]">{details}</span>}
              <span className="block text-[13px] tabular-nums text-[#6F6358]">{placed}</span>
            </span>
          </span>
          <span className="mt-3 flex items-center justify-between gap-3 border-t border-[#EAE4DA] pt-3">
            <span className="min-w-0 text-base font-semibold tabular-nums text-[#2B2118]">{total}</span>
            <ViewDetails />
          </span>
        </span>
      </Link>
    </li>
  );
}
