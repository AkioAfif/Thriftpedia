'use client';

import { cn } from '@/lib/utils';

export function Toggle({
  id = 'toggle-hide-sold',
  checked = false,
  onChange,
  label = 'Hide sold items',
  className,
}) {
  return (
    <div className={cn('flex items-center justify-between pt-1', className)}>
      <label
        htmlFor={id}
        className="text-sm font-semibold text-text cursor-pointer select-none"
      >
        {label}
      </label>
      <label htmlFor={id} className="relative inline-block w-11 h-6 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={cn(
            'w-11 h-6 rounded-full peer transition-colors shadow-inner flex items-center px-0.5 peer-focus:ring-2 peer-focus:ring-primary',
            checked ? 'bg-primary justify-end' : 'bg-[#D1C7BD] justify-start'
          )}
        >
          <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200" />
        </div>
      </label>
    </div>
  );
}
