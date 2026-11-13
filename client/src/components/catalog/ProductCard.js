'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, ConditionBadge } from '@/components/ui/Badge';
import { WishlistButton } from './WishlistButton';
import { ArrowForwardIcon } from '@/components/ui/Icons';
import { formatPrice } from '@/lib/utils';
import { canOptimizeImage } from '@/lib/imageHosts';

export function ProductCard({ product }) {
  const [imageError, setImageError] = useState(false);
  const isSold = product.status === 'SOLD';
  const photoUrl = product.photos?.[0];

  return (
    <div
      data-layer="ProductCard"
      data-product-id={product._id}
      data-status={product.status?.toLowerCase()}
      className="group relative flex flex-col justify-between h-full bg-white border border-[#E6DDD2] hover:border-[#B5532E]/40 rounded-2xl p-4 shadow-card hover:shadow-md transition-all duration-300"
    >
      <div className="flex flex-col gap-3">
        {/* Photo Container */}
        <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#FAF7F2]">
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
            <div className="absolute inset-0 bg-[#2B2118]/20 pointer-events-none" />
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
            isSold={isSold}
          />
        </div>

        {/* Product Details */}
        <div className="flex flex-col gap-1">
          <h3
            className={`font-semibold text-[15px] sm:text-base truncate transition-colors ${
              isSold
                ? 'text-[#5C4D40]'
                : 'text-[#2B2118] group-hover:text-[#B5532E]'
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
                  : 'text-[#2B2118]'
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
          className={`w-full min-h-[44px] px-3 py-1.5 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 focus-visible:outline-none after:absolute after:inset-0 after:rounded-2xl after:content-[''] ${
            isSold
              ? 'border border-[#E6DDD2] bg-white text-[#5C4D40] hover:border-[#B5532E] hover:text-[#B5532E]'
              : 'bg-[#FAF7F2] hover:bg-[#B5532E] text-[#2B2118] hover:text-white'
          }`}
        >
          <span>View Details</span>
          <ArrowForwardIcon className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
