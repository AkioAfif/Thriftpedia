import { CloseIcon } from '../icons';
import { CONDITION_OPTIONS, SIZE_OPTIONS, SORT_OPTIONS } from '@/lib/adminProducts';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1';

const labelFor = (options, value) => options.find((o) => o.value === value)?.label ?? value;

// One removable chip per active filter. Labels only; removing calls back with the key to clear.
export default function ActiveFilterChips({ filters, categories = [], onRemove }) {
  const chips = [
    filters.q && { key: 'q', text: `Search: ${filters.q}` },
    filters.category && {
      key: 'category',
      text: `Category: ${categories.find((c) => c.slug === filters.category)?.name ?? filters.category}`,
    },
    filters.size && { key: 'size', text: `Size: ${labelFor(SIZE_OPTIONS, filters.size)}` },
    filters.condition && { key: 'condition', text: `Condition: ${labelFor(CONDITION_OPTIONS, filters.condition)}` },
    filters.status && { key: 'status', text: `Status: ${filters.status === 'SOLD' ? 'Sold' : 'Available'}` },
    filters.sort !== 'newest' && { key: 'sort', text: `Sort: ${labelFor(SORT_OPTIONS, filters.sort)}` },
  ].filter(Boolean);

  if (chips.length === 0) return null;

  return (
    <ul aria-label="Active filters" className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <li key={chip.key}>
          <span className="inline-flex min-h-11 max-w-full items-center gap-1 rounded-full border border-[#EBC3AE] bg-[#FBE6DC] pl-3 text-[13px] font-semibold text-primary">
            <span className="truncate">{chip.text}</span>
            <button
              type="button"
              onClick={() => onRemove(chip.key)}
              aria-label={`Remove filter ${chip.text}`}
              className={`flex size-11 shrink-0 items-center justify-center rounded-full hover:bg-[#F7D3C2] ${focusRing}`}
            >
              <CloseIcon width={14} height={14} />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
