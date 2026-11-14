'use client';

import { useId, useState } from 'react';
import { OrderStepper } from './OrderTimeline';
import TrackingBox from './TrackingBox';
import { COURIER_MAX, NOTE_MAX, TRACKING_MAX, TRANSITION_ACTIONS, statusMeta } from '@/lib/adminOrders';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2';
const inputBase = `w-full rounded-xl border bg-white px-4 text-sm text-[#2B2118] placeholder:text-[#8C7E72] ${focusRing}`;
const primaryBtn = `min-h-[48px] w-full rounded-xl bg-[#B5532E] px-5 text-[15px] font-semibold text-white transition-colors duration-150 hover:bg-[#9C4425] ${focusRing}`;

const TERMINAL_COPY = {
  COMPLETED: 'This order is completed. Its status can no longer change.',
  CANCELLED: 'This order was cancelled and the product went back on sale. Its status can no longer change.',
};

function actionFor(status) {
  return TRANSITION_ACTIONS[status] ?? { label: `Mark as ${statusMeta(status).label}`, done: 'Status updated' };
}

function DoneIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5F7A5E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

// Stepper, tracking and the next-step actions in one card; history lives on the page. Buttons come only from `allowedTransitions`.
export default function OrderStatusPanel({ order, onSubmit }) {
  const ids = useId();
  const [target, setTarget] = useState(null);
  const [form, setForm] = useState({ trackingNumber: '', courier: '', note: '' });
  const [fieldError, setFieldError] = useState('');
  const [busy, setBusy] = useState(false);

  const transitions = Array.isArray(order.allowedTransitions) ? order.allowedTransitions : [];
  const forward = transitions.filter((s) => s !== 'CANCELLED');
  const canCancel = transitions.includes('CANCELLED');
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
    <section aria-labelledby={`${ids}-title`} className="overflow-hidden rounded-[20px] border border-[#D9CFC1] bg-white">
      <div className="border-b border-[#EAE4DA] bg-[#F5F0E8] px-5 py-3.5 sm:px-6">
        <h2 id={`${ids}-title`} className="text-[18px] font-semibold text-[#2B2118]">
          Order progress
        </h2>
      </div>

      <div className="p-5 sm:p-6">
        <OrderStepper status={order.status} history={order.statusHistory} />

        {order.trackingNumber && (
          <div className="mt-6">
            <TrackingBox trackingNumber={order.trackingNumber} courier={order.courier} />
          </div>
        )}
      </div>

      <div className="border-t border-[#EAE4DA] p-5 sm:p-6">
        <h3 className="text-[18px] font-semibold text-[#2B2118]">Next step</h3>

        {transitions.length === 0 && (
          <p className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#F5F0E8] px-4 py-3 text-sm text-[#2B2118]">
            {order.status === 'COMPLETED' && <DoneIcon />}
            {TERMINAL_COPY[order.status] ?? 'There is no next step for this order.'}
          </p>
        )}

        {transitions.length > 0 && !target && (
          <div className="mt-4 flex flex-col items-center gap-2">
            {forward.map((status) => (
              <button key={status} type="button" onClick={() => choose(status)} className={primaryBtn}>
                {actionFor(status).label}
              </button>
            ))}
            {canCancel && (
              <button
                type="button"
                onClick={() => choose('CANCELLED')}
                className={`min-h-[44px] rounded-lg px-3 text-sm font-semibold text-[#ba1a1a] underline-offset-4 hover:underline ${focusRing}`}
              >
                {actionFor('CANCELLED').label}
              </button>
            )}
            <p className="text-center text-[13px] text-[#6F6358]">The product&apos;s sold status is handled by the system.</p>
          </div>
        )}

        {target && (
          <form onSubmit={submit} noValidate className="mt-4 space-y-4">
            <p className="text-sm font-semibold text-[#2B2118]">
              {action.label}
              <span className="font-normal text-[#6F6358]">
                {' '}· {statusMeta(order.status).label} → {statusMeta(target).label}
              </span>
            </p>

            {action.destructive && (
              <p className="rounded-xl bg-[#FBEDE6] px-4 py-3 text-sm text-[#7A3416]">
                The buyer&apos;s order ends here and the product goes back on sale right away. This cannot be undone.
              </p>
            )}

            {shipping && (
              <>
                <div>
                  <label htmlFor={`${ids}-tracking`} className="text-sm font-medium text-[#2B2118]">
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
                  <label htmlFor={`${ids}-courier`} className="text-sm font-medium text-[#2B2118]">
                    Courier <span className="font-normal text-[#6F6358]">(optional)</span>
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
              <label htmlFor={`${ids}-note`} className="text-sm font-medium text-[#2B2118]">
                Note <span className="font-normal text-[#6F6358]">(optional, kept in history)</span>
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
                className={`min-h-[44px] rounded-xl border border-[#e8e1d8] bg-white px-5 text-sm font-medium text-[#2B2118] hover:bg-[#faf7f2] disabled:opacity-60 ${focusRing}`}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className={`min-h-[44px] rounded-xl px-5 text-sm font-semibold text-white transition-colors disabled:cursor-wait disabled:opacity-70 ${focusRing} ${
                  action.destructive ? 'bg-[#ba1a1a] hover:bg-[#93000a]' : 'bg-[#B5532E] hover:bg-[#9C4425]'
                }`}
              >
                {busy ? 'Saving…' : action.destructive ? 'Yes, cancel order' : action.label}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
