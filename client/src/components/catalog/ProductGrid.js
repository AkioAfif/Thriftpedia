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
      className="grid grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-6 items-stretch"
    >
      {products.map((product) => (
        <ProductCard key={product._id} product={product} />
      ))}
    </div>
  );
}
