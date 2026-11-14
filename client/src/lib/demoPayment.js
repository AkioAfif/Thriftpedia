'use client';

// DEMO-PAYMENT (hapus sebelum rilis)
// Development-only preview of every payment state on the buyer order page, without Midtrans keys.
// Open /orders/<id>?demoPayment=<state>. Only the DISPLAYED order is overridden in the browser;
// Pay now is simulated and never calls the API. In production builds both exports are inert
// (NODE_ENV is inlined at build time, so the preview code is dropped).
//
// To remove: delete this file and every line marked "DEMO-PAYMENT (hapus sebelum rilis)".

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

const ENABLED = process.env.NODE_ENV === 'development';

export const DEMO_PAYMENT_STATES = [
  'unpaid',
  'processing',
  'pending-confirm',
  'paid',
  'expired',
  'failed',
  'unavailable',
  'noaddress',
];

// Fictional address, used only when the real order has none and the state needs one.
const SAMPLE_ADDRESS = {
  recipientName: 'Preview Buyer',
  phone: '081200000000',
  address: 'Jl. Contoh No. 1, RT 01/RW 02',
  city: 'Yogyakarta',
  postalCode: '55281',
};

const PRESETS = {
  unpaid: { status: 'PENDING', paymentStatus: 'UNPAID' },
  processing: { status: 'PENDING', paymentStatus: 'UNPAID', busy: true },
  'pending-confirm': { status: 'PENDING', paymentStatus: 'UNPAID', confirming: true },
  paid: { status: 'PROCESSING', paymentStatus: 'PAID' },
  expired: { status: 'CANCELLED', paymentStatus: 'EXPIRED' },
  failed: { status: 'CANCELLED', paymentStatus: 'FAILED' },
  unavailable: { status: 'PENDING', paymentStatus: 'UNPAID', unavailable: true },
  noaddress: { status: 'PENDING', paymentStatus: 'UNPAID', noAddress: true },
};

const LOADING_MS = 1200;
const CONFIRMING_MS = 3000;

function useDemoPaymentDev(order, payment) {
  const searchParams = useSearchParams();
  const requested = searchParams.get('demoPayment');
  const fromUrl = DEMO_PAYMENT_STATES.includes(requested) ? requested : null;
  const [state, setState] = useState({ fromUrl, current: fromUrl });
  const [run, setRun] = useState(0);

  // URL changed (another preview state): start over from it. Guarded update during render.
  if (state.fromUrl !== fromUrl) setState({ fromUrl, current: fromUrl });

  // Simulated Pay now: loading, then "being confirmed", then paid. Timers are cleaned up.
  useEffect(() => {
    if (!run) return undefined;
    const confirm = setTimeout(() => {
      toast('Checking your payment...');
      setState((s) => ({ ...s, current: 'pending-confirm' }));
    }, LOADING_MS);
    const paid = setTimeout(() => setState((s) => ({ ...s, current: 'paid' })), LOADING_MS + CONFIRMING_MS);
    return () => {
      clearTimeout(confirm);
      clearTimeout(paid);
    };
  }, [run]);

  if (!order || !state.current) return { order, payment };
  const preset = PRESETS[state.current];
  return {
    order: {
      ...order,
      status: preset.status,
      paymentStatus: preset.paymentStatus,
      shippingAddress: preset.noAddress ? undefined : (order.shippingAddress ?? SAMPLE_ADDRESS),
      trackingNumber: null,
      courier: null,
      __demo: state.current,
    },
    payment: {
      busy: Boolean(preset.busy),
      unavailable: Boolean(preset.unavailable),
      confirming: Boolean(preset.confirming),
      unconfirmed: false,
      error: '',
      pay: () => {
        setState((s) => ({ ...s, current: 'processing' }));
        setRun((n) => n + 1);
      },
    },
  };
}

export const useDemoPayment = ENABLED ? useDemoPaymentDev : (order, payment) => ({ order, payment });

// Small fixed chip so a preview can't be mistaken for real data.
export function DemoPaymentChip({ order }) {
  if (!ENABLED || !order?.__demo) return null;
  return (
    <p className="pointer-events-none fixed bottom-4 left-4 z-50 rounded-full border-[1.5px] border-dashed border-[#2E6A8F] bg-[#DCEBF2] px-3 py-1 text-[13px] font-semibold text-[#1F4B66] shadow-level-2">
      Preview: {order.__demo}
    </p>
  );
}
