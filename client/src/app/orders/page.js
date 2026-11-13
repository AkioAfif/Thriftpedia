'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/BuyerContext';
import { getOrders } from '@/lib/services/orderService';

export default function OrdersPage() {
  const { token, user, ready } = useAuth();
  const { requestLogin } = useWishlist();
  const buyer = Boolean(token) && user?.role?.toUpperCase() === 'BUYER';
  const query = useQuery({ queryKey: ['orders', token], queryFn: () => getOrders(token), enabled: ready && buyer, retry: false });
  return <main className="buyer-page"><h1 className="headline-mobile lg:headline-lg">Your orders</h1>
    {!ready ? <p role="status">Loading…</p> : !token ? <button className="buyer-primary" onClick={requestLogin}>Log in to view your orders</button> : !buyer ? <p>Order history is available for buyer accounts.</p> : query.isPending ? <p role="status">Loading orders…</p> : query.isError ? <div role="alert"><p>! {query.error.message}</p><button className="buyer-secondary mt-md" onClick={() => query.refetch()}>Try again</button></div> : query.data.length ? <ul className="space-y-md">{query.data.map((order) => <li key={order._id} className="card space-y-md"><p className="label-md text-text-secondary">{order.status}</p><h2 className="headline-sm">{order.product?.name || 'Product unavailable'}</h2><Link className="buyer-secondary w-fit" href={`/orders/${order._id}`}>View order</Link></li>)}</ul> : <p>No orders yet.</p>}
  </main>;
}
