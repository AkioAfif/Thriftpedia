import { Skeleton } from '@/components/ui/Skeleton';

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col justify-between h-full bg-white border border-[#E6DDD2] rounded-2xl p-4 shadow-card">
      <div className="flex flex-col gap-3">
        {/* Photo area */}
        <Skeleton className="w-full aspect-[4/5] rounded-xl" />

        {/* Details area */}
        <div className="flex flex-col gap-2 pt-1">
          <Skeleton className="w-4/5 h-4 rounded" />
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="w-20 h-3 rounded" />
            <Skeleton className="w-12 h-3 rounded" />
          </div>
          <Skeleton className="w-24 h-5 rounded mt-1" />
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <Skeleton className="w-16 h-3 rounded" />
            <Skeleton className="w-10 h-3 rounded" />
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="pt-3 mt-3 border-t border-[#E6DDD2]/60">
        <Skeleton className="w-full h-[38px] rounded-xl" />
      </div>
    </div>
  );
}
