import { cn } from '@/lib/utils';

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

export const panel = 'rounded-2xl border border-[#D9CFC1] bg-surface';

// Top strip of the white cards: surface-muted with a border divider.
export const panelHeader = 'border-b border-border bg-surface-muted px-5 py-3';

// Secondary = white with a primary outline (6.9:1).
export const secondaryButton = cn(
  'inline-flex min-h-11 items-center justify-center rounded-[10px] border-[1.5px] border-primary bg-surface px-5 text-sm font-semibold text-primary hover:bg-primary-tint',
  focusRing
);

export const formatCount = (n) => new Intl.NumberFormat('id-ID').format(Number(n) || 0);

export function SectionHeading({ id, title, icon, action }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2.5 text-xl font-semibold text-text">
        {icon && <span className="text-text-secondary">{icon}</span>}
        {title}
      </h2>
      {action}
    </div>
  );
}

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
