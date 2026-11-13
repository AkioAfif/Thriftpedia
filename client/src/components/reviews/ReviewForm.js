'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { ActionDialog } from '@/components/ui/ActionDialog';
import { Button } from '@/components/ui/Button';
import { createProductReview } from '@/lib/services/buyerService';
import { canOptimizeImage } from '@/lib/imageHosts';

export function ReviewForm({ product, onClose }) {
  const { token } = useAuth();
  const client = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const lock = useRef(false);
  const ratingError = Number.isInteger(rating) && rating >= 1 && rating <= 5 ? '' : 'Choose a rating from 1 to 5 stars.';
  const commentError = comment.length > 1000 ? 'Keep your comment to 1,000 characters or fewer.' : '';
  const dirty = rating > 0 || comment.length > 0;
  function requestClose() { if (!lock.current) { if (dirty) setConfirm(true); else onClose(); } }
  async function submit(event) {
    event.preventDefault();
    if (lock.current) return;
    setTouched({ rating: true, comment: true });
    if (ratingError || commentError) { event.currentTarget.querySelector(ratingError ? 'input[name="rating"]' : 'textarea')?.focus(); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      await createProductReview(token, product._id, rating, comment);
      await client.invalidateQueries({ queryKey: ['reviews', product._id] });
      toast.success('Your review has been published.'); onClose();
    } catch (err) {
      setError(err.status === 403 ? 'This order is not eligible for a review. Only completed purchases can be reviewed.' : err.message);
      if (err.status === 409) await client.invalidateQueries({ queryKey: ['reviews', product._id] });
    } finally { lock.current = false; setBusy(false); }
  }

  return <ActionDialog title={confirm ? 'Discard this draft?' : 'Write a review'} busy={busy} onRequestClose={confirm ? () => setConfirm(false) : requestClose}>
    {confirm ? <div className="space-y-lg"><p className="body-md">Your rating and comment haven’t been submitted. Discarding will remove this draft.</p><div className="flex flex-col gap-md md:flex-row"><Button variant="buyerPrimary" size="lg" className="min-h-12 flex-1" onClick={() => setConfirm(false)}>Keep editing</Button><Button variant="buyerSecondary" size="lg" className="min-h-12 flex-1 text-error" onClick={onClose}>Discard draft</Button></div></div>
      : <form onSubmit={submit} noValidate className="space-y-lg">
        <div className="flex items-start gap-md">
          {product.photos?.[0] && <Image src={product.photos[0]} alt="" width={64} height={80} unoptimized={!canOptimizeImage(product.photos[0])} className="h-20 w-16 shrink-0 rounded-lg object-cover" />}
          <div className="min-w-0 space-y-sm"><h3 className="font-semibold text-title-md break-words">{product.name}</h3><p className="label-md text-text-secondary">Size {product.size} · Completed</p></div>
        </div>
        <fieldset disabled={busy} aria-describedby={touched.rating && ratingError ? 'review-rating-error' : 'review-rating-value'} className="space-y-sm"
          onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setTouched((previous) => ({ ...previous, rating: true })); }}>
          <legend className="label-md mb-md text-text-secondary">Rating <span aria-hidden="true">*</span></legend>
          <div className="flex gap-sm">{[1, 2, 3, 4, 5].map((value) => <label key={value} className="relative">
            <input type="radio" name="rating" value={value} autoFocus={value === 1} checked={rating === value} onChange={() => setRating(value)} aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`} required className="peer sr-only" />
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-md border border-border bg-canvas text-text peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 peer-disabled:opacity-50">{value <= rating ? '★' : '☆'}</span>
          </label>)}</div>
          {touched.rating && ratingError ? <p id="review-rating-error" role="alert" className="body-sm text-error">! {ratingError}</p> : <p id="review-rating-value" aria-live="polite" className="body-sm text-text-secondary">{rating ? `${rating} of 5 stars` : 'Select 1–5 stars'}</p>}
        </fieldset>
        <div className="space-y-sm"><label htmlFor="review-comment" className="label-md text-text-secondary">Comment (optional)</label>
          <textarea id="review-comment" value={comment} maxLength={1000} disabled={busy} rows={4} onChange={(event) => setComment(event.target.value)} onBlur={() => setTouched((previous) => ({ ...previous, comment: true }))}
            aria-invalid={Boolean(touched.comment && commentError)} aria-describedby="review-comment-count review-comment-error" className="buyer-input resize-y" placeholder="Share the fit, condition or details you loved." />
          <p id="review-comment-count" className="body-sm font-metadata text-text-secondary">{comment.length.toLocaleString('en-US')} / 1,000</p>
          <p id="review-comment-error" role={touched.comment && commentError ? 'alert' : undefined} className="body-sm text-error">{touched.comment && commentError ? `! ${commentError}` : ''}</p>
        </div>
        {error && <p role="alert" className="body-sm text-error">! {error} Your draft is still here.</p>}
        <div className="sticky bottom-0 flex flex-col gap-md bg-surface pb-[env(safe-area-inset-bottom)] pt-sm md:flex-row">
          <Button variant="buyerSecondary" size="lg" className="min-h-12 md:flex-1" disabled={busy} onClick={requestClose}>Cancel</Button>
          <Button type="submit" variant="buyerPrimary" size="lg" className="min-h-12 md:flex-[2]" disabled={busy}>{busy ? 'Submitting…' : error ? 'Try again' : 'Submit review'}</Button>
        </div>
      </form>}
  </ActionDialog>;
}
