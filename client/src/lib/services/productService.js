import { apiClient } from '../api';
import { buildQueryString } from '../utils';

export async function getProducts(params = {}) {
  const qs = buildQueryString(params);
  const endpoint = qs ? `/products?${qs}` : '/products';

  const res = await apiClient(endpoint, {
    cache: 'no-store',
  });

  return {
    data: res?.data || [],
    meta: res?.meta || { total: 0, page: 1, limit: 12, totalPages: 0 },
    message: res?.message || '',
  };
}

// GET /api/products/:id -> data (category populated with name + slug). 404 = gone, 400 = bad id.
export async function getProductById(id) {
  const res = await apiClient(`/products/${encodeURIComponent(id)}`, { cache: 'no-store' });
  return res?.data ?? null;
}

// GET /api/products/:productId/reviews -> [{ rating, comment, buyer: { name }, createdAt }]
export async function getProductReviews(id) {
  const res = await apiClient(`/products/${encodeURIComponent(id)}/reviews`, { cache: 'no-store' });
  return Array.isArray(res?.data) ? res.data : [];
}

// Available pieces from the same category, without the current one.
export async function getRelatedProducts({ categorySlug, excludeId, max = 4 }) {
  const qs = new URLSearchParams({ category: categorySlug, status: 'AVAILABLE', limit: String(max + 1) });
  const res = await apiClient(`/products?${qs}`, { cache: 'no-store' });
  const list = Array.isArray(res?.data) ? res.data : [];
  return list.filter((p) => String(p?._id) !== String(excludeId)).slice(0, max);
}
