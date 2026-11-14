import { statusMeta } from '@/lib/orderView';
import { formatRupiah } from '@/lib/adminProducts';
import { paymentStatusOf } from '@/lib/payment';
import { PaymentBadge } from '@/components/orders/PaymentBadge';

// Solid tint + 2px saturated border (statusMeta dot colours). Text is #2B2118 / #5C4D40,
// both >= 6:1 on every tint.
const TONE = {
  PENDING: 'bg-[#FBF1D4] border-[#B07D12]',
  PROCESSING: 'bg-[#FBE6DC] border-[#B5532E]',
  SHIPPED: 'bg-[#DCEBF2] border-[#2E6A8F]',
  COMPLETED: 'bg-[#E4EEE2] border-[#2F7A3E]',
  CANCELLED: 'bg-[#F7DDD6] border-[#8A2E1B]',
};

function sentenceFor(order, { canCancel, payable }) {
  const payment = paymentStatusOf(order);
  switch (order.status) {
    case 'PENDING':
      if (payable) return canCancel ? 'Waiting for payment. You can still cancel.' : 'Waiting for payment.';
      return canCancel ? 'Waiting to be processed. You can still cancel.' : 'Waiting to be processed.';
    case 'PROCESSING':
      return payment === 'PAID' ? 'Payment received. The seller is preparing your piece.' : 'The seller is preparing your piece.';
    case 'SHIPPED':
      return order.trackingNumber
        ? `On its way to you. Tracking: ${order.trackingNumber}${order.courier ? ` (${order.courier})` : ''}`
        : 'On its way to you.';
    case 'COMPLETED':
      return 'Delivered. You can now leave a review.';
    case 'CANCELLED':
      if (payment === 'EXPIRED') return 'Payment expired. The order was cancelled and the piece is back on sale.';
      if (payment === 'FAILED') return 'Payment failed. The order was cancelled and the piece is back on sale.';
      if (payment === 'PAID') return 'Payment received after the order was cancelled.';
      return 'This order was cancelled.';
    default:
      return '';
  }
}

// Full-width "where is my order" block, read top to bottom: status + payment badge, sentence,
// total, then actions. Below sm everything stacks and the buttons are full width (first action on
// top); from sm the total sits right of the status and the actions line up right-aligned, the
// first one rightmost. `note` is an info row under the buttons (payment confirming, unavailable...).
export function OrderStatusRibbon({ order, total, canCancel, payable = false, actions = null, note = null }) {
  const meta = statusMeta(order.status);
  return (
    <section
      aria-label="Current status"
      className={`grid grid-cols-1 gap-4 rounded-[20px] border-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-x-6 sm:p-6 ${TONE[order.status] ?? 'bg-[#F5F0E8] border-[#8A7A6B]'}`}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[#5C4D40]">Current status</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="text-[22px] font-semibold leading-tight text-[#2B2118]">{meta.label}</p>
          <PaymentBadge order={order} />
        </div>
        <p className="mt-1.5 break-words text-sm text-[#5C4D40]">{sentenceFor(order, { canCancel, payable })}</p>
      </div>
      <div className="min-w-0 sm:text-right">
        <p className="text-[13px] font-medium text-[#5C4D40]">Total</p>
        <p className="break-words text-[28px] font-semibold leading-tight tabular-nums text-[#2B2118]">{formatRupiah(total)}</p>
      </div>
      {(actions || note) && (
        <div className="flex min-w-0 flex-col gap-3 border-t border-[#2B2118]/10 pt-4 sm:col-span-2">
          {actions && <div className="flex flex-col gap-3 sm:flex-row-reverse sm:flex-wrap sm:justify-start">{actions}</div>}
          {/* Always mounted (empty = hidden) so screen readers announce a note when it appears. */}
          <div role="status" className="min-w-0 empty:hidden">
            {note}
          </div>
        </div>
      )}
    </section>
  );
}
