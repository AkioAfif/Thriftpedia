'use client';

import { CONDITIONS } from '@/lib/constants';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';

export function ConditionCheckboxes({
  selectedConditions = [],
  onToggleCondition,
  isMobile = false,
}) {
  return (
    <div
      className={cn('space-y-3 pb-6 border-b border-[#E6DDD2]', isMobile && 'pb-4')}
      data-layer="Filter/Condition"
    >
      <span className="text-xs font-bold uppercase tracking-wider text-[#2B2118] block font-mono">
        Condition
      </span>
      <div className="flex flex-col gap-1 text-sm">
        {CONDITIONS.map((cond) => {
          const isChecked = selectedConditions.includes(cond.value);
          const inputId = isMobile ? `mobile-cond-${cond.value}` : `cond-${cond.value}`;
          return (
            <Checkbox
              key={cond.value}
              id={inputId}
              checked={isChecked}
              label={cond.label}
              onChange={() => onToggleCondition(cond.value)}
            />
          );
        })}
      </div>
    </div>
  );
}
