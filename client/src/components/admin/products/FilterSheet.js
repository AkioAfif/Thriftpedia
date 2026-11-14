'use client';

import { useEffect, useRef } from 'react';
import { CONDITION_OPTIONS, SIZE_OPTIONS } from '@/lib/adminProducts';
import { CloseIcon } from '../icons';
import FilterSelect from './FilterSelect';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2';
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled])';
const MD_QUERY = '(min-width: 768px)';
const label = 'mb-1.5 block text-[13px] font-medium text-[#6F6358]';

export const EMPTY_DRAFT = { category: '', size: '', condition: '' };

// Mobile bottom sheet. The draft lives in ProductFilters and is only applied on "Apply".
export default function FilterSheet({ open, draft, onDraftChange, categories, onApply, onClose }) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const hasDraft = Boolean(draft.category || draft.size || draft.condition);
  const set = (changes) => onDraftChange({ ...draft, ...changes });

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  // Lock page scroll while open; restored on close and on unmount.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // The sheet is mobile-only; widening to md closes it (state changes inside the listener).
  useEffect(() => {
    if (!open) return undefined;
    const media = window.matchMedia(MD_QUERY);
    const onChange = (e) => {
      if (e.matches) onClose();
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [open, onClose]);

  function onKeyDown(e) {
    // A FilterSelect inside handles its own Esc (and marks it handled) to close just its list.
    if (e.key === 'Escape' && !e.defaultPrevented) {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(panelRef.current?.querySelectorAll(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-[#2B2118]/40 transition-opacity duration-200 motion-reduce:transition-none md:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        inert={!open}
        onKeyDown={onKeyDown}
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[20px] border-t border-[#D9CFC1] bg-white transition-transform duration-200 motion-reduce:transition-none md:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#EAE4DA] py-2 pl-5 pr-2">
          <h2 id="filter-sheet-title" className="text-[18px] font-semibold text-[#2B2118]">
            Filters
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className={`flex size-11 items-center justify-center rounded-xl text-[#2B2118] hover:bg-[#F5F0E8] ${focusRing}`}
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-8 pt-4">
          <div>
            <span aria-hidden="true" className={label}>Category</span>
            <FilterSelect
              id="sheet-category"
              label="Category"
              emptyLabel="All"
              value={draft.category}
              onChange={(category) => set({ category })}
              options={categories.map((cat) => ({ value: cat.slug, label: cat.name }))}
            />
          </div>

          <fieldset>
            <legend className={label}>Size</legend>
            <div className="flex flex-wrap gap-2">
              {[{ value: '', label: 'All' }, ...SIZE_OPTIONS].map((opt) => {
                const selected = draft.size === opt.value;
                return (
                  <button
                    key={opt.value || 'all'}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => set({ size: opt.value })}
                    className={`min-h-11 min-w-[52px] rounded-xl border px-4 text-sm font-semibold ${focusRing} ${
                      selected ? 'border-[#B5532E] bg-[#B5532E] text-white' : 'border-[#D9CFC1] bg-white text-[#2B2118] hover:border-[#B5532E]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div>
            <span aria-hidden="true" className={label}>Condition</span>
            <FilterSelect
              id="sheet-condition"
              label="Condition"
              emptyLabel="All"
              value={draft.condition}
              onChange={(condition) => set({ condition })}
              options={CONDITION_OPTIONS}
            />
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-[#D9CFC1] bg-white px-5 py-3">
          {hasDraft && (
            <button
              type="button"
              onClick={() => onDraftChange(EMPTY_DRAFT)}
              className={`min-h-11 flex-1 rounded-xl border border-[#D9CFC1] bg-white px-4 text-sm font-semibold text-[#2B2118] hover:bg-[#F5F0E8] ${focusRing}`}
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onApply}
            className={`min-h-11 flex-1 rounded-xl bg-[#B5532E] px-4 text-sm font-semibold text-white hover:bg-[#9C4425] ${focusRing}`}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
