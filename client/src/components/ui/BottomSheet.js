'use client';

import { useEffect } from 'react';
import { CloseIcon } from './Icons';
import { cn } from '@/lib/utils';

export function BottomSheet({
  isOpen,
  onClose,
  title = 'Filters',
  badgeText,
  children,
  footer,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-text/50 backdrop-blur-xs flex flex-col justify-end transition-opacity"
    >
      <div
        className="flex-1 w-full"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="w-full max-h-[85vh] bg-canvas rounded-t-3xl border-t border-[#E6DDD2] p-5 flex flex-col gap-4 shadow-pop overflow-hidden animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD2]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-text">{title}</span>
            {badgeText && (
              <span className="h-6 px-2.5 rounded-full bg-[#FBEDE6] text-primary text-xs font-mono font-bold flex items-center justify-center">
                {badgeText}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close filters"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] rounded-full text-[#5C4D40] hover:text-text hover:bg-border/50 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs">
          {children}
        </div>

        {footer && (
          <div className="pt-3 border-t border-[#E6DDD2] flex items-center gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
