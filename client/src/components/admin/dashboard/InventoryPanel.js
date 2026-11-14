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
      <div className="h-full bg-secondary" style={{ width: `${availablePct}%` }} />
      <div className="h-full bg-primary" style={{ width: `${total === 0 ? 0 : 100 - availablePct}%` }} />
    </div>
  );
}

function Figure({ label, value, tone = 'text-text' }) {
  return (
    <div>
      <dt className="text-[13px] text-text-secondary">
        {label}
      </dt>
      <dd className={cn('mt-1 text-2xl font-semibold tabular-nums', tone)}>{formatCount(value)}</dd>
    </div>
  );
}

function InventoryBody({ products }) {
  const available = Number(products.available) || 0;
  const sold = Number(products.sold) || 0;
  const total = Number(products.total) || available + sold;
  return (
    <>
      <dl className="mt-5 grid grid-cols-3 gap-4">
        <Figure label="Available" value={available} tone="text-secondary" />
        <Figure label="Sold" value={sold} tone="text-primary" />
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

      <div className="px-5 pb-5">
        {section.status === 'loading' && (
          <div aria-hidden="true">
            <div className="mt-5 grid grid-cols-3 gap-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
            <Skeleton className="mt-4 h-3 rounded-full" />
          </div>
        )}
        {section.status === 'error' && <SectionError className="mt-5" message={section.error} onRetry={section.retry} />}
        {section.status === 'ready' && <InventoryBody products={section.data?.products ?? {}} />}

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href="/admin/products" className={secondaryButton}>
            Manage products
          </Link>
          <Link
            href="/admin/products?status=SOLD"
            className={cn('inline-flex min-h-11 items-center rounded-md px-1 text-sm font-semibold text-primary hover:underline', focusRing)}
          >
            View sold items
          </Link>
        </div>
      </div>
    </section>
  );
}
