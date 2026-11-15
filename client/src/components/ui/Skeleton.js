import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('bg-surface-muted rounded-xl shimmer-effect', className)}
      aria-hidden="true"
      {...props}
    />
  );
}
