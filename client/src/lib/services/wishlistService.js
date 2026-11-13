import { apiClient } from '../api';

const auth = (token) => ({ Authorization: `Bearer ${token}` });

// GET /api/wishlist (BUYER) -> [{ _id, product: <populated product | null>, createdAt }]
export async function getWishlist(token) {
  const res = await apiClient('/wishlist', { headers: auth(token), cache: 'no-store' });
  return Array.isArray(res?.data) ? res.data : [];
}

export function isInWishlist(list, productId) {
  return list.some((item) => String(item?.product?._id ?? item?.product ?? '') === String(productId));
}

// 409 = already saved
export function addToWishlist(token, productId) {
  return apiClient('/wishlist', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ productId }),
  });
}

// 404 = not in the wishlist
export function removeFromWishlist(token, productId) {
  return apiClient(`/wishlist/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
    headers: auth(token),
  });
}
