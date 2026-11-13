import { apiClient } from '../api';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

export async function getProduct(id) {
  const res = await apiClient(`/products/${id}`, { cache: 'no-store' });
  return res?.data ?? null;
}

// 409 = product already sold to another buyer, 404 = product gone
export async function createOrder(token, productId) {
  const res = await apiClient('/orders', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ productId }),
  });
  return res?.data ?? null;
}

// GET /orders answers { items, meta, counts }; empty values are dropped from the query.
export async function getOrdersPage(token, params = {}) {
  const query = Object.entries(params).filter(([, value]) => value !== '' && value != null);
  const qs = new URLSearchParams(query).toString();
  const res = await apiClient(qs ? `/orders?${qs}` : '/orders', {
    headers: auth(token),
    cache: 'no-store',
  });
  const data = res?.data ?? {};
  return {
    items: Array.isArray(data.items) ? data.items : [],
    meta: { total: 0, page: 1, limit: 10, totalPages: 0, ...(data.meta ?? {}) },
    counts: data.counts ?? null,
  };
}

export async function getOrders(token, params = {}) {
  return (await getOrdersPage(token, params)).items;
}

// Buyer cancels their own PENDING order. Returns the order in the same shape as getOrder.
export async function cancelOrder(token, orderId) {
  const res = await apiClient(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'PATCH',
    headers: auth(token),
  });
  return res?.data ?? null;
}

export async function getOrder(token, orderId) {
  const res = await apiClient(`/orders/${orderId}`, {
    headers: auth(token),
    cache: 'no-store',
  });
  return res?.data ?? null;
}

export async function updateOrderStatus(token, orderId, status) {
  const res = await apiClient(`/orders/${orderId}`, {
    method: 'PATCH',
    headers: auth(token),
    body: JSON.stringify({ status }),
  });
  return res?.data ?? null;
}
