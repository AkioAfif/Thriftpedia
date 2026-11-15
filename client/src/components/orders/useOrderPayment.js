'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { createPaymentToken } from '@/lib/services/paymentService';
import { loadSnap, paymentStatusOf } from '@/lib/payment';

const POLL_EVERY_MS = 3000;
const POLL_MAX = 5;

// Midtrans' hosted page opens in a new tab. The tab must be opened inside the click itself:
// a window.open after awaiting the token is no longer a user gesture and gets popup-blocked.
// So it is opened blank first and pointed at Midtrans once the URL is known.
function openBlankTab() {
  const tab = window.open('', '_blank');
  if (!tab) return null; // blocked anyway: the caller falls back to this tab
  try {
    tab.opener = null; // the payment page must not reach back into ours
    tab.document.title = 'Opening payment…';
  } catch {
    // cross-origin or closed already: nothing to set
  }
  return tab;
}

const closeTab = (tab) => {
  if (tab && !tab.closed) tab.close();
};

// Pay now for one order. The browser never decides that an order is paid: whatever Snap reports,
// the order is fetched again (`refresh`) and then polled a few times, because the official status
// only arrives through the Midtrans webhook. `order` may be undefined while it loads.
export function useOrderPayment({ order, token, refresh }) {
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false); // 503: payment not configured on the server
  const [error, setError] = useState('');
  const [poll, setPoll] = useState(null); // { status, payment, done } taken when Snap closed
  const [awayInTab, setAwayInTab] = useState(null); // snapshot while the buyer pays in the other tab
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

  // While the buyer pays in the Midtrans tab, check the order each time they come back to this one.
  // Watching stops by itself once the order moves (paid, expired, cancelled).
  const watchingTab =
    Boolean(awayInTab) && order?.status === awayInTab.status && paymentStatusOf(order) === awayInTab.payment;
  const checkPaymentRef = useRef(checkPayment);
  useEffect(() => {
    checkPaymentRef.current = checkPayment;
  });
  useEffect(() => {
    if (!watchingTab) return undefined;
    const onReturn = () => {
      if (document.visibilityState === 'visible') checkPaymentRef.current(awayInTab);
    };
    document.addEventListener('visibilitychange', onReturn);
    return () => document.removeEventListener('visibilitychange', onReturn);
  }, [watchingTab, awayInTab]);

  async function pay() {
    if (busy || !order) return;
    const snapshot = { status: order.status, payment: paymentStatusOf(order) };
    // Without a Snap client key the hosted page is the only way: open its tab now, in the click.
    const tab = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ? null : openBlankTab();
    setBusy(true);
    setError('');

    let session;
    try {
      session = await createPaymentToken(token, order._id);
    } catch (err) {
      closeTab(tab);
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

    const snap = tab ? null : await loadSnap().catch(() => null);
    if (!mounted.current) {
      closeTab(tab);
      return;
    }

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

    // No Snap (no client key, script blocked or failed): Midtrans' hosted page in a new tab.
    if (session.redirectUrl) {
      const target = tab ?? openBlankTab(); // Snap failed to load: try a tab (may be blocked now)
      if (target && !target.closed) {
        target.location.href = session.redirectUrl;
        setBusy(false);
        setAwayInTab(snapshot);
        toast('Complete the payment in the new tab, then come back here.');
        return;
      }
      // Popups blocked: leave for the hosted page in this tab. Stays busy while leaving.
      window.location.assign(session.redirectUrl);
      return;
    }
    closeTab(tab);
    setBusy(false);
    setError('Couldn’t open the payment page. Please try again.');
  }

  return { pay, busy, unavailable, error, confirming, unconfirmed };
}
