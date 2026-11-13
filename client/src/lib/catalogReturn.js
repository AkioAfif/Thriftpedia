'use client';

import { useSyncExternalStore } from 'react';
import { buildQueryString } from './utils';

// Remembers the catalog's last filters so "Catalog" / "Back to catalog" on a product page
// returns the buyer to the same results.
const KEY = 'thriftpedia:catalog-query';

export function rememberCatalogQuery(search) {
  try {
    window.sessionStorage.setItem(KEY, search);
  } catch {
    // storage unavailable: links fall back to /catalog
  }
}

function readQuery() {
  try {
    return window.sessionStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

const subscribeNoop = () => () => {};

export function useCatalogHref() {
  const raw = useSyncExternalStore(subscribeNoop, readQuery, () => '');
  // Re-serialise through the catalog's allow-list so only known filter keys survive.
  const qs = buildQueryString(Object.fromEntries(new URLSearchParams(raw)));
  return qs ? `/catalog?${qs}` : '/catalog';
}
