import { statusMeta } from '@/lib/orderView';

// Order status as coloured text with a small line icon: no pill, no dot.
// Colours are statusMeta's own text colours (all >= 7:1 on white).
const LOOK = {
  PENDING: { ink: 'text-[#6B4C0C]', icon: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2" /></> },
  PROCESSING: { ink: 'text-[#8F3B23]', icon: <><path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" /><path d="m4 8.5 8 4.5 8-4.5M12 13v7" /></> },
  SHIPPED: { ink: 'text-[#1F4B66]', icon: <><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" /><circle cx="7" cy="17.5" r="1.5" /><circle cx="17.5" cy="17.5" r="1.5" /></> },
  COMPLETED: { ink: 'text-[#1F5A2B]', icon: <path d="m5 12.5 4.5 4.5L19 7.5" /> },
  CANCELLED: { ink: 'text-[#5C4D40]', icon: <path d="M7 7l10 10M17 7 7 17" /> },
};

export function StatusText({ status, className = '' }) {
  const look = LOOK[status] ?? { ink: 'text-[#5C4D40]', icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-semibold ${look.ink} ${className}`}>
      {look.icon && (
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          {look.icon}
        </svg>
      )}
      {statusMeta(status).label}
    </span>
  );
}
