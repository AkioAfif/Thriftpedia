import { ORDER_STEPS, formatOrderDateTime, historyNote, statusMeta } from '@/lib/adminOrders';

const STEP_STATE_TEXT = { done: 'completed', current: 'current step', upcoming: 'not reached yet' };

// How far along the forward path the order got. A cancelled order stops at the last step it
// actually reached (taken from its history), and no step counts as current.
function stepStates(status, history) {
  const cancelled = status === 'CANCELLED';
  const reached = cancelled
    ? Math.max(-1, ...history.map((h) => ORDER_STEPS.indexOf(h.status)))
    : ORDER_STEPS.indexOf(status);

  return ORDER_STEPS.map((step, i) => {
    if (i < reached || (cancelled && i === reached)) return 'done';
    if (i === reached) return 'current';
    return 'upcoming';
  });
}

const CIRCLE = {
  done: 'border-[#2b1d14] bg-[#2b1d14] text-white',
  upcoming: 'border-[#e8e1d8] bg-white text-[#6E5D4F]',
};

export function OrderStepper({ status, history }) {
  const entries = Array.isArray(history) ? history : [];
  const states = stepStates(status, entries);

  return (
    <ol className="space-y-0" aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => {
        const state = states[i];
        const meta = statusMeta(step);
        const last = i === ORDER_STEPS.length - 1;
        return (
          <li key={step} aria-current={state === 'current' ? 'step' : undefined} className="relative flex items-center gap-3.5 pb-4 last:pb-0">
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-px ${states[i + 1] === 'upcoming' ? 'bg-[#e8e1d8]' : 'bg-[#2b1d14]'}`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums ${
                state === 'current' ? `border-transparent ${meta.badge}` : CIRCLE[state]
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-sm ${state === 'upcoming' ? 'text-[#6E5D4F]' : 'font-semibold text-[#2b1d14]'}`}>
              {meta.label}
              <span className="sr-only">, {STEP_STATE_TEXT[state]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Newest first. `by` is populated with { name, role } for admins only.
export default function OrderTimeline({ history }) {
  const list = Array.isArray(history) ? history : [];
  const entries = list.map((entry, index) => ({ entry, note: historyNote(entry, index) })).reverse();

  if (entries.length === 0) {
    return <p className="mt-3 text-sm text-[#6E5D4F]">No history recorded for this order.</p>;
  }

  return (
    <ol className="mt-3 space-y-4">
      {entries.map(({ entry, note }) => {
        const actor = entry.by?.name
          ? `${entry.by.name}${entry.by.role === 'BUYER' ? ' (buyer)' : ''}`
          : entry.by === null
            ? 'System'
            : null;
        return (
          <li key={`${entry.status}-${entry.at}`} className="min-w-0">
            <p className="break-words text-sm text-[#2b1d14]">
              <span className="font-semibold">{statusMeta(entry.status).label}</span>
              {note && <> · {note}</>}
            </p>
            <p className="mt-0.5 text-xs tabular-nums text-[#6E5D4F]">
              <time dateTime={entry.at}>{formatOrderDateTime(entry.at)}</time>
              {actor && <> · {actor}</>}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
