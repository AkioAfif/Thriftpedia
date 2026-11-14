'use client';

import AddProductFab from '@/components/admin/AddProductFab';
import { DashboardHeader } from '@/components/admin/dashboard/DashboardHeader';
import { InventoryPanel } from '@/components/admin/dashboard/InventoryPanel';
import { NeedsAttention } from '@/components/admin/dashboard/NeedsAttention';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { useDashboardData } from '@/components/admin/dashboard/useDashboardData';

// Answers "what should I do now?": open order work first, then recent orders and stock.
// Summary and order requests load in parallel; each section shows its own skeleton/error.
// Below md: 16px side padding (main's 24px minus 8), 20px between sections, and 88px at the
// bottom so the floating "Add product" button never covers the last card.
export default function DashboardPage() {
  const { adminName, summary, orders } = useDashboardData();

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-5 pb-[88px] max-md:-mx-2 max-md:w-auto md:space-y-8 md:pb-0">
      <DashboardHeader adminName={adminName} />
      <NeedsAttention section={orders} />
      <div className="grid grid-cols-1 items-start gap-4 md:gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <RecentOrders section={orders} />
        <InventoryPanel section={summary} />
      </div>
      <AddProductFab />
    </div>
  );
}
