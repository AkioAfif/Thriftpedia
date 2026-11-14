'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDownIcon } from '../icons';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1';

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

// Drop-in replacement for the old native <select>: same props, same onChange(value).
// The empty option (when `emptyLabel` is set) is listed as "All".
// variant="field" is the form look (no active tint) and adds disabled/invalid/describedBy;
// includeEmpty={false} keeps the placeholder out of the list (a required choice).
export default function FilterSelect({
  id,
  label,
  value,
  onChange,
  emptyLabel,
  options,
  defaultValue = '',
  align = 'left',
  variant = 'filter',
  includeEmpty = true,
  disabled = false,
  invalid = false,
  describedBy,
}) {
  const uid = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const list = emptyLabel && includeEmpty ? [{ value: '', label: 'All' }, ...options] : options;
  const selectedIndex = Math.max(0, list.findIndex((o) => o.value === value));
  const current = list.find((o) => o.value === value);
  const isField = variant === 'field';
  const isActive = !isField && value !== defaultValue;
  const triggerText = emptyLabel && !value ? emptyLabel : current?.label ?? emptyLabel ?? '';
  const optionId = (i) => `${uid}-opt-${i}`;

  // Focus moves into the list when it opens; no state is set here.
  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
    // optionId only depends on uid, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  // Clicking anywhere outside closes the panel (state is set inside the event handler).
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function openList(index = selectedIndex) {
    setActiveIndex(index);
    setOpen(true);
  }

  function close({ refocus = true } = {}) {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }

  function choose(index) {
    const next = list[index];
    close();
    if (next && next.value !== value) onChange(next.value);
  }

  function onTriggerKeyDown(e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      openList();
    }
  }

  function onListKeyDown(e) {
    const last = list.length - 1;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(last, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(last);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(activeIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close({ refocus: false });
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <span id={`${uid}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? `${uid}-list` : undefined}
        aria-labelledby={`${uid}-label ${id}`}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKeyDown}
        className={
          isField
            ? `flex h-11 w-full items-center justify-between gap-2 rounded-xl border bg-white pl-3 pr-3 text-left text-sm focus-visible:outline-none focus-visible:border-[#B5532E] focus-visible:shadow-[0_0_0_1px_#B5532E,0_0_0_4px_#FBE6DC] disabled:cursor-not-allowed disabled:bg-[#F5F0E8] ${
                open ? 'border-[#B5532E] shadow-[0_0_0_1px_#B5532E,0_0_0_4px_#FBE6DC]' : invalid ? 'border-[#B3402A]' : 'border-[#D9CFC1]'
              } ${value ? 'text-[#2B2118]' : 'text-[#6F6358]'}`
            : `flex h-11 w-full items-center justify-between gap-2 rounded-xl border pl-4 pr-3 text-left text-sm transition-colors ${focusRing} ${
                open ? 'border-[#B5532E] ring-1 ring-[#B5532E]' : isActive ? 'border-[#EBC3AE]' : 'border-[#D9CFC1] hover:border-[#B5532E]'
              } ${isActive ? 'bg-[#FBE6DC] font-semibold text-[#B5532E]' : 'bg-white text-[#2B2118]'}`
        }
      >
        <span className="min-w-0 truncate">{triggerText}</span>
        <span aria-hidden="true" className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''} ${isActive ? 'text-[#B5532E]' : 'text-[#6F6358]'}`}>
          <ChevronDownIcon width={16} height={16} />
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${uid}-list`}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={`${uid}-label`}
          aria-activedescendant={optionId(activeIndex)}
          onKeyDown={onListKeyDown}
          className={`absolute top-[calc(100%+6px)] z-30 max-h-[280px] w-full min-w-[200px] overflow-y-auto rounded-[14px] border border-[#D9CFC1] bg-white p-1.5 shadow-[0_8px_24px_rgba(43,33,24,0.08)] focus:outline-none ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {list.map((opt, i) => {
            const selected = opt.value === value;
            const active = i === activeIndex;
            return (
              <li
                key={opt.value || '__all'}
                id={optionId(i)}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActiveIndex(i)}
                onClick={() => choose(i)}
                className={`flex h-10 cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 text-sm ${
                  selected ? 'bg-[#FBE6DC] font-semibold text-[#B5532E]' : `text-[#2B2118] ${active ? 'bg-[#F5F0E8]' : ''}`
                } ${active && selected ? 'ring-1 ring-inset ring-[#B5532E]' : ''}`}
              >
                <span className="truncate">{opt.label}</span>
                {selected && <CheckIcon />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
