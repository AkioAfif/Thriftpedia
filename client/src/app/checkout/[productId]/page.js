'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthDialog from '@/components/auth/AuthDialog';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorOutlineIcon } from '@/components/ui/Icons';
import { getProduct, createOrder } from '@/lib/services/orderService';
import { conditionLabel, formatRupiah, sizeLabel } from '@/lib/adminProducts';
import { canOptimizeImage } from '@/lib/imageHosts';
import { ADDRESS_FIELDS, EMPTY_ADDRESS, validateAddress } from '@/lib/shippingAddress';
import { draftKey, usePersistedForm } from '@/hooks/usePersistedForm';
import { AddressForm } from '@/components/orders/AddressForm';
import { LoadingDots } from '@/components/ui/LoadingDots';

const btnBase =
  'inline-flex w-full min-h-[44px] items-center justify-center rounded-md px-5 text-body-md font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const btnPrimary = `${btnBase} bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed`;
const btnSecondary = `${btnBase} border border-border bg-canvas text-text hover:bg-surface hover:text-primary`;

// Why the piece can't be checked out. 'taken' = another buyer won the race at Place order.
const UNAVAILABLE = {
  taken: { title: 'Someone just bought this', text: 'This piece is no longer available.' },
  sold: { title: 'This piece has been sold', text: 'This piece is no longer available.' },
  notFound: { title: 'Product not found', text: 'This piece doesn’t exist or was removed.' },
};

export default function CheckoutPage() {
  const { productId } = useParams();
  const router = useRouter();
  const { token, user, isLoggedIn, ready, logout } = useAuth();

  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(null); // null | key of UNAVAILABLE
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [authOpen, setAuthOpen] = useState(false);
  // How the buyer pays. 'online' needs a delivery address; 'seller' places the order and
  // the payment is agreed with the store (the address stays optional).
  const [method, setMethod] = useState('online'); // 'online' | 'seller'
  const [addressOpen, setAddressOpen] = useState(false); // only used by 'seller'
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState({});
  const addressFormRef = useRef(null);
  // Method, address and the disclosure survive a refresh (per account and product); cleared once the order exists.
  const addressDraft = usePersistedForm({
    key: draftKey(user, 'checkout-address', productId),
    value: { open: addressOpen, address, method },
    baseline: { open: false, address: EMPTY_ADDRESS, method: 'online' },
    enabled: ready,
    onRestore: (draft) => {
      const restored = { ...EMPTY_ADDRESS };
      for (const field of ADDRESS_FIELDS) {
        if (typeof draft.address?.[field] === 'string') restored[field] = draft.address[field];
      }
      setAddress(restored);
      setAddressOpen(Boolean(draft.open));
      setMethod(draft.method === 'seller' ? 'seller' : 'online');
    },
  });
  // Set by the login dialog; the effect below places the order once the new token is in context.
  const pendingOrder = useRef(false);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getProduct(productId)
      .then((p) => {
        if (!active) return;
        setProduct(p);
        setUnavailable(!p ? 'notFound' : p.status === 'AVAILABLE' ? null : 'sold');
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 404 || err.status === 400) setUnavailable('notFound');
        else setLoadError(err.message);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [productId, attempt]);

  function retry() {
    setLoading(true);
    setLoadError('');
    setAttempt((n) => n + 1);
  }

  function changeAddress(key, value) {
    setAddress((current) => ({ ...current, [key]: value }));
    // A fixed field drops its error right away; the rest are re-checked on Place order.
    setAddressErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  }

  function chooseMethod(next) {
    if (next === method) return;
    setMethod(next);
    setAddressErrors({});
    setSubmitError('');
  }

  async function placeOrder() {
    if (submitting) return;
    // Paying online needs the whole address; with the seller it is optional (all blank = none sent).
    const checked = validateAddress(address, { required: method === 'online' });
    setAddressErrors(checked.errors);
    const firstInvalid = ADDRESS_FIELDS.find((key) => checked.errors[key]);
    if (firstInvalid) {
      setAddressOpen(true);
      // After the panel has rendered open.
      requestAnimationFrame(() => addressFormRef.current?.querySelector(`[name="${firstInvalid}"]`)?.focus());
      return;
    }
    if (!token) {
      setAuthOpen(true);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const order = await createOrder(token, productId, checked.address ?? undefined);
      addressDraft.clear();
      router.push(`/orders/${order._id}?placed=1${method === 'online' ? '&pay=1' : ''}`);
    } catch (err) {
      setSubmitting(false);
      // backend re-checks stock atomically; 409 means another buyer got it first
      if (err.status === 409 || err.status === 404) {
        setUnavailable('taken');
        setProduct((p) => (p ? { ...p, status: 'SOLD' } : p));
      } else if (err.status === 401) {
        logout();
      } else {
        setSubmitError(err.message);
      }
    }
  }

  // Runs after the render that carries the new token, so placeOrder sees it.
  useEffect(() => {
    if (!token || !pendingOrder.current) return;
    pendingOrder.current = false;
    queueMicrotask(placeOrder); // outside the effect body: placeOrder sets state
  });

  function handleAuthSuccess(newUser) {
    // Admins land on the disabled button and its explanation instead of ordering.
    if (String(newUser?.role ?? '').toUpperCase() !== 'ADMIN') pendingOrder.current = true;
  }

  const isAdmin = String(user?.role ?? '').toUpperCase() === 'ADMIN';
  const reason = unavailable ? UNAVAILABLE[unavailable] : null;
  const showSkeleton = loading || !ready;
  // Only in the normal checkout state; sold / not found / load error keep "Back to catalog"
  // as the single way out. Admins (Place order disabled) still see it.
  const showBackToProduct = !showSkeleton && !loadError && !reason && Boolean(product);

  return (
    <main className="mx-auto w-full max-w-[600px] flex-1 px-margin-mobile py-xl md:px-margin-tablet md:py-16 lg:px-8">
      {/* One element: a 44px round icon button below md; icon + text link from md. */}
      {showBackToProduct ? (
        <Link
          href={`/catalog/${encodeURIComponent(productId)}`}
          aria-label="Back to product"
          className="mb-3 inline-flex size-11 items-center justify-center rounded-full border-[1.5px] border-border bg-surface text-text transition-colors duration-150 hover:border-primary hover:text-primary active:border-primary active:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none md:size-auto md:min-h-11 md:justify-start md:gap-2 md:rounded-md md:border-0 md:bg-transparent md:text-text-secondary"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0 md:size-4">
            <path d="M19 12H5M11 6l-6 6 6 6" />
          </svg>
          <span className="sr-only text-sm font-semibold md:not-sr-only">Back to product</span>
        </Link>
      ) : (
        showSkeleton && <div aria-hidden="true" className="mb-3 h-11" />
      )}
      <h1 className="text-headline-mobile font-semibold md:text-headline-lg">Checkout</h1>

      {loading || !ready ? (
        <CheckoutSkeleton />
      ) : loadError ? (
        <div role="alert" className="mt-lg flex flex-col items-center gap-sm border-t border-border pt-lg text-center">
          <ErrorOutlineIcon />
          <p className="text-body-md text-text">We couldn&apos;t load this piece. {loadError}</p>
          <button type="button" onClick={retry} className={`${btnSecondary} mt-sm sm:w-auto`}>
            Try again
          </button>
        </div>
      ) : (
        <>
          {!reason && (
            <p className="mt-sm text-body-md text-text-secondary">
              {isLoggedIn ? 'Review your one-of-one piece and place your order.' : 'Log in to buy this one-of-one piece.'}
            </p>
          )}

          {product && unavailable !== 'notFound' && <ProductRow product={product} sold={Boolean(reason)} />}

          {product && !reason && (
            <div className="mt-md flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-md">
                <span className="text-title-md font-semibold text-text">Total</span>
                <span className="text-headline-sm font-semibold tabular-nums text-text">{formatRupiah(product.price)}</span>
              </div>
              <p className="text-[13px] text-text-secondary">This piece is one of a kind.</p>
            </div>
          )}

          {product && !reason && !isAdmin && (
            <PaymentChoice
              method={method}
              onMethod={chooseMethod}
              addressOpen={addressOpen}
              onToggleAddress={() => setAddressOpen((value) => !value)}
              values={address}
              errors={addressErrors}
              onChange={changeAddress}
              disabled={submitting}
              formRef={addressFormRef}
            />
          )}

          <div className="mt-lg flex flex-col gap-sm">
            {reason ? (
              <div role="alert" className="flex flex-col gap-md rounded-lg bg-badge-danger p-md text-text">
                <div className="flex gap-sm">
                  <ErrorOutlineIcon className="mt-0.5 h-5 w-5 shrink-0 text-error" />
                  <div>
                    <p className="text-title-md font-semibold">{reason.title}</p>
                    <p className="mt-1 text-body-md">{reason.text}</p>
                  </div>
                </div>
                <Link href="/catalog" className={btnPrimary}>
                  Back to catalog
                </Link>
              </div>
            ) : (
              <>
                {submitError && (
                  <p role="alert" className="flex items-center gap-sm text-[13px] text-error">
                    <ErrorOutlineIcon className="h-4 w-4 shrink-0" />
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={submitting || isAdmin}
                  aria-busy={submitting}
                  aria-describedby={isAdmin ? 'admin-order-note' : undefined}
                  className={btnPrimary}
                >
                 {submitting ? <LoadingDots /> : method === 'online' ? 'Place order and pay' : 'Place order'}
                </button>
                {isAdmin ? (
                  <p id="admin-order-note" className="text-[13px] text-text-secondary">
                    Admin accounts can&apos;t place orders.
                  </p>
                ) : (
                  <p className="text-[13px] text-text-secondary">
                    {method === 'online'
                      ? 'Next you’ll pay for this order. You can cancel while it’s Pending.'
                      : 'You’ll agree on payment with the store. You can cancel while it’s Pending.'}
                  </p>
                )}
                <Link href="/catalog" className={btnSecondary}>
                  Back to catalog
                </Link>
              </>
            )}
          </div>
        </>
      )}

      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        context="checkout"
        initialTab="login"
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}

function ProductRow({ product, sold }) {
  const photo = product.photos?.[0];
  const [photoFailed, setPhotoFailed] = useState(false);
  return (
    <div className="mt-lg flex items-center gap-md border-y border-border py-md">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-muted">
        {photo && !photoFailed ? (
          <Image
            src={photo}
            alt={product.name}
            fill
            sizes="64px"
            unoptimized={!canOptimizeImage(photo)}
            onError={() => setPhotoFailed(true)}
            className={`object-cover ${sold ? 'opacity-50 grayscale' : ''}`}
          />
        ) : (
          <span className="text-[10px] text-text-muted">No image</span>
        )}
        {sold && <Badge variant="sold" className="absolute bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px]" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-title-md font-medium">{product.name}</p>
        <p className="mt-xs text-[13px] text-text-secondary">
          Size {sizeLabel(product.size)} · {conditionLabel(product.condition)}
        </p>
      </div>
      <p className={`shrink-0 text-title-md font-semibold tabular-nums ${sold ? 'text-text-muted' : 'text-text'}`}>
        {formatRupiah(product.price)}
      </p>
    </div>
  );
}

function MethodCard({ value, checked, onSelect, disabled, title, text }) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-[20px] border-[1.5px] p-4 transition-colors duration-150 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 motion-reduce:transition-none ${
        checked ? 'border-primary bg-primary-tint' : 'border-border bg-surface hover:border-text-secondary'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <input
        type="radio"
        name="payment-method"
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onSelect(value)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
          checked ? 'border-primary' : 'border-border'
        }`}
      >
        {checked && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0">
        <span className="block text-base font-semibold text-text">{title}</span>
        <span className="mt-0.5 block text-[13px] text-text-secondary">{text}</span>
      </span>
    </label>
  );
}

// Online: the address is required and always visible. Seller: it stays hidden behind a small link.
function PaymentChoice({ method, onMethod, addressOpen, onToggleAddress, values, errors, onChange, disabled, formRef }) {
  const panelId = `${useId()}-panel`;
  const online = method === 'online';
  return (
    <fieldset className="mt-lg min-w-0">
      <legend className="text-base font-semibold text-text">How will you pay?</legend>
      <div className="mt-3 flex flex-col gap-3">
        <MethodCard
          value="online"
          checked={online}
          onSelect={onMethod}
          disabled={disabled}
          title="Pay online now"
          text="Card, virtual account or QRIS. A delivery address is required."
        />
        <MethodCard
          value="seller"
          checked={!online}
          onSelect={onMethod}
          disabled={disabled}
          title="Arrange with seller"
          text="Place the order first, then agree on payment with the store. You can add an address later."
        />
      </div>

      <div className="mt-4">
        {!online && (
          <button
            type="button"
            aria-expanded={addressOpen}
            aria-controls={panelId}
            onClick={onToggleAddress}
            className="inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            {addressOpen ? 'Hide address' : 'Add address anyway (optional)'}
          </button>
        )}
        {/* Hidden, not unmounted: what was typed stays, and Place order can still focus the first bad field. */}
        <div
          id={panelId}
          ref={formRef}
          hidden={!online && !addressOpen}
          className="mt-2 rounded-[20px] border border-border bg-surface px-4 pb-5 pt-4 sm:px-5"
        >
          <h2 className="text-base font-semibold text-text">Delivery address</h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            {online
              ? 'Check it carefully: it can’t be changed once payment opens. Shipping cost is arranged separately.'
              : 'Optional. Shipping cost is arranged separately.'}
          </p>
          <div className="mt-4">
            <AddressForm values={values} errors={errors} onChange={onChange} disabled={disabled} />
          </div>
        </div>
      </div>
    </fieldset>
  );
}

function CheckoutSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mt-sm h-5 w-64" />
      <div className="mt-lg flex items-center gap-md border-y border-border py-md">
        <Skeleton className="h-16 w-16 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>
      <Skeleton className="mt-md h-8 w-full rounded-md" />
      <Skeleton className="mt-lg h-14 w-full rounded-[20px]" />
      <Skeleton className="mt-lg h-11 w-full rounded-md" />
      <Skeleton className="mt-sm h-11 w-full rounded-md" />
    </div>
  );
}