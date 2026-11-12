import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ALLOWED_QUERY_KEYS, DEFAULT_PAGE, DEFAULT_SORT } from './constants';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price) {
  if (price === null || price === undefined || isNaN(Number(price))) {
    return 'Rp 0';
  }
  const num = Number(price);
  return `Rp ${num.toLocaleString('en-US')}`;
}

export function formatPriceShort(price) {
  if (price === null || price === undefined || isNaN(Number(price))) {
    return '0';
  }
  const num = Number(price);
  if (num >= 1000000 && num % 1000000 === 0) {
    return `${num / 1000000}m`;
  }
  if (num >= 1000 && num % 1000 === 0) {
    return `${num / 1000}k`;
  }
  return num.toLocaleString('en-US');
}

export function cleanQueryParams(params = {}) {
  const cleaned = {};

  for (const [key, rawValue] of Object.entries(params)) {
    if (!ALLOWED_QUERY_KEYS.includes(key)) continue;
    if (rawValue === undefined || rawValue === null) continue;

    const value = typeof rawValue === 'string' ? rawValue.trim() : rawValue;
    if (value === '') continue;

    if (key === 'page' && (Number(value) === DEFAULT_PAGE || value === '1')) {
      continue;
    }
    if (key === 'sort' && value === DEFAULT_SORT) {
      continue;
    }
    if (key === 'hideSold') {
      if (value === true || value === 'true') {
        cleaned.hideSold = 'true';
      }
      continue;
    }

    if (key === 'minPrice' || key === 'maxPrice') {
      const num = Number(value);
      if (!isNaN(num) && num >= 0) {
        cleaned[key] = String(num);
      }
      continue;
    }

    cleaned[key] = String(value);
  }

  return cleaned;
}

export function buildQueryString(params = {}) {
  const cleaned = cleanQueryParams(params);
  const searchParams = new URLSearchParams(cleaned);
  return searchParams.toString();
}
