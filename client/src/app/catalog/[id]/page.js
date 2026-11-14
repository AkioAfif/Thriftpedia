'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { ErrorOutlineIcon, SearchOffIcon } from '@/components/ui/Icons';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PurchasePanel } from '@/components/product/PurchasePanel';
import AuthDialog from '@/components/auth/AuthDialog';
import { ProductReviews } from '@/components/product/ProductReviews';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { getProductById, getProductReviews, getRelatedProducts } from '@/lib/services/productService';
import { addToWishlist, getWishlist, isInWishlist, removeFromWishlist } from '@/lib/services/wishlistService';
import { useCatalogHref } from '@/lib/catalogReturn';
import { conditionLabel, sizeLabel } from '@/lib/adminProducts';

const ACTIONS = ['buy', 'wishlist'];
const pageWrap = 'mx-auto w-full max-w-7xl px-4 sm:px-8';
const outlineBtn =
  'inline-flex min-h-[44px] items-center justify-center rounded-md border border-border bg-surface px-5 text-body-md font-semibold text-text transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';
const primaryBtn =
  'inline-flex min-h-[44px] items-center justify-center rounded-md bg-primary px-5 text-body-md font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

function Breadcrumb({ catalogHref, category, name }) {
  const link = 'rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
  return (
    <nav aria-label="Breadcrumb" className="text-body-sm text-text-secondary">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
        <li>
          <Link href="/" className={link}>Home</Link>
        </li>
        <li aria-hidden="true">›</li>
        <li>
          <Link href={catalogHref} className={link}>Catalog</Link>
        </li>
        {category?.slug && (
          <>
            <li aria-hidden="true">›</li>
            <li>
              <Link href={`/catalog?category=${encodeURIComponent(category.slug)}`} className={link}>
                {category.name}
              </Link>
            </li>
          </>
        )}
        {name && (
          <>
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="min-w-0 max-w-full truncate font-medium text-text">
              {name}
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading product" className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-3">
        <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-16 rounded-lg sm:h-24 sm:w-20" />)}
        </div>
      </div>
      <div className="flex h-fit flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-9 w-3/4 rounded" />
        <Skeleton className="h-8 w-40 rounded" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </div>
  );
}

function PageMessage({ icon, title, children, actions }) {
  return (
    <div className="mx-auto mt-12 flex max-w-[30rem] flex-col items-center gap-3 text-center">
      {icon}
      <h1 className="text-headline-sm font-semibold text-text md:text-headline-md">{title}</h1>
      <p className="text-body-md text-text-secondary">{children}</p>
      <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">{actions}</div>
    </div>
  );
}

function DescriptionCard({ product }) {
  const rows = [
    ['Brand', product.brand || '—'],
    ['Category', product.category?.name || 'Uncategorized'],
    ['Size', sizeLabel(product.size)],
    ['Condition', conditionLabel(product.condition)],
  ];
  return (
    <section className="grid gap-8 rounded-2xl border border-border bg-surface p-5 shadow-level-1 sm:p-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
      <div>
        <h2 className="text-headline-sm font-semibold text-text">Description</h2>
        {product.description ? (
          <p className="mt-3 max-w-[65ch] whitespace-pre-line break-words text-body-lg text-text-secondary">{product.description}</p>
        ) : (
          <p className="mt-3 text-body-md italic text-text-secondary">No description provided for this piece.</p>
        )}
      </div>
      <div>
        <h2 className="text-headline-sm font-semibold text-text">Details</h2>
        <dl className="mt-3 divide-y divide-border">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5 text-body-md">
              <dt className="text-text-secondary">{label}</dt>
              <dd className="min-w-0 break-words text-right font-medium text-text">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { token, user, isLoggedIn, ready, logout } = useAuth();
  const catalogHref = useCatalogHref();

  const role = String(user?.role ?? '').toUpperCase();
  const isAdmin = role === 'ADMIN';
  const isBuyer = isLoggedIn && !isAdmin;

  const [tick, setTick] = useState(0);
  const loadKey = `${id}#${tick}`;
  const [result, setResult] = useState({ key: null, status: 'loading', product: null, error: '' });
  const loading = result.key !== loadKey;
  const product = loading ? null : result.product;

  const [justSold, setJustSold] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loginAction, setLoginAction] = useState(null);
  const [loginDone, setLoginDone] = useState(0);
  const pendingAfterLogin = useRef(null);

  const [reviewTick, setReviewTick] = useState(0);
  const [reviews, setReviews] = useState({ key: null, items: [], error: '' });
  const reviewKey = `${id}#${reviewTick}`;

  const [related, setRelated] = useState({ key: null, items: [], error: false });

  const wishKey = `${token}|${id}`;
  const [wish, setWish] = useState({ key: null, saved: false });
  const [wishBusy, setWishBusy] = useState(false);

  useEffect(() => {
    let active = true;
    getProductById(id)
      .then((p) => {
        if (!active) return;
        setResult(p ? { key: loadKey, status: 'ready', product: p, error: '' } : { key: loadKey, status: 'notfound', product: null, error: '' });
      })
      .catch((err) => {
        if (!active) return;
        const notFound = err.status === 404 || err.status === 400;
        setResult({ key: loadKey, status: notFound ? 'notfound' : 'error', product: null, error: err.message });
      });
    return () => {
      active = false;
    };
  }, [id, loadKey]);

  useEffect(() => {
    if (product?.name) document.title = `${product.name} — Thriftpedia`;
  }, [product?.name]);

  useEffect(() => {
    let active = true;
    getProductReviews(id)
      .then((items) => active && setReviews({ key: reviewKey, items, error: '' }))
      .catch((err) => active && setReviews({ key: reviewKey, items: [], error: err.message || 'Please try again.' }));
    return () => {
      active = false;
    };
  }, [id, reviewKey]);

  const categorySlug = product?.category?.slug ?? '';
  const relatedKey = `${id}|${categorySlug}`;
  useEffect(() => {
    if (!categorySlug) return undefined;
    let active = true;
    getRelatedProducts({ categorySlug, excludeId: id })
      .then((items) => active && setRelated({ key: relatedKey, items, error: false }))
      .catch(() => active && setRelated({ key: relatedKey, items: [], error: true }));
    return () => {
      active = false;
    };
  }, [id, categorySlug, relatedKey]);

  useEffect(() => {
    if (!token || !isBuyer) return undefined;
    let active = true;
    getWishlist(token)
      .then((list) => active && setWish({ key: wishKey, saved: isInWishlist(list, id) }))
      .catch((err) => {
        if (!active) return;
        if (err.status === 401) logout();
        setWish({ key: wishKey, saved: false });
      });
    return () => {
      active = false;
    };
  }, [token, isBuyer, id, wishKey, logout]);

  const wishReady = !isLoggedIn || isAdmin || wish.key === wishKey;
  const saved = isBuyer && wish.key === wishKey && wish.saved;
  const setSaved = useCallback((value) => setWish({ key: wishKey, saved: value }), [wishKey]);

  const sold = product?.status !== 'AVAILABLE';
  const view = justSold ? 'taken' : sold ? 'sold' : 'available';

  const markSold = useCallback((fresh) => {
    setResult((r) => ({ ...r, product: fresh ?? (r.product ? { ...r.product, status: 'SOLD' } : r.product) }));
    setJustSold(true);
  }, []);

  const goToCheckout = useCallback(async () => {
    setChecking(true);
    try {
      const fresh = await getProductById(id);
      if (fresh?.status === 'AVAILABLE') {
        router.push(`/checkout/${id}`);
        return;
      }
      markSold(fresh);
    } catch (err) {
      if (err.status === 404 || err.status === 409) markSold(null);
      else toast.error(err.message || 'Couldn’t check availability. Please try again.');
    }
    setChecking(false);
  }, [id, router, markSold]);

  const saveToWishlist = useCallback(async () => {
    setWishBusy(true);
    try {
      await addToWishlist(token, id);
      setSaved(true);
      toast.success('Saved to your wishlist');
    } catch (err) {
      if (err.status === 409) {
        setSaved(true);
        toast('Already in your wishlist');
      } else if (err.status === 401) {
        logout();
        setLoginAction('wishlist');
      } else {
        toast.error(err.message || 'Couldn’t update your wishlist.');
      }
    } finally {
      setWishBusy(false);
    }
  }, [token, id, setSaved, logout]);

  async function handleToggleWishlist() {
    if (!isLoggedIn) {
      setLoginAction('wishlist');
      return;
    }
    if (!saved) {
      saveToWishlist();
      return;
    }
    setWishBusy(true);
    try {
      await removeFromWishlist(token, id);
      setSaved(false);
      toast('Removed from your wishlist');
    } catch (err) {
      if (err.status === 404) setSaved(false);
      else if (err.status === 401) {
        logout();
        setLoginAction('wishlist');
      } else toast.error(err.message || 'Couldn’t update your wishlist.');
    } finally {
      setWishBusy(false);
    }
  }

  function handleBuy() {
    if (!isLoggedIn) {
      setLoginAction('buy');
      return;
    }
    if (isAdmin) return;
    goToCheckout();
  }

    function handleAuthSuccess(authUser) {
    const pending = loginAction;
    setLoginAction(null);
    if (String(authUser?.role ?? '').toUpperCase() === 'ADMIN') return;
    pendingAfterLogin.current = pending;
    setLoginDone((n) => n + 1);
  }

  const action = searchParams.get('action');
  const resumed = useRef(false);
  const productReady = !loading && result.status === 'ready';
  useEffect(() => {
    if (resumed.current || !ACTIONS.includes(action) || !ready || !productReady || !wishReady) return;
    resumed.current = true;
    router.replace(pathname, { scroll: false });
    if (!isBuyer || result.product?.status !== 'AVAILABLE') return;
    if (action === 'buy') queueMicrotask(goToCheckout);
    else if (!saved) queueMicrotask(saveToWishlist);
  }, [action, ready, productReady, wishReady, isBuyer, saved, result.product, router, pathname, goToCheckout, saveToWishlist]);

    useEffect(() => {
    const pending = pendingAfterLogin.current;
    if (!pending || !isBuyer || !token || !productReady || !wishReady) return;
    pendingAfterLogin.current = null;
    if (result.product?.status !== 'AVAILABLE') return;
    if (pending === 'buy') queueMicrotask(goToCheckout);
    else if (pending === 'wishlist' && !saved) queueMicrotask(saveToWishlist);
  }, [loginDone, isBuyer, token, productReady, wishReady, saved, result.product, goToCheckout, saveToWishlist]);

  return (
    <main className="w-full flex-1 pb-16 pt-6 md:pt-8">
      <div className={pageWrap}>
        <Breadcrumb catalogHref={catalogHref} category={product?.category} name={product?.name} />

        {loading ? (
          <DetailSkeleton />
        ) : result.status === 'notfound' ? (
          <PageMessage
            icon={<SearchOffIcon className="h-10 w-10 text-primary" />}
            title="Product not found"
            actions={<Link href={catalogHref} className={primaryBtn}>Back to catalog</Link>}
          >
            This piece may have been removed, or the link is incorrect.
          </PageMessage>
        ) : result.status === 'error' ? (
          <PageMessage
            icon={<ErrorOutlineIcon className="h-10 w-10 text-error" />}
            title="Couldn’t load this piece"
            actions={
              <>
                <button type="button" onClick={() => setTick((t) => t + 1)} className={primaryBtn}>
                  Retry
                </button>
                <Link href={catalogHref} className={outlineBtn}>Back to catalog</Link>
              </>
            }
          >
            {result.error || 'Something went wrong.'} Please try again.
          </PageMessage>
        ) : (
          <div className="flex flex-col gap-12 md:gap-16">
            <div className="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-10">
              <ProductGallery key={product._id} photos={product.photos ?? []} name={product.name} sold={sold} />
              <div className="lg:sticky lg:top-6">
                <PurchasePanel
                  product={product}
                  view={view}
                  checking={checking}
                  isAdmin={isAdmin}
                  onBuy={handleBuy}
                  catalogHref={catalogHref}
                  wishlist={{ saved, busy: wishBusy, ready: wishReady }}
                  onToggleWishlist={handleToggleWishlist}
                />
              </div>
            </div>

            <DescriptionCard product={product} />

            <ProductReviews
              state={
                reviews.key !== reviewKey
                  ? { status: 'loading', items: [] }
                  : reviews.error
                    ? { status: 'error', items: [], error: reviews.error }
                    : { status: 'ready', items: reviews.items }
              }
              onRetry={() => setReviewTick((t) => t + 1)}
            />

            {categorySlug && (
              <RelatedProducts
                categorySlug={categorySlug}
                state={
                  related.key !== relatedKey
                    ? { status: 'loading', items: [] }
                    : { status: related.error ? 'error' : 'ready', items: related.items }
                }
              />
            )}
          </div>
        )}
      </div>

      <AuthDialog
        key={loginAction ?? 'closed'}
        open={Boolean(loginAction)}
        onClose={() => setLoginAction(null)}
        context={loginAction === 'buy' ? 'checkout' : 'wishlist'}
        initialTab="login"
        onSuccess={handleAuthSuccess}
      />
    </main>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  return (
    <Suspense
      fallback={
        <main className="w-full flex-1 pb-16 pt-6 md:pt-8">
          <div className={pageWrap}>
            <DetailSkeleton />
          </div>
        </main>
      }
    >
      <ProductDetail key={id} />
    </Suspense>
  );
}