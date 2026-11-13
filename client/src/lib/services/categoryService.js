import { apiClient } from '../api';

export async function getCategories() {
  const res = await apiClient('/categories', {
    cache: 'no-store',
  });

  return res?.data || [];
}
