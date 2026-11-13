'use client';

import Link from 'next/link';
import { ProductCard } from '@/components/catalog/ProductCard';
import { ProductCardSkeleton } from '@/components/catalog/ProductCardSkeleton';
import { ArrowForwardIcon } from '@/components/ui/Icons';

// Same-category AVAILABLE pieces. Hidden when there is nothing to show or the request fails.
export function RelatedProducts({ state, categorySlug }) {
  if (state.status === 'error' || (state.status === 'ready' && state.items.length === 0)) return null;

  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <h2 id="related-title" className="text-headline-sm font-semibold text-text md:text-headline-md">
          You might also like
        </h2>
        <Link
          href={`/catalog?category=${encodeURIComponent(categorySlug)}`}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-md px-1 text-body-md font-semibold text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          See more
          <ArrowForwardIcon className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 items-stretch gap-3.5 sm:gap-6 lg:grid-cols-4">
        {state.status === 'loading'
          ? [0, 1, 2, 3].map((i) => <ProductCardSkeleton key={i} />)
          : state.items.map((product) => <ProductCard key={product._id} product={product} />)}
      </div>
    </section>
  );
}
