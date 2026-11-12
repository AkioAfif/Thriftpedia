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
        'flex items-center min-h-[40px] px-2.5 rounded-xl hover:bg-white/70 cursor-pointer transition-colors gap-3 focus-within:ring-2 focus-within:ring-[#B5532E]',
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
        className="w-4 h-4 rounded border-[#D1C7BD] text-[#B5532E] focus:ring-[#B5532E] cursor-pointer accent-[#B5532E]"
        {...props}
      />
      {label && (
        <span
          className={cn(
            'text-xs sm:text-sm select-none',
            checked ? 'text-[#2B2118] font-semibold' : 'text-[#2B2118] font-medium'
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
});
