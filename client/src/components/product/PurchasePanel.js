'use client';

import Link from 'next/link';
import { ErrorOutlineIcon, HeartIcon, LockIcon } from '@/components/ui/Icons';
import { conditionLabel, formatRupiah, sizeLabel } from '@/lib/adminProducts';
import { cn } from '@/lib/utils';

const btnBase =
  'inline-flex w-full min-h-[48px] items-center justify-center gap-2 rounded-md px-5 text-body-md font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const btnPrimary = `${btnBase} bg-primary text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary`;
const btnSecondary = `${btnBase} border border-border bg-surface text-text hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-border disabled:text-text-muted disabled:hover:text-text-muted`;

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent motion-reduce:animate-none"
    />
  );
}

// Three states that must read differently at a glance: colour, icon and words all change.
function StatusPanel({ view }) {
  if (view === 'taken') {
    return (
      <div role="alert" className="flex gap-3 rounded-lg border border-error/30 bg-error-tint px-4 py-3 text-[#7A1010]">
        <ErrorOutlineIcon className="mt-0.5 h-5 w-5 shrink-0 text-error" />
        <div>
          <p className="text-body-md font-semibold">Someone just bought this</p>
          <p className="text-body-sm">It sold while you were looking, so it can’t be checked out anymore.</p>
        </div>
      </div>
    );
  }
  if (view === 'sold') {
    return (
      <div className="flex gap-3 rounded-lg bg-[#4A3F35] px-4 py-3 text-white">
        <LockIcon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="text-body-md font-semibold">Sold · one of a kind</p>
          <p className="text-body-sm text-white/85">This piece has been sold.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#CFE0CB] bg-badge-success/60 px-4 py-3 text-[#2F5A2C]">
      <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3F7A3A]" />
      <p className="text-body-md font-semibold">Available · 1 of 1 piece</p>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex min-h-[32px] items-center rounded-full border border-border bg-surface px-3 text-body-sm font-medium text-text">
      {children}
    </span>
  );
}

export function PurchasePanel({
  product,
  view,
  checking,
  isAdmin,
  onBuy,
  catalogHref,
  wishlist,
  onToggleWishlist,
}) {
  const available = view === 'available';
  const wishlistDisabled = !available || isAdmin || wishlist.busy || !wishlist.ready;

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-level-1 sm:p-6">
      <div className="flex flex-col gap-2">
        {product.brand && <p className="label-md text-text-secondary">{product.brand}</p>}
        <h1 className="text-headline-mobile font-semibold text-text md:text-headline-lg">{product.name}</h1>
        <p className={cn('font-metadata text-[28px] font-semibold leading-9', available ? 'text-text' : 'text-text-muted')}>
          {formatRupiah(product.price)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip>Size {sizeLabel(product.size)}</Chip>
        <Chip>{conditionLabel(product.condition)}</Chip>
      </div>

      <StatusPanel view={view} />

      <div className="flex flex-col gap-3">
        {available ? (
          <>
            <button
              type="button"
              onClick={onBuy}
              disabled={checking || isAdmin}
              aria-busy={checking}
              aria-describedby={isAdmin ? 'admin-buy-note' : undefined}
              className={btnPrimary}
            >
              {checking ? (
                <>
                  <Spinner />
                  <span role="status">Checking availability…</span>
                </>
              ) : (
                'Buy Now'
              )}
            </button>
            {isAdmin && (
              <p id="admin-buy-note" className="text-body-sm text-text-secondary">
                Admin accounts can’t buy products. Log in with a buyer account to order.
              </p>
            )}
          </>
        ) : (
          <>
            <button type="button" disabled className={`${btnBase} cursor-not-allowed bg-[#EFEBE4] text-[#6E5D4F]`}>
              <LockIcon className="h-4 w-4" />
              Sold out
            </button>
            <Link href={catalogHref} className={btnSecondary}>
              Back to catalog
            </Link>
          </>
        )}

        <button
          type="button"
          onClick={onToggleWishlist}
          disabled={wishlistDisabled}
          aria-pressed={wishlist.saved}
          className={btnSecondary}
        >
          <HeartIcon
            filled={wishlist.saved}
            className={cn('h-[18px] w-[18px]', wishlist.saved && 'text-primary')}
          />
          {wishlist.saved ? 'Saved to Wishlist' : 'Add to Wishlist'}
        </button>
      </div>

      {available && (
        <p className="flex gap-2 text-body-sm text-text-secondary">
          <ErrorOutlineIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-secondary" />
          You can cancel while your order is Pending. Once shipped, items can’t be returned.
        </p>
      )}
    </div>
  );
}
