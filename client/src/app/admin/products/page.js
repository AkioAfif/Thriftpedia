'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../../components/admin/products/ConfirmDialog';
import ProductFilters from '../../../components/admin/products/ProductFilters';
import ProductFormModal from '../../../components/admin/products/ProductFormModal';
import ProductPagination from '../../../components/admin/products/ProductPagination';
import ProductStatCards from '../../../components/admin/products/ProductStatCards';
import ProductTable from '../../../components/admin/products/ProductTable';
import { clearToken } from '../../../lib/adminAuth';
import {
  DEFAULT_FILTERS,
  EMPTY_META,
  createProduct,
  deleteProduct,
  fetchCategories,
  fetchProductStats,
  fetchProducts,
  formatNumber,
  updateProduct,
} from '../../../lib/adminProducts';

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export default function ProductManagementPage() {
  const router = useRouter();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState({ key: null, items: [], meta: EMPTY_META, error: '' });
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const queryKey = `${JSON.stringify(filters)}#${refreshTick}`;
  const loading = result.key !== queryKey;

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status === 401) {
        clearToken();
        router.replace('/login');
        return true;
      }
      return false;
    },
    [router]
  );

  const updateFilters = useCallback((changes) => {
    setFilters((prev) => ({ ...prev, ...changes, page: changes.page ?? 1 }));
  }, []);

  useEffect(() => {
    let active = true;

    fetchProducts(filters)
      .then((data) => {
        if (!active) return;
        setResult({ key: queryKey, items: data.items, meta: data.meta, error: '' });

        if (data.items.length === 0 && filters.page > 1 && data.meta.totalPages > 0) {
          setFilters((prev) =>
            prev.page > data.meta.totalPages ? { ...prev, page: data.meta.totalPages } : prev
          );
        }
      })
      .catch((err) => {
        if (!active) return;
        if (handleAuthError(err)) return;
        setResult({ key: queryKey, items: [], meta: EMPTY_META, error: err.message });
      });

    return () => {
      active = false;
    };
  }, [filters, queryKey, handleAuthError]);

  useEffect(() => {
    let active = true;

    fetchProductStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        if (active) handleAuthError(err);
      });

    return () => {
      active = false;
    };
  }, [refreshTick, handleAuthError]);

  useEffect(() => {
    let active = true;

    fetchCategories()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  const refresh = () => setRefreshTick((t) => t + 1);

  function submitSearch() {
    updateFilters({ q: searchInput.trim() });
  }

  function resetFilters() {
    setSearchInput('');
    setFilters({ ...DEFAULT_FILTERS });
  }

  async function handleSaveProduct(payload) {
    try {
      if (modal.mode === 'edit') {
        await updateProduct(modal.product._id, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product added');
      }
    } catch (err) {
      if (handleAuthError(err)) return;
      throw err;
    }

    const wasCreate = modal.mode === 'create';
    setModal(null);
    if (wasCreate) {
      setSearchInput('');
      setFilters({ ...DEFAULT_FILTERS });
    }
    refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget._id);
      toast.success('Product deleted');
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      if (!handleAuthError(err)) {
        toast.error(err.message);
        setDeleteTarget(null);
      }
    } finally {
      setDeleting(false);
    }
  }

  const { total, page, limit, totalPages } = result.meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = total === 0 ? 0 : from + result.items.length - 1;
  const summary = total === 0 ? 'No products' : `Showing ${from}–${to} of ${formatNumber(total)} products`;

  const hasActiveFilters = Boolean(
    filters.q || filters.category || filters.size || filters.condition || filters.status
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Product Management</h1>
          <p className="mt-2 text-sm text-[#6E5D4F]">Status updates automatically when buyers order.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create', product: null })}
          className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#a3452a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#8f3b23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 sm:w-auto"
        >
          <PlusIcon />
          Add Product
        </button>
      </div>

      <div className="mt-6">
        <ProductStatCards
          stats={stats}
          activeStatus={filters.status}
          onSelect={(status) => updateFilters({ status })}
        />
      </div>

      <div className="mt-4">
        <ProductFilters
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearchSubmit={submitSearch}
          filters={filters}
          categories={categories}
          onChange={updateFilters}
        />
      </div>

      <div className="mt-6">
        <ProductTable
          items={result.items}
          initialLoading={loading && result.items.length === 0}
          refreshing={loading && result.items.length > 0}
          error={loading ? '' : result.error}
          hasActiveFilters={hasActiveFilters}
          onRetry={refresh}
          onResetFilters={resetFilters}
          onEdit={(product) => setModal({ mode: 'edit', product })}
          onDelete={setDeleteTarget}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[#6E5D4F]">{summary}</p>
        <ProductPagination
          page={page}
          totalPages={totalPages}
          onChange={(nextPage) => updateFilters({ page: nextPage })}
        />
      </div>

      {modal && (
        <ProductFormModal
          key={modal.product?._id ?? 'new'}
          mode={modal.mode}
          product={modal.product}
          categories={categories}
          onSubmit={handleSaveProduct}
          onClose={() => setModal(null)}
          onAuthError={handleAuthError}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete product?"
          message={`"${deleteTarget.name}" will be removed permanently. Products that already have orders cannot be deleted.`}
          confirmLabel="Delete"
          busy={deleting}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}