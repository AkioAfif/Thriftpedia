import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { formatCount, SectionError } from './shared';

// In order-flow sequence; /admin/orders reads ?status=, so each segment opens its tab.
const STEPS = [
  { status: 'PENDING', label: 'Pending', note: 'Ready to process' },
  { status: 'PROCESSING', label: 'Processing', note: 'Ready to ship' },
  { status: 'SHIPPED', label: 'Shipped', note: 'In transit' },
];

// Segments with orders use status tints; empty segments use surface and secondary text.
const TONE = {
  PENDING: { busy: 'bg-badge-warning hover:bg-badge-warning', ink: 'text-text' },
  PROCESSING: { busy: 'bg-primary-tint hover:bg-primary-tint', ink: 'text-primary' },
  SHIPPED: { busy: 'bg-badge-info hover:bg-badge-info', ink: 'text-text' },
};
const IDLE = 'bg-surface hover:bg-canvas';
const MUTED = 'text-text-secondary';

const hrefFor = (status) => `/admin/orders?status=${status}`;
const nameFor = (step, n) => `${step.label}: ${formatCount(n)} ${n === 1 ? 'order' : 'orders'}, ${step.note.toLowerCase()}`;
const linkFx =
  'group relative transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary motion-reduce:transition-none';

function Chevron() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-1/2 z-10 flex size-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface text-text-secondary"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-150 group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </span>
  );
}

function ClosedLine({ counts }) {
  return (
    <p className="mt-3 text-[13px] text-text-secondary">
      Completed <span className="font-semibold text-text">{formatCount(counts.COMPLETED)}</span>
      <span aria-hidden="true"> · </span>
      <span className="sr-only">, </span>
      Cancelled <span className="font-semibold text-text">{formatCount(counts.CANCELLED)}</span>
    </p>
  );
}

function AllClearCard() {
  return (
    <Link
      href="/admin/orders"
      className="flex min-h-14 items-center gap-2.5 rounded-xl border border-border bg-surface px-4 text-[15px] font-medium text-text hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--secondary)" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 12.5 4.5 4.5L19 7.5" />
      </svg>
      All caught up – no orders waiting
    </Link>
  );
}

// "Order pipeline": Pending > Processing > Shipped, each segment one link to its tab.
// md and up: one 112px bar of three joined segments with chevrons between them.
// Below md: three 56px rows (or one "All caught up" card when nothing is waiting).
export function OrderPipeline({ section }) {
  const counts = section.data?.counts ?? {};
  const items = STEPS.map((step) => ({ ...step, count: Number(counts[step.status]) || 0 }));
  const allClear = items.every((item) => item.count === 0);

  return (
    <section aria-labelledby="pipeline-title">
      <h2 id="pipeline-title" className="text-lg font-semibold text-text md:text-xl">
        Order pipeline
      </h2>

      {section.status === 'error' && <SectionError className="mt-4" message={section.error} onRetry={section.retry} />}

      {section.status === 'loading' && (
        <div aria-hidden="true" className="mt-3 md:mt-4">
          <div className="flex flex-col gap-2 md:hidden">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
          <Skeleton className="hidden h-[112px] rounded-[20px] md:block" />
          <Skeleton className="mt-3 h-4 w-48 rounded" />
        </div>
      )}

      {section.status === 'ready' && (
        <>
          {/* Below md */}
          <div className="mt-3 md:hidden">
            {allClear ? (
              <AllClearCard />
            ) : (
              <ul className="flex flex-col gap-2">
                {items.map((step) => (
                  <li key={step.status}>
                    <Link
                      href={hrefFor(step.status)}
                      aria-label={nameFor(step, step.count)}
                      className={cn(
                        'flex min-h-14 items-center justify-between gap-3 rounded-xl border border-border px-4',
                        linkFx,
                        step.count > 0 ? TONE[step.status].busy : IDLE
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-text">{step.label}</span>
                        <span className="block truncate text-[13px] text-text-secondary">{step.note}</span>
                      </span>
                      <span className={cn('text-[24px] font-semibold leading-none', step.count > 0 ? TONE[step.status].ink : MUTED)}>
                        {formatCount(step.count)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* md and up */}
          <ol className="mt-4 hidden h-[112px] grid-cols-3 overflow-hidden rounded-[20px] border border-border md:grid">
            {items.map((step, i) => (
              <li key={step.status} className={cn('relative min-w-0', i > 0 && 'border-l border-border')}>
                <Link
                  href={hrefFor(step.status)}
                  aria-label={nameFor(step, step.count)}
                  className={cn(
                    'flex h-full items-center justify-between gap-4 px-6',
                    linkFx,
                    step.count > 0 ? TONE[step.status].busy : IDLE
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-text">{step.label}</span>
                    <span className="block truncate text-[13px] text-text-secondary">{step.note}</span>
                  </span>
                  <span className={cn('text-[40px] font-semibold leading-none', step.count > 0 ? TONE[step.status].ink : MUTED)}>
                    {formatCount(step.count)}
                  </span>
                  {i < items.length - 1 && <Chevron />}
                </Link>
              </li>
            ))}
          </ol>

          <ClosedLine counts={counts} />
        </>
      )}
    </section>
  );
}
