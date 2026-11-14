import Link from 'next/link';
import { ConditionBadge } from '@/components/ui/Badge';
import { getPhotoSrc } from '@/lib/adminProducts';
import { cn } from '@/lib/utils';
import { LandingPhoto } from './LandingPhoto';
import { WaveDivider } from './WaveDivider';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const decor = 'pointer-events-none absolute z-0';

function HeroDecor() {
  return (
    <div aria-hidden="true">
      {/* Left blob #F6E7C1 @ 45% */}
      <div className={cn(decor, '-bottom-16 -left-36 size-[280px] rounded-full bg-[#F6E7C1] opacity-45 blur-[35px] md:size-[374px]')} />
      {/* Right blob #F4D9CC @ 45%, edges fade out through a large blur, no stroke */}
      <div
        className={cn(decor, 'left-[78%] top-[54%] h-[330px] w-[380px] -translate-x-1/2 -translate-y-1/2 bg-[#F4D9CC] opacity-45 blur-[80px] sm:h-[480px] sm:w-[540px] lg:h-[560px] lg:w-[640px]')}
        style={{ borderRadius: '58% 42% 64% 36% / 45% 62% 38% 55%' }}
      />
      <div className={cn(decor, 'left-[7%] top-14 hidden size-3 rounded-full bg-primary/20 md:block')} />
      <svg viewBox="0 0 24 24" className={cn(decor, 'right-[48%] top-28 hidden size-6 text-primary opacity-30 lg:block')}>
        <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" fill="currentColor" />
      </svg>
    </div>
  );
}

function HeroCard({ product, tall = false, priority = false, tilt, delay }) {
  const sizes = '(min-width: 1024px) 300px, 45vw';
  return (
    <div className="landing-enter" style={{ '--enter-delay': `${delay}ms` }}>
      <Link
        href={`/catalog/${product._id}`}
        className={cn(
          'group block rounded-3xl border border-text/10 bg-surface shadow-level-2 transition-transform duration-300 motion-safe:hover:rotate-0',
          tall ? 'p-3.5' : 'rounded-2xl p-3',
          tilt,
          focusRing
        )}
      >
        <div className={cn('relative overflow-hidden bg-badge-info', tall ? 'aspect-[3/4] rounded-2xl' : 'aspect-[4/3] rounded-xl')}>
          <LandingPhoto
            src={getPhotoSrc(product)}
            alt={product.name}
            sizes={sizes}
            priority={priority}
            className="transition-transform duration-500 motion-safe:group-hover:scale-105"
          />
          <ConditionBadge condition={product.condition} className="absolute left-3 top-3 z-10 bg-surface/95" />
        </div>
        {tall && <p className="truncate px-1 pb-1 pt-3 text-sm font-bold text-text">{product.name}</p>}
      </Link>
    </div>
  );
}

export function Hero({ products = [] }) {
  const [first, second, third] = products;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-surface-muted pb-24 pt-12 md:pb-32 md:pt-16">
      <HeroDecor />

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-6">
            <h1 id="hero-title" className="landing-enter text-[44px] font-extrabold leading-[1.08] tracking-tight text-text sm:text-6xl lg:text-7xl">
              One piece.
              <br />
              One owner.
            </h1>
            <p className="landing-enter max-w-[512px] text-lg leading-relaxed text-text-secondary sm:text-xl" style={{ '--enter-delay': '80ms' }}>
              Pre-loved fashion, each piece unique and available once. Handpicked vintage and modern timeless essentials.
            </p>
            <div className="landing-enter flex flex-wrap items-center gap-4 pt-2" style={{ '--enter-delay': '160ms' }}>
              <Link
                href="/catalog"
                className={cn('inline-flex min-h-12 items-center rounded-full bg-primary px-7 text-base font-semibold text-on-primary shadow-level-1 transition-colors hover:bg-primary-hover', focusRing)}
              >
                Browse catalog
              </Link>
              <Link
                href="#how-it-works"
                className={cn('inline-flex min-h-12 items-center rounded-full border-2 border-text/25 px-7 text-base font-semibold text-text transition-colors hover:border-text hover:bg-canvas', focusRing)}
              >
                How it works
              </Link>
            </div>
          </div>

          {first && (
            <div className="relative lg:col-span-6">
              <div className="grid grid-cols-2 items-center gap-4 sm:gap-6">
                <HeroCard product={first} tall priority tilt="md:-rotate-3" delay={240} />
                <div className="space-y-4 sm:space-y-6">
                  {second && <HeroCard product={second} tilt="md:rotate-3" delay={320} />}
                  {third && <HeroCard product={third} tilt="md:-rotate-1" delay={400} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 text-canvas" aria-hidden="true">
        <WaveDivider variant="hero" className="h-10 md:h-16" />
      </div>
    </section>
  );
}
