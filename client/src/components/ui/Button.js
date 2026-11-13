import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] disabled:opacity-40 disabled:cursor-not-allowed select-none';

  const variants = {
    buyerPrimary: 'bg-primary text-on-primary hover:bg-primary-hover',
    buyerSecondary: 'border border-border bg-canvas text-text hover:bg-surface hover:text-primary',
    primary:
      'bg-[#B5532E] hover:bg-[#9C4425] text-white shadow-xs',
    secondary:
      'bg-[#FAF7F2] hover:bg-[#B5532E] text-[#2B2118] hover:text-white border border-[#E6DDD2]',
    outline:
      'border border-[#B5532E] text-[#B5532E] hover:bg-[#FBEDE6] shadow-xs',
    subtle:
      'border border-[#E6DDD2] bg-white text-[#2B2118] hover:bg-[#F1EBE1] shadow-xs',
    ghost:
      'text-[#5C4D40] hover:text-[#2B2118] hover:bg-[#F1EBE1]',
    sold:
      'bg-[#EFEBE4] text-[#8C7E72] cursor-not-allowed',
  };

  const sizes = {
    sm: 'min-h-[32px] px-3 py-1 text-xs rounded-lg',
    md: 'min-h-[38px] px-3.5 py-1.5 text-xs rounded-xl',
    lg: 'min-h-[44px] px-5 py-2.5 text-sm rounded-xl',
    icon: 'min-w-[40px] min-h-[40px] p-2 rounded-full',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});
