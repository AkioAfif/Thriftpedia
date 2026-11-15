import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';
import { focusRing, formatCount, panel, secondaryButton, SectionError } from './shared';

const plural = (n, one, many) => `${formatCount(n)} ${n === 1 ? one : many}`;

// One 16px bar (Available #5F7A5E, Sold #B5532E). The numbers are written out below it,
// each with a 10px square swatch, so the bar itself is decorative.
function InventoryBody({ products }) {
  const available = Number(products.available) || 0;
  const sold = Number(products.sold) || 0;
  const total = Number(products.total) || available + sold;
  const counted = available + sold;
  const availablePct = counted === 0 ? 0 : (available / counted) * 100;
  return (
    <>
      <p className="mt-3 text-[28px] font-semibold leading-tight text-[#2B2118]">{plural(total, 'piece', 'pieces')}</p>
      <div aria-hidden="true" className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-[#F5F0E8]">
        <div className="h-full bg-[#5F7A5E]" style={{ width: `${availablePct}%` }} />
        <div className="h-full bg-[#B5532E]" style={{ width: `${counted === 0 ? 0 : 100 - availablePct}%` }} />
      </div>
      <p className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] text-[#2B2118]">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 bg-[#5F7A5E]" />
          {formatCount(available)} available
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 bg-[#B5532E]" />
          {formatCount(sold)} sold
        </span>
      </p>
      {available === 0 && (
        <p role="status" className="mt-4 rounded-xl bg-badge-warning px-4 py-3 text-sm text-[#6B4C0C]">
          No pieces available. Add products so buyers have something to buy.
        </p>
      )}
    </>
  );
}

export function InventoryPanel({ section }) {
  return (
    <section aria-labelledby="inventory-title" className={cn(panel, 'flex flex-col p-4 md:p-6')}>
      <h2 id="inventory-title" className="text-lg font-semibold text-[#2B2118]">Inventory</h2>

      {section.status === 'loading' && (
        <div aria-hidden="true">
          <Skeleton className="mt-3 h-8 w-32 rounded" />
          <Skeleton className="mt-3 h-4 rounded-full" />
          <div className="mt-2 flex justify-between">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-16 rounded" />
          </div>
        </div>
      )}
      {section.status === 'error' && <SectionError className="mt-4" message={section.error} onRetry={section.retry} />}
      {section.status === 'ready' && <InventoryBody products={section.data?.products ?? {}} />}

      <div className="mt-6 flex flex-col gap-2">
        <Link href="/admin/products" className={cn(secondaryButton, 'w-full rounded-xl')}>
          Manage products
        </Link>
        <Link
          href="/admin/products?status=SOLD"
          className={cn('inline-flex min-h-11 w-full items-center justify-center rounded-md px-1 text-sm font-semibold text-[#B5532E] hover:underline', focusRing)}
        >
          View sold items
        </Link>
      </div>
    </section>
  );
}
