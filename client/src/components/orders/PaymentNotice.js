import { LoadingDots } from '@/components/ui/LoadingDots';
import { canPay, hasAddress } from '@/lib/payment';

function InfoIcon({ className }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function AlertIcon({ className }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </svg>
  );
}

// One info row (icon + 14px line + optional detail) on a white panel, readable on any ribbon tint.
export function PaymentNoticeRow({ tone = 'info', title, detail, busy = false, id }) {
  const error = tone === 'error';
  const Icon = error ? AlertIcon : InfoIcon;
  return (
    <div id={id} className="flex items-start gap-2.5 rounded-xl border border-[#2B2118]/10 bg-white px-3.5 py-3 text-sm text-[#2B2118]">
      <Icon className={`mt-px size-5 shrink-0 ${error ? 'text-[#B3402A]' : 'text-[#5C4D40]'}`} />
      <div className="min-w-0 break-words">
        <p className={`inline-flex flex-wrap items-center gap-2 font-semibold ${error ? 'text-[#B3402A]' : ''}`}>
          {title}
          {busy && <LoadingDots className="text-[#5C4D40]" />}
        </p>
        {detail && <p className="mt-0.5 text-[#5C4D40]">{detail}</p>}
      </div>
    </div>
  );
}

// The payment line for an order, or null. Errors first, then progress, then why Pay now is off.
// `id` is what a disabled Pay now points at with aria-describedby.
export function paymentNotice(order, payment, id = 'pay-note') {
  if (payment.error) return <PaymentNoticeRow tone="error" title={payment.error} id={id} />;
  if (payment.confirming) {
    return <PaymentNoticeRow title="Payment is being confirmed." detail="This page updates on its own." busy id={id} />;
  }
  if (payment.unconfirmed) {
    return (
      <PaymentNoticeRow
        title="We haven’t received the payment yet."
        detail="If you paid, it can take a few minutes to show here."
        id={id}
      />
    );
  }
  if (!canPay(order)) return null;
  if (payment.unavailable) {
    return (
      <PaymentNoticeRow title="Online payment isn’t available right now." detail="You can still keep or cancel this order." id={id} />
    );
  }
  if (!hasAddress(order)) {
    return <PaymentNoticeRow title="No delivery address, so online payment isn’t available." id={id} />;
  }
  return null;
}
