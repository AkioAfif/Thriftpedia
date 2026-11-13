import { forwardRef } from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-hover shadow-level-1',
  secondary:
    'border border-border bg-canvas text-text hover:bg-primary hover:text-on-primary',
  outline:
    'border border-primary text-primary hover:bg-primary-tint shadow-level-1',
  subtle:
    'border border-border bg-surface text-text hover:bg-surface-muted shadow-level-1',
  ghost:
    'text-text-secondary hover:bg-surface-muted hover:text-text',
  sold:
    'bg-surface-muted text-text-muted cursor-not-allowed',
};

const sizes = {
  sm: 'min-h-8 px-sm py-xs body-sm rounded-md',
  md: 'min-h-10 px-md py-sm body-sm rounded-lg',
  lg: 'min-h-11 px-lg py-sm body-md rounded-lg',
  icon: 'min-h-10 min-w-10 p-sm rounded-full',
};

export const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading || variant === 'sold'}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-sm',
        'select-none font-semibold transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant] ?? variants.primary,
        sizes[size] ?? sizes.md,
        className
      )}
      {...props}
    >
      {loading && (
        <LoaderCircle
          size={18}
          className="animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
});
