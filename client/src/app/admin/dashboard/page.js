'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '../../../components/admin/StatCard';
import { BagIcon, BoxIcon } from '../../../components/admin/icons';
import { apiFetch } from '../../../lib/adminApi';
import { clearToken } from '../../../lib/adminAuth';

const formatNumber = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

function CardSkeleton() {
  return <div className="h-72 animate-pulse rounded-[20px] bg-[#efe9e0]" />;
}

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [summary, setSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchSummary = useCallback(async () => {
    try {
      const body = await apiFetch('/dashboard/summary');
      setSummary(body?.data ?? {});
      setErrorMessage('');
      setStatus('ready');
    } catch (err) {
      if (err.status === 401) {
        clearToken();
        router.replace('/login');
        return;
      }
      setErrorMessage(err.message);
      setStatus('error');
    }
  }, [router]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  function retry() {
    setStatus('loading');
    fetchSummary();
  }

  const products = summary?.products ?? {};
  const orders = summary?.orders ?? {};

  // Urutan sesuai desain. Dipetakan per nama field, bukan per urutan response.
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
        <div className="mt-8 max-w-xl rounded-[20px] border border-[#e6b8a2] bg-[#fdefe6] p-7">
          <h2 className="text-xl font-semibold">Gagal memuat ringkasan</h2>
          <p className="mt-2 text-sm text-[#6b5d52]">{errorMessage}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 rounded-[10px] bg-[#a3452a] px-5 py-2 text-sm font-semibold text-white"
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