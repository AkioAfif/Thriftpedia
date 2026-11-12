import { LockIcon } from './Icons';
import { CONDITIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function Badge({ children, variant = 'default', className, ...props }) {
  if (variant === 'sold') {
    return (
      <span
        className={cn(
          'px-2.5 py-1 rounded-full text-xs font-bold shadow-xs bg-[#2B2118] text-white flex items-center gap-1 select-none',
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
          'h-5 min-w-[20px] px-1.5 rounded-full bg-[#FBEDE6] text-[#B5532E] text-[11px] font-mono font-bold flex items-center justify-center select-none',
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

export function ConditionBadge({ condition, className }) {
  const norm = (condition || '').toUpperCase();
  const matched = CONDITIONS.find((c) => c.value === norm) || {
    badgeLabel: condition,
    bgClass: 'bg-[#DCEBF2]',
    textClass: 'text-[#0F2D3D]',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-bold shadow-xs select-none',
        matched.bgClass,
        matched.textClass,
        className
      )}
    >
      {matched.badgeLabel}
    </span>
  );
}
