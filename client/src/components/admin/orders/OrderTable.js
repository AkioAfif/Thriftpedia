'use client';

import Link from 'next/link';
import OrderStatusBadge from './OrderStatusBadge';
import { formatOrderDate, orderBuyer, orderItem, orderLabel } from '@/lib/adminOrders';
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]';
const primaryButton = `mt-5 inline-flex min-h-[40px] items-center rounded-xl bg-[#a3452a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#8f3b23] ${focusRing}`;

function Shell({ id, labelledBy, busy, children }) {
  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      aria-busy={busy || undefined}
      className="overflow-hidden rounded-[20px] border border-[#e8e1d8] bg-white"
    >
      {children}
    </div>
  );
}

function Message({ title, children, action }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-lg font-semibold text-[#2b1d14]">{title}</p>
      <p className="mx-auto mt-2 max-w-[28rem] text-sm text-[#6E5D4F]">{children}</p>
      {action}
    </div>
  );
}

function ItemThumb({ src }) {
  if (!src) return <span aria-hidden="true" className="block h-[50px] w-10 shrink-0 rounded-md bg-[#efe9e0]" />;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt="" loading="lazy" className="h-[50px] w-10 shrink-0 rounded-md bg-[#efe9e0] object-cover" />;
}

export default function OrderTable({
  panelId,
  labelledBy,
  items,
  initialLoading,
  refreshing,
  error,
  noOrdersAtAll,
  hasActiveFilters,
  detailHref,
  onRetry,
  onResetFilters,
}) {
  const shell = (children, busy) => (
    <Shell id={panelId} labelledBy={labelledBy} busy={busy}>
      {children}
    </Shell>
  );

  if (error?.status === 403) {
    return shell(
      <Message title="Access denied">
        Only admin accounts can view orders. Sign in with an admin account to continue.
      </Message>
    );
  }

  if (error) {
    return shell(
      <Message
        title="Couldn't load orders"
        action={
          <button type="button" onClick={onRetry} className={primaryButton}>
            Try again
          </button>
        }
      >
        {error.message}
      </Message>
    );
  }

  if (initialLoading) {
    return shell(
      <div className="space-y-4 p-6">
        <span className="sr-only">Loading orders</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg bg-[#efe9e0]" />
        ))}
      </div>,
      true
    );
  }

  if (items.length === 0) {
    if (noOrdersAtAll) {
      return shell(
        <Message title="No orders yet">
          Orders appear here as soon as a buyer checks out. The product is marked sold automatically, so there is
          nothing to update in Product Management.
        </Message>
      );
    }
    return shell(
      <Message
        title="No orders match"
        action={
          hasActiveFilters && (
            <button type="button" onClick={onResetFilters} className={primaryButton}>
              Show all orders
            </button>
          )
        }
      >
        Try another order ID or buyer name, or switch to a different status tab.
      </Message>
    );
  }

  return shell(
    <div className={`transition-opacity duration-150 ${refreshing ? 'opacity-60' : ''}`}>
      {/* Narrow screens: one tappable card per order, so status and total never hide off-screen. */}
      <ul className="divide-y divide-[#efe9e0] md:hidden">
        {items.map((order) => {
          const buyer = orderBuyer(order);
          const item = orderItem(order);
          const label = orderLabel(order);
          return (
            <li key={order._id}>
              <Link
                href={detailHref(order)}
                aria-label={`View order ${label}`}
                className={`flex gap-3 p-4 hover:bg-[#FAF7F2] focus-visible:bg-[#FAF7F2] ${focusRing} focus-visible:ring-inset`}
              >
                <ItemThumb src={item.photo} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold tabular-nums text-[#2b1d14]">{label}</span>
                    <OrderStatusBadge status={order.status} className="min-w-0" />
                  </div>
                  <p className="mt-1 truncate text-sm font-semibold text-[#2b1d14]">{item.name}</p>
                  <p className="truncate text-xs text-[#6E5D4F]">
                    {buyer.name ?? 'Deleted account'} · <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
                  </p>
                  <p className="mt-1 text-sm font-semibold tabular-nums text-[#2b1d14]">
                    {order.total == null ? '—' : formatRupiah(order.total)}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <caption className="sr-only">Orders</caption>
        <thead>
          <tr className="bg-[#f1ebe1] text-left text-[#4A3F35]">
            <th scope="col" className="px-4 py-3.5 font-semibold">Order ID</th>
            <th scope="col" className="px-4 py-3.5 font-semibold">Date</th>
            <th scope="col" className="px-4 py-3.5 font-semibold">Buyer</th>
            <th scope="col" className="px-4 py-3.5 font-semibold">Item</th>
            <th scope="col" className="min-w-[110px] px-4 py-3.5 font-semibold">Total</th>
            <th scope="col" className="px-4 py-3.5 font-semibold">Status</th>
            <th scope="col" className="px-4 py-3.5 text-right font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((order) => {
            const buyer = orderBuyer(order);
            const item = orderItem(order);
            const label = orderLabel(order);
            return (
              <tr key={order._id} className="border-t border-[#efe9e0] hover:bg-[#FAF7F2]">
                <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-[#2b1d14]">{label}</td>
                <td className="whitespace-nowrap px-4 py-4 tabular-nums text-[#6E5D4F]">
                  <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-[180px] truncate text-[#2b1d14]" title={buyer.name ?? undefined}>
                    {buyer.name ?? 'Deleted account'}
                  </p>
                  {buyer.email && (
                    <p className="max-w-[180px] truncate text-xs text-[#6E5D4F]" title={buyer.email}>
                      {buyer.email}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <ItemThumb src={item.photo} />
                    <div className="min-w-0 max-w-[240px]">
                      <p className="truncate font-semibold text-[#2b1d14]" title={item.name}>{item.name}</p>
                      <p className="truncate text-xs text-[#6E5D4F]">
                        {[item.brand, item.size && `Size ${sizeLabel(item.size)}`].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="min-w-[110px] whitespace-nowrap px-4 py-4 text-left font-semibold tabular-nums text-[#2b1d14]">
                  {order.total == null ? '—' : formatRupiah(order.total)}
                </td>
                <td className="px-4 py-4">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={detailHref(order)}
                    aria-label={`View order ${label}`}
                    className={`inline-flex min-h-[40px] items-center rounded-xl border border-[#CFBEAE] bg-white px-5 text-sm font-semibold text-[#2b1d14] hover:bg-[#faf7f2] ${focusRing}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>,
    refreshing
  );
}
