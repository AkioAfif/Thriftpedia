'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/BuyerContext';
import { getOrder } from '@/lib/services/orderService';
import { formatPrice } from '@/lib/utils';
import { ProductReviews } from '@/components/reviews/ProductReviews';

export default function OrderPage({ params }) {
  const { orderId } = use(params);
  const { token, user, ready } = useAuth();
  const { requestLogin } = useWishlist();
  const buyer = Boolean(token) && user?.role?.toUpperCase() === 'BUYER';
  const query = useQuery({ queryKey: ['order', orderId, token], queryFn: () => getOrder(token, orderId), enabled: ready && buyer, retry: false });
  return <main className="buyer-page"><Link className="buyer-control inline-flex min-h-11 items-center body-sm" href="/orders">← Your orders</Link><h1 className="headline-mobile lg:headline-lg">Order detail</h1>
    {!ready ? <p role="status">Loading…</p> : !token ? <button className="buyer-primary" onClick={requestLogin}>Log in to view this order</button> : !buyer ? <p>This order is available for its buyer.</p> : query.isPending ? <p role="status">Loading order…</p> : query.isError ? <div role="alert"><p>! {query.error.message}</p><button className="buyer-secondary mt-md" onClick={() => query.refetch()}>Try again</button></div> : query.data && <>
      <span className="label-md inline-block rounded-full bg-badge-neutral px-2.5 py-1">{query.data.status}</span><h2 className="headline-sm">{query.data.product?.name || 'Product unavailable'}</h2><p className="body-sm text-text-secondary">Order {query.data._id}</p>
      {query.data.product && <><p className="price">{formatPrice(query.data.product.price)}</p><ProductReviews product={query.data.product} order={query.data} /></>}
    </>}
  </main>;
}
