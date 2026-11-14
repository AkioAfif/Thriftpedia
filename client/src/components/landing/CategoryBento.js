import Link from 'next/link';
import { cn } from '@/lib/utils';
import { LandingPhoto } from './LandingPhoto';
import { Reveal } from './Reveal';

// Photo placement per layout (from md up; on mobile the photo sits under the text, 160px tall).
const LAYOUTS = {
  half: {
    card: 'md:h-80 rounded-[40px] md:rounded-[48px]',
    text: 'p-6 sm:p-8 md:h-full md:max-w-[50%]',
    photo: 'md:absolute md:inset-y-0 md:right-0 md:h-full md:w-1/2',
    sizes: '(min-width: 1024px) 210px, (min-width: 768px) 25vw, 100vw',
  },
  bottom: {
    card: 'md:h-80 rounded-3xl',
    text: 'p-5 md:h-[40%]',
    photo: 'md:absolute md:inset-x-0 md:bottom-0 md:h-[60%]',
    sizes: '(min-width: 1024px) 210px, (min-width: 768px) 50vw, 100vw',
  },
  third: {
    card: 'md:h-44 rounded-3xl',
    text: 'p-6 md:h-full md:max-w-[66%]',
    photo: 'md:absolute md:inset-y-0 md:right-0 md:h-full md:w-1/3',
    sizes: '(min-width: 1024px) 210px, (min-width: 768px) 17vw, 100vw',
  },
};

const CATEGORIES = [
  { slug: 'jackets', label: 'Jackets', eyebrow: 'Outerwear', layout: 'half', span: 'lg:col-span-2', bg: 'bg-badge-info', fallback: 'bg-[#CFE2EC]', dot: '-bottom-10 -right-10 size-44 bg-white/40' },
  { slug: 'hats', label: 'Hats', layout: 'bottom', span: 'lg:col-span-1', bg: 'bg-badge-warning', fallback: 'bg-[#EFDBA8]' },
  { slug: 'accessories', label: 'Accessories', layout: 'bottom', span: 'lg:col-span-1', bg: 'bg-canvas', fallback: 'bg-border' },
  { slug: 'tops', label: 'Tops', eyebrow: 'Everyday wear', eyebrowTone: 'text-primary-hover', layout: 'half', span: 'lg:col-span-2', bg: 'bg-primary-tint', fallback: 'bg-badge-danger', dot: '-right-8 -top-8 size-40 bg-badge-warning/40' },
  { slug: 'knitwear', label: 'Knitwear', note: 'Cardigans & Sweaters', layout: 'third', span: 'lg:col-span-3', bg: 'bg-badge-success', fallback: 'bg-[#CDE0C7]' },
  { slug: 'pants', label: 'Pants', note: 'Corduroy, Denim & Chinos', layout: 'third', span: 'lg:col-span-3', bg: 'bg-secondary-tint', fallback: 'bg-[#DCE7DA]' },
];

function ArrowBadge() {
  return (
    <span aria-hidden="true" className="relative flex size-10 items-center justify-center rounded-full border border-border bg-white text-primary shadow-level-1 group-hover:text-white">
      <span className="absolute inset-0 rounded-full bg-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <svg className="relative size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </span>
  );
}

function CategoryCard({ category, photo }) {
  const layout = LAYOUTS[category.layout];
  return (
    <Link
      href={`/catalog?category=${category.slug}`}
      aria-label={`Shop ${category.label}`}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden border border-text/5 transition-transform duration-300 motion-safe:hover:-translate-y-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        category.bg,
        layout.card
      )}
    >
      {category.dot && <span aria-hidden="true" className={cn('pointer-events-none absolute z-0 hidden rounded-full md:block', category.dot)} />}

      <div className={cn('relative z-10 flex flex-col justify-between gap-6', layout.text)}>
        <div>
          {category.eyebrow && (
            <p className={cn('text-xs font-semibold uppercase tracking-wider', category.eyebrowTone ?? 'text-text-secondary')}>{category.eyebrow}</p>
          )}
          <h3 className="mt-1 text-2xl font-semibold leading-tight text-text">{category.label}</h3>
          {category.note && <p className="mt-1 text-[13px] text-text-secondary">{category.note}</p>}
        </div>
        <ArrowBadge />
      </div>

      <div className={cn('relative h-40 w-full overflow-hidden', layout.photo)}>
        <LandingPhoto
          src={photo?.src}
          alt={photo?.alt ?? ''}
          fallbackLabel={category.label}
          fallbackClass={category.fallback}
          sizes={layout.sizes}
          className="transition-transform duration-500 motion-safe:group-hover:scale-105"
        />
      </div>
    </Link>
  );
}

export function CategoryBento({ photos = {} }) {
  return (
    <section aria-labelledby="categories-title" className="relative bg-surface-muted py-20 md:py-32">
      <div className="mx-auto w-full max-w-[1280px] px-6 sm:px-8">
        <Reveal className="mb-10 md:mb-12">
          <h2 id="categories-title" className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            Shop by category
          </h2>
        </Reveal>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          {CATEGORIES.map((category, i) => (
            <Reveal as="li" key={category.slug} index={i} className={category.span}>
              <CategoryCard category={category} photo={photos[category.slug]} />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
