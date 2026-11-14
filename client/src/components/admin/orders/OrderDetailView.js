'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import DetailCard from './DetailCard';
import OrderItemCard from './OrderItemCard';
import OrderStatusBadge from './OrderStatusBadge';
import OrderStatusPanel from './OrderStatusPanel';
import OrderSummaryRow from './OrderSummaryRow';
import OrderTimeline from './OrderTimeline';
import { useAuth } from '@/context/AuthContext';
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

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const cardCls = 'rounded-[20px] border border-[#D9CFC1] bg-white p-5 sm:p-7';
const pulse = 'animate-pulse rounded-[20px] bg-[#efe9e0]';

function Breadcrumb({ backHref, current }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-text-secondary">
        <li>
          <Link href={backHref} className={`rounded hover:text-text hover:underline ${focusRing}`}>
            Order Management
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li aria-current="page" className="min-w-0 truncate text-text">
          {current}
        </li>
      </ol>
    </nav>
  );
}

function StateMessage({ title, children, action }) {
  return (
    <div className={`${cardCls} px-6 py-16 text-center`}>
      <p className="text-lg font-semibold text-text">{title}</p>
      <p className="mx-auto mt-2 max-w-[28rem] text-sm text-text-secondary">{children}</p>
      {action}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading order</span>
      <div className="h-10 w-72 animate-pulse rounded-lg bg-[#efe9e0]" />
      <div className="mt-2 h-5 w-56 animate-pulse rounded-md bg-[#efe9e0]" />
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-28 ${pulse}`} />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className={`h-96 lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1 ${pulse}`} />
        <div className={`h-60 lg:col-span-7 lg:col-start-1 lg:row-start-1 ${pulse}`} />
        <div className={`h-72 lg:col-span-7 lg:col-start-1 lg:row-start-2 ${pulse}`} />
      </div>
    </div>
  );
}

export default function OrderDetailView() {
  const { id } = useParams();
  const router = useRouter();
  // Clears token, user and thriftpedia_token together, so the Navbar is logged out too.
  const { logout } = useAuth();
  const searchParams = useSearchParams();
  const [state, setState] = useState({ status: 'loading', order: null, error: null });
  const [attempt, setAttempt] = useState(0);

  // Only a sanitised list query is accepted, so the breadcrumb can never point anywhere else.
  const backSearch = orderQueryToSearch(parseOrderQuery(new URLSearchParams(searchParams.get('back') ?? '')));
  const backHref = backSearch ? `/admin/orders?${backSearch}` : '/admin/orders';

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status !== 401) return false;
      logout();
      router.replace('/login');
      return true;
    },
    [router, logout]
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

  if (state.status === 'loading') {
    return (
      <div>
        <Breadcrumb backHref={backHref} current="Order" />
        <div className="mt-6">
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
        <Breadcrumb backHref={backHref} current="Order" />
        <div className="mt-6">
          {status === 403 ? (
            <StateMessage title="Access denied">Only admin accounts can view and manage orders.</StateMessage>
          ) : notFound ? (
            <StateMessage title="Order not found">
              This order doesn&apos;t exist or the link is wrong. Go back to Order Management and pick it again.
            </StateMessage>
          ) : (
            <StateMessage
              title="Couldn't load this order"
              action={
                <button
                  type="button"
                  onClick={reload}
                  className={`mt-5 min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover ${focusRing}`}
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
  const label = orderLabel(order);

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <Breadcrumb backHref={backHref} current={order.orderNumber ? `Order ${label}` : 'Order'} />

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="break-words text-[32px] font-semibold leading-tight tabular-nums text-text">Order {label}</h1>
            <OrderStatusBadge status={order.status} size="lg" />
          </div>
          <p className="mt-1.5 text-sm tabular-nums text-text-secondary">
            Placed <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
          </p>
        </div>
        <Link
          href={backHref}
          className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-primary bg-white px-5 text-sm font-semibold text-primary hover:bg-[#FBE6DC] ${focusRing}`}
        >
          <span aria-hidden="true">←</span> Back to orders
        </Link>
      </header>

      <div className="mt-6">
        <OrderSummaryRow order={order} buyer={buyer} />
      </div>

      {/* DOM order = mobile order: progress, item, history. From lg the progress column moves right. */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
          <div className="space-y-4 lg:sticky lg:top-6">
            {order.status === 'CANCELLED' && (
              <p className="rounded-2xl border border-[#EBC3AE] bg-[#F7DDD6] px-5 py-4 text-sm font-medium text-[#8A2E1B]">
                This order was cancelled. The steps below show how far it got.
              </p>
            )}
            <OrderStatusPanel key={`${order.status}-${order.updatedAt}`} order={order} onSubmit={changeStatus} />
          </div>
        </div>

        <div className="min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-1">
          <OrderItemCard item={item} />
        </div>

        <div className="min-w-0 lg:col-span-7 lg:col-start-1 lg:row-start-2">
          <DetailCard titleId="order-history-title" title="Status history">
            <OrderTimeline history={order.statusHistory} />
          </DetailCard>
        </div>
      </div>
    </div>
  );
}
