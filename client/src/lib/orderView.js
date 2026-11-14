// Display helpers shared by the admin and buyer order pages. No API calls here.

// Order of the tabs. Labels only; which statuses exist comes from the server's `counts`.
export const ORDER_STATUS_ORDER = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];

// Fixed status colours, used by every badge, tab dot and history entry on the order pages.
export const ORDER_STATUS_META = {
  PENDING: { label: 'Pending', badge: 'bg-[#f7e9c4] text-[#6B4C0C]', dot: 'bg-[#B07D12]' },
  PROCESSING: { label: 'Processing', badge: 'bg-[#f8ebe4] text-[#8F3B23]', dot: 'bg-[#B5532E]' },
  SHIPPED: { label: 'Shipped', badge: 'bg-[#dce9f2] text-[#1F4B66]', dot: 'bg-[#2E6A8F]' },
  COMPLETED: { label: 'Completed', badge: 'bg-[#dff0e0] text-[#1F5A2B]', dot: 'bg-[#2F7A3E]' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-[#E8E1D8] text-[#5C4D40]', dot: 'bg-[#8A7A6B]' },
};

export const statusMeta = (status) =>
  ORDER_STATUS_META[status] ?? { label: status ?? 'Unknown', badge: 'bg-[#efe9e0] text-[#4A3F35]', dot: 'bg-[#8A7A6B]' };

// Snapshot first: it survives later product edits and deletion.
export const orderItem = (order) => {
  const snap = order?.productSnapshot ?? {};
  const live = order?.product ?? {};
  return {
    name: snap.name ?? live.name ?? 'Unknown item',
    brand: snap.brand ?? live.brand ?? '',
    photo: snap.photo ?? live.photos?.[0] ?? '',
    size: snap.size ?? live.size ?? null,
    condition: snap.condition ?? live.condition ?? null,
    price: snap.price ?? live.price ?? null,
  };
};

export const orderLabel = (order) => (order?.orderNumber ? `#${order.orderNumber}` : 'Unnumbered order');

// The shop runs on Jakarta time, so everyone sees the same clock regardless of their browser.
const TIME_ZONE = 'Asia/Jakarta';
const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TIME_ZONE });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TIME_ZONE });

export function formatOrderDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? dateFormat.format(d) : '—';
}

export function formatOrderDateTime(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? `${dateFormat.format(d)}, ${timeFormat.format(d)} WIB` : '—';
}

// The forward path shown by the stepper. CANCELLED is not a step: it ends the path early.
export const ORDER_STEPS = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED'];

// Display-only text for a history entry. The checkout entry has no note in the data.
export function historyNote(entry, index) {
  if (entry?.note) return entry.note;
  return index === 0 && entry?.status === 'PENDING' ? 'Order placed' : null;
}
