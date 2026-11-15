'use client';

import { useState } from 'react';
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';

function CoverImage({ src, alt }) {
  const [failedSrc, setFailedSrc] = useState(null);
  if (!src || failedSrc === src) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[14px] bg-surface-muted text-[13px] text-text-secondary">
        {src ? 'Image unavailable' : 'No photo yet'}
      </div>
    );
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} className="aspect-[4/5] w-full rounded-[14px] bg-surface-muted object-cover" />;
}

// Mini catalog card built only from the form's current state (cover = first photo).
export default function ProductPreview({ coverUrl, name, brand, size, price }) {
  const priceText = /^\d+$/.test(price) && Number(price) > 0 ? formatRupiah(price) : 'Rp —';
  return (
    <section aria-labelledby="product-preview-title" className="rounded-2xl border border-border bg-surface p-4">
      <h2 id="product-preview-title" className="text-[15px] font-semibold text-text">
        How buyers will see it
      </h2>
      <div className="mt-3 rounded-2xl border border-border bg-canvas p-3">
        <CoverImage src={coverUrl} alt={name ? `${name} cover photo` : 'Cover photo'} />
        <p className="mt-3 truncate text-[13px] text-text-secondary">{brand.trim() || 'Brand'}</p>
        <p className="mt-0.5 line-clamp-2 text-[15px] font-semibold text-text">{name.trim() || 'Product name'}</p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-base font-semibold tabular-nums text-text">{priceText}</span>
          {size && (
            <span className="rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs font-semibold text-text">
              {sizeLabel(size)}
            </span>
          )}
        </div>
      </div>
      <p className="mt-3 text-[13px] text-text-secondary">Updates as you type. The first photo is the card image.</p>
    </section>
  );
}
