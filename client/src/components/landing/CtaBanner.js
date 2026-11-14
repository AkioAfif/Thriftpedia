import Link from 'next/link';
import { getPhotoSrc } from '@/lib/adminProducts';
import { cn } from '@/lib/utils';
import { LandingPhoto } from './LandingPhoto';
import { Reveal } from './Reveal';

const FRAMES = ['-rotate-5 z-10', 'rotate-4 -ml-4 z-20'];

function BannerDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute right-14 top-1/2 z-0 hidden size-[250px] -translate-y-1/2 items-center justify-center md:flex">
      <div className="absolute size-[200px] rounded-full bg-white/10" />
      <div className="absolute size-[250px] rounded-full border-[1.5px] border-white/20" />
      <div className="absolute right-[31px] top-[31px] size-3 rounded-full bg-white/30" />
    </div>
  );
}

// Two framed photos taken from the hero products (no extra request).
export function CtaBanner({ products = [] }) {
  const photos = products.slice(0, 2);

  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-surface-muted pb-24 pt-12 md:pb-24 md:pt-16">
      <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <Reveal className="relative flex flex-col items-start gap-10 overflow-hidden rounded-[32px] bg-primary px-6 py-12 text-white sm:px-10 md:h-[280px] md:flex-row md:items-center md:justify-between md:px-14 md:py-0">
          <BannerDecor />

          <div className="relative z-10 flex flex-col items-start">
            <h2 id="cta-title" className="text-[32px] font-bold leading-tight tracking-tight text-white md:text-5xl">
              Found something you like?
            </h2>
            <p className="mt-3 max-w-[460px] text-lg leading-relaxed text-canvas">Give a one-of-a-kind piece its next chapter.</p>
            <Link
              href="/catalog"
              className="mt-6 inline-flex min-h-12 items-center rounded-full bg-white px-7 text-[15px] font-semibold text-primary shadow-level-1 transition-transform duration-200 hover:bg-canvas motion-safe:hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            >
              Browse catalog
            </Link>
          </div>

          {photos.length > 0 && (
            <div aria-hidden="true" className="relative z-10 flex shrink-0 items-center self-center md:self-auto">
              {photos.map((product, i) => (
                <div
                  key={product._id}
                  className={cn('relative size-[136px] shrink-0 overflow-hidden rounded-2xl border-8 border-white bg-white sm:size-[170px]', FRAMES[i])}
                >
                  <LandingPhoto src={getPhotoSrc(product)} alt="" fallbackLabel={product.name} sizes="170px" />
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
