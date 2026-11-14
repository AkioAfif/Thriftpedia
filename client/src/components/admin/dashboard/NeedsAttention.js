import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { statusMeta } from '@/lib/orderView';
import { cn } from '@/lib/utils';
import { formatCount, SectionError, SectionHeading } from './shared';

// In order-flow sequence. /admin/orders reads ?status= (parseOrderQuery), so each links to its tab.
const STEPS = [
  { status: 'PENDING', task: 'Ready to process', action: 'Review orders' },
  { status: 'PROCESSING', task: 'Ready to ship', action: 'Prepare shipment' },
  { status: 'SHIPPED', task: 'Waiting for delivery', action: 'Track shipments' },
];

// Solid tint per status (card) plus a saturated badge: white on statusMeta's own text colour
// (#6B4C0C / #8F3B23 / #1F4B66), all above 7:1. Text on every tint stays at or above 4.8:1.
// `ink` is the action text and the hover border (>= 5.5:1 on its tint).
const TINTS = {
  PENDING: { card: 'bg-[#FBF1D4] border-[#EBD596]', badge: 'bg-[#6B4C0C] text-white', ink: 'text-[#7A5A10]', hoverBorder: 'hover:border-[#7A5A10]' },
  PROCESSING: { card: 'bg-[#FBE6DC] border-[#EBC3AE]', badge: 'bg-[#8F3B23] text-white', ink: 'text-[#9A3B22]', hoverBorder: 'hover:border-[#9A3B22]' },
  SHIPPED: { card: 'bg-[#DCEBF2] border-[#B7D3E0]', badge: 'bg-[#1F4B66] text-white', ink: 'text-[#1F4B66]', hoverBorder: 'hover:border-[#1F4B66]' },
};

// Lift 2px with a soft shadow on hover, settle with scale .99 when pressed, 2px focus ring.
// Only transform, box-shadow and border-color animate; reduced motion keeps everything still.
const cardFx =
  'group cursor-pointer transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(43,33,24,0.08)] active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100';

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F7A5E" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

// "View orders ->": the arrow nudges 3px right while the card is hovered or focused.
function ActionLine({ text, ink, className }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-semibold', ink, className)}>
      {text}
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-150 group-hover:translate-x-[3px] group-focus-visible:translate-x-[3px] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-focus-visible:translate-x-0"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </span>
  );
}

const hrefFor = (status) => `/admin/orders?status=${status}`;
const actionFor = (step, count) => (count > 0 ? step.action : 'View orders');
const nameFor = (step, count) => `${statusMeta(step.status).label} orders: ${formatCount(count)}. ${actionFor(step, count)}`;

// Big standalone numbers use proportional figures: tabular-nums swaps in a footed "1".
const bigNumber = 'font-sans text-[36px] font-semibold leading-none text-[#2B2118]';

function Badge({ status }) {
  return (
    <span className={cn('w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold', TINTS[status].badge)}>
      {statusMeta(status).label}
    </span>
  );
}

// md and up: one white card, three equal columns split by 1px rules. Each column is one link.
// Dot = status colour; number = saturated status colour (count > 0) or muted grey (0).
// #8C7E70 is the muted grey: 3.9:1 on white, enough for 32px semibold text (large text, 3:1).
const DESKTOP = {
  PENDING: { dot: 'bg-[#C99A1F]', ink: 'text-[#7A5A10]', note: 'Ready to process' },
  PROCESSING: { dot: 'bg-[#C8653A]', ink: 'text-[#9A3B22]', note: 'Ready to ship' },
  SHIPPED: { dot: 'bg-[#3A7CA5]', ink: 'text-[#1F4B66]', note: 'In transit' },
};

function AttentionColumn({ count, ...step }) {
  const look = DESKTOP[step.status];
  const label = statusMeta(step.status).label;
  return (
    <li className="min-w-0">
      <Link
        href={hrefFor(step.status)}
        aria-label={`${label}: ${formatCount(count)} ${count === 1 ? 'order' : 'orders'}. View orders`}
        className="group flex h-full flex-col p-5 transition-colors duration-150 hover:bg-[#FBF8F3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B5532E] motion-reduce:transition-none"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-full', look.dot)} />
          <span className="text-sm font-semibold text-[#2B2118]">{label}</span>
        </span>
        <span className={cn('mt-2 text-[32px] font-semibold leading-10 tabular-nums', count > 0 ? look.ink : 'text-[#8C7E70]')}>
          {formatCount(count)}
        </span>
        <span className="text-[13px] text-[#6F6358]">{count > 0 ? look.note : 'Nothing waiting'}</span>
        <ActionLine text="View orders" ink="text-[#B5532E]" className="mt-4" />
      </Link>
    </li>
  );
}

const desktopCard = 'mt-4 hidden grid-cols-3 divide-x divide-[#EAE4DA] overflow-hidden rounded-2xl border border-[#D9CFC1] bg-surface md:grid';

// Below md: a status with work is a card (number first); an empty one is a compact 44px row.
function MobileItem({ count, ...step }) {
  const tint = TINTS[step.status];
  if (count === 0) {
    return (
      <li>
        <Link
          href={hrefFor(step.status)}
          aria-label={nameFor(step, count)}
          className={cn('flex min-h-11 items-center justify-between gap-3 rounded-xl border px-4', tint.card, tint.hoverBorder, cardFx)}
        >
          <Badge status={step.status} />
          <ActionLine text="View orders" ink={tint.ink} />
        </Link>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={hrefFor(step.status)}
        aria-label={nameFor(step, count)}
        className={cn('block rounded-2xl border-2 p-4', tint.card, tint.hoverBorder, cardFx)}
      >
        <span className="flex items-start justify-between gap-3">
          <span className={bigNumber}>{formatCount(count)}</span>
          <Badge status={step.status} />
        </span>
        <span className="mt-1 block text-sm text-[#2B2118]">{step.task}</span>
        <ActionLine text={step.action} ink={tint.ink} className="mt-2" />
      </Link>
    </li>
  );
}

function MobileList({ counts }) {
  const items = STEPS.map((step) => ({ ...step, count: Number(counts[step.status]) || 0 }));
  if (items.every((item) => item.count === 0)) {
    return (
      <Link
        href="/admin/orders"
        aria-label="All caught up, no orders waiting. View orders"
        className={cn('mt-3 flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-2xl border border-[#D9CFC1] bg-surface px-4 py-3 hover:border-[#6F6358]', cardFx)}
      >
        <span className="flex items-center gap-2.5">
          <CheckIcon />
          <span className="text-[15px] font-medium text-[#2B2118]">All caught up – no orders waiting</span>
        </span>
        <ActionLine text="View orders" ink="text-[#B5532E]" />
      </Link>
    );
  }
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {items.map((item) => (
        <MobileItem key={item.status} {...item} />
      ))}
    </ul>
  );
}

export function NeedsAttention({ section }) {
  const counts = section.data?.counts ?? {};
  const allClear = section.status === 'ready' && STEPS.every((step) => !(Number(counts[step.status]) > 0));
  return (
    <section aria-labelledby="needs-attention-title">
      <SectionHeading
        id="needs-attention-title"
        title="Needs attention"
        action={allClear ? <span className="hidden text-[13px] text-[#6F6358] md:inline">All caught up</span> : null}
      />
      {section.status === 'error' && <SectionError className="mt-4" message={section.error} onRetry={section.retry} />}

      {section.status === 'loading' && (
        <>
          <div aria-hidden="true" className="mt-3 flex flex-col gap-2.5 md:hidden">
            <Skeleton className="h-[112px] rounded-2xl" />
            <Skeleton className="h-11 rounded-xl" />
            <Skeleton className="h-11 rounded-xl" />
          </div>
          <div aria-hidden="true" className={desktopCard}>
            {STEPS.map((step) => (
              <div key={step.status} className="space-y-3 p-5">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-9 w-14 rounded-md" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            ))}
          </div>
        </>
      )}

      {section.status === 'ready' && (
        <>
          <div className="md:hidden">
            <MobileList counts={counts} />
          </div>
          <ul className={desktopCard}>
            {STEPS.map((step) => (
              <AttentionColumn key={step.status} {...step} count={Number(counts[step.status]) || 0} />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
