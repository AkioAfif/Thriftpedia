'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import OrderStatusPanel from './OrderStatusPanel';
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
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]';
const cardCls = 'rounded-[20px] border border-[#e8e1d8] bg-white p-5 sm:p-7';

function Breadcrumb({ backHref, current }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-[#6E5D4F]">
        <li>
          <Link href={backHref} className={`rounded hover:text-[#2b1d14] hover:underline ${focusRing}`}>
            Order Management
          </Link>
        </li>
        <li aria-hidden="true">›</li>
        <li aria-current="page" className="min-w-0 truncate text-[#2b1d14]">
          {current}
        </li>
      </ol>
    </nav>
  );
}

function StateMessage({ title, children, action }) {
  return (
    <div className={`${cardCls} px-6 py-16 text-center`}>
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
      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="h-72 animate-pulse rounded-[20px] bg-[#efe9e0]" />
        <div className="h-96 animate-pulse rounded-[20px] bg-[#efe9e0]" />
      </div>
    </div>
  );
}

// Falls back to a plain tile when there is no photo or the image fails to load.
function ItemPhoto({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span
        role="img"
        aria-label="No photo"
        className="flex aspect-[4/5] w-28 shrink-0 items-center justify-center rounded-xl bg-[#efe9e0] text-xs text-[#6E5D4F] sm:w-36"
      >
        No photo
      </span>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="aspect-[4/5] w-28 shrink-0 rounded-xl bg-[#efe9e0] object-cover sm:w-36"
    />
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
  const subline = [item.brand, item.size ? sizeLabel(item.size) : null].filter(Boolean).join(' · ');

  return (
    <div>
      <Breadcrumb backHref={backHref} current={order.orderNumber ? `Order ${order.orderNumber}` : 'Order'} />
      <h1 className="mt-4 break-words text-3xl font-semibold tabular-nums text-[#2b1d14] sm:text-4xl">
        Order {orderLabel(order)}
      </h1>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section aria-labelledby="order-item-title" className={`${cardCls} lg:col-start-1 lg:row-start-1`}>
          <h2 id="order-item-title" className="text-xl font-semibold text-[#2b1d14]">
            Item
          </h2>
          <div className="mt-5 flex gap-4 sm:gap-6">
            <ItemPhoto src={item.photo} alt={item.name} />
            <div className="min-w-0 flex-1 pt-1">
              <p className="break-words text-lg font-semibold text-[#2b1d14] sm:text-xl">{item.name}</p>
              {subline && <p className="mt-2 break-words text-sm text-[#6E5D4F]">{subline}</p>}
              <p className="mt-4 text-lg font-semibold tabular-nums text-[#2b1d14] sm:text-xl">
                {item.price == null ? '—' : formatRupiah(item.price)}
              </p>
            </div>
          </div>
        </section>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <OrderStatusPanel key={`${order.status}-${order.updatedAt}`} order={order} onSubmit={changeStatus} />
        </div>

        <section aria-labelledby="order-buyer-title" className={`${cardCls} lg:col-start-1 lg:row-start-2`}>
          <h2 id="order-buyer-title" className="text-xl font-semibold text-[#2b1d14]">
            Buyer
          </h2>
          <p className="mt-5 break-words font-semibold text-[#2b1d14]">{buyer.name ?? 'Deleted account'}</p>
          {order.buyer === null && buyer.name && (
            <p className="mt-0.5 text-xs text-[#6E5D4F]">Account has since been deleted</p>
          )}
          <p className="mt-2 break-all text-sm text-[#6E5D4F]">{buyer.email ?? 'No email on record'}</p>
        </section>

        <section
          aria-label="Order total"
          className={`${cardCls} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:col-span-2`}
        >
          <div>
            <p className="text-sm text-[#6E5D4F]">Order total</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-[#2b1d14]">
              {order.total == null ? '—' : formatRupiah(order.total)}
            </p>
          </div>
          <p className="text-sm tabular-nums text-[#6E5D4F]">
            Placed <time dateTime={order.createdAt}>{formatOrderDateTime(order.createdAt)}</time>
          </p>
        </section>
      </div>
    </div>
  );
}
