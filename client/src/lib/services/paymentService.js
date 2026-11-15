import { apiClient } from '../api';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// POST /payments/:orderId (buyer, owner only, no body). Answers 201 with a new Snap token or
// 200 with the open one. Errors carry the server's message: 400 no shipping address,
// 409 order no longer PENDING + UNPAID, 502 Midtrans error, 503 payment not configured.
export async function createPaymentToken(token, orderId) {
  try {
    const res = await apiClient(`/payments/${encodeURIComponent(orderId)}`, {
      method: 'POST',
      headers: auth(token),
    });
    const data = res?.data ?? {};
    return { token: data.token ?? null, redirectUrl: data.redirectUrl ?? null };
  } catch (err) {
    // apiClient swaps 5xx messages for a generic one; 502/503 explain themselves here.
    if (err?.status >= 500 && err.data?.message) err.message = err.data.message;
    throw err;
  }
}
