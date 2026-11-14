'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

function scrollToSection(id) {
  const target = document.getElementById(id);
  if (!target) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  window.history.replaceState(null, '', `#${id}`);
}

// Tracks which section is in the reading band (upper part of the viewport).
function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const nodes = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (nodes.length === 0 || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-20% 0px -65% 0px' }
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [ids]);
  return [active, setActive];
}

function TocList({ sections, active, onSelect, className }) {
  return (
    <ol className={className}>
      {sections.map((section, i) => {
        const isActive = section.id === active;
        return (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={isActive ? 'location' : undefined}
              onClick={(event) => {
                event.preventDefault();
                onSelect(section.id);
              }}
              className={cn(
                'flex min-h-11 items-center gap-2 border-l-2 pl-3 text-sm transition-colors',
                isActive ? 'border-primary font-semibold text-primary' : 'border-border text-text-secondary hover:text-text',
                focusRing
              )}
            >
              <span>{i + 1}</span>
              <span>{section.title}</span>
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export function LegalToc({ sections }) {
  const [ids] = useState(() => sections.map((s) => s.id));
  const [active, setActive] = useActiveSection(ids);
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    const onPointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const select = (id) => {
    setActive(id);
    setOpen(false);
    scrollToSection(id);
  };

  const activeIndex = Math.max(0, sections.findIndex((s) => s.id === active));

  return (
    <>
      {/* Desktop: sticky list */}
      <nav aria-label="On this page" className="sticky top-28 hidden lg:block">
        <p className="mb-4 text-sm font-semibold text-text-secondary">On this page</p>
        <TocList sections={sections} active={active} onSelect={select} className="space-y-4" />
      </nav>

      {/* Mobile and tablet: "Contents" dropdown above the text */}
      <nav aria-label="Contents" ref={menuRef} className="relative lg:hidden">
        <button
          ref={buttonRef}
          type="button"
          aria-expanded={open}
          aria-controls="legal-toc-menu"
          onClick={() => setOpen((v) => !v)}
          className={cn('flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-surface px-4 text-left', focusRing)}
        >
          <span className="text-sm font-semibold text-text">Contents</span>
          <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
            {activeIndex + 1} {sections[activeIndex]?.title}
          </span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className={cn('size-4 shrink-0 text-text transition-transform', open && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {open && (
          <div id="legal-toc-menu" className="absolute inset-x-0 top-full z-30 mt-2 rounded-xl border border-border bg-surface p-3 shadow-level-2">
            <TocList sections={sections} active={active} onSelect={select} className="space-y-1" />
          </div>
        )}
      </nav>
    </>
  );
}
