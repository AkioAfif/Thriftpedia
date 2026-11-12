'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorOutlineIcon } from '@/components/ui/Icons';
import { getProduct, createOrder } from '@/lib/services/orderService';
import { formatPrice } from '@/lib/utils';
import { canOptimizeImage } from '@/lib/imageHosts';

const btnBase =
  'inline-flex w-full min-h-[44px] items-center justify-center rounded-md px-5 text-body-md font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const btnPrimary = `${btnBase} bg-primary text-on-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed`;
const btnSecondary = `${btnBase} border border-border bg-canvas text-text hover:bg-surface hover:text-primary`;

export default function CheckoutPage() {
  const { productId } = useParams();
  const router = useRouter();
  const { token, user, isLoggedIn, ready, logout } = useAuth();

  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    getProduct(productId)
      .then((p) => {
        if (!active) return;
        setProduct(p);
        setUnavailable(p?.status !== 'AVAILABLE');
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 404 || err.status === 400) setUnavailable(true);
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

  async function placeOrder() {
    if (submitting) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const order = await createOrder(token, productId);
      router.push(`/orders/${order._id}?placed=1`);
    } catch (err) {
      setSubmitting(false);
      // backend re-checks stock atomically; 409 means another buyer got it first
      if (err.status === 409 || err.status === 404) {
        setUnavailable(true);
        setProduct((p) => (p ? { ...p, status: 'SOLD' } : p));
      } else if (err.status === 401) {
        logout();
      } else {
        setSubmitError(err.message);
      }
    }
  }

  const loginHref = `/login?redirect=${encodeURIComponent(`/checkout/${productId}`)}`;
  const isAdmin = String(user?.role ?? '').toUpperCase() === 'ADMIN';

  return (
    <main className="mx-auto w-full max-w-[600px] flex-1 px-margin-mobile py-xl md:px-margin-tablet md:py-16">
      <h1 className="text-headline-mobile font-semibold md:text-headline-lg">Checkout</h1>

      {loading || !ready ? (
        <CheckoutSkeleton />
      ) : loadError ? (
        <div role="alert" className="mt-lg flex flex-col items-center gap-sm border-t border-border pt-lg text-center">
          <ErrorOutlineIcon />
          <p className="text-body-md text-text">We couldn&apos;t load this piece. {loadError}</p>
          <button type="button" onClick={retry}className={`${btnSecondary} mt-sm sm:w-auto`}>
            Try again
          </button>
        </div>
      ) : (
        <>
          <p className="mt-sm text-body-md text-text-secondary">
            {unavailable
              ? 'This piece can no longer be checked out.'
              : isLoggedIn
                ? 'Review your one-of-one piece and place your order.'
                : 'Log in to buy this one-of-one piece.'}
          </p>

          {product && <ProductRow product={product} sold={unavailable} />}

          <div className="mt-lg flex flex-col gap-sm">
            {unavailable ? (
              <>
                <p role="alert" className="flex items-center gap-sm rounded-md bg-badge-danger px-md py-sm text-body-md text-text">
                  <ErrorOutlineIcon className="h-5 w-5 shrink-0 text-error" />
                  Sorry, this piece is no longer available.
                </p>
                <Link href="/catalog" className={btnPrimary}>
                  Back to catalog
                </Link>
              </>
            ) : !isLoggedIn ? (
              <>
                <Link href={loginHref} className={btnPrimary}>
                  Log in to continue
                </Link>
                <Link href="/catalog" className={btnSecondary}>
                  Back to catalog
                </Link>
              </>
            ) : (
              <>
                {submitError && (
                  <p role="alert" className="flex items-center gap-sm text-body-sm text-error">
                    <ErrorOutlineIcon className="h-4 w-4 shrink-0" />
                    {submitError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={placeOrder}
                  disabled={submitting || isAdmin}
                  aria-busy={submitting}
                  className={btnPrimary}
                >
                  {submitting ? <Spinner /> : 'Place order'}
                </button>
                {isAdmin && (
                  <p className="text-body-sm text-text-secondary">Admin accounts can&apos;t place orders.</p>
                )}
                <Link href="/catalog" className={btnSecondary}>
                  Back to catalog
                </Link>
              </>
            )}
          </div>
        </>
      )}
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
            className={`object-cover ${sold ? 'opacity-75 grayscale' : ''}`}
          />
        ) : (
          <span className="text-[10px] text-text-muted">No image</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-title-md font-medium">{product.name}</p>
        <p className="mt-xs label-md text-text-secondary">
          Size {product.size} · {product.condition?.replaceAll('_', ' ')}
        </p>
      </div>
      <p className="price shrink-0">{formatPrice(product.price)}</p>
    </div>
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
      <Skeleton className="mt-lg h-11 w-full rounded-md" />
    </div>
  );
}

function Spinner() {
  return (
    <span
      role="status"
      aria-label="Placing order"
      className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary border-t-transparent motion-reduce:animate-none"
    />
  );
}
