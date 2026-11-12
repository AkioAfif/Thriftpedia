'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import OrderStatusBadge from './OrderStatusBadge';
import OrderStatusPanel from './OrderStatusPanel';
import OrderTimeline from './OrderTimeline';
import { ChevronLeftIcon } from '../icons';
import { clearToken } from '@/lib/adminAuth';
import {
  fetchOrder,
  formatOrderDateTime,
  orderBuyer,
  orderItem,
  orderLabel,
  orderQueryToSearch,
  parseOrderQuery,
  updateOrderStatus,
} from '@/lib/adminOrders';
import { conditionLabel, formatRupiah, sizeLabel } from '@/lib/adminProducts';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]';
const sectionCls = 'rounded-[20px] border border-[#e8e1d8] bg-white p-5 sm:p-6';

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#6E5D4F]">{label}</dt>
      <dd className="mt-1 break-words text-sm text-[#2b1d14]">{children}</dd>
    </div>
  );
}

function StateMessage({ title, children, action }) {
  return (
    <div className={`${sectionCls} px-6 py-16 text-center`}>
      <p className="text-lg font-semibold text-[#2b1d14]">{title}</p>
      <p className="mx-auto mt-2 max-w-[28rem] text-sm text-[#6E5D4F]">{children}</p>
      {action}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading order</span>
      <div className="h-10 w-64 animate-pulse rounded-lg bg-[#efe9e0]" />
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="h-96 animate-pulse rounded-[20px] bg-[#efe9e0]" />
        <div className="h-72 animate-pulse rounded-[20px] bg-[#efe9e0]" />
      </div>
    </div>
  );
}

export default function OrderDetailView() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState({ status: 'loading', order: null, error: null });
  const [attempt, setAttempt] = useState(0);

  // Only a sanitised list query is accepted, so "back" can never point anywhere else.
  const backSearch = orderQueryToSearch(parseOrderQuery(new URLSearchParams(searchParams.get('back') ?? '')));
  const backHref = backSearch ? `/admin/orders?${backSearch}` : '/admin/orders';

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status !== 401) return false;
      clearToken();
      router.replace('/login');
      return true;
    },
    [router]
  );

  useEffect(() => {
    let active = true;
    fetchOrder(id)
      .then((order) => {
        if (active) setState({ status: 'ready', order, error: null });
      })
      .catch((err) => {
        if (!active || handleAuthError(err)) return;
        setState({ status: 'error', order: null, error: err });
      });
    return () => {
      active = false;
    };
  }, [id, attempt, handleAuthError]);

  const reload = () => {
    setState((s) => (s.order ? s : { status: 'loading', order: null, error: null }));
    setAttempt((n) => n + 1);
  };

  async function changeStatus(payload, action) {
    try {
      const updated = await updateOrderStatus(id, payload);
      setState({ status: 'ready', order: updated, error: null });
      toast.success(action.done);
      return true;
    } catch (err) {
      if (handleAuthError(err)) return false;
      if (err.status === 403 || err.status === 404) {
        setState({ status: 'error', order: null, error: err });
        return false;
      }
      toast.error(err.message);
      // 409: someone else moved this order first. Show the current truth.
      if (err.status === 409) reload();
      return false;
    }
  }

  const back = (
    <Link
      href={backHref}
      className={`inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-medium text-[#6E5D4F] hover:text-[#2b1d14] ${focusRing}`}
    >
      <ChevronLeftIcon width={16} height={16} />
      Back to orders
    </Link>
  );

  if (state.status === 'loading') {
    return (
      <div>
        {back}
        <div className="mt-4">
          <DetailSkeleton />
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    const { status, message } = state.error ?? {};
    const notFound = status === 404 || status === 400;
    return (
      <div>
        {back}
        <div className="mt-4">
          {status === 403 ? (
            <StateMessage title="Access denied">Only admin accounts can view and manage orders.</StateMessage>
          ) : notFound ? (
            <StateMessage title="Order not found">
              This order doesn&apos;t exist or the link is wrong. Go back to the list and pick it again.
            </StateMessage>
          ) : (
            <StateMessage
              title="Couldn't load this order"
              action={
                <button
                  type="button"
                  onClick={reload}
                  className={`mt-5 min-h-[40px] rounded-xl bg-[#a3452a] px-5 text-sm font-semibold text-white hover:bg-[#8f3b23] ${focusRing}`}
                >
                  Try again
                </button>
              }
            >
              {message}
            </StateMessage>
          )}
        </div>
      </div>
    );
  }

  const { order } = state;
  const item = orderItem(order);
  const buyer = orderBuyer(order);
  const productStatus = order.product?.status;

  return (
    <div>
      {back}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <h1 className="text-3xl font-semibold tabular-nums sm:text-4xl">Order {orderLabel(order)}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-2 text-sm text-[#6E5D4F]">
        Placed <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
      </p>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <section aria-labelledby="order-item-title" className={sectionCls}>
            <h2 id="order-item-title" className="text-lg font-semibold text-[#2b1d14]">
              Item
            </h2>
            <div className="mt-4 flex gap-4">
              {item.photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={item.photo} alt={item.name} className="h-32 w-24 shrink-0 rounded-xl bg-[#efe9e0] object-cover" />
              ) : (
                <span aria-hidden="true" className="h-32 w-24 shrink-0 rounded-xl bg-[#efe9e0]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-[#2b1d14]">{item.name}</p>
                {item.brand && <p className="text-sm text-[#6E5D4F]">{item.brand}</p>}
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <Field label="Size">{item.size ? sizeLabel(item.size) : '—'}</Field>
                  <Field label="Condition">{item.condition ? conditionLabel(item.condition) : '—'}</Field>
                  <Field label="Price">
                    <span className="font-mono tabular-nums">{item.price == null ? '—' : formatRupiah(item.price)}</span>
                  </Field>
                </dl>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[#efe9e0] pt-4">
              <span className="text-sm font-semibold text-[#2b1d14]">Order total</span>
              <span className="font-mono text-lg font-semibold tabular-nums text-[#2b1d14]">
                {order.total == null ? '—' : formatRupiah(order.total)}
              </span>
            </div>
            {productStatus && (
              <p className="mt-3 text-xs text-[#6E5D4F]">
                Product is currently {productStatus === 'SOLD' ? 'sold' : 'available'} in the catalog. This follows the
                order automatically.
              </p>
            )}
          </section>

          <section aria-labelledby="order-buyer-title" className={sectionCls}>
            <h2 id="order-buyer-title" className="text-lg font-semibold text-[#2b1d14]">
              Buyer &amp; shipping
            </h2>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Buyer">
                {buyer.name ?? 'Deleted account'}
                {order.buyer === null && buyer.name && (
                  <span className="block text-xs text-[#6E5D4F]">Account has since been deleted</span>
                )}
              </Field>
              <Field label="Email">{buyer.email ?? '—'}</Field>
              <Field label="Courier">{order.courier || '—'}</Field>
              <Field label="Tracking number">
                {order.trackingNumber ? (
                  <span className="font-mono">{order.trackingNumber}</span>
                ) : (
                  <span className="text-[#6E5D4F]">Added when the order ships</span>
                )}
              </Field>
            </dl>
          </section>
        </div>

        <div className="space-y-5 lg:sticky lg:top-6">
          <OrderStatusPanel key={`${order.status}-${order.updatedAt}`} order={order} onSubmit={changeStatus} />
          <OrderTimeline history={order.statusHistory} />
        </div>
      </div>
    </div>
  );
}
