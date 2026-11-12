'use client';

import { TrashIcon } from '../icons';
import {
  conditionLabel,
  formatRupiah,
  getPhotoSrc,
  sizeLabel,
} from '../../../lib/adminProducts';

const CONDITION_STYLES = {
  NEW_WITH_TAGS: 'bg-[#dff0e0] text-[#2f6b3a]',
  LIKE_NEW: 'bg-[#dce9f2] text-[#2f5d78]',
  GOOD_VINTAGE: 'bg-[#f7e9c4] text-[#7a5a12]',
  FAIR_DISTRESSED: 'bg-[#f6dfd2] text-[#8a3f1d]',
};

function ProductThumb({ product }) {
  const src = getPhotoSrc(product);
  if (!src) {
    return <span aria-hidden="true" className="block h-[50px] w-10 shrink-0 rounded-md bg-[#efe9e0]" />;
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt="" loading="lazy" className="h-[50px] w-10 shrink-0 rounded-md bg-[#efe9e0] object-cover" />;
}

function Badge({ className, children }) {
  return (
    <span className={`inline-block min-w-24 rounded-full px-3 py-1.5 text-center text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function Shell({ children }) {
  return <div className="overflow-hidden rounded-[20px] border border-[#e8e1d8] bg-white">{children}</div>;
}

export default function ProductTable({
  items,
  initialLoading,
  refreshing,
  error,
  hasActiveFilters,
  onRetry,
  onResetFilters,
  onEdit,
  onDelete,
}) {
  if (error) {
    return (
      <Shell>
        <div className="px-6 py-16 text-center">
          <p className="text-lg font-semibold text-[#2b1d14]">Gagal memuat produk</p>
          <p className="mt-2 text-sm text-[#6b5d52]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 rounded-[10px] bg-[#a3452a] px-5 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  if (initialLoading) {
    return (
      <Shell>
        <div className="space-y-4 p-6" aria-busy="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-[#efe9e0]" />
          ))}
        </div>
      </Shell>
    );
  }

  if (items.length === 0) {
    return (
      <Shell>
        <div className="px-6 py-16 text-center">
          <p className="text-lg font-semibold text-[#2b1d14]">No products found</p>
          <p className="mt-2 text-sm text-[#6b5d52]">
            {hasActiveFilters ? 'Try changing or clearing your filters.' : 'Add your first product to get started.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-5 rounded-[10px] bg-[#a3452a] px-5 py-2 text-sm font-semibold text-white"
            >
              Reset filters
            </button>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={`overflow-x-auto transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#f1ebe1] text-left text-[#6b5d52]">
              <th scope="col" className="px-4 py-3.5 font-medium">Product</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Category</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Size</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Condition</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Price</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Status</th>
              <th scope="col" className="px-4 py-3.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => {
              const sold = product.status === 'SOLD';
              return (
                <tr key={product._id} className="border-t border-[#efe9e0]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ProductThumb product={product} />
                      <div className="min-w-0 max-w-[240px]">
                        <p className="truncate font-medium text-[#2b1d14]">{product.name}</p>
                        <p className="truncate text-xs text-[#6b5d52]">{product.brand || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#2b1d14]">{product.category?.name ?? '—'}</td>
                  <td className="px-4 py-4 text-[#2b1d14]">{sizeLabel(product.size)}</td>
                  <td className="px-4 py-4">
                    <Badge className={CONDITION_STYLES[product.condition] ?? 'bg-[#efe9e0] text-[#6b5d52]'}>
                      {conditionLabel(product.condition)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 font-medium text-[#2b1d14]">{formatRupiah(product.price)}</td>
                  <td className="px-4 py-4">
                    <Badge className={sold ? 'bg-[#e8e1d8] text-[#8d8075]' : 'bg-[#dff0e0] text-[#2f6b3a]'}>
                      {sold ? 'Sold' : 'Available'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(product)}
                        aria-label={`Edit ${product.name}`}
                        className="rounded-lg border border-[#e8e1d8] bg-white px-4 py-2 text-sm font-medium text-[#2b1d14] hover:bg-[#faf7f2]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(product)}
                        disabled={sold}
                        aria-label={`Delete ${product.name}`}
                        title={sold ? 'Sold products cannot be deleted' : 'Delete product'}
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#e8e1d8] bg-white text-[#2b1d14] hover:bg-[#faf7f2] disabled:cursor-not-allowed disabled:text-[#c9c0b5] disabled:hover:bg-white"
                      >
                        <TrashIcon width={18} height={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}