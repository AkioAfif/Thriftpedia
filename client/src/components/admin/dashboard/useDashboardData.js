'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/adminApi';
import { useAuth } from '@/context/AuthContext';

const LOADING = { status: 'loading', data: null, error: '' };

// GET /api/dashboard/summary -> { products: { total, available, sold }, orders: { pending, completed, cancelled } }
async function fetchSummary() {
  const body = await apiFetch('/dashboard/summary');
  return body?.data ?? {};
}

// GET /api/orders?limit=5&sort=newest -> the five newest orders plus the per-status counts.
async function fetchRecentOrders() {
  const body = await apiFetch('/orders?limit=5&sort=newest');
  const data = body?.data ?? {};
  return { items: Array.isArray(data.items) ? data.items : [], counts: data.counts ?? {} };
}

// One independently loading section: its own state, error and retry.
// setState only happens in the promise callbacks and in retry (an event handler).
function useSection(fetcher, onUnauthorized) {
  const [state, setState] = useState(LOADING);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((data) => {
        if (active) setState({ status: 'ready', data, error: '' });
      })
      .catch((err) => {
        if (!active) return;
        if (err?.status === 401) {
          onUnauthorized();
          return;
        }
        setState({ status: 'error', data: null, error: err?.message || 'Something went wrong.' });
      });
    return () => {
      active = false;
    };
  }, [fetcher, attempt, onUnauthorized]);

  const retry = useCallback(() => {
    setState(LOADING);
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, retry };
}

// Both requests start in the same commit, so they run in parallel; one failing leaves the other.
export function useDashboardData() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const onUnauthorized = useCallback(() => {
    logout();
    router.replace('/login');
  }, [logout, router]);

  const summary = useSection(fetchSummary, onUnauthorized);
  const orders = useSection(fetchRecentOrders, onUnauthorized);

  return { adminName: user?.name ?? '', summary, orders };
}
