'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import FilterSelect from '@/components/ui/FilterSelect';
import MobileBackBar from '../MobileBackBar';
import FormSection from './FormSection';
import PhotoDropZone from './PhotoDropZone';
import PhotoGallery, { toPhotoItem } from './PhotoGallery';
import ProductPreview from './ProductPreview';
import { useAuth } from '@/context/AuthContext';
import { draftKey, usePersistedForm } from '@/hooks/usePersistedForm';
import {
  ALLOWED_IMAGE_TYPES,
  CONDITION_OPTIONS,
  MAX_FILE_SIZE,
  MAX_PHOTOS,
  SIZE_OPTIONS,
  formatRupiah,
  uploadPhotos,
} from '@/lib/adminProducts';

const MAX_DESCRIPTION = 1000;

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

// 44px fields: var(--border) border; focus = 2px terracotta edge (1px border + 1px inset shadow) and a var(--primary-tint) ring.
const focusField =
  'outline-none focus:border-primary focus:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_var(--primary-tint)]';

const inputBase =
  'h-11 w-full rounded-xl border bg-surface px-3 text-sm text-text placeholder:text-text-secondary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary';

const inputClass = (error) => `${inputBase} ${error ? 'border-error' : 'border-border'} ${focusField}`;

const errorText = 'mt-1.5 text-[13px] font-medium text-error';

function initialValues(product) {
  return {
    name: product?.name ?? '',
    brand: product?.brand ?? '',
    category: product?.category?._id ?? product?.category ?? '',
    size: product?.size ?? '',
    condition: product?.condition ?? '',
    price: product?.price !== undefined ? String(product.price) : '',
    description: product?.description ?? '',
  };
}

function initialPhotos(product) {
  return Array.isArray(product?.photos)
    ? product.photos.filter((p) => typeof p === 'string' && p.trim().length > 0)
    : [];
}

function validate(values, photos) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = 'Enter a name (at least 2 characters).';
  if (!values.brand.trim()) errors.brand = 'Brand is required.';
  if (!values.category) errors.category = 'Choose a category.';
  if (!SIZE_OPTIONS.some((s) => s.value === values.size)) errors.size = 'Choose a size.';
  if (!CONDITION_OPTIONS.some((c) => c.value === values.condition)) {
    errors.condition = 'Choose a condition.';
  }
  if (!/^\d+$/.test(values.price) || Number(values.price) <= 0) {
    errors.price = 'Enter a price greater than 0.';
  }
  if (photos.length === 0) errors.photos = 'Add at least one photo.';
  return errors;
}

function Field({ id, label, required, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-text">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1.5 text-[13px] text-text-secondary">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className={errorText}>
          {error}
        </p>
      )}
    </div>
  );
}

export function FormPageLayout({ title, children }) {
  return (
    <div className="mx-auto w-full max-w-[1152px]">
      {/* Below lg the top bar shows "Back to Products" + the title, so the breadcrumb is desktop-only. */}
      <MobileBackBar href="/admin/products" label="Products" title={`${title.charAt(0)}${title.slice(1).toLowerCase()}`} />
      <nav aria-label="Breadcrumb" className="hidden text-sm text-text-secondary lg:block">
        <Link href="/admin/products" className={`rounded hover:text-text ${focusRing}`}>
          Product Management
        </Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page" className="text-text">{title}</span>
      </nav>
      <h1 className="mb-6 text-[32px] font-semibold leading-tight text-text sm:text-[40px] lg:mt-2">{title}</h1>
      {children}
    </div>
  );
}

export function FormLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" aria-busy="true">
      <div className="flex flex-col gap-6">
        <div className="h-80 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-96 animate-pulse rounded-2xl bg-surface-muted" />
      </div>
      <div className="hidden h-[26rem] animate-pulse rounded-2xl bg-surface-muted lg:block" />
    </div>
  );
}

export function FormError({ message, onRetry }) {
  return (
    <div className="max-w-[576px] rounded-2xl border border-primary-tint bg-primary-tint p-6">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-text-secondary">{message}</p>
      <div className="mt-5 flex gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`min-h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-primary-hover ${focusRing}`}
          >
            Try again
          </button>
        )}
        <Link
          href="/admin/products"
          className={`flex min-h-11 items-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-text hover:bg-surface-muted ${focusRing}`}
        >
          Back to products
        </Link>
      </div>
    </div>
  );
}

export default function ProductForm({ mode, product, categories, onSubmit, onAuthError }) {
  const uid = useId();
  const sold = product?.status === 'SOLD';

  const [values, setValues] = useState(() => initialValues(product));
  // Ordered list of { id, url }; index 0 is the cover. `photoUrls` is what the server gets.
  const [photos, setPhotos] = useState(() => initialPhotos(product).map(toPhotoItem));
  const photoUrls = photos.map((p) => p.url);
  const [snapshot] = useState(() =>
    JSON.stringify({ values: initialValues(product), photos: initialPhotos(product) })
  );
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const busy = submitting || uploading;

  // Unsaved changes survive a refresh (per account; one draft for "new", one per edited product).
  // New: restored right after mount. Edit: the server data stays; a different draft is offered
  // in a banner (Restore / Discard). Sold products can't be edited, so they keep no draft.
  const { user } = useAuth();
  const baseline = { values: initialValues(product), photos: initialPhotos(product) };
  const draft = usePersistedForm({
    key: mode === 'edit' ? draftKey(user, 'product-edit', product?._id) : draftKey(user, 'product-new'),
    value: { values, photos: photoUrls },
    baseline,
    autoRestore: mode !== 'edit',
    enabled: !sold,
    onRestore: (saved) => {
      const restored = { ...baseline.values };
      for (const field of Object.keys(restored)) {
        if (typeof saved.values?.[field] === 'string') restored[field] = saved.values[field];
      }
      setValues(restored);
      if (Array.isArray(saved.photos)) {
        const urls = saved.photos.filter((url) => typeof url === 'string' && url.trim()).slice(0, MAX_PHOTOS);
        setPhotos(urls.map(toPhotoItem));
      }
    },
  });
  const dirty = JSON.stringify({ values, photos: photoUrls }) !== snapshot;

  useEffect(() => {
    if (!dirty || submitting) return undefined;
    function onBeforeUnload(e) {
      e.preventDefault();
      e.returnValue = '';
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, submitting]);

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  async function processFiles(files) {
    // One upload at a time: a second drop while uploading would race and scramble the order.
    if (files.length === 0 || sold || busy) return;
    setPhotoError('');

    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return setPhotoError(`Maximum ${MAX_PHOTOS} photos per product.`);
    if (files.length > room) return setPhotoError(`You can add ${room} more photo(s).`);
    const badType = files.find((f) => !ALLOWED_IMAGE_TYPES.includes(f.type));
    if (badType) return setPhotoError(`"${badType.name}" is not a JPG, PNG, or WebP image.`);
    const tooBig = files.find((f) => f.size > MAX_FILE_SIZE);
    if (tooBig) return setPhotoError(`"${tooBig.name}" is larger than 5 MB.`);

    setUploading(true);
    try {
      const urls = await uploadPhotos(files);
      // Appended in the order the server returned them; the first photo of an empty list is the cover.
      setPhotos((prev) => [...prev, ...urls.map(toPhotoItem)]);
      setErrors((prev) => ({ ...prev, photos: undefined }));
    } catch (err) {
      if (!onAuthError(err)) setPhotoError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sold || busy) return;
    setFormError('');

    const found = validate(values, photoUrls);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        brand: values.brand.trim(),
        description: values.description.trim(),
        category: values.category,
        size: values.size,
        condition: values.condition,
        price: Number(values.price),
        photos: photoUrls, // array order = display order, index 0 = cover
      });
      draft.clear();
    } catch (err) {
      if (!onAuthError(err)) setFormError(err.message);
      setSubmitting(false);
    }
  }

  function handleCancelClick(e) {
    if (dirty && !window.confirm('Discard your unsaved changes?')) {
      e.preventDefault();
      return;
    }
    draft.clear();
  }

  const locked = sold || submitting;
  const noChanges = mode === 'edit' && !dirty && !sold;
  const fieldError = (key) => (errors[key] ? `${uid}-${key}-error` : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate>
      {draft.pending && (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 break-words text-sm text-text">
            <strong className="font-semibold">Restore unsaved changes?</strong>{' '}
            <span className="text-text-secondary">You edited this product earlier without saving.</span>
          </p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={draft.discard}
              className={`min-h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text hover:bg-surface-muted sm:flex-none ${focusRing}`}
            >
              Discard
            </button>
            <button
              type="button"
              onClick={draft.restore}
              className={`min-h-11 flex-1 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover sm:flex-none ${focusRing}`}
            >
              Restore
            </button>
          </div>
        </div>
      )}
      {sold && (
        <div role="status" className="mb-6 rounded-2xl border border-border bg-surface-muted p-4 text-sm text-text">
          <strong className="font-semibold">This item is sold.</strong> Sold products can&apos;t be edited.
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <FormSection
            step={1}
            title="Photos"
            titleId={`${uid}-photos`}
            tone="bg-primary-tint"
            aside={<span className="text-[13px] font-medium tabular-nums text-text">{photos.length}/{MAX_PHOTOS}</span>}
          >
            {!sold && (
              <PhotoDropZone disabled={busy || photos.length >= MAX_PHOTOS} uploading={uploading} onFiles={processFiles} />
            )}

            {(photoError || errors.photos) && (
              <p role="alert" className={errorText}>
                {photoError || errors.photos}
              </p>
            )}

            {photos.length > 0 && (
              <>
                {!sold && photos.length > 1 && (
                  <p className="mt-3 text-[13px] text-text-secondary">The first photo is the cover. Drag photos or use the arrows to reorder.</p>
                )}
                <PhotoGallery
                  photos={photos}
                  readOnly={sold}
                  onChange={(next) => {
                    setPhotos(next);
                    setErrors((prev) => (prev.photos && next.length > 0 ? { ...prev, photos: undefined } : prev));
                  }}
                />
              </>
            )}
          </FormSection>

          <FormSection step={2} title="Basic info" titleId={`${uid}-basic`} tone="bg-surface-muted">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={`${uid}-name`} label="Name" required error={errors.name}>
                  <input
                    id={`${uid}-name`}
                    value={values.name}
                    onChange={(e) => setField('name', e.target.value)}
                    maxLength={120}
                    disabled={locked}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={fieldError('name')}
                    className={inputClass(errors.name)}
                  />
                </Field>
                <Field id={`${uid}-brand`} label="Brand" required error={errors.brand}>
                  <input
                    id={`${uid}-brand`}
                    value={values.brand}
                    onChange={(e) => setField('brand', e.target.value)}
                    maxLength={100}
                    disabled={locked}
                    aria-invalid={Boolean(errors.brand)}
                    aria-describedby={fieldError('brand')}
                    className={inputClass(errors.brand)}
                  />
                </Field>
              </div>

              <Field id={`${uid}-category`} label="Category" required error={errors.category}>
                <FilterSelect
                  id={`${uid}-category`}
                  label="Category"
                  variant="field"
                  includeEmpty={false}
                  emptyLabel="Choose category"
                  value={values.category}
                  onChange={(category) => setField('category', category)}
                  options={categories.map((c) => ({ value: c._id, label: c.name }))}
                  disabled={locked}
                  invalid={Boolean(errors.category)}
                  describedBy={fieldError('category')}
                />
              </Field>

              <fieldset disabled={locked}>
                <legend className="text-sm font-semibold text-text">
                  Size <span className="text-error">*</span>
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((s) => (
                    <label key={s.value} className="relative cursor-pointer">
                      <input
                        type="radio"
                        name={`${uid}-size`}
                        value={s.value}
                        checked={values.size === s.value}
                        onChange={() => setField('size', s.value)}
                        className="peer sr-only"
                      />
                      <span className="flex min-h-11 min-w-[52px] items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-text hover:border-primary peer-checked:border-primary peer-checked:bg-primary peer-checked:text-on-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:bg-surface-muted peer-disabled:text-text-secondary peer-disabled:peer-checked:bg-text-secondary peer-disabled:peer-checked:text-on-primary">
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.size && (
                  <p role="alert" className={errorText}>{errors.size}</p>
                )}
              </fieldset>

              <fieldset disabled={locked}>
                <legend className="text-sm font-semibold text-text">
                  Condition <span className="text-error">*</span>
                </legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {CONDITION_OPTIONS.map((c) => (
                    <label key={c.value} className="relative block cursor-pointer">
                      <input
                        type="radio"
                        name={`${uid}-condition`}
                        value={c.value}
                        checked={values.condition === c.value}
                        onChange={() => setField('condition', c.value)}
                        className="peer sr-only"
                      />
                      <span className="block h-full rounded-xl border-2 border-border bg-surface p-3 pr-10 hover:border-primary peer-checked:border-primary peer-checked:bg-primary-tint peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:hover:border-border">
                        <span className="block text-sm font-semibold text-text">{c.label}</span>
                        <span className="mt-0.5 block text-[13px] text-text-secondary">{c.hint}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-3.5 size-[18px] rounded-full border-2 border-border bg-surface peer-checked:border-primary peer-checked:bg-primary peer-checked:shadow-[inset_0_0_0_3px_white]"
                      />
                    </label>
                  ))}
                </div>
                {errors.condition && (
                  <p role="alert" className={errorText}>{errors.condition}</p>
                )}
              </fieldset>
            </div>
          </FormSection>

          <FormSection step={3} title="Description" titleId={`${uid}-description-title`} tone="bg-secondary-tint">
            <Field id={`${uid}-description`} label="Description" hint="Optional. Mention flaws, measurements, or fit.">
              <textarea
                id={`${uid}-description`}
                value={values.description}
                onChange={(e) => setField('description', e.target.value)}
                maxLength={MAX_DESCRIPTION}
                rows={5}
                disabled={locked}
                className={`${inputBase} h-auto border-border py-2.5 ${focusField}`}
              />
            </Field>
            <p className="mt-1 text-right text-[13px] tabular-nums text-text-secondary">
              {values.description.length}/{MAX_DESCRIPTION}
            </p>
          </FormSection>

          <FormSection step={4} title="Pricing" titleId={`${uid}-pricing`} tone="bg-badge-warning">
            <Field
              id={`${uid}-price`}
              label="Price"
              required
              error={errors.price}
              hint={values.price ? `Shown to buyers as ${formatRupiah(values.price)}` : 'Whole rupiah, numbers only.'}
            >
              <div
                className={`flex h-11 overflow-hidden rounded-xl border bg-surface focus-within:border-primary focus-within:shadow-[0_0_0_1px_var(--primary),0_0_0_4px_var(--primary-tint)] ${
                  errors.price ? 'border-error' : 'border-border'
                }`}
              >
                <span aria-hidden="true" className="flex items-center border-r border-border bg-surface-muted px-3 text-sm font-semibold text-text">
                  Rp
                </span>
                <input
                  id={`${uid}-price`}
                  inputMode="numeric"
                  value={values.price}
                  onChange={(e) => setField('price', e.target.value.replace(/\D/g, ''))}
                  placeholder="680000"
                  disabled={locked}
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={fieldError('price')}
                  className="min-w-0 flex-1 bg-surface px-3 text-sm tabular-nums text-text outline-none placeholder:text-text-secondary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary"
                />
              </div>
            </Field>
            <p className="mt-4 text-[13px] text-text-secondary">Stock: 1. Status is set automatically when a buyer orders.</p>
          </FormSection>
        </div>

        <aside className="min-w-0 lg:sticky lg:top-6">
          <ProductPreview
            coverUrl={photos[0]?.url ?? ''}
            name={values.name}
            brand={values.brand}
            size={values.size}
            price={values.price}
          />
        </aside>
      </div>

      {formError && (
        <p role="alert" className="mt-6 rounded-xl bg-error-tint px-4 py-3 text-sm font-medium text-error">
          {formError}
        </p>
      )}

      {/* Below lg: one 64px row (8 + 48 + 8) plus the safe-area inset, Cancel 2/5 and Save 3/5;
          the status text moves into the disabled button. From lg: unchanged. */}
      <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex flex-nowrap items-center justify-end gap-3 border-t border-border bg-surface px-6 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 lg:-mx-10 lg:flex-wrap lg:px-10 lg:pb-4 lg:pt-4">
        {!sold && (dirty || noChanges) && (
          <span className="mr-auto hidden text-[13px] text-text-secondary lg:inline" aria-live="polite">
            {noChanges ? 'No changes to save' : 'You have unsaved changes.'}
          </span>
        )}
        <Link
          href="/admin/products"
          onClick={handleCancelClick}
          className={`flex min-h-12 items-center justify-center rounded-xl border border-border bg-surface px-5 text-sm font-semibold text-text hover:bg-surface-muted lg:min-h-11 lg:justify-start ${sold ? 'flex-1' : 'flex-[2]'} lg:flex-none ${focusRing}`}
        >
          {sold ? 'Back to products' : 'Cancel'}
        </Link>
        {!sold && (
          <button
            type="submit"
            disabled={busy || (mode === 'edit' && !dirty)}
            className={`min-h-12 flex-[3] rounded-xl bg-primary px-6 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-border disabled:text-text-secondary lg:min-h-11 lg:flex-none ${focusRing}`}
          >
            {submitting ? (
              'Saving...'
            ) : mode === 'edit' ? (
              noChanges ? (
                <>
                  <span className="lg:hidden">No changes</span>
                  <span className="hidden lg:inline">Save changes</span>
                </>
              ) : (
                'Save changes'
              )
            ) : (
              'Add product'
            )}
          </button>
        )}
      </div>
    </form>
  );
}
