import { Suspense } from 'react';
import { getCategories } from '@/lib/services/categoryService';
import { getProducts } from '@/lib/services/productService';
import { buildQueryString } from '@/lib/utils';
import { SearchBar } from '@/components/catalog/SearchBar';
import { CategoryTabs } from '@/components/catalog/CategoryTabs';
import { FilterSidebar } from '@/components/catalog/FilterSidebar';
import { ResultsHeader } from '@/components/catalog/ResultsHeader';
import { ProductGrid } from '@/components/catalog/ProductGrid';
import { Pagination } from '@/components/catalog/Pagination';
import { CatalogSkeleton } from '@/components/catalog/CatalogSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import { RememberCatalogQuery } from '@/components/catalog/RememberCatalogQuery';

async function ProductResultsArea({ searchParams }) {
  const { data: products, meta } = await getProducts(searchParams);

  return (
    <>
      <ResultsHeader meta={meta} />
      <ProductGrid products={products} />
      <Pagination meta={meta} />
    </>
  );
}

function ResultsAreaFallback() {
  return (
    <>
      <div className="w-full flex flex-col gap-3 pb-3 border-b border-[#E6DDD2]">
        <div className="flex items-center justify-between min-h-[40px]">
          <Skeleton className="w-48 h-5 rounded" />
          <Skeleton className="w-32 h-8 rounded-xl" />
        </div>
      </div>
      <CatalogSkeleton />
    </>
  );
}

export default async function CatalogPage({ searchParams }) {
  const resolvedParams = await searchParams;
  const categories = await getCategories();
  const queryString = buildQueryString(resolvedParams);

  return (
    <main className="w-full min-w-0 flex-1 overflow-x-clip">
      {/* overflow-x-clip is only a safety net; the real overflow causes are fixed in the grid,
          the results column (min-w-0) and the price inputs. */}
      <Suspense fallback={null}>
        <RememberCatalogQuery />
      </Suspense>
      {/* Title, Search & Category Chips */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pt-4 pb-4 md:pt-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 md:gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-5">
            <div className="flex flex-col gap-1.5 max-w-[36rem]">
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#2B2118] tracking-tight leading-tight">
                Find Your Favorite Items
              </h1>
              <p className="text-sm sm:text-base text-[#5C4D40]">
                Every piece is curated, one-of-one, and 100% original.
              </p>
            </div>
            <Suspense fallback={<div className="w-full md:w-[440px] h-12" />}>
              <SearchBar />
            </Suspense>
          </div>

          <Suspense fallback={<div className="w-full h-10" />}>
            <CategoryTabs categories={categories} />
          </Suspense>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="w-full px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
          <Suspense fallback={null}>
            <FilterSidebar />
          </Suspense>

          <div className="flex-1 w-full min-w-0 flex flex-col gap-4">
            <Suspense key={queryString} fallback={<ResultsAreaFallback />}>
              <ProductResultsArea searchParams={resolvedParams} />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
