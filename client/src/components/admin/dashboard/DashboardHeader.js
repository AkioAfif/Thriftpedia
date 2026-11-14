import Link from 'next/link';
import { cn } from '@/lib/utils';
import { focusRing } from './shared';

// The shop runs on Jakarta time, like the order pages.
const todayFormat = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

// Below md: 28px title with a tight greeting/date block; "Add product" moves to the floating button.
export function DashboardHeader({ adminName }) {
  const firstName = adminName.trim().split(/\s+/)[0];
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[28px] font-semibold leading-[1.2] text-text md:text-4xl md:leading-10">Dashboard</h1>
        <p className="mt-1 text-[15px] text-[#6F6358] md:mt-2">
          {firstName ? `Hi ${firstName}, here's what needs you today.` : "Here's what needs you today."}
          <span className="mt-0.5 block text-[13px] text-[#6F6358] md:mt-1">{todayFormat.format(new Date())} WIB</span>
        </p>
      </div>
      <Link
        href="/admin/products/new"
        className={cn(
          'hidden min-h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover md:inline-flex',
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
