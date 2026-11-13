'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/BuyerContext';
import { cancelOrder, getOrder } from '@/lib/services/orderService';
import { formatOrderDateTime, historyNote, orderItem, orderLabel, statusMeta } from '@/lib/orderView';
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';
import OrderStatusBadge from '@/components/admin/orders/OrderStatusBadge';
import { OrderStepper } from '@/components/admin/orders/OrderTimeline';
import { OrderThumb } from '@/components/orders/OrderThumb';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { CheckIcon, ChevronDownIcon, ErrorOutlineIcon } from '@/components/ui/Icons';

// TODO: remove this flag (and keep the cancel UI) once PATCH /api/orders/:id/cancel is merged into main.
const BUYER_CANCEL_ENABLED = process.env.NEXT_PUBLIC_BUYER_CANCEL === 'true';

const PAGE = 'mx-auto w-full max-w-[1120px] flex-1 px-margin-mobile py-lg md:px-margin-tablet lg:py-xl';
const CARD = 'rounded-2xl border border-border bg-surface p-md sm:p-lg';

export default function OrderPage({ params }) {
  const { orderId } = use(params);
  return (
    <Suspense fallback={<main className={PAGE}><DetailSkeleton /></main>}>
      <OrderView key={orderId} orderId={orderId} />
    </Suspense>
  );
}

function OrderView({ orderId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Read once: the flag is stripped from the URL right away so a refresh shows the detail page.
  const [placed] = useState(() => searchParams.get('placed') === '1');
  const { token, user, ready } = useAuth();
  const { requestLogin } = useWishlist();
  const buyer = Boolean(token) && user?.role?.toUpperCase() === 'BUYER';
  const queryKey = ['order', orderId, token];
  const query = useQuery({ queryKey, queryFn: () => getOrder(token, orderId), enabled: ready && buyer, retry: false });

  useEffect(() => {
    if (searchParams.has('placed')) router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  let body;
  if (!ready || (buyer && query.isPending)) body = <DetailSkeleton />;
  else if (!token) {
    body = (
      <Notice title="Log in to view this order">
        <button type="button" className="buyer-primary w-full sm:w-auto" onClick={requestLogin}>Log in</button>
      </Notice>
    );
  } else if (!buyer) body = <Notice title="Orders are available for buyer accounts." />;
  else if (query.isError) {
    body = (
      <Notice title="Couldn’t load this order" message={query.error.message} alert>
        <button type="button" className="buyer-secondary w-full sm:w-auto" onClick={() => query.refetch()}>Retry</button>
        <Link href="/orders" className="buyer-secondary w-full sm:w-auto">My orders</Link>
      </Notice>
    );
  } else if (placed) body = <PlacedView order={query.data} />;
  else body = <OrderDetail order={query.data} queryKey={queryKey} onReload={() => query.refetch()} />;

  return <main className={PAGE}>{body}</main>;
}

function Notice({ title, message, alert = false, children }) {
  return (
    <div role={alert ? 'alert' : undefined} className={`${CARD} mx-auto flex max-w-[640px] flex-col items-center gap-md text-center`}>
      {alert && <ErrorOutlineIcon className="h-7 w-7 text-error" />}
      <h1 className="text-headline-sm font-semibold text-text">{title}</h1>
      {message && <p className="text-body-md text-text-secondary">{message}</p>}
      {children && <div className="flex w-full flex-col gap-sm sm:w-auto sm:flex-row">{children}</div>}
    </div>
  );
}

function PlacedView({ order }) {
  const item = orderItem(order);
  const heading = useRef(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <div className="mx-auto flex max-w-[640px] flex-col items-center gap-lg py-md text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-badge-success text-[#1F5A2B]">
        <CheckIcon className="h-7 w-7" />
      </span>
      <div className="flex flex-col items-center gap-sm">
        <h1 ref={heading} tabIndex={-1} className="text-headline-mobile font-semibold text-text outline-none md:text-headline-lg">
          Order placed
        </h1>
        <p className="flex flex-wrap items-center justify-center gap-md text-title-md text-text">
          <span className="tabular-nums">{orderLabel(order)}</span>
          <OrderStatusBadge status={order.status} />
        </p>
        <p className="text-body-md tabular-nums text-text-secondary">
          <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
        </p>
      </div>

      <section aria-label="Order summary" className={`${CARD} w-full text-left`}>
        <div className="flex items-center gap-md">
          <OrderThumb src={item.photo} alt={item.name} sizes="80px" className="h-20 w-20" />
          <div className="min-w-0">
            <p className="break-words text-title-md font-semibold text-text">{item.name}</p>
            {item.size && <p className="mt-1 text-body-md text-text-secondary">Size {sizeLabel(item.size)}</p>}
            <p className="mt-1 text-body-md font-semibold tabular-nums text-text">{formatRupiah(item.price)}</p>
          </div>
        </div>
        <div className="mt-md flex items-center justify-between gap-md border-t border-border pt-md">
          <span className="text-title-md text-text">Total</span>
          <span className="text-headline-sm font-semibold tabular-nums text-text">{formatRupiah(order.total ?? item.price)}</span>
        </div>
      </section>

      <div className="flex w-full flex-col gap-sm">
        <Link href="/orders" className="buyer-primary">View my orders</Link>
        <Link href="/catalog" className="buyer-secondary">Continue shopping</Link>
      </div>
    </div>
  );
}

function OrderDetail({ order, queryKey, onReload }) {
  const item = orderItem(order);
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const canCancel = BUYER_CANCEL_ENABLED && order.status === 'PENDING';

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-body-md text-text-secondary">
            <li>
              <Link href="/orders" className="buyer-control inline-flex min-h-11 items-center rounded-md px-1 hover:text-primary">
                My orders
              </Link>
            </li>
            <li aria-hidden="true">
              <ChevronDownIcon className="h-3.5 w-3.5 -rotate-90" />
            </li>
            <li aria-current="page" className="px-1 tabular-nums text-text">{orderLabel(order)}</li>
          </ol>
        </nav>
        <h1 className="text-headline-mobile font-semibold text-text md:text-headline-lg">Order detail</h1>
      </div>

      <div className="grid items-start gap-lg lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="flex flex-col gap-lg">
          <section aria-labelledby="item-title" className={CARD}>
            <h2 id="item-title" className="text-headline-sm font-semibold text-text">Item</h2>
            <div className="mt-md flex gap-md sm:gap-lg">
              <OrderThumb src={item.photo} alt={item.name} sizes="112px" className="h-[120px] w-24 sm:h-[140px] sm:w-28" />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="break-words text-title-md font-semibold text-text sm:text-headline-sm">{item.name}</p>
                {item.brand && <p className="text-body-md text-text-secondary">{item.brand}</p>}
                {item.size && <p className="text-body-md text-text-secondary">Size {sizeLabel(item.size)}</p>}
                <p className="mt-sm text-title-md font-semibold tabular-nums text-text">{formatRupiah(item.price)}</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="total-title" className={CARD}>
            <h2 id="total-title" className="text-headline-sm font-semibold text-text">Total</h2>
            <dl className="mt-md flex flex-col">
              <div className="flex flex-wrap items-baseline justify-between gap-x-md gap-y-1 pb-md">
                <dt className="text-body-md text-text-secondary">Order placed</dt>
                <dd className="text-body-md tabular-nums text-text-secondary">
                  <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-md border-t border-border pt-md">
                <dt className="text-title-md text-text">Total</dt>
                <dd className="text-headline-sm font-semibold tabular-nums text-text">{formatRupiah(order.total ?? item.price)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="flex flex-col gap-lg">
          <section aria-labelledby="status-title" className={CARD}>
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <h2 id="status-title" className="text-headline-sm font-semibold text-text">Order status</h2>
              <OrderStatusBadge status={order.status} />
            </div>
            <div className="mt-md">
              <OrderStepper status={order.status} history={history} />
            </div>

            {order.trackingNumber && (
              <dl className="mt-md flex flex-col gap-1 border-t border-border pt-md">
                <dt className="text-body-md font-semibold text-text">Tracking number</dt>
                <dd className="break-all text-body-md tabular-nums text-text">{order.trackingNumber}</dd>
                {order.courier && <dd className="text-body-sm text-text-secondary">via {order.courier}</dd>}
              </dl>
            )}

            <div className="mt-md border-t border-border pt-md">
              <h3 className="text-body-md font-semibold text-text">Status history</h3>
              <StatusHistory history={history} />
            </div>

            {canCancel && <CancelOrder order={order} queryKey={queryKey} onReload={onReload} />}
          </section>

          <section aria-label="Review" className={CARD}>
            {order.product?._id ? (
              <ProductReviews product={order.product} order={order} />
            ) : (
              <p className="text-body-md text-text-secondary">This product was removed, so it can’t be reviewed.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

// Newest first, like the admin timeline, without who made the change.
function StatusHistory({ history }) {
  if (history.length === 0) return <p className="mt-sm text-body-sm text-text-secondary">No history recorded yet.</p>;
  const entries = history.map((entry, index) => ({ entry, note: historyNote(entry, index) })).reverse();
  return (
    <ol className="mt-sm flex flex-col gap-md">
      {entries.map(({ entry, note }) => {
        const label = statusMeta(entry.status).label;
        return (
          <li key={`${entry.status}-${entry.at}`} className="min-w-0">
            <p className="break-words text-body-md text-text">{note ? `${note} · ${label}` : label}</p>
            <p className="mt-0.5 text-body-sm tabular-nums text-text-secondary">
              <time dateTime={entry.at}>{formatOrderDateTime(entry.at)}</time>
            </p>
          </li>
        );
      })}
    </ol>
  );
}

function CancelOrder({ order, queryKey, onReload }) {
  const { token } = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [notice, setNotice] = useState('');

  async function confirm() {
    setBusy(true);
    setDialogError('');
    try {
      const updated = await cancelOrder(token, order._id);
      client.setQueryData(queryKey, updated);
      client.invalidateQueries({ queryKey: ['orders-page'] });
      setOpen(false);
      toast.success('Order cancelled.');
    } catch (err) {
      if ([403, 404, 409].includes(err.status)) {
        // The order changed under us (already processed or cancelled): show why and reload it.
        setOpen(false);
        setNotice(err.message);
        onReload();
      } else {
        setDialogError(err.message || 'Couldn’t cancel this order. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-md border-t border-border pt-md">
      {notice && (
        <p role="alert" className="mb-sm flex gap-sm rounded-md bg-error-tint px-md py-sm text-body-md text-text">
          <ErrorOutlineIcon className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          {notice}
        </p>
      )}
      <button
        type="button"
        onClick={() => { setDialogError(''); setOpen(true); }}
        className="buyer-control -mx-1 inline-flex min-h-11 items-center rounded-md px-1 text-body-md font-semibold text-error underline-offset-4 hover:underline"
      >
        Cancel order
      </button>
      <p className="text-body-sm text-text-secondary">You can cancel while your order is Pending.</p>

      {open && (
        <ActionDialog title="Cancel this order?" busy={busy} onRequestClose={() => setOpen(false)}>
          <p className="text-body-md text-text-secondary">
            {orderItem(order).name} goes back on sale and another buyer can buy it. This can’t be undone.
          </p>
          {dialogError && (
            <p role="alert" className="mt-md flex gap-sm text-body-md text-error">
              <ErrorOutlineIcon className="mt-0.5 h-4 w-4 shrink-0 text-error" />
              {dialogError}
            </p>
          )}
          <div className="mt-lg flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
            <button type="button" className="buyer-secondary" disabled={busy} onClick={() => setOpen(false)}>
              Keep order
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              aria-busy={busy}
              className="buyer-control flex min-h-12 items-center justify-center rounded-md bg-error px-md py-3 text-body-md font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Cancelling…' : 'Cancel order'}
            </button>
          </div>
        </ActionDialog>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order" className="flex flex-col gap-lg">
      <Skeleton className="h-5 w-40 rounded" />
      <Skeleton className="h-9 w-56 rounded" />
      <div className="grid gap-lg lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className={CARD}>
          <Skeleton className="h-6 w-20 rounded" />
          <div className="mt-md flex gap-md">
            <Skeleton className="h-[120px] w-24 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
              <Skeleton className="h-5 w-1/2 rounded" />
            </div>
          </div>
        </div>
        <div className={CARD}>
          <Skeleton className="h-6 w-32 rounded" />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="mt-md h-8 w-40 rounded" />)}
        </div>
      </div>
    </div>
  );
}
