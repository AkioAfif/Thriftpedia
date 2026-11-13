import { Suspense } from 'react';
import OrdersView from '@/components/admin/orders/OrdersView';

export const metadata = { title: 'Order Management | Thriftpedia' };

function OrdersFallback() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading orders</span>
      <div className="h-10 w-72 animate-pulse rounded-lg bg-[#efe9e0]" />
      <div className="mt-6 h-14 animate-pulse rounded-2xl bg-[#efe9e0]" />
      <div className="mt-4 h-12 animate-pulse rounded-xl bg-[#efe9e0]" />
      <div className="mt-4 h-80 animate-pulse rounded-[20px] bg-[#efe9e0]" />
    </div>
  );
}

// OrdersView reads the URL (useSearchParams), so it renders inside its own Suspense boundary.
export default function OrderManagementPage() {
  return (
    <Suspense fallback={<OrdersFallback />}>
      <OrdersView />
    </Suspense>
  );
}
