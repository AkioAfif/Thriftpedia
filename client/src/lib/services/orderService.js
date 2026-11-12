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

export async function getOrders(token, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await apiClient(qs ? `/orders?${qs}` : '/orders', {
    headers: auth(token),
    cache: 'no-store',
  });
  return res?.data ?? [];
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
