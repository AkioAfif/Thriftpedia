'use client';

import { StarIcon } from '@/components/ui/Icons';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/utils';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// "Maya Lestari" -> "Maya L." so a full name isn't published next to a purchase.
function reviewerName(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Buyer';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function Stars({ value, className }) {
  const rounded = Math.round(value);
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} className={cn('h-4 w-4', n <= rounded ? 'text-[#C98A1B]' : 'text-[#E3DCD2]')} />
      ))}
    </span>
  );
}

export function ProductReviews({ state, onRetry }) {
  const reviews = state.items;
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count : 0;

  return (
    <section aria-labelledby="reviews-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="reviews-title" className="text-headline-sm font-semibold text-text md:text-headline-md">
          Reviews
        </h2>
        {state.status === 'ready' && count > 0 && (
          <p className="flex flex-wrap items-center gap-2 text-body-md text-text">
            <Stars value={average} />
            <span className="font-semibold">{average.toFixed(1)} / 5</span>
            <span className="text-text-secondary">
              · {count} {count === 1 ? 'review' : 'reviews'}
            </span>
          </p>
        )}
        <p className="text-body-sm text-text-secondary">Only buyers with a completed order can review.</p>
      </div>

      {state.status === 'loading' && (
        <div className="flex flex-col gap-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-surface p-5">
              <Skeleton className="h-4 w-40 rounded" />
              <Skeleton className="mt-3 h-4 w-28 rounded" />
              <Skeleton className="mt-3 h-4 w-full rounded" />
            </div>
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-md text-text">Couldn’t load reviews. {state.error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-border px-4 text-body-md font-semibold text-text hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {state.status === 'ready' && count === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-surface px-5 py-8 text-center">
          <p className="text-body-md font-semibold text-text">No reviews yet</p>
          <p className="mt-1 text-body-sm text-text-secondary">Reviews appear here once a buyer’s order is completed.</p>
        </div>
      )}

      {state.status === 'ready' && count > 0 && (
        <ul className="flex flex-col gap-3">
          {reviews.map((review) => (
            <li key={review._id} className="rounded-xl border border-border bg-surface p-5">
              <p className="text-body-md font-semibold text-text">
                {reviewerName(review.buyer?.name)}
                <span className="font-normal text-text-secondary"> · Verified purchase</span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-text-secondary">
                <Stars value={Number(review.rating) || 0} />
                <span className="sr-only">Rated {review.rating} out of 5</span>
                {review.createdAt && <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>}
              </p>
              {review.comment ? (
                <p className="mt-3 whitespace-pre-line text-body-md text-text">{review.comment}</p>
              ) : (
                <p className="mt-3 text-body-md italic text-text-secondary">No written comment.</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
