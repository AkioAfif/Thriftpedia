import Link from 'next/link';
import { ProductCard } from '@/components/catalog/ProductCard';
import { cn } from '@/lib/utils';
import { Reveal } from './Reveal';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

export function EmptyPieces() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
      <p className="text-lg font-semibold text-text">No pieces yet</p>
      <Link
        href="/catalog"
        className={cn('inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-on-primary hover:bg-primary-hover', focusRing)}
      >
        Browse catalog
      </Link>
    </div>
  );
}

export function NewArrivals({ products = [] }) {
  return (
    <section aria-labelledby="new-arrivals-title" className="relative overflow-hidden bg-canvas py-20 md:py-32">
      <div aria-hidden="true" className="pointer-events-none absolute right-0 top-0 z-0 size-40 rounded-bl-full bg-primary-tint opacity-70 md:size-72" />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <Reveal className="mb-10 flex items-end justify-between gap-4 md:mb-12">
          <h2 id="new-arrivals-title" className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            New arrivals
          </h2>
          <Link
            href="/catalog"
            className={cn('inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-2 text-base font-bold text-primary hover:underline', focusRing)}
          >
            See all
            <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </Reveal>

        {products.length === 0 ? (
          <EmptyPieces />
        ) : (
          // ProductCard is used as-is; on the landing page a SOLD price is not struck through.
          <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 [&_.line-through]:no-underline">
            {products.map((product, i) => (
              <Reveal as="li" key={product._id} index={i} className="min-w-0">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
