import { statusMeta } from '@/lib/orderView';
import { formatRupiah } from '@/lib/adminProducts';
import { detailFocusRing } from './DetailCard';

// Tint + saturated 2px border per status (tints match the dashboard; borders are statusMeta dots).
// Every tint keeps text-secondary labels at 4.5:1 or better.
const STATUS_TONE = {
  PENDING: 'bg-[#FBF1D4] border-[#B07D12]',
  PROCESSING: 'bg-[#FBE6DC] border-primary',
  SHIPPED: 'bg-badge-info border-[#2E6A8F]',
  COMPLETED: 'bg-[#DFF0E0] border-[#2F7A3E]',
  CANCELLED: 'bg-surface-muted border-[#8A7A6B]',
};

const box = 'min-w-0 rounded-2xl p-5';
const label = 'text-[13px] font-medium text-text-secondary';

function initials(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? '?'}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

export default function OrderSummaryRow({ order, buyer }) {
  const meta = statusMeta(order.status);
  return (
    <section aria-label="Order summary" className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
      <div className={`${box} border-2 ${STATUS_TONE[order.status] ?? STATUS_TONE.CANCELLED}`}>
        <p className={label}>Current status</p>
        <p className="mt-2 text-[22px] font-semibold text-text">
          {meta.label}
        </p>
      </div>

      <div className={`${box} border border-[#EBD596] bg-[#FBF1D4]`}>
        <p className={label}>Order total</p>
        <p className="mt-2 break-words text-[28px] font-semibold leading-tight tabular-nums text-text">
          {order.total == null ? '—' : formatRupiah(order.total)}
        </p>
      </div>

      <div className={`${box} flex items-start gap-3.5 border border-[#D9CFC1] bg-surface-muted`}>
        <span
          aria-hidden="true"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FBE6DC] text-sm font-bold text-primary"
        >
          {initials(buyer.name)}
        </span>
        <div className="min-w-0">
          <p className={label}>Buyer</p>
          <p className="mt-1 break-words text-base font-semibold text-text">{buyer.name ?? 'Deleted account'}</p>
          {order.buyer === null && buyer.name && <p className="text-[13px] text-text-secondary">Account has since been deleted</p>}
          {buyer.email ? (
            <a
              href={`mailto:${buyer.email}`}
              className={`mt-0.5 inline-block break-all rounded text-sm font-medium text-primary-hover underline-offset-2 hover:underline ${detailFocusRing}`}
            >
              {buyer.email}
            </a>
          ) : (
            <p className="mt-0.5 text-sm text-text-secondary">No email on record</p>
          )}
        </div>
      </div>
    </section>
  );
}
