'use client';

import { cn } from '@/lib/utils';

const tabs = [
  { value: 'login', label: 'Log in' },
  { value: 'register', label: 'Sign up' },
];

export default function AuthTabs({ activeTab, onChange }) {
  return (
    <div
      className="flex w-full"
      role="tablist"
      aria-label="Authentication"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.value;

        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            id={`auth-tab-${tab.value}`}
            aria-selected={active}
            aria-controls="auth-tab-panel"
            onClick={() => onChange(tab.value)}
            className={cn(
              'flex h-11 flex-1 items-center justify-center',
              'border-b-2 body-md font-semibold',
              'transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-primary',
              active
                ? 'border-primary text-text'
                : 'border-border text-text-secondary hover:text-text'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}