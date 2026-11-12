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

export default function ProductManagementPage() {
  const router = useRouter();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState({ key: null, items: [], meta: EMPTY_META, error: '' });
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', product }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const queryKey = `${JSON.stringify(filters)}#${refreshTick}`;
  const loading = result.key !== queryKey;

  // Token tidak valid atau kedaluwarsa: kembali ke halaman login.
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

  // Daftar produk
  useEffect(() => {
    let active = true;

    fetchProducts(filters)
      .then((data) => {
        if (!active) return;
        setResult({ key: queryKey, items: data.items, meta: data.meta, error: '' });

        // Halaman terakhir habis setelah hapus: mundur ke halaman terakhir yang masih ada.
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

  // Angka pada kartu Total / Available / Sold
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

  // Daftar kategori (sekali)
  useEffect(() => {
    let active = true;

    fetchCategories()
      .then((list) => {
        if (active) setCategories(list);
      })
      .catch(() => {
        // Gagal memuat kategori tidak menghalangi halaman; dropdown hanya berisi "All categories".
      });

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
      throw err; // ditampilkan di dalam form
    }

    const wasCreate = modal.mode === 'create';
    setModal(null);
    if (wasCreate) {
      // Tampilkan produk baru di halaman pertama, urutan terbaru.
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Product Management</h1>
          <p className="mt-2 text-sm text-[#6b5d52]">Status updates automatically when buyers order.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create', product: null })}
          className="rounded-[10px] bg-[#a3452a] px-7 py-3 text-sm font-semibold text-white hover:bg-[#8f3b23]"
        >
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

      <div className="mt-5">
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
        <p className="text-sm text-[#6b5d52]">{summary}</p>
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