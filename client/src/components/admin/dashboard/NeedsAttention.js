import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { statusMeta } from '@/lib/orderView';
import { cn } from '@/lib/utils';
import { focusRing, formatCount, SectionError, SectionHeading } from './shared';

// In order-flow sequence. /admin/orders reads ?status= (parseOrderQuery), so each links to its tab.
const STEPS = [
  { status: 'PENDING', task: 'Ready to process', action: 'Process orders' },
  { status: 'PROCESSING', task: 'Ready to ship', action: 'Ship orders' },
  { status: 'SHIPPED', task: 'Waiting for delivery', action: 'Track shipments' },
];

// Solid tint per status (card) plus a saturated badge: white on statusMeta's own text colour
// (#6B4C0C / #8F3B23 / #1F4B66), all above 7:1. Text on every tint stays at or above 4.8:1.
const TINTS = {
  PENDING: { card: 'bg-[#FBF1D4] border-[#EBD596]', badge: 'bg-[#6B4C0C] text-white' },
  PROCESSING: { card: 'bg-[#FBE6DC] border-[#EBC3AE]', badge: 'bg-[#8F3B23] text-white' },
  SHIPPED: { card: 'bg-badge-info border-[#B7D3E0]', badge: 'bg-[#1F4B66] text-white' },
};

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function AttentionItem({ status, task, action, count }) {
  const meta = statusMeta(status);
  const tint = TINTS[status];
  const idle = count === 0;
  return (
    <li>
      <Link
        href={`/admin/orders?status=${status}`}
        className={cn(
          'flex h-full min-h-11 flex-col gap-3 rounded-2xl p-5 hover:shadow-sm',
          tint.card,
          idle ? 'border' : 'border-2',
          focusRing
        )}
      >
        <span className={cn('w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold', tint.badge)}>
          {meta.label}
        </span>
        {idle ? (
          <span className="flex items-center gap-2 text-base font-medium text-text-secondary">
            <CheckIcon />
            All caught up
          </span>
        ) : (
          <span className="flex items-baseline gap-2">
            <span className="text-[36px] font-semibold leading-none tabular-nums text-text">{formatCount(count)}</span>
            <span className="text-sm text-text">{task.toLowerCase()}</span>
          </span>
        )}
        <span className={cn('mt-auto text-sm font-semibold', idle ? 'text-text-secondary' : 'text-primary')}>
          {idle ? (
            `No ${meta.label.toLowerCase()} orders`
          ) : (
            <>
              {action} <span aria-hidden="true">→</span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

export function NeedsAttention({ section }) {
  const counts = section.data?.counts ?? {};
  return (
    <section aria-labelledby="needs-attention-title">
      <SectionHeading id="needs-attention-title" title="Needs attention" />
      {section.status === 'error' ? (
        <SectionError className="mt-4" message={section.error} onRetry={section.retry} />
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STEPS.map((step) =>
            section.status === 'loading' ? (
              <li key={step.status}>
                <Skeleton className="h-[148px] rounded-2xl" />
              </li>
            ) : (
              <AttentionItem key={step.status} {...step} count={Number(counts[step.status]) || 0} />
            )
          )}
        </ul>
      )}
    </section>
  );
}
