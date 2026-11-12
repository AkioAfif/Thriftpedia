'use client';

import { useId, useState } from 'react';
import OrderStatusBadge from './OrderStatusBadge';
import { COURIER_MAX, NOTE_MAX, TRACKING_MAX, TRANSITION_ACTIONS, statusMeta } from '@/lib/adminOrders';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2';
const inputBase = `w-full rounded-xl border bg-white px-4 text-sm text-[#2B2118] placeholder:text-[#8C7E72] ${focusRing}`;

const TERMINAL_COPY = {
  COMPLETED: 'This order is completed. Its status can no longer change.',
  CANCELLED: 'This order was cancelled and the product went back on sale. Its status can no longer change.',
};

function actionFor(status) {
  return TRANSITION_ACTIONS[status] ?? { label: `Move to ${statusMeta(status).label}`, done: 'Status updated' };
}

// Buttons come only from `allowedTransitions` sent by the server.
export default function OrderStatusPanel({ order, onSubmit }) {
  const ids = useId();
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ trackingNumber: '', courier: '', note: '' });
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);

  const transitions = Array.isArray(order.allowedTransitions) ? order.allowedTransitions : [];
  const shipping = target === 'SHIPPED';
  const action = target ? actionFor(target) : null;

  function choose(status) {
    setTarget(status);
    setForm({ trackingNumber: '', courier: '', note: '' });
    setFieldError('');
  }

  async function submit(e) {
    e.preventDefault();
    const trackingNumber = form.trackingNumber.trim();
    if (shipping && !trackingNumber) {
      setFieldError('Enter the tracking number before marking the order as shipped.');
      document.getElementById(`${ids}-tracking`)?.focus();
      return;
    }
    const payload = { status: target };
    if (shipping) {
      payload.trackingNumber = trackingNumber;
      if (form.courier.trim()) payload.courier = form.courier.trim();
    }
    if (form.note.trim()) payload.note = form.note.trim();

    setBusy(true);
    const ok = await onSubmit(payload, action);
    setBusy(false);
    if (ok) setTarget(null);
  }

  return (
    <section aria-labelledby={`${ids}-title`} className="rounded-[20px] border border-[#e8e1d8] bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id={`${ids}-title`} className="text-lg font-semibold text-[#2b1d14]">
          Manage status
        </h2>
        <OrderStatusBadge status={order.status} />
      </div>

      {transitions.length === 0 && (
        <p className="mt-4 text-sm text-[#6E5D4F]">
          {TERMINAL_COPY[order.status] ?? 'There is no next step for this order.'}
        </p>
      )}

      {transitions.length > 0 && !target && (
        <div className="mt-5 flex flex-col gap-2.5">
          {transitions.map((status) => {
            const a = actionFor(status);
            return (
              <button
                key={status}
                type="button"
                onClick={() => choose(status)}
                className={`min-h-[44px] rounded-xl px-5 text-sm font-semibold transition-colors duration-150 ${focusRing} ${
                  a.destructive
                    ? 'border border-[#CFBEAE] bg-white text-[#8F3B23] hover:border-[#B5532E] hover:bg-[#FBEDE6]'
                    : 'bg-[#a3452a] text-white hover:bg-[#8f3b23]'
                }`}
              >
                {a.label}
              </button>
            );
          })}
          <p className="mt-1 text-xs text-[#6E5D4F]">The product&apos;s sold status is handled by the system.</p>
        </div>
      )}

      {target && (
        <form onSubmit={submit} noValidate className="mt-5 space-y-4">
          <p className="text-sm font-semibold text-[#2b1d14]">
            {action.label}
            <span className="font-normal text-[#6E5D4F]"> · {statusMeta(order.status).label} → {statusMeta(target).label}</span>
          </p>

          {action.destructive && (
            <p className="rounded-xl bg-[#FBEDE6] px-4 py-3 text-sm text-[#7A3416]">
              The buyer&apos;s order ends here and the product goes back on sale right away. This cannot be undone.
            </p>
          )}

          {shipping && (
            <>
              <div>
                <label htmlFor={`${ids}-tracking`} className="text-sm font-medium text-[#2b1d14]">
                  Tracking number <span className="text-[#8F3B23]">(required)</span>
                </label>
                <input
                  id={`${ids}-tracking`}
                  value={form.trackingNumber}
                  maxLength={TRACKING_MAX}
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(fieldError) || undefined}
                  aria-describedby={fieldError ? `${ids}-tracking-error` : undefined}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, trackingNumber: e.target.value }));
                    if (fieldError) setFieldError('');
                  }}
                  placeholder="e.g. JNE0012345678"
                  className={`mt-1.5 h-11 font-mono ${inputBase} ${fieldError ? 'border-[#ba1a1a]' : 'border-[#CFBEAE]'}`}
                />
                {fieldError && (
                  <p id={`${ids}-tracking-error`} className="mt-1.5 text-sm text-[#ba1a1a]">
                    {fieldError}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor={`${ids}-courier`} className="text-sm font-medium text-[#2b1d14]">
                  Courier <span className="font-normal text-[#6E5D4F]">(optional)</span>
                </label>
                <input
                  id={`${ids}-courier`}
                  value={form.courier}
                  maxLength={COURIER_MAX}
                  autoComplete="off"
                  onChange={(e) => setForm((f) => ({ ...f, courier: e.target.value }))}
                  placeholder="e.g. JNE, SiCepat"
                  className={`mt-1.5 h-11 border-[#CFBEAE] ${inputBase}`}
                />
              </div>
            </>
          )}

          <div>
            <label htmlFor={`${ids}-note`} className="text-sm font-medium text-[#2b1d14]">
              Note <span className="font-normal text-[#6E5D4F]">(optional, kept in history)</span>
            </label>
            <textarea
              id={`${ids}-note`}
              rows={3}
              value={form.note}
              maxLength={NOTE_MAX}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className={`mt-1.5 resize-y border-[#CFBEAE] py-2.5 ${inputBase}`}
            />
          </div>

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setTarget(null)}
              disabled={busy}
              className={`min-h-[44px] rounded-xl border border-[#e8e1d8] bg-white px-5 text-sm font-medium text-[#2b1d14] hover:bg-[#faf7f2] disabled:opacity-60 ${focusRing}`}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={busy}
              className={`min-h-[44px] rounded-xl bg-[#a3452a] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#8f3b23] disabled:cursor-wait disabled:opacity-70 ${focusRing}`}
            >
              {busy ? 'Saving…' : action.destructive ? 'Yes, cancel order' : action.label}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
