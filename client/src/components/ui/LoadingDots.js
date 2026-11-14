import { cn } from '@/lib/utils';

// Three pulsing dots (6px, currentColor) staggered 0/150/300ms; static under reduced motion.
// Keyframes: `.loading-dot` in globals.css.
const DELAYS = [0, 150, 300];

export function LoadingDots({ className }) {
  return (
    <span className={cn('inline-flex items-center', className)}>
      <span aria-hidden="true" className="inline-flex items-center gap-1.5">
        {DELAYS.map((delay) => (
          <span key={delay} className="loading-dot size-1.5 rounded-full bg-current" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </span>
      <span className="sr-only">Loading</span>
    </span>
  );
}
