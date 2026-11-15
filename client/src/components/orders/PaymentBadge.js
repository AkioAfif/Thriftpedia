import { paymentMeta, paymentStatusOf } from '@/lib/payment';

const SIZES = {
  sm: 'min-h-6 px-2.5 py-0.5 text-[13px]',
  md: 'min-h-7 px-3 py-0.5 text-[13px]',
  // Header of the admin order detail page, next to the large status badge.
  lg: 'min-h-9 px-4 py-1.5 text-[13px]',
};

// The one payment badge used on every order page. Missing paymentStatus reads as Unpaid.
export function PaymentBadge({ order, size = 'md', className = '' }) {
  const meta = paymentMeta(paymentStatusOf(order));
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full border font-semibold leading-tight ${SIZES[size] ?? SIZES.md} ${meta.className} ${className}`}
    >
      <span className="sr-only">Payment: </span>
      {meta.label}
    </span>
  );
}
