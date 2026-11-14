import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Checkbox = forwardRef(function Checkbox(
  { id, checked = false, onChange, label, className, disabled = false, ...props },
  ref
) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center min-h-[40px] px-2.5 rounded-xl hover:bg-white/70 cursor-pointer transition-colors gap-3 focus-within:ring-2 focus-within:ring-primary',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input
        ref={ref}
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 rounded border-[#D1C7BD] text-primary focus:ring-primary cursor-pointer accent-primary"
        {...props}
      />
      {label && (
        <span
          className={cn(
            'text-xs sm:text-sm select-none',
            checked ? 'text-text font-semibold' : 'text-text font-medium'
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
});
