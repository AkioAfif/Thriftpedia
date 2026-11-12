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
