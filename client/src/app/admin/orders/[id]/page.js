import { Suspense } from 'react';
import OrderDetailView from '@/components/admin/orders/OrderDetailView';

export const metadata = { title: 'Order Detail | Thriftpedia' };

// OrderDetailView reads the `back` query param, so it renders inside a Suspense boundary.
export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div aria-busy="true">
          <span className="sr-only">Loading order</span>
          <div className="h-10 w-64 animate-pulse rounded-lg bg-[#efe9e0]" />
        </div>
      }
    >
      <OrderDetailView />
    </Suspense>
  );
}
