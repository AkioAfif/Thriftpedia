'use client';

import { forwardRef, useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const AuthInput = forwardRef(function AuthInput(
  {
    label,
    type = 'text',
    error,
    hint,
    id,
    className,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);

  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="flex w-full flex-col gap-sm">
      <label
        htmlFor={inputId}
        className="label-md text-text-secondary"
      >
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          className={cn(
            'h-12 w-full rounded-md border border-border',
            'bg-surface px-md body-md text-text',
            'placeholder:text-text-muted',
            'outline-none transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary-tint',
            'disabled:cursor-not-allowed disabled:bg-surface-muted',
            isPassword && 'pr-14',
            error && 'border-error',
            className
          )}
        />

        {isPassword && (
          <button
            type="button"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            disabled={props.disabled}
            onClick={() => setVisible(!visible)}
            className="absolute right-xs top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary hover:text-text focus-visible:outline-2 focus-visible:outline-primary"
          >
            {visible ? (
              <EyeOff size={20} aria-hidden="true" />
            ) : (
              <Eye size={20} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="body-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="body-sm text-text-secondary">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default AuthInput;