'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/BuyerContext';
import { cancelOrder, getOrder } from '@/lib/services/orderService';
import { formatOrderDateTime, orderItem, orderLabel } from '@/lib/orderView';
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';
import OrderStatusBadge from '@/components/admin/orders/OrderStatusBadge';
import OrderTimeline, { OrderStepper } from '@/components/admin/orders/OrderTimeline';
import TrackingBox from '@/components/admin/orders/TrackingBox';
import { BuyerOrderItem } from '@/components/orders/BuyerOrderItem';
import { OrderBackBar, OrderBackButton } from '@/components/orders/OrderBackNav';
import { OrderStatusRibbon } from '@/components/orders/OrderStatusRibbon';
import { useOrdersHref } from '@/components/orders/ordersReturn';
import { OrderThumb } from '@/components/orders/OrderThumb';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { CheckIcon, ErrorOutlineIcon } from '@/components/ui/Icons';

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
  const { token, user, ready, logout } = useAuth();
  const { requestLogin } = useWishlist();
  const buyer = Boolean(token) && user?.role?.toUpperCase() === 'BUYER';
  const queryKey = ['order', orderId, token];
  const query = useQuery({ queryKey, queryFn: () => getOrder(token, orderId), enabled: ready && buyer, retry: false });
  // Expired/invalid session: clear it once; the new (null) token disables the query, so this runs once.
  const unauthorized = query.isError && query.error?.status === 401;

  useEffect(() => {
    if (unauthorized) logout();
  }, [unauthorized, logout]);

  useEffect(() => {
    if (searchParams.has('placed')) router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  let body;
  if (!ready || (buyer && query.isPending)) body = <DetailSkeleton />;
  else if (!token || unauthorized) {
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
  // Lives here, not in CancelOrder: after a 403/404/409 reload the order may no longer be PENDING.
  const [cancelNotice, setCancelNotice] = useState('');
  const backHref = useOrdersHref();
  const label = orderLabel(order);
  const numbered = Boolean(order.orderNumber);
  const cancelled = order.status === 'CANCELLED';
  const total = order.total ?? item.price;
  const productId = order.product?._id ?? null;
  // Cancelled orders have no stepper; below lg the progress card then only appears for a notice.
  const progressHiddenOnMobile = cancelled && !cancelNotice && !order.trackingNumber;

  return (
    <div className="flex flex-col gap-5 md:gap-lg">
      <OrderBackBar href={backHref} label={numbered ? label : ''} />

      {/* md and up: the Back button is the only way back (no breadcrumb). */}
      <div className="hidden md:flex">
        <OrderBackButton href={backHref} />
      </div>

      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="break-words text-[28px] font-semibold leading-tight tabular-nums text-[#2B2118] md:text-[32px]">
            {numbered ? `Order ${label}` : 'Order'}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1.5 text-sm tabular-nums text-[#6F6358]">
          Placed <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
        </p>
      </header>

      <OrderStatusRibbon order={order} total={total} canCancel={canCancel} />

      {/* DOM order = mobile order: progress, item, history, review. From lg: item and review on
          the left (7/12), the progress card on the right (5/12), sticky. */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
        <div className={`lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 lg:self-stretch ${progressHiddenOnMobile ? 'max-lg:hidden' : ''}`}>
          <section aria-labelledby="progress-title" className="rounded-[20px] border border-[#D9CFC1] bg-white p-4 sm:p-5 lg:sticky lg:top-24">
            <h2 id="progress-title" className="text-[18px] font-semibold text-[#2B2118]">Order progress</h2>
            {!cancelled && (
              <div className="mt-4">
                <OrderStepper status={order.status} history={history} />
              </div>
            )}
            {order.trackingNumber && (
              <div className="mt-4">
                <TrackingBox trackingNumber={order.trackingNumber} courier={order.courier} />
              </div>
            )}
            <div className="mt-5 hidden border-t border-[#EAE4DA] pt-4 lg:block">
              <h3 className="text-[15px] font-semibold text-[#2B2118]">Status history</h3>
              <div className="mt-3">
                <OrderTimeline history={history} />
              </div>
            </div>

            {cancelNotice && (
              <p role="alert" className="mt-md flex gap-sm rounded-md bg-error-tint px-md py-sm text-body-md text-text">
                <ErrorOutlineIcon className="mt-0.5 h-4 w-4 shrink-0 text-error" />
                {cancelNotice}
              </p>
            )}
            {canCancel && <CancelOrder order={order} queryKey={queryKey} onReload={onReload} onNotice={setCancelNotice} />}
          </section>
        </div>

        <div className="min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-1">
          <BuyerOrderItem item={item} productId={productId} fromPath={`/orders/${order._id}`} />
        </div>

        {/* Below lg the history is its own card after the item (from lg it is in the progress card). */}
        <section aria-labelledby="history-title" className="rounded-[20px] border border-[#D9CFC1] bg-white p-4 sm:p-5 lg:hidden">
          <h2 id="history-title" className="text-[18px] font-semibold text-[#2B2118]">Status history</h2>
          <div className="mt-3">
            <OrderTimeline history={history} />
          </div>
        </section>

        <section aria-label="Review" className="min-w-0 rounded-[20px] border border-[#D9CFC1] bg-white p-4 sm:p-5 lg:col-span-7 lg:col-start-1 lg:row-start-2">
          {order.product?._id ? (
            <ProductReviews product={order.product} order={order} />
          ) : (
            <p className="text-body-md text-text-secondary">This product was removed, so it can’t be reviewed.</p>
          )}
        </section>
      </div>
    </div>
  );
}

function CancelOrder({ order, queryKey, onReload, onNotice }) {
  const { token } = useAuth();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');

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
        onNotice(err.message || 'This order can no longer be cancelled.');
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
      <button
        type="button"
        onClick={() => { setDialogError(''); onNotice(''); setOpen(true); }}
        className="buyer-control -mx-1 inline-flex min-h-11 items-center rounded-md px-1 text-body-md font-semibold text-error underline-offset-4 hover:underline"
      >
        Cancel order
      </button>
      <p className="text-[13px] text-text-secondary">You can cancel while your order is Pending.</p>

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
    <div aria-busy="true" aria-label="Loading order" className="flex flex-col gap-5 md:gap-lg">
      <Skeleton className="hidden h-11 w-56 rounded-full md:block" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      <Skeleton className="h-[124px] w-full rounded-[20px]" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="rounded-[20px] border border-[#D9CFC1] bg-white p-5 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <Skeleton className="h-6 w-36 rounded" />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="mt-4 h-8 w-40 rounded" />)}
        </div>
        <div className="flex gap-4 rounded-[20px] border border-[#D9CFC1] bg-white p-5 lg:col-span-7 lg:col-start-1 lg:row-start-1">
          <Skeleton className="size-24 rounded-2xl md:size-32" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-6 w-1/3 rounded-full" />
            <Skeleton className="h-5 w-1/4 rounded" />
          </div>
        </div>
        <Skeleton className="h-40 rounded-[20px] lg:col-span-7 lg:col-start-1 lg:row-start-2" />
      </div>
    </div>
  );
}
