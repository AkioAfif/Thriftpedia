'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BoxIcon, SearchIcon, TrashIcon } from '../icons';
import { conditionLabel, formatRupiah, getPhotoSrc, sizeLabel } from '../../../lib/adminProducts';

const CONDITION_STYLES = {
  NEW_WITH_TAGS: 'bg-[#dff0e0] text-[#1F5A2B]',
  LIKE_NEW: 'bg-[#dce9f2] text-[#1F4B66]',
  GOOD_VINTAGE: 'bg-[#f7e9c4] text-[#6B4C0C]',
  FAIR_DISTRESSED: 'bg-[#f6dfd2] text-[#7A3416]',
};

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1';
const primaryBtn = `inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#a3452a] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#8f3b23] ${focusRing}`;
const SOLD_DELETE_HINT = 'Sold products have an order and can’t be deleted.';

const COLUMNS = [
  { label: 'Product' },
  { label: 'Category' },
  { label: 'Size' },
  { label: 'Condition' },
  { label: 'Price', align: 'text-right' },
  { label: 'Status' },
  { label: 'Actions' },
];

function AlertIcon(props) {
  return (
    <svg aria-hidden="true" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}

// Same tile when there is no photo or it fails to load (e.g. an old local /uploads URL).
function ProductThumb({ product, className }) {
  const src = getPhotoSrc(product);
  const [failedSrc, setFailedSrc] = useState(null);
  if (!src || failedSrc === src) {
    return <span aria-hidden="true" className={`block shrink-0 rounded-lg bg-[#efe9e0] ${className}`} />;
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={`shrink-0 rounded-lg bg-[#efe9e0] object-cover ${className}`}
    />
  );
}

function Badge({ className, children }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const sold = status === 'SOLD';
  return <Badge className={sold ? 'bg-[#E8E1D8] text-[#5C4D40]' : 'bg-[#dff0e0] text-[#1F5A2B]'}>{sold ? 'Sold' : 'Available'}</Badge>;
}

// Server rule: sold products cannot be edited or deleted, and neither can products with orders.
function RowActions({ product, onDelete }) {
  const sold = product.status === 'SOLD';
  const hintId = `delete-hint-${product._id}`;
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/products/${product._id}/edit`}
        aria-label={`${sold ? 'View' : 'Edit'} ${product.name}`}
        className={`inline-flex min-h-[44px] items-center rounded-xl border border-[#CFBEAE] bg-white px-4 text-sm font-semibold text-[#2b1d14] hover:bg-[#faf7f2] md:min-h-[40px] ${focusRing}`}
      >
        {sold ? 'View' : 'Edit'}
      </Link>
      <button
        type="button"
        onClick={() => {
          if (!sold) onDelete(product);
        }}
        aria-disabled={sold || undefined}
        aria-label={`Delete ${product.name}`}
        aria-describedby={sold ? hintId : undefined}
        title={sold ? SOLD_DELETE_HINT : undefined}
        className={`flex h-11 w-11 items-center justify-center rounded-xl border bg-white md:h-10 md:w-10 ${focusRing} ${
          sold ? 'cursor-not-allowed border-[#E8E1D8] text-[#A89B8E]' : 'border-[#CFBEAE] text-[#2b1d14] hover:bg-[#faf7f2]'
        }`}
      >
        <TrashIcon width={18} height={18} />
      </button>
      {sold && (
        <span id={hintId} className="sr-only">
          {SOLD_DELETE_HINT}
        </span>
      )}
    </div>
  );
}

function TableHead() {
  return (
    <thead>
      <tr className="bg-[#f1ebe1] text-left text-[#4A3F35]">
        {COLUMNS.map((col) => (
          <th key={col.label} scope="col" className={`px-4 py-3.5 font-semibold ${col.align ?? ''}`}>
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

const bar = 'block h-3.5 animate-pulse rounded-full bg-[#efe9e0]';

function LoadingRows() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading products</span>
      <table className="hidden w-full min-w-[920px] border-collapse text-sm md:table" aria-hidden="true">
        <TableHead />
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr key={i} className="border-t border-[#efe9e0]">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="block h-[50px] w-10 animate-pulse rounded-lg bg-[#efe9e0]" />
                  <span className={`${bar} w-48`} />
                </div>
              </td>
              <td className="px-4 py-4"><span className={`${bar} w-20`} /></td>
              <td className="px-4 py-4"><span className={`${bar} w-8`} /></td>
              <td className="px-4 py-4"><span className={`${bar} w-24`} /></td>
              <td className="px-4 py-4"><span className={`${bar} ml-auto w-24`} /></td>
              <td className="px-4 py-4"><span className={`${bar} w-20`} /></td>
              <td className="px-4 py-4"><span className={`${bar} w-24`} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="divide-y divide-[#efe9e0] md:hidden" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex gap-3 p-4">
            <span className="block h-20 w-16 animate-pulse rounded-lg bg-[#efe9e0]" />
            <span className="flex flex-1 flex-col gap-2.5 pt-1">
              <span className={`${bar} w-3/4`} />
              <span className={`${bar} w-1/3`} />
              <span className={`${bar} w-1/4`} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StateMessage({ icon, title, children, action, live }) {
  return (
    <div role={live ? 'alert' : undefined} className="flex flex-col items-center px-6 py-16 text-center sm:py-24">
      <span className="text-[#6E5D4F]">{icon}</span>
      <p className="mt-5 text-xl font-semibold text-[#2b1d14] sm:text-2xl">{title}</p>
      <p className="mt-2 max-w-[28rem] text-sm text-[#6E5D4F]">{children}</p>
      {action && <div className="mt-6 w-full max-w-[12rem]">{action}</div>}
    </div>
  );
}

export default function ProductTable({
  items,
  initialLoading,
  refreshing,
  error,
  filtered,
  onRetry,
  onResetFilters,
  onDelete,
}) {
  let body;

  if (error) {
    body = (
      <StateMessage
        live
        icon={<AlertIcon />}
        title="Couldn't load products"
        action={
          <button type="button" onClick={onRetry} className={`${primaryBtn} w-full`}>
            Retry
          </button>
        }
      >
        Please try again. Your filters have been kept.
      </StateMessage>
    );
  } else if (initialLoading) {
    body = <LoadingRows />;
  } else if (items.length === 0) {
    body = filtered ? (
      <StateMessage
        icon={<SearchIcon width={36} height={36} strokeWidth={1.5} />}
        title="No matches"
        action={
          <button type="button" onClick={onResetFilters} className={`${primaryBtn} w-full`}>
            Reset filters
          </button>
        }
      >
        No products match these filters. Try a different search or reset the filters.
      </StateMessage>
    ) : (
      <StateMessage
        icon={<BoxIcon width={36} height={36} strokeWidth={1.5} />}
        title="No products yet"
        action={
          <Link href="/admin/products/new" className={`${primaryBtn} w-full`}>
            Add Product
          </Link>
        }
      >
        Add your first product to start building the catalog.
      </StateMessage>
    );
  } else {
    body = (
      <div aria-busy={refreshing || undefined} className={`transition-opacity duration-150 ${refreshing ? 'opacity-50' : ''}`}>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[920px] border-collapse text-sm">
            <caption className="sr-only">Products</caption>
            <TableHead />
            <tbody>
              {items.map((product) => (
                <tr key={product._id} className="border-t border-[#efe9e0] hover:bg-[#FAF7F2]">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <ProductThumb product={product} className="h-[50px] w-10" />
                      <div className="min-w-0 max-w-[240px]">
                        <p className="truncate font-semibold text-[#2b1d14]" title={product.name}>
                          {product.name}
                        </p>
                        <p className="truncate text-xs text-[#6E5D4F]">{product.brand || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-[#2b1d14]">{product.category?.name ?? '—'}</td>
                  <td className="px-4 py-3.5 text-[#2b1d14]">{sizeLabel(product.size)}</td>
                  <td className="px-4 py-3.5">
                    <Badge className={CONDITION_STYLES[product.condition] ?? 'bg-[#efe9e0] text-[#4A3F35]'}>
                      {conditionLabel(product.condition)}
                    </Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold tabular-nums text-[#2b1d14]">
                    {formatRupiah(product.price)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={product.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <RowActions product={product} onDelete={onDelete} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-[#efe9e0] md:hidden" aria-label="Products">
          {items.map((product) => (
            <li key={product._id} className="flex gap-3 p-4">
              <ProductThumb product={product} className="h-20 w-16" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[#2b1d14]">{product.name}</p>
                <p className="truncate text-xs text-[#6E5D4F]">
                  {[product.brand, sizeLabel(product.size)].filter(Boolean).join(' · ')}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="font-semibold tabular-nums text-[#2b1d14]">{formatRupiah(product.price)}</span>
                  <StatusBadge status={product.status} />
                </div>
                <div className="mt-3">
                  <RowActions product={product} onDelete={onDelete} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return <div className="overflow-hidden rounded-[20px] border border-[#e8e1d8] bg-white">{body}</div>;
}
