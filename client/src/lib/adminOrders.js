import { apiFetch } from './adminApi';

export const ORDER_PAGE_SIZE = 10;

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

// What the admin does to move an order INTO a status. Which buttons appear is decided by
// the server's `allowedTransitions`; this only names them.
export const TRANSITION_ACTIONS = {
  PROCESSING: { label: 'Start processing', done: 'Order is now processing' },
  SHIPPED: { label: 'Mark as shipped', done: 'Order marked as shipped' },
  COMPLETED: { label: 'Mark as completed', done: 'Order completed' },
  CANCELLED: { label: 'Cancel order', done: 'Order cancelled, product is back on sale', destructive: true },
};

export const ORDER_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'total_desc', label: 'Total: High to Low' },
  { value: 'total_asc', label: 'Total: Low to High' },
];

export const DEFAULT_ORDER_QUERY = { status: '', q: '', sort: 'newest', page: 1 };
export const EMPTY_ORDER_META = { total: 0, page: 1, limit: ORDER_PAGE_SIZE, totalPages: 0 };

export const TRACKING_MAX = 50;
export const COURIER_MAX = 50;
export const NOTE_MAX = 500;
const Q_MAX = 100;

// URL -> sanitised query. Invalid values fall back to defaults instead of producing a 400.
export function parseOrderQuery(searchParams) {
  const status = searchParams.get('status') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const page = Number(searchParams.get('page'));
  const q = (searchParams.get('q') ?? '').trim().slice(0, Q_MAX);
  return {
    status: ORDER_STATUS_ORDER.includes(status) ? status : '',
    q,
    sort: ORDER_SORT_OPTIONS.some((o) => o.value === sort) ? sort : 'newest',
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}

// Query -> URL search string, omitting defaults so URLs stay short and shareable.
export function orderQueryToSearch(query) {
  const params = new URLSearchParams();
  if (query.status) params.set('status', query.status);
  if (query.q) params.set('q', query.q);
  if (query.sort && query.sort !== 'newest') params.set('sort', query.sort);
  if (query.page > 1) params.set('page', String(query.page));
  return params.toString();
}

export async function fetchOrders(query) {
  const params = new URLSearchParams(orderQueryToSearch(query));
  params.set('limit', String(ORDER_PAGE_SIZE));
  const body = await apiFetch(`/orders?${params.toString()}`);
  const data = body?.data ?? {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
    meta: { ...EMPTY_ORDER_META, ...(data.meta ?? {}) },
    counts: data.counts ?? null,
  };
}

export async function fetchOrder(id) {
  const body = await apiFetch(`/orders/${encodeURIComponent(id)}`);
  return body?.data ?? null;
}

// Returns the updated order in the same shape as fetchOrder.
export async function updateOrderStatus(id, payload) {
  const body = await apiFetch(`/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return body?.data ?? null;
}

// Snapshot first: it survives buyer deletion and later product edits.
export const orderBuyer = (order) => ({
  name: order?.buyerSnapshot?.name ?? order?.buyer?.name ?? null,
  email: order?.buyerSnapshot?.email ?? order?.buyer?.email ?? null,
});

export const orderItem = (order) => {
  const snap = order?.productSnapshot ?? {};
  const live = order?.product ?? {};
  return {
    name: snap.name ?? live.name ?? 'Unknown item',
    brand: snap.brand ?? '',
    photo: snap.photo ?? live.photos?.[0] ?? '',
    size: snap.size ?? live.size ?? null,
    condition: snap.condition ?? live.condition ?? null,
    price: snap.price ?? live.price ?? null,
  };
};

export const orderLabel = (order) => (order?.orderNumber ? `#${order.orderNumber}` : 'Unnumbered order');

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export function formatOrderDate(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? dateFormat.format(d) : '—';
}

export function formatOrderDateTime(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? `${dateFormat.format(d)}, ${timeFormat.format(d)}` : '—';
}
