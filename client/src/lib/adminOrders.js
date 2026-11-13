import { apiFetch } from './adminApi';
import { ORDER_STATUS_ORDER } from './orderView';

// Display helpers moved to orderView.js so buyer pages can share them; re-exported unchanged.
export {
  ORDER_STATUS_ORDER,
  ORDER_STATUS_META,
  statusMeta,
  orderItem,
  orderLabel,
  formatOrderDate,
  formatOrderDateTime,
  ORDER_STEPS,
  historyNote,
} from './orderView';

export const ORDER_PAGE_SIZE = 10;

// What the admin does to move an order INTO a status. Which buttons appear is decided by
// the server's `allowedTransitions`; this only names them.
export const TRANSITION_ACTIONS = {
  PROCESSING: { label: 'Mark as Processing', done: 'Order is now processing' },
  SHIPPED: { label: 'Mark as Shipped', done: 'Order marked as shipped' },
  COMPLETED: { label: 'Mark as Completed', done: 'Order completed' },
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
