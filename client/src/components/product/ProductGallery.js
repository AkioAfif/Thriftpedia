'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { LockIcon } from '@/components/ui/Icons';
import { canOptimizeImage } from '@/lib/imageHosts';
import { cn } from '@/lib/utils';

function Chevron({ direction }) {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
    </svg>
  );
}

function PhotoFallback({ small = false }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#EFEBE4] text-center">
      <span className={cn('font-metadata text-[#6E5D4F]', small ? 'text-[10px]' : 'text-sm')}>
        {small ? 'No photo' : 'Photo unavailable'}
      </span>
    </div>
  );
}

export function ProductGallery({ photos = [], name, sold = false }) {
  const list = photos.filter((p) => typeof p === 'string' && p.trim().length > 0);
  const [active, setActive] = useState(0);
  const [failed, setFailed] = useState(() => new Set());
  const thumbRefs = useRef([]);

  const count = list.length;
  const index = Math.min(active, Math.max(count - 1, 0));
  const src = list[index];
  const markFailed = (i) => setFailed((prev) => new Set(prev).add(i));

  function select(i, focus = false) {
    const next = (i + count) % count;
    setActive(next);
    if (focus) thumbRefs.current[next]?.focus();
  }

  function onThumbKeyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      select(index + 1, true);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      select(index - 1, true);
    } else if (e.key === 'Home') {
      e.preventDefault();
      select(0, true);
    } else if (e.key === 'End') {
      e.preventDefault();
      select(count - 1, true);
    }
  }

  const arrowClass =
    'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface text-text shadow-level-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

  return (
    <section aria-label={`Photos of ${name}`} className="flex min-w-0 flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#EFEBE4]">
        {src && !failed.has(index) ? (
          <Image
            key={src}
            src={src}
            alt={count > 1 ? `${name}, photo ${index + 1} of ${count}` : name}
            fill
            priority={index === 0}
            sizes="(max-width: 1024px) 100vw, 55vw"
            unoptimized={!canOptimizeImage(src)}
            onError={() => markFailed(index)}
            className={cn('object-cover transition-opacity duration-200', sold && 'opacity-60 grayscale')}
          />
        ) : (
          <PhotoFallback />
        )}

        <div className="absolute left-3 top-3 z-10 sm:left-4 sm:top-4">
          {sold ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[#2B2118] px-4 py-2 text-sm font-bold text-white shadow-level-2">
              <LockIcon className="h-4 w-4" />
              Sold
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-badge-success px-3 py-1.5 text-xs font-semibold text-[#2F5A2C]">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#3F7A3A]" />
              Available
            </span>
          )}
        </div>

        {count > 1 && (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => select(index - 1)} className={`${arrowClass} left-3`}>
              <Chevron direction="left" />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => select(index + 1)} className={`${arrowClass} right-3`}>
              <Chevron direction="right" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div role="group" aria-label="Choose a photo" onKeyDown={onThumbKeyDown} className="flex gap-2 overflow-x-auto p-1 sm:gap-3">
          {list.map((photo, i) => (
            <button
              key={`${photo}-${i}`}
              ref={(el) => {
                thumbRefs.current[i] = el;
              }}
              type="button"
              aria-label={`Show photo ${i + 1} of ${count}`}
              aria-current={i === index ? 'true' : undefined}
              tabIndex={i === index ? 0 : -1}
              onClick={() => select(i)}
              className={cn(
                'relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#EFEBE4] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:h-24 sm:w-20',
                i === index ? 'border-primary' : 'border-transparent hover:border-border'
              )}
            >
              {failed.has(i) ? (
                <PhotoFallback small />
              ) : (
                <Image
                  src={photo}
                  alt=""
                  fill
                  sizes="80px"
                  unoptimized={!canOptimizeImage(photo)}
                  onError={() => markFailed(i)}
                  className={cn('object-cover', sold && 'opacity-60 grayscale')}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
