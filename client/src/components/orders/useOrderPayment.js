'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { createPaymentToken } from '@/lib/services/paymentService';
import { loadSnap, paymentStatusOf } from '@/lib/payment';

const POLL_EVERY_MS = 3000;
const POLL_MAX = 5;

// Pay now for one order. The browser never decides that an order is paid: whatever Snap reports,
// the order is fetched again (`refresh`) and then polled a few times, because the official status
// only arrives through the Midtrans webhook. `order` may be undefined while it loads.
export function useOrderPayment({ order, token, refresh }) {
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false); // 503: payment not configured on the server
  const [error, setError] = useState('');
  const [poll, setPoll] = useState(null); // { status, payment, done } taken when Snap closed
  const refreshRef = useRef(refresh);
  const mounted = useRef(false);

  useEffect(() => {
    refreshRef.current = refresh;
  });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Polling stops as soon as the order moves (paid, expired, cancelled), after POLL_MAX tries, or on unmount.
  const changed = Boolean(poll) && (order?.status !== poll.status || paymentStatusOf(order) !== poll.payment);
  const confirming = Boolean(poll) && !poll.done && !changed;
  const unconfirmed = Boolean(poll?.done) && !changed;

  useEffect(() => {
    if (!confirming) return undefined;
    let count = 0;
    const id = setInterval(() => {
      count += 1;
      refreshRef.current();
      if (count >= POLL_MAX) {
        clearInterval(id);
        setPoll((current) => (current ? { ...current, done: true } : current));
      }
    }, POLL_EVERY_MS);
    return () => clearInterval(id);
  }, [confirming]);

  function checkPayment(snapshot) {
    toast('Checking your payment...');
    refreshRef.current();
    setPoll({ ...snapshot, done: false });
  }

  async function pay() {
    if (busy || !order) return;
    const snapshot = { status: order.status, payment: paymentStatusOf(order) };
    setBusy(true);
    setError('');

    let session;
    try {
      session = await createPaymentToken(token, order._id);
    } catch (err) {
      if (!mounted.current) return;
      setBusy(false);
      if (err.status === 503) {
        setUnavailable(true);
      } else if (err.status === 409 || err.status === 401 || err.status === 403 || err.status === 404) {
        // The order changed (or the session ended): show the current truth.
        if (err.status === 409) toast.error(err.message);
        refreshRef.current();
      } else {
        setError(err.message || 'Couldn’t start the payment. Please try again.');
      }
      return;
    }

    const snap = await loadSnap().catch(() => null);
    if (!mounted.current) return;

    if (snap && session.token) {
      let handled = false;
      const done = () => {
        if (handled) return;
        handled = true;
        if (mounted.current) checkPayment(snapshot);
      };
      setBusy(false);
      try {
        snap.pay(session.token, { onSuccess: done, onPending: done, onError: done, onClose: done });
      } catch {
        setError('The payment window is already open. Finish or close it first.');
      }
      return;
    }

    // No Snap (no client key, script blocked or failed): Midtrans' hosted page. Stays busy while leaving.
    if (session.redirectUrl) {
      window.location.assign(session.redirectUrl);
      return;
    }
    setBusy(false);
    setError('Couldn’t open the payment page. Please try again.');
  }

  return { pay, busy, unavailable, error, confirming, unconfirmed };
}
