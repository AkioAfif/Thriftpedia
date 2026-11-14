'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, ConditionBadge } from '@/components/ui/Badge';
import { WishlistButton } from './WishlistButton';
import { ArrowForwardIcon } from '@/components/ui/Icons';
import { formatPrice } from '@/lib/utils';
import { canOptimizeImage } from '@/lib/imageHosts';

export function ProductCard({ product, wishlist = false }) {
  const [imageError, setImageError] = useState(false);
  const isSold = product.status === 'SOLD';
  const photoUrl = product.photos?.[0];

  if (wishlist) return (
    <article data-product-id={product._id} className="flex min-w-0 flex-col gap-md rounded-xl border border-border bg-surface p-md shadow-level-1">
      <div className="relative h-[300px] overflow-hidden rounded-lg bg-surface-muted">
        {photoUrl && !imageError ? <Image src={photoUrl} alt={product.name} fill sizes="(max-width: 767px) calc(100vw - 66px), (max-width: 1024px) 45vw, 30vw" className="object-cover" unoptimized={!canOptimizeImage(photoUrl)} onError={() => setImageError(true)} />
          : <span className="absolute inset-0 flex items-center justify-center body-sm text-text-secondary">Photo unavailable</span>}
      </div>
      <div className="flex min-h-11 items-start gap-sm">
        <ConditionBadge condition={product.condition} className="label-md bg-surface-muted text-text shadow-none" />
        {isSold && <span className="label-md rounded-full bg-badge-neutral px-2.5 py-1">SOLD</span>}
        <div className="flex-1" />
        <WishlistButton productId={product._id} productName={product.name} product={product} inline />
      </div>
      <h2 className="text-title-md font-semibold break-words">{product.name}</h2>
      <p className="label-md text-text-secondary">Size {product.size}</p>
      <p className="price">{formatPrice(product.price)}</p>
      <Link href={`/catalog/${product._id}`} className="buyer-secondary mt-auto text-center">View details</Link>
    </article>
  );

  return (
    <div
      data-layer="ProductCard"
      data-product-id={product._id}
      data-status={product.status?.toLowerCase()}
      className="group relative flex flex-col justify-between h-full bg-white border border-[#E6DDD2] hover:border-primary/40 rounded-2xl p-4 shadow-card hover:shadow-md transition-all duration-300"
    >
      <div className="flex flex-col gap-3">
        {/* Photo Container */}
        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-canvas">
          {photoUrl && !imageError ? (
            <Image
              src={photoUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 300px"
              className={`object-cover transition-transform duration-300 ease-out ${
                isSold
                  ? 'opacity-75 grayscale'
                  : 'group-hover:scale-105'
              }`}
              unoptimized={!canOptimizeImage(photoUrl)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-[#EFEBE4] flex items-center justify-center text-xs font-mono text-[#8C7E72]">
              No image
            </div>
          )}

          {/* Sold Overlay */}
          {isSold && (
            <div className="absolute inset-0 bg-text/20 pointer-events-none" />
          )}

          {/* Top-left badge: Sold or Condition badge */}
          <div className="absolute top-3 left-3 z-10">
            {isSold ? (
              <Badge variant="sold" />
            ) : (
              <ConditionBadge condition={product.condition} />
            )}
          </div>

          {/* Top-right wishlist button */}
          <WishlistButton
            productId={product._id}
            productName={product.name}
            product={product}
            isSold={isSold}
            disabled={isSold}
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-1">
          <h3
            className={`font-semibold text-[15px] sm:text-base truncate transition-colors ${
              isSold
                ? 'text-[#5C4D40]'
                : 'text-text group-hover:text-primary'
            }`}
          >
            {product.name}
          </h3>

          <div className="flex items-center justify-between text-xs">
            <span
              className={`font-medium uppercase truncate ${
                isSold ? 'text-[#6E5D4F]' : 'text-[#4A3F35]'
              }`}
            >
              {product.brand || 'VINTAGE'}
            </span>
            <span
              className={`font-mono font-bold uppercase shrink-0 ${
                isSold ? 'text-[#6E5D4F]' : 'text-[#4A3F35]'
              }`}
            >
              Size {product.size}
            </span>
          </div>

          <div className="pt-1.5 flex items-baseline">
            <span
              className={`text-base sm:text-lg font-bold font-mono leading-none ${
                isSold
                  ? 'text-[#6E5D4F] line-through'
                  : 'text-text'
              }`}
            >
              {formatPrice(product.price)}
            </span>
          </div>

        </div>
      </div>
      {/* Action Button */}
      <div className="pt-3 mt-3 border-t border-[#E6DDD2]/60">
        {/* The only link in the card; its ::after stretches over the photo and name so they are clickable too. */}
        <Link
          href={`/catalog/${product._id}`}
          aria-label={`View details, ${product.name}${isSold ? ', sold' : ''}`}
          className={`w-full min-h-[44px] px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] ${
            isSold
              ? 'border border-[#E6DDD2] bg-white text-[#5C4D40] hover:border-primary hover:text-primary'
              : 'bg-canvas hover:bg-primary text-text hover:text-white'
          }`}
        >
          <span>View Details</span>
          <ArrowForwardIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
