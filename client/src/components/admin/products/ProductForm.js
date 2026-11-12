'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { CloseIcon } from '../icons';
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
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]';

const card = 'rounded-2xl border border-[#e6ddd2] bg-white p-5 sm:p-6';

const inputBase =
  'h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#2B2118] placeholder:text-[#8C7E72] disabled:cursor-not-allowed disabled:bg-[#F1EBE1] disabled:text-[#6E5D4F]';

const inputClass = (error) =>
  `${inputBase} ${error ? 'border-[#BA1A1A]' : 'border-[#CFBEAE]'} ${focusRing}`;

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

// A photo that no longer loads (e.g. an old local /uploads URL) shows a clear placeholder,
// so the admin knows to remove it and upload a new one.
function PhotoPreview({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} could not be loaded`}
        className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-[#CFBEAE] bg-[#EFEBE4] px-3 text-center"
      >
        <span className="text-xs font-semibold text-[#5C4D40]">Image unavailable</span>
        <span className="text-[11px] text-[#6E5D4F]">Remove it and upload again</span>
      </div>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="aspect-[4/5] w-full rounded-xl border border-[#e6ddd2] bg-[#EFEBE4] object-cover"
    />
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
    </svg>
  );
}

function Field({ id, label, required, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-[#2B2118]">
        {label}
        {required && <span className="text-[#BA1A1A]"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1.5 text-xs text-[#6E5D4F]">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-[#BA1A1A]">
          {error}
        </p>
      )}
    </div>
  );
}

export function FormPageLayout({ title, children }) {
  return (
    <div className="mx-auto max-w-6xl">
      <nav aria-label="Breadcrumb" className="text-sm text-[#6E5D4F]">
        <Link href="/admin/products" className={`rounded hover:text-[#2B2118] ${focusRing}`}>
          Product Management
        </Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page" className="text-[#2B2118]">{title}</span>
      </nav>
      <h1 className="mb-6 mt-2 text-3xl font-semibold sm:text-4xl">{title}</h1>
      {children}
    </div>
  );
}

export function FormLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-5" aria-busy="true">
      <div className="h-80 animate-pulse rounded-2xl bg-[#efe9e0] lg:col-span-2" />
      <div className="h-[32rem] animate-pulse rounded-2xl bg-[#efe9e0] lg:col-span-3" />
    </div>
  );
}

export function FormError({ message, onRetry }) {
  return (
    <div className="max-w-xl rounded-2xl border border-[#e6b8a2] bg-[#fdefe6] p-6">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-[#6E5D4F]">{message}</p>
      <div className="mt-5 flex gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`min-h-[40px] rounded-xl bg-[#a3452a] px-5 text-sm font-semibold text-white hover:bg-[#8f3b23] ${focusRing}`}
          >
            Try again
          </button>
        )}
        <Link
          href="/admin/products"
          className={`flex min-h-[40px] items-center rounded-xl border border-[#CFBEAE] bg-white px-5 text-sm font-semibold text-[#2B2118] ${focusRing}`}
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
  const [photos, setPhotos] = useState(() => initialPhotos(product));
  const [snapshot] = useState(() =>
    JSON.stringify({ values: initialValues(product), photos: initialPhotos(product) })
  );
  const [errors, setErrors] = useState({});
  const [photoError, setPhotoError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const busy = submitting || uploading;
  const dirty = JSON.stringify({ values, photos }) !== snapshot;

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
    if (files.length === 0 || sold) return;
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
      setPhotos((prev) => [...prev, ...urls]);
      setErrors((prev) => ({ ...prev, photos: undefined }));
    } catch (err) {
      if (!onAuthError(err)) setPhotoError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleFileInput(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    processFiles(files);
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function makeCover(index) {
    setPhotos((prev) => [prev[index], ...prev.filter((_, i) => i !== index)]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (sold || busy) return;
    setFormError('');

    const found = validate(values, photos);
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
        photos,
      });
    } catch (err) {
      if (!onAuthError(err)) setFormError(err.message);
      setSubmitting(false);
    }
  }

  function handleCancelClick(e) {
    if (dirty && !window.confirm('Discard your unsaved changes?')) e.preventDefault();
  }

  const locked = sold || submitting;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {sold && (
        <div role="status" className="mb-6 rounded-2xl border border-[#CFBEAE] bg-[#F1EBE1] p-4 text-sm text-[#2B2118]">
          <strong className="font-semibold">This item is sold.</strong> Sold products can&apos;t be edited.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className={card} aria-labelledby={`${uid}-photos`}>
            <h2 id={`${uid}-photos`} className="text-lg font-semibold">
              Photos <span className="text-sm font-normal text-[#6E5D4F]">({photos.length}/{MAX_PHOTOS})</span>
            </h2>

            {!sold && (
              <label
                className="relative mt-4 block cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  processFiles(Array.from(e.dataTransfer.files ?? []));
                }}
              >
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileInput}
                  disabled={busy || photos.length >= MAX_PHOTOS}
                  className="peer sr-only"
                />
                <span className="flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-[#CFBEAE] bg-[#FAF7F2] px-4 py-6 text-center text-[#4A3F35] peer-focus-visible:ring-2 peer-focus-visible:ring-[#B5532E] peer-disabled:cursor-not-allowed peer-disabled:opacity-60">
                  <UploadIcon />
                  <span className="text-sm font-semibold">
                    {uploading ? 'Uploading...' : 'Drag photos here or browse'}
                  </span>
                  <span className="text-xs text-[#6E5D4F]">JPG, PNG or WebP · max 5 MB each</span>
                </span>
              </label>
            )}

            {(photoError || errors.photos) && (
              <p role="alert" className="mt-2 text-xs font-medium text-[#BA1A1A]">
                {photoError || errors.photos}
              </p>
            )}

            {photos.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
                {photos.map((src, index) => (
                  <li key={src} className="relative">
                    <PhotoPreview src={src} alt={`Product photo ${index + 1}`} />
                    {index === 0 ? (
                      <span className="absolute bottom-2 left-2 rounded-full bg-[#2B2118] px-2.5 py-1 text-xs font-semibold text-white">
                        Cover
                      </span>
                    ) : (
                      !sold && (
                        <button
                          type="button"
                          onClick={() => makeCover(index)}
                          className={`absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#2B2118] ${focusRing}`}
                        >
                          Make cover
                        </button>
                      )
                    )}
                    {!sold && (
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        aria-label={`Remove photo ${index + 1}`}
                        className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#2B2118] shadow-sm ${focusRing}`}
                      >
                        <CloseIcon width={14} height={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card}>
            <Field
              id={`${uid}-description`}
              label="Description"
              hint="Optional. Mention flaws, measurements, or fit."
            >
              <textarea
                id={`${uid}-description`}
                value={values.description}
                onChange={(e) => setField('description', e.target.value)}
                maxLength={MAX_DESCRIPTION}
                rows={5}
                disabled={locked}
                className={`w-full rounded-xl border border-[#CFBEAE] bg-white px-3 py-2.5 text-sm text-[#2B2118] disabled:bg-[#F1EBE1] ${focusRing}`}
              />
            </Field>
            <p className="mt-1 text-right text-xs text-[#6E5D4F]">
              {values.description.length}/{MAX_DESCRIPTION}
            </p>
          </section>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-3">
          <section className={card} aria-labelledby={`${uid}-basic`}>
            <h2 id={`${uid}-basic`} className="text-lg font-semibold">Basic info</h2>

            <div className="mt-4 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id={`${uid}-name`} label="Name" required error={errors.name}>
                  <input
                    id={`${uid}-name`}
                    value={values.name}
                    onChange={(e) => setField('name', e.target.value)}
                    maxLength={120}
                    disabled={locked}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? `${uid}-name-error` : undefined}
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
                    aria-describedby={errors.brand ? `${uid}-brand-error` : undefined}
                    className={inputClass(errors.brand)}
                  />
                </Field>
              </div>

              <Field id={`${uid}-category`} label="Category" required error={errors.category}>
                <select
                  id={`${uid}-category`}
                  value={values.category}
                  onChange={(e) => setField('category', e.target.value)}
                  disabled={locked}
                  aria-invalid={Boolean(errors.category)}
                  aria-describedby={errors.category ? `${uid}-category-error` : undefined}
                  className={inputClass(errors.category)}
                >
                  <option value="">Choose category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <fieldset disabled={locked}>
                <legend className="text-sm font-semibold text-[#2B2118]">
                  Size <span className="text-[#BA1A1A]">*</span>
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
                      <span className="flex min-h-[40px] min-w-[48px] items-center justify-center rounded-xl border border-[#CFBEAE] bg-white px-4 text-sm font-semibold text-[#4A3F35] peer-checked:border-[#B5532E] peer-checked:bg-[#B5532E] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#B5532E] peer-focus-visible:ring-offset-2 peer-disabled:opacity-60">
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.size && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-[#BA1A1A]">{errors.size}</p>
                )}
              </fieldset>

              <fieldset disabled={locked}>
                <legend className="text-sm font-semibold text-[#2B2118]">
                  Condition <span className="text-[#BA1A1A]">*</span>
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
                      <span className="block rounded-xl border border-[#CFBEAE] bg-white p-3 pr-10 peer-checked:border-[#B5532E] peer-checked:bg-[#FBEDE6] peer-focus-visible:ring-2 peer-focus-visible:ring-[#B5532E] peer-disabled:opacity-60">
                        <span className="block text-sm font-semibold text-[#2B2118]">{c.label}</span>
                        <span className="mt-0.5 block text-xs text-[#6E5D4F]">{c.hint}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-3 h-4 w-4 rounded-full border-2 border-[#CFBEAE] bg-white peer-checked:border-[#B5532E] peer-checked:bg-[#B5532E] peer-checked:shadow-[inset_0_0_0_2px_white]"
                      />
                    </label>
                  ))}
                </div>
                {errors.condition && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-[#BA1A1A]">{errors.condition}</p>
                )}
              </fieldset>
            </div>
          </section>

          <section className={card} aria-labelledby={`${uid}-pricing`}>
            <h2 id={`${uid}-pricing`} className="text-lg font-semibold">Pricing</h2>
            <div className="mt-4">
              <Field
                id={`${uid}-price`}
                label="Price"
                required
                error={errors.price}
                hint={values.price ? `Shown to buyers as ${formatRupiah(values.price)}` : 'Whole rupiah, numbers only.'}
              >
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#6E5D4F]">
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
                    aria-describedby={errors.price ? `${uid}-price-error` : undefined}
                    className={`${inputClass(errors.price)} pl-10 font-mono`}
                  />
                </div>
              </Field>
            </div>
          </section>

          <p className="px-1 text-sm text-[#6E5D4F]">
            Stock: 1. Status is set automatically when a buyer orders.
          </p>
        </div>
      </div>

      {formError && (
        <p role="alert" className="mt-6 rounded-xl bg-[#FBE9E7] px-4 py-3 text-sm font-medium text-[#8C1D18]">
          {formError}
        </p>
      )}

      <div className="sticky bottom-0 z-10 mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-[#e6ddd2] bg-[#FAF7F2]/95 py-4 backdrop-blur">
        {dirty && !sold && (
          <span className="mr-auto text-sm text-[#6E5D4F]">You have unsaved changes.</span>
        )}
        <Link
          href="/admin/products"
          onClick={handleCancelClick}
          className={`flex min-h-[44px] items-center rounded-xl border border-[#CFBEAE] bg-white px-5 text-sm font-semibold text-[#2B2118] hover:bg-[#F1EBE1] ${focusRing}`}
        >
          {sold ? 'Back to products' : 'Cancel'}
        </Link>
        {!sold && (
          <button
            type="submit"
            disabled={busy || (mode === 'edit' && !dirty)}
            className={`min-h-[44px] rounded-xl bg-[#a3452a] px-6 text-sm font-semibold text-white hover:bg-[#8f3b23] disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
          >
            {submitting ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Add product'}
          </button>
        )}
      </div>
    </form>
  );
}