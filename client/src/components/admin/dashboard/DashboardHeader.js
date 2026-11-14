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

export function DashboardHeader({ adminName }) {
  const firstName = adminName.trim().split(/\s+/)[0];
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Dashboard</h1>
        <p className="mt-2 text-base text-text-secondary">
          {firstName ? `Hi ${firstName}, here's what needs you today.` : "Here's what needs you today."}
          <span className="mt-1 block font-metadata text-sm">{todayFormat.format(new Date())} WIB</span>
        </p>
      </div>
      <Link
        href="/admin/products/new"
        className={cn(
          'inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover',
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
