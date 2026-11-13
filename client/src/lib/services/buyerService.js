import { apiClient } from '../api';

const authorization = (token) => ({ Authorization: `Bearer ${token}` });

export async function getWishlist(token, signal) {
  const result = await apiClient('/wishlist', { headers: authorization(token), signal, cache: 'no-store' });
  return (result?.data ?? []).filter((entry) => entry.product?._id);
}

export async function saveWishlistItem(token, productId) {
  return apiClient('/wishlist', { method: 'POST', headers: authorization(token), body: JSON.stringify({ productId }) });
}

export async function removeWishlistItem(token, productId) {
  return apiClient(`/wishlist/${encodeURIComponent(productId)}`, { method: 'DELETE', headers: authorization(token) });
}

export async function getProductReviews(productId, signal) {
  const result = await apiClient(`/products/${encodeURIComponent(productId)}/reviews`, { signal, cache: 'no-store' });
  return result?.data ?? [];
}

export async function createProductReview(token, productId, rating, comment) {
  const result = await apiClient(`/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'POST', headers: authorization(token), body: JSON.stringify({ rating, comment }),
  });
  return result?.data;
}
