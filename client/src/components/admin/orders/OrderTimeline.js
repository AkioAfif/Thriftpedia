import { formatOrderDateTime, statusMeta } from '@/lib/adminOrders';

// Newest first. `by` is populated with { name, role } for admins only.
export default function OrderTimeline({ history }) {
  const entries = Array.isArray(history) ? [...history].reverse() : [];

  return (
    <section aria-labelledby="order-history-title" className="rounded-[20px] border border-[#e8e1d8] bg-white p-5 sm:p-6">
      <h2 id="order-history-title" className="text-lg font-semibold text-[#2b1d14]">
        Status history
      </h2>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-[#6E5D4F]">No history recorded for this order.</p>
      ) : (
        <ol className="mt-5">
          {entries.map((entry, i) => {
            const meta = statusMeta(entry.status);
            const last = i === entries.length - 1;
            const actor = entry.by?.name
              ? `${entry.by.name}${entry.by.role === 'BUYER' ? ' (buyer)' : ''}`
              : entry.by === null
                ? 'System'
                : null;
            return (
              <li key={`${entry.status}-${entry.at}`} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!last && <span aria-hidden="true" className="absolute left-[5px] top-4 h-full w-px bg-[#e8e1d8]" />}
                <span aria-hidden="true" className={`relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ring-white ${meta.dot}`} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#2b1d14]">{meta.label}</p>
                  <p className="text-xs tabular-nums text-[#6E5D4F]">
                    <time dateTime={entry.at}>{formatOrderDateTime(entry.at)}</time>
                    {actor && <> · {actor}</>}
                  </p>
                  {entry.note && <p className="mt-1.5 break-words text-sm text-[#4A3F35]">{entry.note}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
