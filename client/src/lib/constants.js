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

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const CONDITIONS = [
  { value: 'NEW_WITH_TAGS', label: 'Baru dengan Tag' },
  { value: 'LIKE_NEW', label: 'Seperti Baru' },
  { value: 'GOOD_VINTAGE', label: 'Bekas Pakai' },
  { value: 'FAIR_DISTRESSED', label: 'Ada Cacat' },
];