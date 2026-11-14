'use client';

import { useSyncExternalStore } from 'react';
import { ORDER_STATUS_ORDER } from '@/lib/orderView';

// Remembers the order list's ?status=&page= when a card is opened, so "Back to my orders"
// returns to the same tab and page. Same pattern as lib/catalogReturn.js.
const KEY = 'thriftpedia:orders-query';

export function rememberOrdersQuery(search) {
  try {
    window.sessionStorage.setItem(KEY, search);
  } catch {
    // storage unavailable: the link falls back to /orders
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

// Only a known status and a positive integer page survive; anything else is dropped.
export function useOrdersHref() {
  const raw = useSyncExternalStore(subscribeNoop, readQuery, () => '');
  const params = new URLSearchParams(raw);
  const clean = new URLSearchParams();
  const status = params.get('status') ?? '';
  const page = Number(params.get('page'));
  if (ORDER_STATUS_ORDER.includes(status)) clean.set('status', status);
  if (Number.isInteger(page) && page > 1) clean.set('page', String(page));
  const qs = clean.toString();
  return qs ? `/orders?${qs}` : '/orders';
}
