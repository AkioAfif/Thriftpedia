'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ConditionBadge } from '@/components/ui/Badge';
import { ArrowForwardIcon } from '@/components/ui/Icons';
import { WishlistButton } from '@/components/catalog/WishlistButton';
import { formatPrice } from '@/lib/utils';
import { canOptimizeImage } from '@/lib/imageHosts';
import { productHrefFrom } from '@/lib/navigation';

// Same frame as the catalog card (photo 4:5, badge top-left, heart top-right, one link with an
// overlay), but normal-case Plus Jakarta Sans throughout. Sold pieces stay in the list: dimmed
// photo, dark "Sold" badge, muted price and a neutral button; the heart still removes them.
export function WishlistCard({ product }) {
  const [imageError, setImageError] = useState(false);
  const sold = product.status === 'SOLD';
  const photoUrl = product.photos?.[0];
  const size = product.size === 'FREE' ? 'Free' : product.size;

  return (
    <article
      data-product-id={product._id}
      className="group relative flex h-full flex-col justify-between rounded-2xl border border-[#E6DDD2] bg-white p-4 shadow-card transition-shadow duration-150 hover:shadow-md motion-reduce:transition-none"
    >
      <div className="flex flex-col gap-3">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-[#FAF7F2]">
          {photoUrl && !imageError ? (
            <Image
              src={photoUrl}
              alt={product.name}
              fill
              sizes="(max-width: 639px) calc(100vw - 64px), (max-width: 1023px) 45vw, 30vw"
              className={`object-cover ${sold ? 'opacity-60' : ''}`}
              unoptimized={!canOptimizeImage(photoUrl)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#EFEBE4] text-[13px] text-[#6F6358]">No image</div>
          )}

          {/* Badge stops 8px short of the 44px heart (12 + 44 + 8 + 12 = 76px) and truncates. */}
          <div className="absolute left-3 top-3 z-10 max-w-[calc(100%-76px)] [&>span]:block [&>span]:truncate">
            {sold ? (
              <span className="rounded-full bg-[#2B2118] px-2.5 py-1 text-xs font-semibold text-white">Sold</span>
            ) : (
              <ConditionBadge condition={product.condition} className="font-semibold" />
            )}
          </div>

          {/* Stays active for sold pieces so they can be removed. */}
          <WishlistButton productId={product._id} productName={product.name} product={product} />
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="truncate text-base font-semibold text-[#2B2118]">{product.name}</h2>
          <p className="flex items-center justify-between gap-3 text-[13px] text-[#6F6358]">
            <span className="min-w-0 truncate">{product.brand || 'Vintage'}</span>
            <span className="shrink-0">Size {size}</span>
          </p>
          <p className={`pt-1 font-sans text-lg font-semibold leading-tight ${sold ? 'text-[#776B5F]' : 'text-[#2B2118]'}`}>
            {formatPrice(product.price)}
          </p>
          {sold && <p className="text-[13px] text-[#6F6358]">No longer available</p>}
        </div>
      </div>

      <div className="mt-3 border-t border-[#E6DDD2]/60 pt-3">
        {/* The card's only link; its ::after stretches over the card (the heart sits above it). */}
        <Link
          href={productHrefFrom(product._id, '/wishlist')}
          aria-label={`View details, ${product.name}${sold ? ', sold' : ''}`}
          className={`flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors duration-150 after:absolute after:inset-0 after:rounded-2xl after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none ${
            sold
              ? 'border border-[#D9CFC1] bg-white text-[#2B2118] hover:bg-[#F5F0E8]'
              : 'bg-[#FAF7F2] text-[#2B2118] hover:bg-[#B5532E] hover:text-white'
          }`}
        >
          View details
          <ArrowForwardIcon className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
