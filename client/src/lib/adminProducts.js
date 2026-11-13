import { apiFetch } from './adminApi';

export const PAGE_SIZE = 10;
export const MAX_PHOTOS = 5;
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'FREE'].map((value) => ({
  value,
  label: value === 'FREE' ? 'Free Size' : value,
}));

export const CONDITION_OPTIONS = [
  { value: 'NEW_WITH_TAGS', label: 'Baru dengan Tag', hint: 'Belum pernah dipakai, tag masih menempel.' },
  { value: 'LIKE_NEW', label: 'Seperti Baru', hint: 'Dipakai sangat jarang, hampir tanpa bekas.' },
  { value: 'GOOD_VINTAGE', label: 'Bekas Pakai', hint: 'Ada tanda pemakaian normal, tidak ada cacat besar.' },
  { value: 'FAIR_DISTRESSED', label: 'Ada Cacat', hint: 'Ada noda, pudar, atau kerusakan terlihat. Jelaskan di deskripsi.' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Sort: Newest' },
  { value: 'oldest', label: 'Sort: Oldest' },
  { value: 'price_asc', label: 'Sort: Price low to high' },
  { value: 'price_desc', label: 'Sort: Price high to low' },
];

export const DEFAULT_FILTERS = {
  q: '',
  category: '',
  size: '',
  condition: '',
  status: '',
  sort: 'newest',
  page: 1,
};

export const EMPTY_META = { total: 0, page: 1, limit: PAGE_SIZE, totalPages: 0 };

export const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);
export const formatRupiah = (n) => `Rp ${(Number(n) || 0).toLocaleString('en-US')}`;

export function sizeLabel(size) {
  return size === 'FREE' ? 'Free Size' : size;
}

export function conditionLabel(value) {
  return CONDITION_OPTIONS.find((c) => c.value === value)?.label ?? value;
}

export function getPhotoSrc(product) {
  const first = Array.isArray(product?.photos) ? product.photos[0] : '';
  return typeof first === 'string' ? first.trim() : '';
}

export function buildProductQuery(filters) {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.category) params.set('category', filters.category);
  if (filters.size) params.set('size', filters.size);
  if (filters.condition) params.set('condition', filters.condition);
  if (filters.status) params.set('status', filters.status);
  if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort);
  params.set('page', String(filters.page || 1));
  params.set('limit', String(PAGE_SIZE));
  return params.toString();
}

export async function fetchProducts(filters) {
  const body = await apiFetch(`/products?${buildProductQuery(filters)}`);
  return {
    items: Array.isArray(body?.data) ? body.data : [],
    meta: { ...EMPTY_META, ...(body?.meta ?? {}) },
  };
}

export async function fetchProduct(id) {
  const body = await apiFetch(`/products/${id}`);
  return body?.data ?? null;
}

export async function fetchCategories() {
  const body = await apiFetch('/categories');
  return Array.isArray(body?.data) ? body.data : [];
}

export async function fetchProductStats() {
  const body = await apiFetch('/dashboard/summary');
  const p = body?.data?.products ?? {};
  return {
    total: Number(p.total) || 0,
    available: Number(p.available) || 0,
    sold: Number(p.sold) || 0,
  };
}

export function createProduct(payload) {
  return apiFetch('/products', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateProduct(id, payload) {
  return apiFetch(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function deleteProduct(id) {
  return apiFetch(`/products/${id}`, { method: 'DELETE' });
}

export function extractUploadedUrls(body) {
  const source = body?.data ?? body?.urls ?? body?.photos ?? body?.files ?? [];
  const list = Array.isArray(source)
    ? source
    : (source?.urls ?? source?.photos ?? source?.files ?? []);

  return list
    .map((item) => (typeof item === 'string' ? item : (item?.url ?? item?.path ?? '')))
    .filter((url) => typeof url === 'string' && url.length > 0);
}

export async function uploadPhotos(files) {
  const formData = new FormData();
  files.forEach((file) => formData.append('photos', file));

  const body = await apiFetch('/products/upload', { method: 'POST', body: formData });
  const urls = extractUploadedUrls(body);
  if (urls.length === 0) {
    throw new Error('Upload succeeded but no photo URL was returned by the server.');
  }
  return urls;
}