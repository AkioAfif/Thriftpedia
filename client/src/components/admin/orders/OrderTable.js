'use client';

import Link from 'next/link';
import OrderStatusBadge from './OrderStatusBadge';
import { formatOrderDate, orderBuyer, orderItem, orderLabel } from '@/lib/adminOrders';
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
const primaryButton = `mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-hover ${focusRing}`;
const outlineButton = `mt-5 inline-flex min-h-11 items-center rounded-xl border-[1.5px] border-primary bg-surface px-5 text-sm font-semibold text-primary transition-colors hover:bg-primary-tint ${focusRing}`;
// Visual-only twin of the View button inside the mobile card (the whole card is the link).
const viewPill = 'inline-flex min-h-11 shrink-0 items-center rounded-xl border-[1.5px] border-primary bg-surface px-5 text-sm font-semibold text-primary';

function Shell({ id, labelledBy, busy, children }) {
  return (
    <div
      id={id}
      role="tabpanel"
      aria-labelledby={labelledBy}
      aria-busy={busy || undefined}
      className="overflow-hidden rounded-[20px] border border-border bg-surface"
    >
      {children}
    </div>
  );
}

function Message({ title, children, action }) {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-lg font-semibold text-text">{title}</p>
      <p className="mx-auto mt-2 max-w-[28rem] text-sm text-text-secondary">{children}</p>
      {action}
    </div>
  );
}

function ItemThumb({ src, className = 'h-[50px] w-10' }) {
  if (!src) return <span aria-hidden="true" className={`block shrink-0 rounded-md bg-surface-muted ${className}`} />;
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt="" loading="lazy" className={`shrink-0 rounded-md bg-surface-muted object-cover ${className}`} />;
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
          <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-muted" />
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
        title="No orders match this filter"
        action={
          hasActiveFilters && (
            <button type="button" onClick={onResetFilters} className={outlineButton}>
              Reset filters
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
      <ul className="divide-y divide-border md:hidden">
        {items.map((order) => {
          const buyer = orderBuyer(order);
          const item = orderItem(order);
          const label = orderLabel(order);
          return (
            <li key={order._id} className="even:bg-canvas">
              <Link
                href={detailHref(order)}
                aria-label={`View order ${label}`}
                className={`block p-4 hover:bg-surface-muted focus-visible:bg-surface-muted ${focusRing} focus-visible:ring-inset`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-semibold tabular-nums text-text">{label}</span>
                  <OrderStatusBadge status={order.status} className="min-w-0 shrink-0" />
                </span>
                <span className="mt-3 flex items-center gap-3">
                  <ItemThumb src={item.photo} className="size-12" />
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-semibold text-text">{item.name}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-text-secondary">
                      {buyer.name ?? 'Deleted account'} · <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
                    </span>
                  </span>
                </span>
                <span className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold tabular-nums text-text">
                    {order.total == null ? '—' : formatRupiah(order.total)}
                  </span>
                  <span aria-hidden="true" className={viewPill}>
                    View
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[960px] border-collapse text-sm">
        <caption className="sr-only">Orders</caption>
        <thead>
          <tr className="bg-surface-muted text-left text-sm text-text">
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
              <tr key={order._id} className="relative border-t border-border even:bg-canvas hover:bg-surface-muted">
                <td className="whitespace-nowrap px-4 py-4 font-semibold tabular-nums text-text">{label}</td>
                <td className="whitespace-nowrap px-4 py-4 tabular-nums text-text-secondary">
                  <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
                </td>
                <td className="px-4 py-4">
                  <p className="max-w-[180px] truncate text-text" title={buyer.name ?? undefined}>
                    {buyer.name ?? 'Deleted account'}
                  </p>
                  {buyer.email && (
                    <p className="max-w-[180px] truncate text-[13px] text-text-secondary" title={buyer.email}>
                      {buyer.email}
                    </p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <ItemThumb src={item.photo} />
                    <div className="min-w-0 max-w-[240px]">
                      <p className="truncate font-semibold text-text" title={item.name}>{item.name}</p>
                      <p className="truncate text-[13px] text-text-secondary">
                        {[item.brand, item.size && `Size ${sizeLabel(item.size)}`].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="min-w-[110px] whitespace-nowrap px-4 py-4 text-left font-semibold tabular-nums text-text">
                  {order.total == null ? '—' : formatRupiah(order.total)}
                </td>
                <td className="px-4 py-4">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={detailHref(order)}
                    aria-label={`View order ${label}`}
                    className={`inline-flex min-h-11 items-center rounded-xl border-[1.5px] border-primary bg-surface px-5 text-sm font-semibold text-primary after:absolute after:inset-0 after:content-[''] hover:bg-primary-tint ${focusRing}`}
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
