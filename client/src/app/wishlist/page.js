'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/BuyerContext';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';

export default function WishlistPage() {
  const { ready, isLoggedIn } = useAuth();
  const { items, count, query, buyer, requestLogin } = useWishlist();
  const loading = !ready || (buyer && query.isPending);
  return <main className="buyer-page">
    <h1 className="headline-mobile lg:headline-lg">Your Wishlist</h1>
    {isLoggedIn && buyer && <p aria-live="polite" className="label-md text-text-secondary">{loading ? 'Loading saved items…' : `${count} ${count === 1 ? 'item' : 'items'}`}</p>}
    <p className="body-md text-text-secondary">Saved items aren’t reserved.</p>
    {ready && !isLoggedIn ? <section className="card space-y-md py-xl text-center"><h2 className="headline-sm">Your saved finds, all in one place</h2><p className="body-md text-text-secondary">Log in to see the pieces you’ve saved.</p><Button variant="buyerPrimary" size="lg" onClick={requestLogin}>Log in</Button></section>
      : ready && !buyer ? <p role="status" className="body-md">Wishlist is available for buyer accounts.</p>
      : <>
        {query.isError && <div role="alert" className="space-y-md rounded-md border border-error bg-error-tint p-md"><p className="body-md">! {query.error.message}</p><Button variant="buyerPrimary" size="lg" onClick={() => query.refetch()}>Try again</Button></div>}
        {loading ? <div aria-busy="true" aria-label="Loading wishlist" className="grid gap-lg md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((id) => <div key={id} className="card flex flex-col gap-md"><Skeleton className="h-[300px] bg-surface-muted" />{[44, 22, 18, 24, 48].map((height, i) => <Skeleton key={i} className="bg-surface-muted" style={{ height }} />)}</div>)}</div>
          : items.length ? <div className="grid items-start gap-lg md:grid-cols-2 lg:grid-cols-3">{items.map(({ product }) => <ProductCard key={product._id} product={product} wishlist />)}</div>
            : !query.isError && <section className="card space-y-md py-xl text-center"><h2 className="headline-sm">A little room for new finds</h2><p className="body-md text-text-secondary">Save the pieces you love and find them here.</p><Link href="/catalog" className="buyer-primary mx-auto w-fit">Explore catalog</Link></section>}
      </>}
  </main>;
}
