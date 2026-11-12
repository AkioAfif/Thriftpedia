'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { CloseIcon } from '../icons';
import {
  ALLOWED_IMAGE_TYPES,
  CONDITION_OPTIONS,
  MAX_FILE_SIZE,
  MAX_PHOTOS,
  SIZE_OPTIONS,
  parseTags,
  uploadPhotos,
} from '../../../lib/adminProducts';

function initialValues(product) {
  return {
    name: product?.name ?? '',
    brand: product?.brand ?? '',
    category: product?.category?._id ?? '',
    size: product?.size ?? '',
    condition: product?.condition ?? '',
    price: product?.price !== undefined ? String(product.price) : '',
    tags: (product?.tags ?? []).join(', '),
  };
}

function validate(values, photos) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Name is required';
  if (values.brand.trim().length > 100) errors.brand = 'Brand must be 100 characters or fewer';
  if (!SIZE_OPTIONS.some((s) => s.value === values.size)) errors.size = 'Choose a size';
  if (!CONDITION_OPTIONS.some((c) => c.value === values.condition)) errors.condition = 'Choose a condition';
  if (!/^\d+$/.test(values.price.trim())) errors.price = 'Price must be a whole number (0 or more)';
  if (parseTags(values.tags).length > 20) errors.tags = 'Maximum 20 tags';
  if (photos.length === 0) errors.photos = 'Add at least one photo';
  return errors;
}

const inputClass =
  'mt-1 h-11 w-full rounded-lg border border-[#e8e1d8] bg-white px-3 text-sm text-[#2b1d14] outline-none focus:border-[#b4532a]';

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-[#2b1d14]">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#6b5d52]">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs text-[#b42318]">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ProductFormModal({ mode, product, categories, onSubmit, onClose, onAuthError }) {
  const uid = useId();
  const nameRef = useRef(null);

  const [values, setValues] = useState(() => initialValues(product));
  const [photos, setPhotos] = useState(() =>
    Array.isArray(product?.photos)
      ? product.photos.filter((p) => typeof p === 'string' && p.trim().length > 0)
      : []
  );
  const [photoUrl, setPhotoUrl] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const busy = submitting || uploading;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    nameRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape' && !busy) onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  function setField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setFormError('');
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setFormError(`Maximum ${MAX_PHOTOS} photos per product.`);
      return;
    }
    if (files.length > room) {
      setFormError(`You can add ${room} more photo(s) only.`);
      return;
    }
    if (files.some((f) => !ALLOWED_IMAGE_TYPES.includes(f.type))) {
      setFormError('Only JPG, PNG, or WEBP images are allowed.');
      return;
    }
    if (files.some((f) => f.size > MAX_FILE_SIZE)) {
      setFormError('Each photo must be 5 MB or smaller.');
      return;
    }

    setUploading(true);
    try {
      const urls = await uploadPhotos(files);
      setPhotos((prev) => [...prev, ...urls]);
      setErrors((prev) => ({ ...prev, photos: undefined }));
    } catch (err) {
      if (!onAuthError(err)) setFormError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function addPhotoUrl() {
    const url = photoUrl.trim();
    if (!/^https?:\/\/\S+$/i.test(url)) {
      setFormError('Photo URL must start with http:// or https://');
      return;
    }
    if (photos.length >= MAX_PHOTOS) {
      setFormError(`Maximum ${MAX_PHOTOS} photos per product.`);
      return;
    }
    if (photos.includes(url)) {
      setFormError('That photo has already been added.');
      return;
    }
    setPhotos((prev) => [...prev, url]);
    setPhotoUrl('');
    setFormError('');
    setErrors((prev) => ({ ...prev, photos: undefined }));
  }

  function removePhoto(index) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    const found = validate(values, photos);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        brand: values.brand.trim(),
        category: values.category || null,
        tags: parseTags(values.tags),
        size: values.size,
        condition: values.condition,
        price: Number(values.price.trim()),
        photos,
      });
    } catch (err) {
      setFormError(err.message);
      setSubmitting(false);
    }
  }

  const title = mode === 'edit' ? 'Edit product' : 'Add product';

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="w-full max-w-2xl rounded-2xl bg-[#faf7f2] p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 id={`${uid}-title`} className="text-2xl font-semibold text-[#2b1d14]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6b5d52] hover:bg-[#efe9e0] disabled:opacity-60"
          >
            <CloseIcon width={20} height={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${uid}-name`} label="Name" error={errors.name}>
              <input
                id={`${uid}-name`}
                ref={nameRef}
                value={values.name}
                onChange={(e) => setField('name', e.target.value)}
                maxLength={150}
                className={inputClass}
              />
            </Field>
            <Field id={`${uid}-brand`} label="Brand" error={errors.brand}>
              <input
                id={`${uid}-brand`}
                value={values.brand}
                onChange={(e) => setField('brand', e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${uid}-category`} label="Category">
              <select
                id={`${uid}-category`}
                value={values.category}
                onChange={(e) => setField('category', e.target.value)}
                className={inputClass}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field id={`${uid}-price`} label="Price (Rp)" error={errors.price}>
              <input
                id={`${uid}-price`}
                inputMode="numeric"
                value={values.price}
                onChange={(e) => setField('price', e.target.value.replace(/\D/g, ''))}
                placeholder="680000"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id={`${uid}-size`} label="Size" error={errors.size}>
              <select
                id={`${uid}-size`}
                value={values.size}
                onChange={(e) => setField('size', e.target.value)}
                className={inputClass}
              >
                <option value="">Choose size</option>
                {SIZE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field id={`${uid}-condition`} label="Condition" error={errors.condition}>
              <select
                id={`${uid}-condition`}
                value={values.condition}
                onChange={(e) => setField('condition', e.target.value)}
                className={inputClass}
              >
                <option value="">Choose condition</option>
                {CONDITION_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field
            id={`${uid}-tags`}
            label="Tags"
            error={errors.tags}
            hint="Pisahkan dengan koma. Dipakai Quick Jump di katalog: 90s-denim, leather-jacket, workwear, everyday-classic."
          >
            <input
              id={`${uid}-tags`}
              value={values.tags}
              onChange={(e) => setField('tags', e.target.value)}
              placeholder="90s-denim, workwear"
              className={inputClass}
            />
          </Field>

          <div>
            <p className="text-sm font-medium text-[#2b1d14]">
              Photos <span className="font-normal text-[#6b5d52]">({photos.length}/{MAX_PHOTOS})</span>
            </p>

            {photos.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-3">
                {photos.map((src, index) => (
                  <li key={src} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Product photo ${index + 1}`}
                      className="h-20 w-20 rounded-lg border border-[#e8e1d8] bg-[#efe9e0] object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#2b1d14] text-white"
                    >
                      <CloseIcon width={12} height={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label
                className={`cursor-pointer rounded-lg border border-[#b4532a] px-4 py-2 text-sm font-medium text-[#b4532a] hover:bg-[#f8ebe4] ${
                  busy || photos.length >= MAX_PHOTOS ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                {uploading ? 'Uploading...' : 'Upload photos'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFiles}
                  disabled={busy || photos.length >= MAX_PHOTOS}
                  className="sr-only"
                />
              </label>
              <span className="text-xs text-[#6b5d52]">JPG, PNG, or WEBP, max 5 MB each</span>
            </div>

            <div className="mt-3 flex gap-2">
              <input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addPhotoUrl();
                  }
                }}
                placeholder="atau tempel URL foto (https://...)"
                aria-label="Photo URL"
                className="h-10 min-w-0 flex-1 rounded-lg border border-[#e8e1d8] bg-white px-3 text-sm outline-none focus:border-[#b4532a]"
              />
              <button
                type="button"
                onClick={addPhotoUrl}
                disabled={busy}
                className="rounded-lg border border-[#e8e1d8] bg-white px-4 text-sm font-medium text-[#2b1d14] disabled:opacity-60"
              >
                Add URL
              </button>
            </div>

            {errors.photos && (
              <p role="alert" className="mt-1 text-xs text-[#b42318]">
                {errors.photos}
              </p>
            )}
          </div>

          {formError && (
            <p role="alert" className="rounded-lg bg-[#fbe9e7] px-3 py-2 text-sm text-[#b42318]">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-[10px] border border-[#e8e1d8] bg-white px-5 py-2.5 text-sm font-medium text-[#2b1d14] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-[10px] bg-[#a3452a] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#8f3b23] disabled:opacity-60"
            >
              {submitting ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}