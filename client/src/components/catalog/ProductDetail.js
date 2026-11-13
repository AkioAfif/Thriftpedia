'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { canOptimizeImage } from '@/lib/imageHosts';
import { ConditionBadge } from '@/components/ui/Badge';
import { WishlistButton } from './WishlistButton';
import { ProductReviews } from '@/components/reviews/ProductReviews';

export function ProductDetail({ product }) {
  const [selected, setSelected] = useState(0);
  const sold = product.status === 'SOLD';
  return <main className="buyer-page">
    <nav aria-label="Breadcrumb" className="body-sm text-text-secondary"><Link className="buyer-control inline-flex min-h-11 items-center" href="/catalog">Catalog</Link> / {product.name}</nav>
    <section className="grid items-start gap-lg lg:grid-cols-2">
      <div className="space-y-md"><div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-muted">
        {product.photos?.[selected] && <Image src={product.photos[selected]} alt={product.name} fill priority sizes="(max-width: 1024px) 90vw, 45vw" className="object-cover" unoptimized={!canOptimizeImage(product.photos[selected])} />}
        <span className="label-md absolute left-md top-md rounded-full bg-badge-neutral px-2.5 py-1">{sold ? 'Sold' : 'Available'}</span>
      </div><div className="flex flex-wrap gap-sm">{product.photos?.map((photo, i) => <button key={`${photo}-${i}`} type="button" aria-label={`View photo ${i + 1}`} aria-pressed={selected === i} onClick={() => setSelected(i)} className={`buyer-control relative h-20 w-16 overflow-hidden rounded-md border ${selected === i ? 'border-primary' : 'border-border'}`}><Image src={photo} alt="" fill sizes="64px" className="object-cover" unoptimized={!canOptimizeImage(photo)} /></button>)}</div></div>
      <div className="card space-y-md p-lg"><p className="label-md text-text-secondary">{product.brand}</p><h1 className="headline-mobile lg:headline-lg">{product.name}</h1><p className="price">{formatPrice(product.price)}</p><div className="flex flex-wrap items-center gap-sm"><span className="label-md rounded-full bg-surface-muted px-2.5 py-1">Size {product.size}</span><ConditionBadge condition={product.condition} /></div><p className="body-md text-text-secondary">{sold ? 'Sold · This one-of-one piece has found a home.' : 'Available · 1-of-1 piece'}</p>
        {!sold && <Link className="buyer-primary" href={`/checkout/${product._id}`}>Buy now</Link>}
        <WishlistButton productId={product._id} productName={product.name} product={product} inline labelled />
        {sold && <Link className="buyer-secondary" href="/catalog">Back to catalog</Link>}
      </div>
    </section>
    <section className="card grid gap-lg p-lg md:grid-cols-2"><div className="space-y-md"><h2 className="headline-sm">Description</h2><p className="body-md whitespace-pre-wrap break-words">{product.description || 'Explore the photos for the details and condition of this one-of-one piece.'}</p></div><div className="space-y-md"><h2 className="headline-sm">Details</h2><dl className="body-md space-y-sm">{[['Brand', product.brand || 'Vintage'], ['Size', product.size], ['Condition', product.condition?.replaceAll('_', ' ')], ['Category', product.category?.name || 'Pre-loved']].map(([label, value]) => <div className="flex justify-between gap-md border-b border-border py-sm" key={label}><dt className="text-text-secondary">{label}</dt><dd className="text-right">{value}</dd></div>)}</dl></div></section>
    <ProductReviews product={product} />
  </main>;
}
