'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../../../components/admin/StatCard';
import { BagIcon, BoxIcon } from '../../../components/admin/icons';
import { apiFetch } from '../../../lib/adminApi';
import { useAuth } from '@/context/AuthContext';

const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

function CardSkeleton() {
  return <div className="h-72 animate-pulse rounded-[20px] bg-[#efe9e0]" />;
}

export default function DashboardPage() {
  const router = useRouter();
  // Clears token, user and thriftpedia_token together, so the Navbar is logged out too.
  const { logout } = useAuth();
  const [state, setState] = useState({ status: 'loading', summary: null, errorMessage: '' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    apiFetch('/dashboard/summary')
      .then((body) => {
        if (!active) return;
        setState({ status: 'ready', summary: body?.data ?? {}, errorMessage: '' });
      })
      .catch((err) => {
        if (!active) return;
        if (err?.status === 401) {
          logout();
          router.replace('/login');
          return;
        }
        setState({ status: 'error', summary: null, errorMessage: err.message });
      });

    return () => {
      active = false;
    };
  }, [attempt, router, logout]);

  function retry() {
    setState({ status: 'loading', summary: null, errorMessage: '' });
    setAttempt((n) => n + 1);
  }

  const { status, summary, errorMessage } = state;
  const products = summary?.products ?? {};
  const orders = summary?.orders ?? {};

  const productStats = [
    { label: 'Total', value: formatNumber(products.total) },
    { label: 'Available', value: formatNumber(products.available) },
    { label: 'Sold', value: formatNumber(products.sold) },
  ];
  const orderStats = [
    { label: 'Pending', value: formatNumber(orders.pending) },
    { label: 'Cancelled', value: formatNumber(orders.cancelled) },
    { label: 'Completed', value: formatNumber(orders.completed) },
  ];

  return (
    <div>
      <h1 className="text-4xl font-semibold">Dashboard</h1>

      {status === 'loading' && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {status === 'error' && (
        <div className="mt-8 max-w-[36rem] rounded-[20px] border border-[#e6b8a2] bg-[#fdefe6] p-7">
          <h2 className="text-xl font-semibold">Failed to load summary</h2>
          <p className="mt-2 text-sm text-[#6E5D4F]">{errorMessage}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 min-h-[40px] rounded-[10px] bg-[#a3452a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#8f3b23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      )}

      {status === 'ready' && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <StatCard
            icon={<BoxIcon />}
            title="Products"
            stats={productStats}
            buttonLabel="Manage products"
            href="/admin/products"
          />
          <StatCard
            icon={<BagIcon />}
            title="Orders"
            stats={orderStats}
            buttonLabel="Manage orders"
            href="/admin/orders"
          />
        </div>
      )}
    </div>
  );
}