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
import { PaymentBadge } from '@/components/orders/PaymentBadge';
import { paymentNotice, PaymentNoticeRow } from '@/components/orders/PaymentNotice';
import { BuyerShippingAddress } from '@/components/orders/ShippingAddress';
import { AddressDialog } from '@/components/orders/AddressDialog';
import { useOrderPayment } from '@/components/orders/useOrderPayment';
import { ProductReviews } from '@/components/reviews/ProductReviews';
import { EmailLink } from '@/components/legal/EmailLink';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { LoadingDots } from '@/components/ui/LoadingDots';
import { Skeleton } from '@/components/ui/Skeleton';
import { CheckIcon, CloseIcon, ErrorOutlineIcon } from '@/components/ui/Icons';
import { canEditAddress, canPay, hasAddress } from '@/lib/payment';


const PAGE = 'mx-auto w-full max-w-[1120px] flex-1 px-margin-mobile py-lg md:px-margin-tablet lg:px-8 lg:py-xl';
const CARD = 'rounded-[20px] border border-border bg-surface p-4 sm:p-6';
// Same frame for every card on this page: Item, Delivery address, Progress, History, Review.
const ORDER_CARD = 'min-w-0 rounded-[20px] border border-border bg-surface p-4 sm:p-6';
const CARD_TITLE = 'text-[18px] font-semibold leading-tight text-text';
// 48px buttons shared by "Order placed" and the ribbon.
const BTN = 'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto';
const BTN_PRIMARY = `${BTN} bg-primary text-on-primary hover:bg-primary-hover focus-visible:ring-primary`;
const BTN_SECONDARY = `${BTN} border-[1.5px] border-border bg-surface text-text hover:bg-surface-muted focus-visible:ring-primary`;
const TEXT_LINK = 'inline-flex min-h-11 items-center rounded-lg px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

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
  // "View order" / "Pay now" on the confirmation switch to the detail view in place.
  const [placed, setPlaced] = useState(() => searchParams.get('placed') === '1');
  // Read once, like `placed`. pay=1 (from "Pay online now" at checkout) opens payment as soon as the order loads.
  const autoPay = useRef(searchParams.get('pay') === '1');
  // "Arrange with seller" lands on "Order placed" with the store's contact details.
  const [viaSeller] = useState(() => searchParams.get('placed') === '1' && searchParams.get('pay') !== '1');
  const { token, user, ready, logout } = useAuth();
  const { requestLogin } = useWishlist();
  const client = useQueryClient();
  const buyer = Boolean(token) && user?.role?.toUpperCase() === 'BUYER';
  const queryKey = ['order', orderId, token];
  const query = useQuery({ queryKey, queryFn: () => getOrder(token, orderId), enabled: ready && buyer, retry: false });
  // One payment flow for both views, so a payment started on "Order placed" continues on the detail.
  const realPayment = useOrderPayment({
    order: query.data,
    token,
    refresh: () => {
      query.refetch();
      client.invalidateQueries({ queryKey: ['orders-page'] });
    },
  });
  const order = query.data;
  const payment = realPayment;
  // Add / Edit address dialog, opened from the address card, the ribbon notice or "Order placed".
  const [addressOpen, setAddressOpen] = useState(false);
  const openAddress = () => setAddressOpen(true);

  function showDetail() {
    setPlaced(false);
    window.scrollTo({ top: 0 });
  }
  // Expired/invalid session: clear it once; the new (null) token disables the query, so this runs once.
  const unauthorized = query.isError && query.error?.status === 401;

  useEffect(() => {
    if (unauthorized) logout();
  }, [unauthorized, logout]);

  useEffect(() => {
    if (searchParams.has('placed')) router.replace(pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  useEffect(() => {
    if (!autoPay.current || !order) return;
    autoPay.current = false;
    queueMicrotask(() => {
      if (!canPay(order) || !hasAddress(order) || payment.unavailable) return;
      showDetail();
      payment.pay();
    });
  });

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
  } else if (placed) {
    body = (
      <PlacedView
        order={order}
        payment={payment}
        contact={viaSeller}
        onEditAddress={openAddress}
        onViewOrder={showDetail}
        onPay={() => {
          showDetail();
          payment.pay();
        }}
      />
    );
  } else {
    body = (
      <OrderDetail order={order} payment={payment} queryKey={queryKey} onReload={() => query.refetch()} onEditAddress={openAddress} />
    );
  }

  return (
    <main className={PAGE}>
      {body}
      {addressOpen && buyer && order && (
        <AddressDialog
          order={order}
          onClose={() => setAddressOpen(false)}
          onSaved={(updated) => {
            // Same shape as GET /orders/:id, so the page (and Pay now) update at once.
            if (updated) client.setQueryData(queryKey, updated);
            client.invalidateQueries({ queryKey: ['orders-page'] });
          }}
          onConflict={() => query.refetch()}
        />
      )}
    </main>
  );
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

function PlacedView({ order, payment, contact, onEditAddress, onViewOrder, onPay }) {
  const item = orderItem(order);
  const heading = useRef(null);
  useEffect(() => heading.current?.focus(), []);
  const payable = canPay(order);
  const addressed = hasAddress(order);
  const payNow = payable && addressed && !payment.unavailable;
  // Why online payment is off (no address, 503), shown above "View order".
  const notice = payable && !payNow ? paymentNotice(order, payment, 'placed-pay-note', { onAddAddress: onEditAddress }) : null;

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-6 py-2 text-center sm:py-4">
      <span className="flex size-16 items-center justify-center rounded-full bg-secondary-tint text-text">
        <CheckIcon className="size-7" />
      </span>
      <div className="flex min-w-0 flex-col items-center gap-2">
        <h1 ref={heading} tabIndex={-1} className="text-[28px] font-semibold leading-tight text-text outline-none md:text-[32px]">
          Order placed
        </h1>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-base font-semibold tabular-nums text-text">{orderLabel(order)}</span>
          <OrderStatusBadge status={order.status} />
          <PaymentBadge order={order} />
        </div>
        <p className="text-sm tabular-nums text-text-secondary">
          <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
        </p>
      </div>

      <section aria-label="Order summary" className={`${CARD} w-full text-left`}>
        <div className="flex items-center gap-4">
          <OrderThumb src={item.photo} alt={item.name} sizes="80px" className="size-20 shrink-0 rounded-2xl" />
          <div className="min-w-0">
            <p className="break-words text-base font-semibold text-text">{item.name}</p>
            {item.size && <p className="mt-1 text-sm text-text-secondary">Size {sizeLabel(item.size)}</p>}
            <p className="mt-1 text-sm font-semibold tabular-nums text-text">{formatRupiah(item.price)}</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4">
          <span className="text-base text-text">Total</span>
          <span className="text-[22px] font-semibold tabular-nums text-text">{formatRupiah(order.total ?? item.price)}</span>
        </div>
      </section>

      {notice && <div className="w-full text-left">{notice}</div>}

      {contact && payable && (
        <section aria-labelledby="next-step-title" className={`${CARD} w-full text-left`}>
          <h2 id="next-step-title" className={CARD_TITLE}>Next step</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Message the store to agree on payment and shipping cost. Mention order{' '}
            <span className="font-semibold tabular-nums text-text">{orderLabel(order)}</span>.
          </p>
          <p className="mt-3 text-base">
            <EmailLink />
          </p>
          <p className="mt-3 text-[13px] text-text-secondary">Your piece is reserved while the order is Pending.</p>
        </section>
      )}

      {/* At most two buttons. Pay now (when possible) is the main one; otherwise View order is. */}
      <div className="flex w-full flex-col gap-3 sm:flex-row-reverse sm:justify-center">
        {payNow && (
          <button type="button" onClick={onPay} className={BTN_PRIMARY}>
            Pay now
          </button>
        )}
        <button type="button" onClick={onViewOrder} className={payNow ? BTN_SECONDARY : BTN_PRIMARY}>
          View order
        </button>
      </div>

      <nav aria-label="More" className="-mt-2 flex flex-wrap items-center justify-center gap-x-2">
        <Link href="/orders" className={TEXT_LINK}>My orders</Link>
        <span aria-hidden="true" className="text-border">|</span>
        <Link href="/catalog" className={TEXT_LINK}>Continue shopping</Link>
      </nav>
    </div>
  );
}

function OrderDetail({ order, payment, queryKey, onReload, onEditAddress }) {
  const item = orderItem(order);
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const canCancel = order.status === 'PENDING';
  // Pay now stays on screen (disabled) when there is no address or payment is unavailable (503),
  // so the layout does not jump; the info row under the buttons says why.
  const payable = canPay(order);
  const addressed = hasAddress(order);
  const payBlocked = !addressed || payment.unavailable;
  const notice = paymentNotice(order, payment, 'pay-note', { onAddAddress: onEditAddress });
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
    <div className="flex flex-col gap-6">
      <OrderBackBar href={backHref} label={numbered ? label : ''} />

      {/* md and up: the Back button is the only way back (no breadcrumb). */}
      <div className="hidden md:flex">
        <OrderBackButton href={backHref} />
      </div>

      <header className="-mt-2 md:mt-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="break-words text-[28px] font-semibold leading-tight tabular-nums text-text md:text-[32px]">
            {numbered ? `Order ${label}` : 'Order'}
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1.5 text-sm tabular-nums text-text-secondary">
          Placed <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
        </p>
      </header>

      <OrderStatusRibbon
        order={order}
        total={total}
        canCancel={canCancel}
        payable={payable && !payBlocked}
        actions={
          payable || canCancel ? (
            <>
              {payable && <PayNowButton busy={payment.busy} disabled={payBlocked} onPay={payment.pay} />}
              {canCancel && <CancelOrder order={order} queryKey={queryKey} onReload={onReload} onNotice={setCancelNotice} />}
            </>
          ) : null
        }
        note={notice}
      />

      {/* DOM order = mobile order: progress, item, address, history, review. From md: item, address
          and review stacked on the left (7/12), progress on the right (5/12), sticky from lg; its
          wrapper stretches to the row height so the sticky card can travel. */}
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
        <div className={`min-w-0 md:col-span-5 md:col-start-8 md:row-start-1 md:self-stretch ${progressHiddenOnMobile ? 'max-lg:hidden' : ''}`}>
          <section aria-labelledby="progress-title" className={`${ORDER_CARD} lg:sticky lg:top-24`}>
            <h2 id="progress-title" className={CARD_TITLE}>Order progress</h2>
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
            <div className="mt-5 hidden border-t border-border pt-4 lg:block">
              <h3 className="text-base font-semibold text-text">Status history</h3>
              <div className="mt-3">
                <OrderTimeline history={history} />
              </div>
            </div>

            {cancelNotice && (
              <div role="alert" className="mt-4">
                <PaymentNoticeRow tone="error" title={cancelNotice} />
              </div>
            )}
          </section>
        </div>

        {/* When the progress card is hidden below lg, the left column takes the full md width. */}
        <div className={`flex min-w-0 flex-col gap-6 md:col-start-1 md:row-start-1 lg:col-span-7 ${progressHiddenOnMobile ? 'md:col-span-12' : 'md:col-span-7'}`}>
          <BuyerOrderItem item={item} productId={productId} fromPath={`/orders/${order._id}`} />

          <BuyerShippingAddress address={order.shippingAddress} canEdit={canEditAddress(order)} onEdit={onEditAddress} />

          {/* Below lg the history is its own card (from lg it is in the progress card). */}
          <section aria-labelledby="history-title" className={`${ORDER_CARD} lg:hidden`}>
            <h2 id="history-title" className={CARD_TITLE}>Status history</h2>
            <div className="mt-4">
              <OrderTimeline history={history} />
            </div>
          </section>

          <section aria-label="Review" className={ORDER_CARD}>
            {order.product?._id ? (
              <ProductReviews product={order.product} order={order} />
            ) : (
              <p className="text-sm text-text-secondary">This product was removed, so it can’t be reviewed.</p>
            )}
          </section>
        </div>
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
    <>
      <button
        type="button"
        onClick={() => { setDialogError(''); onNotice(''); setOpen(true); }}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-error bg-transparent px-5 text-sm font-semibold text-error transition-colors duration-150 hover:bg-error-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto"
      >
        <CloseIcon className="size-4 shrink-0" />
        Cancel order
      </button>

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
              className="buyer-control flex min-h-12 items-center justify-center rounded-md bg-error px-md py-3 text-body-md font-semibold text-on-primary hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            >
              {busy ? 'Cancelling…' : 'Cancel order'}
            </button>
          </div>
        </ActionDialog>
      )}
    </>
  );
}

function PayNowButton({ busy, disabled, onPay }) {
  return (
    <button
      type="button"
      onClick={onPay}
      disabled={busy || disabled}
      aria-busy={busy}
      aria-describedby={disabled ? 'pay-note' : undefined}
      className={`relative ${BTN} focus-visible:ring-primary ${disabled ? 'cursor-not-allowed bg-border text-text-secondary' : `bg-primary text-on-primary ${busy ? 'cursor-wait' : 'hover:bg-primary-hover'}`
        }`}
    >
      {/* The label keeps the button width while the dots show. */}
      <span className={busy ? 'invisible' : undefined}>Pay now</span>
      {busy && <LoadingDots className="absolute inset-0 justify-center" />}
    </button>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading order" className="flex flex-col gap-6">
      <Skeleton className="hidden h-11 w-56 rounded-full md:block" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
      {/* Ribbon: below sm it stacks status, total and the full-width Pay now / Cancel buttons. */}
      <Skeleton className="h-[296px] w-full rounded-[20px] sm:h-[196px]" />
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
        <div className={`${ORDER_CARD} md:col-span-5 md:col-start-8 md:row-start-1`}>
          <Skeleton className="h-6 w-36 rounded" />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="mt-4 h-8 w-40 max-w-full rounded" />)}
        </div>
        <div className="flex min-w-0 flex-col gap-6 md:col-span-7 md:col-start-1 md:row-start-1">
          <div className={`${ORDER_CARD} flex gap-4 pt-[52px] sm:pt-[60px]`}>
            <Skeleton className="size-24 shrink-0 rounded-2xl md:size-32" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-6 w-1/3 rounded-full" />
              <Skeleton className="h-5 w-1/4 rounded" />
            </div>
          </div>
          <Skeleton className="h-[236px] rounded-[20px]" />
          <Skeleton className="h-40 rounded-[20px]" />
        </div>
      </div>
    </div>
  );
}
