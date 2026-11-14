import { statusMeta } from '@/lib/orderView';
import { formatRupiah } from '@/lib/adminProducts';

// Solid tint + 2px saturated border (statusMeta dot colours). Text is #2B2118 / #5C4D40,
// both >= 6:1 on every tint.
const TONE = {
  PENDING: 'bg-[#FBF1D4] border-[#B07D12]',
  PROCESSING: 'bg-[#FBE6DC] border-[#B5532E]',
  SHIPPED: 'bg-[#DCEBF2] border-[#2E6A8F]',
  COMPLETED: 'bg-[#E4EEE2] border-[#2F7A3E]',
  CANCELLED: 'bg-[#F7DDD6] border-[#8A2E1B]',
};

function sentenceFor(order, canCancel) {
  switch (order.status) {
    case 'PENDING':
      return canCancel ? 'Waiting to be processed. You can still cancel.' : 'Waiting to be processed.';
    case 'PROCESSING':
      return 'The seller is preparing your piece.';
    case 'SHIPPED':
      return order.trackingNumber
        ? `On its way to you. Tracking: ${order.trackingNumber}${order.courier ? ` (${order.courier})` : ''}`
        : 'On its way to you.';
    case 'COMPLETED':
      return 'Delivered. You can now leave a review.';
    case 'CANCELLED':
      return 'This order was cancelled.';
    default:
      return '';
  }
}

// Full-width "where is my order" block: status and one plain sentence left, total right.
export function OrderStatusRibbon({ order, total, canCancel }) {
  const meta = statusMeta(order.status);
  return (
    <section
      aria-label="Current status"
      className={`flex flex-col gap-4 rounded-[20px] border-2 p-5 sm:flex-row sm:items-center sm:justify-between ${TONE[order.status] ?? 'bg-[#F5F0E8] border-[#8A7A6B]'}`}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#5C4D40]">Current status</p>
        <p className="mt-1 text-[22px] font-semibold leading-tight text-[#2B2118]">{meta.label}</p>
        <p className="mt-1 break-words text-sm text-[#5C4D40]">{sentenceFor(order, canCancel)}</p>
      </div>
      <div className="shrink-0 sm:text-right">
        <p className="text-[13px] font-medium text-[#5C4D40]">Total</p>
        <p className="text-[28px] font-semibold leading-tight tabular-nums text-[#2B2118]">{formatRupiah(total)}</p>
      </div>
    </section>
  );
}
