import { ORDER_STEPS, formatOrderDateTime, historyNote, statusMeta } from '@/lib/orderView';

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

function CheckMark() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

// done = green with a check, current = terracotta with a #FBE6DC ring, upcoming = outlined.
const CIRCLE = {
  done: 'bg-secondary text-white',
  current: 'bg-primary text-white ring-4 ring-[#FBE6DC]',
  upcoming: 'border-2 border-[#D9CFC1] bg-white text-text-secondary',
};

// Shared by the admin detail page and the buyer page (/orders/[orderId]).
export function OrderStepper({ status, history }) {
  const entries = Array.isArray(history) ? history : [];
  const states = stepStates(status, entries);
  // Display only: the last step of a completed order reads as finished, not as "in progress".
  const look = (state, i) => (state === 'current' && i === ORDER_STEPS.length - 1 ? 'done' : state);

  return (
    <ol aria-label="Order progress">
      {ORDER_STEPS.map((step, i) => {
        const state = states[i];
        const visual = look(state, i);
        const last = i === ORDER_STEPS.length - 1;
        return (
          <li
            key={step}
            aria-current={state === 'current' ? 'step' : undefined}
            className="relative flex items-center gap-3.5 pb-5 last:pb-0"
          >
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${
                  states[i + 1] === 'upcoming' ? 'bg-[#D9CFC1]' : 'bg-secondary'
                }`}
              />
            )}
            <span
              aria-hidden="true"
              className={`relative flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums ${CIRCLE[visual]}`}
            >
              {visual === 'done' ? <CheckMark /> : i + 1}
            </span>
            <span
              className={`text-[15px] ${
                state === 'current' ? 'font-bold text-text' : state === 'done' ? 'font-semibold text-text' : 'text-text-secondary'
              }`}
            >
              {statusMeta(step).label}
              <span className="sr-only">, {STEP_STATE_TEXT[state]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// Newest first, the newest with a larger dot. `by` is populated with { name, role } for admins only.
export default function OrderTimeline({ history }) {
  const list = Array.isArray(history) ? history : [];
  const entries = list.map((entry, index) => ({ entry, note: historyNote(entry, index) })).reverse();

  if (entries.length === 0) {
    return <p className="text-sm text-text-secondary">No history recorded for this order.</p>;
  }

  return (
    <ol>
      {entries.map(({ entry, note }, i) => {
        const latest = i === 0;
        const last = i === entries.length - 1;
        const actor = entry.by?.name
          ? `${entry.by.name}${entry.by.role === 'BUYER' ? ' (buyer)' : ''}`
          : entry.by === null
            ? 'System'
            : null;
        return (
          <li key={`${entry.status}-${entry.at}`} className="relative flex min-w-0 gap-4 pb-6 last:pb-0">
            {!last && <span aria-hidden="true" className="absolute bottom-0 left-[9px] top-6 w-0.5 bg-border" />}
            <span aria-hidden="true" className="flex w-5 shrink-0 justify-center pt-1">
              <span
                className={`rounded-full ${statusMeta(entry.status).dot} ${latest ? 'size-5 ring-4 ring-surface-muted' : 'mt-1 size-3'}`}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words text-[15px] font-semibold text-text">{statusMeta(entry.status).label}</p>
              {note && <p className="mt-1 break-words text-sm text-text">{note}</p>}
              <p className="mt-1 text-[13px] tabular-nums text-text-secondary">
                <time dateTime={entry.at}>{formatOrderDateTime(entry.at)}</time>
                {actor && <> · {actor}</>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
