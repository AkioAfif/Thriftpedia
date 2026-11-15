'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const OPTION_HEIGHT = 40;
const PANEL_CHROME = 15; // p-1.5 (12px) + border (2px) + rounding slack
const MAX_PANEL_HEIGHT = 280;
const GAP = 6;
const EDGE = 8;

function ChevronIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

// Where the panel goes and how big it is. Computed when opening (an event handler), from
// the trigger's position: opens upwards when there is not enough room below, never wider
// than the screen. The panel is portalled to <body>, or to the enclosing dialog (a moving
// bottom sheet is the containing block for `fixed`), so no card, table or scroll area clips it.
function placePanel(button, optionCount, align) {
  const rect = button.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const wanted = Math.min(MAX_PANEL_HEIGHT, optionCount * OPTION_HEIGHT + PANEL_CHROME);
  const below = vh - rect.bottom - GAP - EDGE;
  const above = rect.top - GAP - EDGE;
  const up = below < wanted && above > below;
  const maxHeight = Math.max(120, Math.min(MAX_PANEL_HEIGHT, up ? above : below));
  const height = Math.min(wanted, maxHeight);

  const width = Math.min(Math.max(rect.width, 200), vw - EDGE * 2);
  let left = align === 'right' ? rect.right - width : rect.left;
  left = Math.min(Math.max(left, EDGE), vw - EDGE - width);
  let top = up ? rect.top - GAP - height : rect.bottom + GAP;

  const container = button.closest('[role="dialog"]') ?? document.body;
  if (container !== document.body) {
    const c = container.getBoundingClientRect();
    left -= c.left + container.clientLeft;
    top -= c.top + container.clientTop;
  }
  return { container, style: { left, top, width, maxHeight } };
}

// Shared dropdown for every admin select: same props and onChange(value) as a native <select>.
// variant="filter" (default): toolbar look; a non-default value tints the trigger.
// variant="field": form look; supports disabled, invalid and describedBy.
// emptyLabel: trigger text while nothing is chosen; the empty option is listed as "All"
// unless includeEmpty={false} (a required choice).
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
  inlineLabel, // optional: "Category", "Sort" ... shown inside the trigger before the value
  compact = false, // optional: 40px trigger instead of 44px
}) {
  const uid = useId();
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);
  const [panel, setPanel] = useState(null); // { container, style } while open
  const [activeIndex, setActiveIndex] = useState(0);
  const open = panel !== null;

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

  // Outside click, page scroll and resize close the panel (state set inside the listeners).
  useEffect(() => {
    if (!open) return undefined;
    const inside = (target) => rootRef.current?.contains(target) || listRef.current?.contains(target);
    const onPointerDown = (e) => {
      if (!inside(e.target)) setPanel(null);
    };
    const onScroll = (e) => {
      if (!listRef.current?.contains(e.target)) setPanel(null);
    };
    const onResize = () => setPanel(null);
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  function openList(index = selectedIndex) {
    if (!buttonRef.current) return;
    setActiveIndex(index);
    setPanel(placePanel(buttonRef.current, list.length, align));
  }

  function close({ refocus = true } = {}) {
    setPanel(null);
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
      // preventDefault also tells an enclosing dialog (e.g. FilterSheet) not to close itself.
      e.preventDefault();
      close();
    } else if (e.key === 'Tab') {
      close({ refocus: false });
    }
  }

  const border = open
    ? 'border-[#B5532E]'
    : invalid
      ? 'border-[#B3402A]'
      : isActive
        ? 'border-[#EBC3AE]'
        : 'border-[#D9CFC1] hover:border-[#B5A595]';
  const tone = isActive
    ? 'bg-[#FBE6DC] font-semibold text-[#B5532E]'
    : `bg-white ${isField && !value ? 'text-[#6F6358]' : 'text-[#2B2118]'}`;

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
        aria-labelledby={inlineLabel ? undefined : `${uid}-label ${id}`}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onTriggerKeyDown}
        className={`flex ${compact ? 'h-10' : 'h-11'} w-full items-center justify-between gap-2 rounded-xl border-[1.5px] px-3.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:bg-[#F5F0E8] disabled:text-[#6F6358] ${border} ${tone}`}
      >
        {inlineLabel ? (
          // Label + value inside the trigger; the button's text is its accessible name.
          <span className="flex min-w-0 items-baseline gap-1.5">
            <span className={`shrink-0 text-[13px] font-normal ${isActive ? 'text-[#B5532E]' : 'text-[#6F6358]'}`}>{inlineLabel}</span>
            <span className={`min-w-0 truncate font-semibold ${isActive ? 'text-[#B5532E]' : 'text-[#2B2118]'}`}>{triggerText}</span>
          </span>
        ) : (
          <span className="min-w-0 truncate">{triggerText}</span>
        )}
        <span
          aria-hidden="true"
          className={`shrink-0 transition-transform duration-150 motion-reduce:transition-none ${open ? 'rotate-180' : ''} ${
            isActive || open ? 'text-[#B5532E]' : 'text-[#6F6358]'
          }`}
        >
          <ChevronIcon />
        </span>
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={`${uid}-list`}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={`${uid}-label`}
            aria-activedescendant={optionId(activeIndex)}
            onKeyDown={onListKeyDown}
            style={panel.style}
            className="fixed z-[60] overflow-y-auto rounded-[14px] border border-[#D9CFC1] bg-white p-1.5 shadow-[0_8px_24px_rgba(43,33,24,0.08)] focus:outline-none"
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
          </ul>,
          panel.container
        )}
    </div>
  );
}
