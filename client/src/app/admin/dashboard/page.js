'use client';

import AddProductFab from '@/components/admin/AddProductFab';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { InventoryPanel } from '@/components/admin/dashboard/InventoryPanel';
import { OrderPipeline } from '@/components/admin/dashboard/OrderPipeline';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { useDashboardData } from '@/components/admin/dashboard/useDashboardData';

// Answers "what should I do now?": a one-line headline, the order pipeline, then recent
// orders and stock. Summary and order requests load in parallel; each section shows its own
// skeleton/error. Below md: 16px sides, 20px between sections, 88px clear of the floating
// "Add product" button. From md: 32px between sections, recent orders 8/12 + inventory 4/12.
export default function DashboardPage() {
  const { summary, orders } = useDashboardData();

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 pb-[88px] max-md:-mx-2 max-md:w-auto md:space-y-8 md:pb-0">
      <DashboardHeader orders={orders} summary={summary} />
      <OrderPipeline section={orders} />
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-12 md:gap-6">
        <div className="min-w-0 md:col-span-8">
          <RecentOrders section={orders} />
        </div>
        <div className="min-w-0 md:col-span-4">
          <InventoryPanel section={summary} />
        </div>
      </div>
      <AddProductFab />
    </div>
  );
}
