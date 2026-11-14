import { LockIcon } from './Icons';
import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'default', className, ...props }) {
  if (variant === 'sold') {
    return (
      <span
        className={cn(
          'px-2.5 py-1 rounded-full text-xs font-bold shadow-xs bg-text text-white flex items-center gap-1 select-none',
          className
        )}
        {...props}
      >
        <LockIcon className="w-3.5 h-3.5 text-white" />
        <span>Sold</span>
      </span>
    );
  }

  if (variant === 'count') {
    return (
      <span
        className={cn(
          'h-5 min-w-[20px] px-1.5 rounded-full bg-[#FBEDE6] text-primary text-[11px] font-mono font-bold flex items-center justify-center select-none',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-bold shadow-xs select-none',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Display text + colour per condition enum. CONDITIONS (lib/constants) stays {value, label}
// because the catalog filters read that shape; the text always names the condition.
const CONDITION_BADGES = {
  NEW_WITH_TAGS: { label: 'New with Tags', bgClass: 'bg-badge-success' },
  LIKE_NEW: { label: 'Like New', bgClass: 'bg-badge-info' },
  GOOD_VINTAGE: { label: 'Pre-loved', bgClass: 'bg-badge-warning' },
  FAIR_DISTRESSED: { label: 'Fair / Distressed', bgClass: 'bg-badge-danger' },
};

export function ConditionBadge({ condition, className }) {
  const raw = String(condition ?? '').trim();
  if (!raw) return null;
  // Unknown values show as-is in a neutral pill instead of an empty one.
  const matched = CONDITION_BADGES[raw.toUpperCase()] ?? { label: raw, bgClass: 'bg-badge-neutral' };

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-bold shadow-xs select-none text-text',
        matched.bgClass,
        className
      )}
    >
      {matched.label}
    </span>
  );
}
