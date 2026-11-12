'use client';

import Link from 'next/link';
import { TrashIcon } from '../icons';
import {
  conditionLabel,
  formatRupiah,
  getPhotoSrc,
  sizeLabel,
} from '../../../lib/adminProducts';

const CONDITION_STYLES = {
  NEW_WITH_TAGS: 'bg-[#dff0e0] text-[#1F5A2B]',
  LIKE_NEW: 'bg-[#dce9f2] text-[#1F4B66]',
  GOOD_VINTAGE: 'bg-[#f7e9c4] text-[#6B4C0C]',
  FAIR_DISTRESSED: 'bg-[#f6dfd2] text-[#7A3416]',
};

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]';

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
    <span className={`inline-flex min-w-24 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${className}`}>
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
  onDelete,
}) {
  if (error) {
    return (
      <Shell>
        <div className="px-6 py-16 text-center">
          <p className="text-lg font-semibold text-[#2b1d14]">Failed to load products</p>
          <p className="mt-2 text-sm text-[#6E5D4F]">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className={`mt-5 min-h-[40px] rounded-xl bg-[#a3452a] px-5 text-sm font-semibold text-white ${focusRing}`}
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
          <p className="text-lg font-semibold text-[#2b1d14]">
            {hasActiveFilters ? 'No products match your filters' : 'No products yet'}
          </p>
          <p className="mt-2 text-sm text-[#6E5D4F]">
            {hasActiveFilters ? 'Try changing or clearing your filters.' : 'Add your first product to get started.'}
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className={`mt-5 min-h-[40px] rounded-xl bg-[#a3452a] px-5 text-sm font-semibold text-white ${focusRing}`}
            >
              Reset all
            </button>
          ) : (
            <Link
              href="/admin/products/new"
              className={`mt-5 inline-flex min-h-[40px] items-center rounded-xl bg-[#a3452a] px-5 text-sm font-semibold text-white ${focusRing}`}
            >
              Add Product
            </Link>
          )}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className={`overflow-x-auto transition-opacity ${refreshing ? 'opacity-60' : ''}`}>
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <caption className="sr-only">Products</caption>
          <thead>
            <tr className="bg-[#f1ebe1] text-left text-[#4A3F35]">
              <th scope="col" className="px-4 py-3.5 font-semibold">Product</th>
              <th scope="col" className="px-4 py-3.5 font-semibold">Category</th>
              <th scope="col" className="px-4 py-3.5 font-semibold">Size</th>
              <th scope="col" className="px-4 py-3.5 font-semibold">Condition</th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">Price</th>
              <th scope="col" className="px-4 py-3.5 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3.5 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((product) => {
              const sold = product.status === 'SOLD';
              const hintId = `delete-hint-${product._id}`;
              return (
                <tr key={product._id} className="border-t border-[#efe9e0] hover:bg-[#FAF7F2]">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <ProductThumb product={product} />
                      <div className="min-w-0 max-w-[240px]">
                        <p className="truncate font-semibold text-[#2b1d14]" title={product.name}>{product.name}</p>
                        <p className="truncate text-xs text-[#6E5D4F]">{product.brand || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[#2b1d14]">{product.category?.name ?? '—'}</td>
                  <td className="px-4 py-4 text-[#2b1d14]">{sizeLabel(product.size)}</td>
                  <td className="px-4 py-4">
                    <Badge className={CONDITION_STYLES[product.condition] ?? 'bg-[#efe9e0] text-[#4A3F35]'}>
                      {conditionLabel(product.condition)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-right font-mono font-semibold tabular-nums text-[#2b1d14]">
                    {formatRupiah(product.price)}
                  </td>
                  <td className="px-4 py-4">
                    <Badge className={sold ? 'bg-[#E8E1D8] text-[#5C4D40]' : 'bg-[#dff0e0] text-[#1F5A2B]'}>
                      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${sold ? 'bg-[#5C4D40]' : 'bg-[#1F5A2B]'}`} />
                      {sold ? 'Sold' : 'Available'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/products/${product._id}/edit`}
                        aria-label={`${sold ? 'View' : 'Edit'} ${product.name}`}
                        className={`flex min-h-[40px] items-center rounded-xl border border-[#CFBEAE] bg-white px-4 text-sm font-semibold text-[#2b1d14] hover:bg-[#faf7f2] ${focusRing}`}
                      >
                        {sold ? 'View' : 'Edit'}
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          if (!sold) onDelete(product);
                        }}
                        aria-disabled={sold}
                        aria-label={`Delete ${product.name}`}
                        aria-describedby={sold ? hintId : undefined}
                        title={sold ? "Sold products can't be deleted." : `Delete ${product.name}`}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border bg-white ${focusRing} ${
                          sold
                            ? 'cursor-not-allowed border-[#E8E1D8] text-[#A89B8E]'
                            : 'border-[#CFBEAE] text-[#2b1d14] hover:bg-[#faf7f2]'
                        }`}
                      >
                        <TrashIcon width={18} height={18} />
                      </button>
                      {sold && (
                        <span id={hintId} className="sr-only">
                          Sold products can&apos;t be deleted.
                        </span>
                      )}
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