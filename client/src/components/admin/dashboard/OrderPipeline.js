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

// A segment with orders: solid tint (a little deeper on hover) and a saturated number.
// An empty segment: white, muted number. #8C7E70 is used instead of #A89B8C: on white it
// is 3.9:1, enough for 40px semibold digits (large text needs 3:1; #A89B8C is only 2.7:1).
const TONE = {
  PENDING: { busy: 'bg-[#FBF1D4] hover:bg-[#F8E7B8]', ink: 'text-[#7A5A10]' },
  PROCESSING: { busy: 'bg-[#FBE6DC] hover:bg-[#F8D7C7]', ink: 'text-[#9A3B22]' },
  SHIPPED: { busy: 'bg-[#DCEBF2] hover:bg-[#CDE2EE]', ink: 'text-[#1F4B66]' },
};
const IDLE = 'bg-white hover:bg-[#FBF8F3]';
const MUTED = 'text-[#8C7E70]';

const hrefFor = (status) => `/admin/orders?status=${status}`;
const nameFor = (step, n) => `${step.label}: ${formatCount(n)} ${n === 1 ? 'order' : 'orders'}, ${step.note.toLowerCase()}`;
const linkFx =
  'group relative transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B5532E] motion-reduce:transition-none';

function Chevron() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-1/2 z-10 flex size-7 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-[#D9CFC1] bg-white text-[#6F6358]"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-150 group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0">
        <path d="m9 6 6 6-6 6" />
      </svg>
    </span>
  );
}

function ClosedLine({ counts }) {
  return (
    <p className="mt-3 text-[13px] text-[#6F6358]">
      Completed <span className="font-semibold text-[#2B2118]">{formatCount(counts.COMPLETED)}</span>
      <span aria-hidden="true"> · </span>
      <span className="sr-only">, </span>
      Cancelled <span className="font-semibold text-[#2B2118]">{formatCount(counts.CANCELLED)}</span>
    </p>
  );
}

function AllClearCard() {
  return (
    <Link
      href="/admin/orders"
      className="flex min-h-14 items-center gap-2.5 rounded-xl border border-[#D9CFC1] bg-white px-4 text-[15px] font-medium text-[#2B2118] hover:bg-[#FBF8F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B5532E]"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F7A5E" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
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
      <h2 id="pipeline-title" className="text-lg font-semibold text-[#2B2118] md:text-xl">
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
                        'flex min-h-14 items-center justify-between gap-3 rounded-xl border border-[#D9CFC1] px-4',
                        linkFx,
                        step.count > 0 ? TONE[step.status].busy : IDLE
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#2B2118]">{step.label}</span>
                        <span className="block truncate text-[13px] text-[#5C4D40]">{step.note}</span>
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
          <ol className="mt-4 hidden h-[112px] grid-cols-3 overflow-hidden rounded-[20px] border border-[#D9CFC1] md:grid">
            {items.map((step, i) => (
              <li key={step.status} className={cn('relative min-w-0', i > 0 && 'border-l border-[#D9CFC1]')}>
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
                    <span className="block text-sm font-semibold text-[#2B2118]">{step.label}</span>
                    <span className="block truncate text-[13px] text-[#5C4D40]">{step.note}</span>
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
