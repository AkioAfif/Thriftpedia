'use client';

import { ProductCard } from './ProductCard';
import { EmptyState } from './EmptyState';

export function ProductGrid({ products = [] }) {
  if (products.length === 0) {
    return <EmptyState />;
  }

  return (
    <div
      id="main-product-grid"
      // 1 column < 480px, 2 columns 480-1023px, 3 from lg; min-w-0 keeps every card inside its column.
      className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch [&>*]:min-w-0"
    >
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
