import { Skeleton } from '@/components/ui/Skeleton';

const container = 'mx-auto w-full max-w-[1280px] px-6 sm:px-8';

function ProductSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-4 w-4/5 rounded" />
      <Skeleton className="h-3 w-1/2 rounded" />
      <Skeleton className="h-5 w-24 rounded" />
      <Skeleton className="mt-2 h-11 w-full" />
    </div>
  );
}

// Same footprint as the landing sections, so swapping in the real page does not shift layout.
export function LandingSkeleton() {
  return (
    <div role="status" aria-label="Loading Thriftpedia" className="flex-1">
      <div className="bg-surface-muted pb-24 pt-12 md:pb-32 md:pt-16">
        <div className={`${container} grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8`}>
          <div className="space-y-6 lg:col-span-6">
            <Skeleton className="h-[48px] w-3/4 sm:h-[64px] lg:h-[76px]" />
            <Skeleton className="h-[48px] w-2/3 sm:h-[64px] lg:h-[76px]" />
            <Skeleton className="h-5 w-full max-w-[512px] rounded" />
            <Skeleton className="h-5 w-4/5 max-w-[420px] rounded" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-12 w-40 rounded-full" />
              <Skeleton className="h-12 w-36 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-4 sm:gap-6 lg:col-span-6">
            <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
            <div className="space-y-4 sm:space-y-6">
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
              <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      <div className={`${container} py-16`}>
        <Skeleton className="mx-auto mb-14 h-10 w-full max-w-[420px]" />
        <div className="grid grid-cols-1 justify-items-center gap-12 md:grid-cols-3 md:gap-8">
          <Skeleton className="h-[330px] w-full max-w-[340px]" />
          <Skeleton className="h-[260px] w-full max-w-[320px]" />
          <Skeleton className="h-[280px] w-full max-w-[360px]" />
        </div>
      </div>

      <div className={`${container} py-20`}>
        <Skeleton className="mb-10 h-10 w-56" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <ProductSkeleton key={i} />)}
        </div>
      </div>

      <div className={`${container} py-20`}>
        <Skeleton className="mb-10 h-10 w-64" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
          <Skeleton className="h-[260px] rounded-[40px] md:h-80 lg:col-span-2" />
          <Skeleton className="h-[260px] rounded-3xl md:h-80" />
          <Skeleton className="h-[260px] rounded-3xl md:h-80" />
          <Skeleton className="h-[260px] rounded-[40px] md:h-80 lg:col-span-2" />
          <Skeleton className="h-[260px] rounded-3xl md:h-44 lg:col-span-3" />
          <Skeleton className="h-[260px] rounded-3xl md:h-44 lg:col-span-3" />
        </div>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
