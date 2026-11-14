import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { focusRing, formatCount } from './shared';

// The shop runs on Jakarta time, like the order pages.
const todayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

const orders = (n, rest) => `${formatCount(n)} ${n === 1 ? 'order is' : 'orders are'} ${rest}`;

// One sentence from real data: the most urgent open step first (Pending, then Processing,
// then Shipped); when nothing is open, how many pieces are on sale.
function headline(counts, products) {
  const pending = Number(counts.PENDING) || 0;
  const processing = Number(counts.PROCESSING) || 0;
  const shipped = Number(counts.SHIPPED) || 0;
  if (pending > 0) return orders(pending, 'waiting to be processed.');
  if (processing > 0) return orders(processing, 'ready to ship.');
  if (shipped > 0) return orders(shipped, 'in transit.');
  if (!products) return 'You’re all caught up.';
  const available = Number(products.available) || 0;
  return `You’re all caught up. ${formatCount(available)} ${available === 1 ? 'piece is' : 'pieces are'} on sale.`;
}

export function DashboardHeader({ orders: orderSection, summary }) {
  const ready = orderSection.status === 'ready';
  const loading = orderSection.status === 'loading' || (ready && summary.status === 'loading');
  const sentence = ready ? headline(orderSection.data?.counts ?? {}, summary.status === 'ready' ? summary.data?.products : null) : '';

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[13px] text-[#6F6358]">{todayFormat.format(new Date())} WIB</p>
        <h1 className="mt-1 text-[28px] font-semibold leading-[1.2] text-[#2B2118] md:text-[36px]">Dashboard</h1>
        {/* Fixed line height while loading, so the page does not jump when the sentence arrives. */}
        <div className="mt-1.5 min-h-7">
          {loading ? (
            <Skeleton className="h-6 w-72 max-w-full rounded" />
          ) : (
            sentence && (
              <p aria-live="polite" className="text-[16px] text-[#2B2118] md:text-[18px]">
                {sentence}
              </p>
            )
          )}
        </div>
      </div>
      <Link
        href="/admin/products/new"
        className={cn(
          'hidden min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#B5532E] px-5 text-sm font-semibold text-white hover:bg-[#9C4425] md:inline-flex',
          focusRing
        )}
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add product
      </Link>
    </header>
  );
}
