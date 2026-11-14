import { ProductCardSkeleton } from './ProductCardSkeleton';

export function CatalogSkeleton() {
  return (
    <div
      id="skeleton-grid"
      className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 [&>*]:min-w-0"
    >
      {[...Array(6)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
