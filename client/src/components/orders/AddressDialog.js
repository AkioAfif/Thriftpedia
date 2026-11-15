'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { draftKey, usePersistedForm } from '@/hooks/usePersistedForm';
import { AddressForm } from '@/components/orders/AddressForm';
import { PaymentNoticeRow } from '@/components/orders/PaymentNotice';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { LoadingDots } from '@/components/ui/LoadingDots';
import { updateOrderAddress } from '@/lib/services/orderService';
import { ADDRESS_FIELDS, EMPTY_ADDRESS, validateAddress } from '@/lib/shippingAddress';

const BTN = 'inline-flex h-12 w-full items-center justify-center rounded-xl px-6 text-[15px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none sm:w-auto';

const pick = (source) => {
  const values = { ...EMPTY_ADDRESS };
  for (const field of ADDRESS_FIELDS) if (typeof source?.[field] === 'string') values[field] = source[field];
  return values;
};

// Add or edit the delivery address of a PENDING, unpaid order (PATCH /orders/:id/address).
// ActionDialog is a native modal <dialog>: bottom sheet below md, centred from md, focus trapped,
// Esc / backdrop close it unless saving. The draft survives a refresh and is dropped on save or Cancel.
// `onSaved(order)` receives the updated order (same shape as GET /orders/:id); `onConflict` runs
// on 409 (the address became read-only, e.g. a payment was started meanwhile).
export function AddressDialog({ order, onClose, onSaved, onConflict }) {
  const { token, user } = useAuth();
  const editing = Boolean(order.shippingAddress);
  const initial = pick(order.shippingAddress);
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState('');
  const [locked, setLocked] = useState(false); // after a 409 there is nothing left to save
  const formRef = useRef(null);

  const draft = usePersistedForm({
    key: draftKey(user, 'order-address', order._id),
    value: values,
    baseline: initial,
    enabled: !locked,
    onRestore: (saved) => setValues(pick(saved)),
  });

  // ActionDialog (a child) opens the modal in its own effect first; then the first field takes focus.
  useEffect(() => {
    formRef.current?.querySelector('input, textarea')?.focus();
  }, []);

  function change(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  function cancel() {
    draft.clear();
    onClose();
  }

  async function save(event) {
    event.preventDefault();
    if (busy || locked) return;
    const checked = validateAddress(values, { required: true });
    setErrors(checked.errors);
    const firstInvalid = ADDRESS_FIELDS.find((key) => checked.errors[key]);
    if (firstInvalid) {
      formRef.current?.querySelector(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setBusy(true);
    setServerError('');
    try {
      const updated = await updateOrderAddress(token, order._id, checked.address);
      draft.clear();
      onSaved(updated);
      toast.success('Address saved');
      onClose();
    } catch (err) {
      setBusy(false);
      setServerError(err.message || 'Couldn’t save the address. Please try again.');
      if (err.status === 409) {
        setLocked(true);
        draft.clear();
        onConflict?.();
      }
    }
  }

  return (
    <ActionDialog title={editing ? 'Edit delivery address' : 'Add delivery address'} busy={busy} onRequestClose={onClose}>
      <form ref={formRef} onSubmit={save} noValidate className="-mt-3">
        <p className="text-[13px] text-text-secondary">Needed to pay online.</p>
        <div className="mt-4">
          <AddressForm values={values} errors={errors} onChange={change} disabled={busy || locked} />
        </div>

        {serverError && (
          <div role="alert" className="mt-4">
            <PaymentNoticeRow tone="error" title={serverError} />
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={cancel}
            disabled={busy}
            className={`${BTN} border-[1.5px] border-border bg-surface text-text hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {locked ? 'Close' : 'Cancel'}
          </button>
          {!locked && (
            <button
              type="submit"
              disabled={busy}
              aria-busy={busy}
              className={`relative ${BTN} bg-primary text-on-primary hover:bg-primary-hover disabled:cursor-wait`}
            >
              {/* The label keeps the button width while the dots show. */}
              <span className={busy ? 'invisible' : undefined}>Save address</span>
              {busy && <LoadingDots className="absolute inset-0 justify-center" />}
            </button>
          )}
        </div>
      </form>
    </ActionDialog>
  );
}
