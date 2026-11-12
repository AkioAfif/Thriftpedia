import { ProductCardSkeleton } from './ProductCardSkeleton';

export function CatalogSkeleton() {
  return (
    <div
      id="skeleton-grid"
      className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6"
    >
      {[...Array(6)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
