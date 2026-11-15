'use client';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import FilterSelect from '@/components/ui/FilterSelect';
import MobileBackBar from '../MobileBackBar';
import FormSection from './FormSection';
import PhotoDropZone from './PhotoDropZone';
import PhotoGallery, { toPhotoItem } from './PhotoGallery';
import ProductPreview from './ProductPreview';
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
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2';

// 44px fields: #D9CFC1 border; focus = 2px terracotta edge (1px border + 1px inset shadow) and a #FBE6DC ring.
const focusField =
  'outline-none focus:border-[#B5532E] focus:shadow-[0_0_0_1px_#B5532E,0_0_0_4px_#FBE6DC]';

const inputBase =
  'h-11 w-full rounded-xl border bg-white px-3 text-sm text-[#2B2118] placeholder:text-[#7A6D61] disabled:cursor-not-allowed disabled:bg-[#F5F0E8] disabled:text-[#6F6358]';

const inputClass = (error) => `${inputBase} ${error ? 'border-[#B3402A]' : 'border-[#D9CFC1]'} ${focusField}`;

const errorText = 'mt-1.5 text-[13px] font-medium text-[#B3402A]';

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
      <label htmlFor={id} className="text-sm font-semibold text-[#2B2118]">
        {label}
        {required && <span className="text-[#B3402A]"> *</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1.5 text-[13px] text-[#6F6358]">{hint}</p>}
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
      <nav aria-label="Breadcrumb" className="hidden text-sm text-[#6F6358] lg:block">
        <Link href="/admin/products" className={`rounded hover:text-[#2B2118] ${focusRing}`}>
          Product Management
        </Link>
        <span aria-hidden="true"> › </span>
        <span aria-current="page" className="text-[#2B2118]">{title}</span>
      </nav>
      <h1 className="mb-6 text-[32px] font-semibold leading-tight text-[#2B2118] sm:text-[40px] lg:mt-2">{title}</h1>
      {children}
    </div>
  );
}

export function FormLoading() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]" aria-busy="true">
      <div className="flex flex-col gap-6">
        <div className="h-80 animate-pulse rounded-2xl bg-[#efe9e0]" />
        <div className="h-96 animate-pulse rounded-2xl bg-[#efe9e0]" />
      </div>
      <div className="hidden h-[26rem] animate-pulse rounded-2xl bg-[#efe9e0] lg:block" />
    </div>
  );
}

export function FormError({ message, onRetry }) {
  return (
    <div className="max-w-[576px] rounded-2xl border border-[#e6b8a2] bg-[#fdefe6] p-6">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="mt-2 text-sm text-[#6F6358]">{message}</p>
      <div className="mt-5 flex gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className={`min-h-11 rounded-xl bg-[#B5532E] px-5 text-sm font-semibold text-white hover:bg-[#9C4425] ${focusRing}`}
          >
            Try again
          </button>
        )}
        <Link
          href="/admin/products"
          className={`flex min-h-11 items-center rounded-xl border border-[#D9CFC1] bg-white px-5 text-sm font-semibold text-[#2B2118] hover:bg-[#F5F0E8] ${focusRing}`}
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
    } catch (err) {
      if (!onAuthError(err)) setFormError(err.message);
      setSubmitting(false);
    }
  }

  function handleCancelClick(e) {
    if (dirty && !window.confirm('Discard your unsaved changes?')) e.preventDefault();
  }

  const locked = sold || submitting;
  const noChanges = mode === 'edit' && !dirty && !sold;
  const fieldError = (key) => (errors[key] ? `${uid}-${key}-error` : undefined);

  return (
    <form onSubmit={handleSubmit} noValidate>
      {sold && (
        <div role="status" className="mb-6 rounded-2xl border border-[#D9CFC1] bg-[#F5F0E8] p-4 text-sm text-[#2B2118]">
          <strong className="font-semibold">This item is sold.</strong> Sold products can&apos;t be edited.
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-6">
          <FormSection
            step={1}
            title="Photos"
            titleId={`${uid}-photos`}
            tone="bg-[#FBE6DC]"
            aside={<span className="text-[13px] font-medium tabular-nums text-[#2B2118]">{photos.length}/{MAX_PHOTOS}</span>}
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
                  <p className="mt-3 text-[13px] text-[#6F6358]">The first photo is the cover. Drag photos or use the arrows to reorder.</p>
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

          <FormSection step={2} title="Basic info" titleId={`${uid}-basic`} tone="bg-[#F5F0E8]">
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
                <legend className="text-sm font-semibold text-[#2B2118]">
                  Size <span className="text-[#B3402A]">*</span>
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
                      <span className="flex min-h-11 min-w-[52px] items-center justify-center rounded-xl border border-[#D9CFC1] bg-white px-4 text-sm font-semibold text-[#2B2118] hover:border-[#B5532E] peer-checked:border-[#B5532E] peer-checked:bg-[#B5532E] peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-[#B5532E] peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:bg-[#F5F0E8] peer-disabled:text-[#6F6358] peer-disabled:peer-checked:bg-[#6F6358] peer-disabled:peer-checked:text-white">
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
                <legend className="text-sm font-semibold text-[#2B2118]">
                  Condition <span className="text-[#B3402A]">*</span>
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
                      <span className="block h-full rounded-xl border-2 border-[#D9CFC1] bg-white p-3 pr-10 hover:border-[#B5532E] peer-checked:border-[#B5532E] peer-checked:bg-[#FBE6DC] peer-focus-visible:ring-2 peer-focus-visible:ring-[#B5532E] peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:hover:border-[#D9CFC1]">
                        <span className="block text-sm font-semibold text-[#2B2118]">{c.label}</span>
                        <span className="mt-0.5 block text-[13px] text-[#6F6358]">{c.hint}</span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 top-3.5 size-[18px] rounded-full border-2 border-[#B5A595] bg-white peer-checked:border-[#B5532E] peer-checked:bg-[#B5532E] peer-checked:shadow-[inset_0_0_0_3px_white]"
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

          <FormSection step={3} title="Description" titleId={`${uid}-description-title`} tone="bg-[#E4EEE2]">
            <Field id={`${uid}-description`} label="Description" hint="Optional. Mention flaws, measurements, or fit.">
              <textarea
                id={`${uid}-description`}
                value={values.description}
                onChange={(e) => setField('description', e.target.value)}
                maxLength={MAX_DESCRIPTION}
                rows={5}
                disabled={locked}
                className={`${inputBase} h-auto border-[#D9CFC1] py-2.5 ${focusField}`}
              />
            </Field>
            <p className="mt-1 text-right text-[13px] tabular-nums text-[#6F6358]">
              {values.description.length}/{MAX_DESCRIPTION}
            </p>
          </FormSection>

          <FormSection step={4} title="Pricing" titleId={`${uid}-pricing`} tone="bg-[#FBF1D4]">
            <Field
              id={`${uid}-price`}
              label="Price"
              required
              error={errors.price}
              hint={values.price ? `Shown to buyers as ${formatRupiah(values.price)}` : 'Whole rupiah, numbers only.'}
            >
              <div
                className={`flex h-11 overflow-hidden rounded-xl border bg-white focus-within:border-[#B5532E] focus-within:shadow-[0_0_0_1px_#B5532E,0_0_0_4px_#FBE6DC] ${
                  errors.price ? 'border-[#B3402A]' : 'border-[#D9CFC1]'
                }`}
              >
                <span aria-hidden="true" className="flex items-center border-r border-[#D9CFC1] bg-[#F5F0E8] px-3 text-sm font-semibold text-[#4A3F35]">
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
                  className="min-w-0 flex-1 bg-white px-3 text-sm tabular-nums text-[#2B2118] outline-none placeholder:text-[#7A6D61] disabled:cursor-not-allowed disabled:bg-[#F5F0E8] disabled:text-[#6F6358]"
                />
              </div>
            </Field>
            <p className="mt-4 text-[13px] text-[#6F6358]">Stock: 1. Status is set automatically when a buyer orders.</p>
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
        <p role="alert" className="mt-6 rounded-xl bg-[#FBE9E7] px-4 py-3 text-sm font-medium text-[#8C1D18]">
          {formError}
        </p>
      )}

      {/* Below lg: one 64px row (8 + 48 + 8) plus the safe-area inset, Cancel 2/5 and Save 3/5;
          the status text moves into the disabled button. From lg: unchanged. */}
      <div className="sticky bottom-0 z-10 -mx-6 mt-8 flex flex-nowrap items-center justify-end gap-3 border-t border-[#D9CFC1] bg-white px-6 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 lg:-mx-10 lg:flex-wrap lg:px-10 lg:pb-4 lg:pt-4">
        {!sold && (dirty || noChanges) && (
          <span className="mr-auto hidden text-[13px] text-[#6F6358] lg:inline" aria-live="polite">
            {noChanges ? 'No changes to save' : 'You have unsaved changes.'}
          </span>
        )}
        <Link
          href="/admin/products"
          onClick={handleCancelClick}
          className={`flex min-h-12 items-center justify-center rounded-xl border border-[#D9CFC1] bg-white px-5 text-sm font-semibold text-[#2B2118] hover:bg-[#F5F0E8] lg:min-h-11 lg:justify-start ${sold ? 'flex-1' : 'flex-[2]'} lg:flex-none ${focusRing}`}
        >
          {sold ? 'Back to products' : 'Cancel'}
        </Link>
        {!sold && (
          <button
            type="submit"
            disabled={busy || (mode === 'edit' && !dirty)}
            className={`min-h-12 flex-[3] rounded-xl bg-[#B5532E] px-6 text-sm font-semibold text-white hover:bg-[#9C4425] disabled:cursor-not-allowed disabled:bg-[#E5DCCD] disabled:text-[#5C4D40] lg:min-h-11 lg:flex-none ${focusRing}`}
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
