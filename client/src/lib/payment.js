// Payment helpers for the buyer and admin order pages (contract: server/docs/order-payment-api.md).

// Orders created before payments existed have no paymentStatus: treat them as UNPAID.
export const paymentStatusOf = (order) => order?.paymentStatus ?? 'UNPAID';

// Pay now is offered only while the order waits and nothing was paid yet.
export const canPay = (order) => order?.status === 'PENDING' && paymentStatusOf(order) === 'UNPAID';

// The API refuses to create a payment for an order without a delivery address.
export const hasAddress = (order) => Boolean(order?.shippingAddress);

// PATCH /orders/:id/address is accepted only before payment starts: once a Snap token exists,
// Midtrans already has the address, so it becomes read-only (the server answers 409).
export const canEditAddress = (order) =>
  order?.status === 'PENDING' && paymentStatusOf(order) === 'UNPAID' && !order?.paymentToken;

// Solid tint + 1px edge so the badge still reads on a ribbon of the same tint.
const PAYMENT_META = {
  UNPAID: { label: 'Unpaid', className: 'bg-badge-warning text-text border-badge-warning' },
  PAID: { label: 'Paid', className: 'bg-badge-success text-text border-badge-success' },
  EXPIRED: { label: 'Expired', className: 'bg-badge-neutral text-text border-border' },
  FAILED: { label: 'Failed', className: 'bg-badge-danger text-text border-badge-danger' },
};

export const paymentMeta = (status) =>
  PAYMENT_META[status] ?? { label: status ?? 'Unknown', className: 'bg-surface-muted text-text border-border' };

// Sandbox Snap.js. The client key is public by design, but it is still never logged.
const SNAP_URL = 'https://app.sandbox.midtrans.com/snap/snap.js';
const SNAP_TIMEOUT_MS = 15000;
let snapPromise = null;

// Loads Snap.js once per page life. Resolves with window.snap; rejects when there is no key or
// the script cannot load (the caller then falls back to the hosted redirectUrl). A failed load
// removes its script tag and can be retried later.
export function loadSnap(clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY) {
  if (typeof window === 'undefined') return Promise.reject(new Error('Snap needs a browser'));
  if (window.snap?.pay) return Promise.resolve(window.snap);
  if (!clientKey) return Promise.reject(new Error('Online payment is not configured'));
  if (snapPromise) return snapPromise;

  snapPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let timer = null;
    const settle = (ok) => {
      clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      if (ok && window.snap?.pay) {
        resolve(window.snap);
        return;
      }
      script.remove();
      snapPromise = null;
      reject(new Error('Couldn’t load the payment window'));
    };
    script.src = SNAP_URL;
    script.async = true;
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => settle(true);
    script.onerror = () => settle(false);
    timer = setTimeout(() => settle(false), SNAP_TIMEOUT_MS);
    document.head.appendChild(script);
  });
  return snapPromise;
}
