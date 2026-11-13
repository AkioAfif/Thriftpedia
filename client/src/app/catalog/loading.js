import { Skeleton } from '@/components/ui/Skeleton';
import { CatalogSkeleton } from '@/components/catalog/CatalogSkeleton';

export default function CatalogLoading() {
  return (
    <main className="w-full flex-1">
      {/* Title & Search bar */}
      <section className="w-full px-4 sm:px-8 pt-8 pb-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="flex flex-col gap-1.5 max-w-[36rem]">
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-[#2B2118] tracking-tight leading-tight">
                Find Your Favorite Items
              </h1>
              <p className="text-sm sm:text-base text-[#5C4D40]">
                Every piece is curated, one-of-one, and 100% original.
              </p>
            </div>
            {/* Search bar skeleton */}
            <div className="w-full md:w-[440px] shrink-0 h-[48px] bg-white border border-[#E6DDD2] rounded-full px-4 flex items-center justify-between shadow-sm">
              <Skeleton className="w-40 h-4 rounded" />
              <Skeleton className="w-16 h-8 rounded-full" />
            </div>
          </div>

          {/* Category Tabs Skeleton */}
          <div className="relative w-full border-b border-[#E6DDD2]/60 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {[...Array(6)].map((_, i) => (
                <Skeleton
                  key={i}
                  className="w-24 h-[40px] rounded-xl shrink-0"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="w-full px-4 sm:px-8 pb-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar Skeleton */}
          <aside className="hidden md:flex flex-col w-[260px] shrink-0 gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DDD2]">
              <Skeleton className="w-20 h-4 rounded" />
              <Skeleton className="w-6 h-5 rounded-full" />
            </div>
            <div className="space-y-3 pb-6 border-b border-[#E6DDD2]">
              <Skeleton className="w-16 h-4 rounded" />
              <div className="grid grid-cols-4 gap-2">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-3 pb-6 border-b border-[#E6DDD2]">
              <Skeleton className="w-24 h-4 rounded" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-10 rounded-xl" />
                <Skeleton className="h-10 rounded-xl" />
              </div>
            </div>
            <div className="space-y-3 pb-6 border-b border-[#E6DDD2]">
              <Skeleton className="w-20 h-4 rounded" />
              <div className="flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-9 rounded-xl" />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <Skeleton className="w-28 h-4 rounded" />
              <Skeleton className="w-11 h-6 rounded-full" />
            </div>
          </aside>

          {/* Results Area */}
          <div className="flex-1 w-full flex flex-col gap-4">
            <div className="w-full flex items-center justify-between pb-3 border-b border-[#E6DDD2] min-h-[40px]">
              <Skeleton className="w-48 h-5 rounded" />
              <Skeleton className="w-32 h-8 rounded-xl" />
            </div>
            <CatalogSkeleton />
          </div>
        </div>
      </section>
    </main>
  );
}
