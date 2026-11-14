import { cn } from '@/lib/utils';

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

// White card, #D9CFC1 border, radius 20 (no tinted header strip).
export const panel = 'rounded-[20px] border border-[#D9CFC1] bg-surface';

// Secondary = white with a terracotta outline (#B5532E on white: 6.9:1).
export const secondaryButton = cn(
  'inline-flex min-h-11 items-center justify-center rounded-[10px] border-[1.5px] border-[#B5532E] bg-surface px-5 text-sm font-semibold text-[#B5532E] hover:bg-primary-tint',
  focusRing
);

export const formatCount = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

// Shown inside a section whose request failed; the other sections keep rendering.
export function SectionError({ message, onRetry, className }) {
  return (
    <div role="alert" className={cn('rounded-xl border border-error-tint bg-surface p-5', className)}>
      <p className="font-semibold text-text">Couldn&apos;t load this section</p>
      <p className="mt-1 text-sm text-text-secondary">{message}</p>
      <button type="button" onClick={onRetry} className={cn(secondaryButton, 'mt-4')}>
        Retry
      </button>
    </div>
  );
}
