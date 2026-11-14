'use client';

import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { InventoryPanel } from '@/components/admin/dashboard/InventoryPanel';
import { NeedsAttention } from '@/components/admin/dashboard/NeedsAttention';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { useDashboardData } from '@/components/admin/dashboard/useDashboardData';

// Answers "what should I do now?": open order work first, then recent orders and stock.
// Summary and order requests load in parallel; each section shows its own skeleton/error.
export default function DashboardPage() {
  const { adminName, summary, orders } = useDashboardData();

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-8">
      <DashboardHeader adminName={adminName} />
      <NeedsAttention section={orders} />
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <RecentOrders section={orders} />
        <InventoryPanel section={summary} />
      </div>
    </div>
  );
}
