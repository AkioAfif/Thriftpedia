export const DEFAULT_PAGE = 1;
export const DEFAULT_SORT = 'newest';

// Harus sama dengan SORT_MAP di backend (product.service.js)
export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

// Query string yang boleh lewat di cleanQueryParams (utils.js).
// Sama dengan field yang dibaca listProducts di backend.
export const ALLOWED_QUERY_KEYS = [
  'q',
  'category',
  'tag',
  'size',
  'condition',
  'minPrice',
  'maxPrice',
  'hideSold',
  'sort',
  'page',
];

// TEBAKAN: sesuaikan dengan enum `size` dan `condition` di model Product backend
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const CONDITIONS = [
  { value: 'Like New', label: 'Like New' },
  { value: 'Good', label: 'Good' },
  { value: 'Fair', label: 'Fair' },
];