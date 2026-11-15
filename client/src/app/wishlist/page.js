'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/BuyerContext';
import { BackToCatalogLink } from '@/components/orders/BackToCatalogLink';
import { WishlistCard } from '@/components/wishlist/WishlistCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

// Same content width and side padding as the catalog page.
const PAGE = 'mx-auto w-full max-w-7xl flex-1 px-4 pb-12 pt-5 sm:px-8 md:pt-8';
const GRID = 'grid grid-cols-1 items-start gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3';

function HeartOutline() {
  return (
    <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" className="text-[#B5532E]">
      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
    </svg>
  );
}

function GridSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading wishlist" className={GRID}>
      {[0, 1, 2].map((id) => (
        <div key={id} className="flex flex-col gap-3 rounded-2xl border border-[#E6DDD2] bg-white p-4">
          <Skeleton className="aspect-[4/5] w-full rounded-xl" />
          <Skeleton className="h-5 w-3/4 rounded" />
          <Skeleton className="h-4 w-1/2 rounded" />
          <Skeleton className="h-6 w-28 rounded" />
          <Skeleton className="mt-2 h-11 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export default function WishlistPage() {
  const { ready, isLoggedIn } = useAuth();
  const { items, count, query, buyer, requestLogin } = useWishlist();
  const loading = !ready || (buyer && query.isPending);

  return (
    <main className={PAGE}>
      <BackToCatalogLink />

      <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-[28px] font-semibold leading-tight text-[#2B2118] md:text-[32px]">Your Wishlist</h1>
        {isLoggedIn && buyer && (
          <p aria-live="polite" className="text-sm text-[#6F6358]">
            {loading ? 'Loading saved items…' : `${count} ${count === 1 ? 'item' : 'items'}`}
          </p>
        )}
      </header>

      <div className="mt-6 space-y-6">
        {ready && !isLoggedIn ? (
          <section className="card space-y-md py-xl text-center">
            <h2 className="headline-sm">Your saved finds, all in one place</h2>
            <p className="body-md text-text-secondary">Log in to see the pieces you’ve saved.</p>
            <Button variant="buyerPrimary" size="lg" onClick={requestLogin}>Log in</Button>
          </section>
        ) : ready && !buyer ? (
          <p role="status" className="body-md">Wishlist is available for buyer accounts.</p>
        ) : (
          <>
            {query.isError && (
              <div role="alert" className="flex flex-col items-start gap-3 rounded-2xl border border-error bg-error-tint p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[#2B2118]">Couldn’t load your wishlist. {query.error.message}</p>
                <Button variant="buyerPrimary" size="lg" onClick={() => query.refetch()}>Retry</Button>
              </div>
            )}
            {loading ? (
              <GridSkeleton />
            ) : items.length ? (
              <div className={GRID}>
                {items.map(({ product }) => <WishlistCard key={product._id} product={product} />)}
              </div>
            ) : (
              !query.isError && (
                <section className="flex flex-col items-center gap-3 rounded-2xl border border-[#E6DDD2] bg-white px-6 py-12 text-center">
                  <HeartOutline />
                  <h2 className="text-xl font-semibold text-[#2B2118]">Your wishlist is empty</h2>
                  <p className="text-sm text-[#6F6358]">Tap the heart on a piece to save it here.</p>
                  <Link href="/catalog" className="buyer-primary mt-2 w-fit">Browse catalog</Link>
                </section>
              )
            )}
          </>
        )}
      </div>
    </main>
  );
}
