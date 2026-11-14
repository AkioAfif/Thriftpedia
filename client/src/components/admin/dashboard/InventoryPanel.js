import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { HangerIcon } from '@/components/ui/icons/HangerIcon';
import { cn } from '@/lib/utils';
import { focusRing, formatCount, panel, panelHeader, secondaryButton, SectionError, SectionHeading } from './shared';

// Two solid segments; the numbers are also written out, so the bar is decorative.
function ProportionBar({ available, sold }) {
  const total = available + sold;
  const availablePct = total === 0 ? 0 : (available / total) * 100;
  return (
    <div aria-hidden="true" className="flex h-3 w-full overflow-hidden rounded-full bg-surface-muted">
      <div className="h-full bg-[#5F7A5E]" style={{ width: `${availablePct}%` }} />
      <div className="h-full bg-[#B5532E]" style={{ width: `${total === 0 ? 0 : 100 - availablePct}%` }} />
    </div>
  );
}

function Figure({ label, value, tone = 'text-text' }) {
  return (
    <div className="min-w-0">
      <dt className="text-[13px] text-[#6F6358]">
        {label}
      </dt>
      <dd className={cn('mt-1 text-[28px] font-semibold leading-tight tabular-nums md:text-2xl md:leading-8', tone)}>{formatCount(value)}</dd>
    </div>
  );
}

function InventoryBody({ products }) {
  const available = Number(products.available) || 0;
  const sold = Number(products.sold) || 0;
  const total = Number(products.total) || available + sold;
  return (
    <>
      <dl className="mt-4 grid grid-cols-3 gap-3 md:mt-5 md:gap-4">
        <Figure label="Available" value={available} tone="text-[#5F7A5E]" />
        <Figure label="Sold" value={sold} tone="text-[#B5532E]" />
        <Figure label="Total" value={total} />
      </dl>
      <div className="mt-4">
        <ProportionBar available={available} sold={sold} />
      </div>
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
    <section aria-labelledby="inventory-title" className={cn(panel, 'flex flex-col overflow-hidden')}>
      <div className={panelHeader}>
        <SectionHeading id="inventory-title" title="Inventory" icon={<HangerIcon />} />
      </div>

      <div className="px-4 pb-4 md:px-5 md:pb-5">
        {section.status === 'loading' && (
          <div aria-hidden="true">
            <div className="mt-4 grid grid-cols-3 gap-3 md:mt-5 md:gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-[60px] rounded-lg md:h-14" />
              ))}
            </div>
            <Skeleton className="mt-4 h-3 rounded-full" />
          </div>
        )}
        {section.status === 'error' && <SectionError className="mt-4 md:mt-5" message={section.error} onRetry={section.retry} />}
        {section.status === 'ready' && <InventoryBody products={section.data?.products ?? {}} />}

        {/* Below md: two full-width actions stacked; from md: one row, as before. */}
        <div className="mt-5 flex flex-col gap-2 md:mt-6 md:flex-row md:flex-wrap md:items-center md:gap-x-4 md:gap-y-2">
          <Link href="/admin/products" className={cn(secondaryButton, 'w-full md:w-auto')}>
            Manage products
          </Link>
          <Link
            href="/admin/products?status=SOLD"
            className={cn('inline-flex min-h-11 w-full items-center justify-center rounded-md px-1 text-sm font-semibold text-primary hover:underline md:w-auto md:justify-start', focusRing)}
          >
            View sold items
          </Link>
        </div>
      </div>
    </section>
  );
}
