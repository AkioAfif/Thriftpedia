'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { getProductReviews } from '@/lib/services/buyerService';
import { getOrders } from '@/lib/services/orderService';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { ReviewForm } from './ReviewForm';

export function ProductReviews({ product, order = null }) {
  const { token, user } = useAuth();
  const buyer = Boolean(token) && String(user?.role || '').toUpperCase() === 'BUYER';
  const [open, setOpen] = useState(false);
  const reviews = useQuery({ queryKey: ['reviews', product._id], queryFn: ({ signal }) => getProductReviews(product._id, signal), retry: false });
  const orders = useQuery({ queryKey: ['completed-orders', token], queryFn: () => getOrders(token, { status: 'COMPLETED' }), enabled: buyer && !order, retry: false });
  const completed = order ? order.status === 'COMPLETED' : orders.data?.some((item) => item.product?._id === product._id);
  const buyerId = user?._id || user?.id || order?.buyer?._id || orders.data?.[0]?.buyer?._id;
  const own = reviews.data?.find((review) => String(review.buyer?._id || review.buyer) === String(buyerId));
  const canWrite = buyer && completed && !own && reviews.isSuccess;

  return <section id="product-review" aria-labelledby="product-review-title" className="space-y-md scroll-mt-24">
    <h2 id="product-review-title" className="headline-sm">Product review</h2>
    {reviews.isPending && <div role="status" aria-label="Loading product review" className="card space-y-md p-lg"><Skeleton className="h-14 bg-surface-muted" /><Skeleton className="h-[18px] bg-surface-muted" /><Skeleton className="h-11 bg-surface-muted" /></div>}
    {reviews.isError && <div role="alert" className="space-y-md rounded-md border border-error bg-error-tint p-md"><p className="body-md">! Couldn’t load the product review. {reviews.error.message}</p><Button variant="buyerPrimary" size="lg" onClick={() => reviews.refetch()}>Try again</Button></div>}
    {reviews.data?.map((review) => {
      const mine = review._id === own?._id;
      const name = review.buyer?.name || (mine ? user?.name : null) || 'Buyer';
      const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
      return <div key={review._id} className="space-y-md">
        {mine && <h3 className="title-md">Your review</h3>}
        <article className="card space-y-md p-lg"><div className="flex gap-md"><span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-full bg-badge-neutral body-md font-semibold">{initials}</span><div className="min-w-0 space-y-sm"><p className="body-md font-semibold break-words">{name}</p><span className="label-md inline-block rounded-full bg-surface-muted px-2.5 py-1">Verified purchase</span></div></div>
          <p className="label-md text-text-secondary"><span aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)} {review.rating} / 5</span>{' · '}<time dateTime={review.createdAt}>{new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(review.createdAt))}</time></p>
          {review.comment && <p className="body-md whitespace-pre-wrap break-words">{review.comment}</p>}
        </article>
      </div>;
    })}
    {reviews.isSuccess && !reviews.data.length && <div className="space-y-sm"><h3 className="title-md">No reviews yet</h3><p className="body-md text-text-secondary">This one-of-one piece is waiting for its first review.</p></div>}
    {canWrite && <Button variant="buyerPrimary" size="lg" className="min-h-12" onClick={() => setOpen(true)}>Write a review</Button>}
    {own && order && <a href="#product-review" className="buyer-secondary w-fit">View review</a>}
    {order && !completed && <p className="body-md text-text-secondary">{order.status === 'CANCELLED' ? 'Cancelled orders aren’t eligible for a review.' : 'You can write a review after this order is completed.'}</p>}
    {orders.isError && buyer && !order && <div role="alert" className="body-sm text-error">! Couldn’t check review eligibility. <button className="buyer-control min-h-11 underline" onClick={() => orders.refetch()}>Try again</button></div>}
    {open && buyer && !own && <ReviewForm key={`${product._id}:${token}`} product={product} onClose={() => setOpen(false)} />}
  </section>;
}
