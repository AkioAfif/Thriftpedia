'use client';

import { useState } from 'react';
import DetailCard from './DetailCard';
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';

const photoBox = 'aspect-[4/5] w-28 shrink-0 rounded-2xl bg-surface-muted sm:w-40';

// Falls back to a plain tile when there is no photo or the image fails to load.
function ItemPhoto({ src, alt }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span role="img" aria-label="No photo" className={`${photoBox} flex items-center justify-center text-sm text-text-secondary`}>
        No photo
      </span>
    );
  }
  /* eslint-disable-next-line @next/next/no-img-element */
  return <img src={src} alt={alt} onError={() => setFailed(true)} className={`${photoBox} object-cover`} />;
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#D9CFC1] bg-surface-muted px-3 py-1 text-[13px] font-medium text-text">
      {children}
    </span>
  );
}

export default function OrderItemCard({ item }) {
  return (
    <DetailCard titleId="order-item-title" title="Item">
      <div className="flex gap-4 sm:gap-6">
        <ItemPhoto src={item.photo} alt={item.name} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="break-words text-[20px] font-semibold leading-snug text-text">{item.name}</p>
          {(item.brand || item.size) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.brand && <Chip>{item.brand}</Chip>}
              {item.size && <Chip>{item.size === 'FREE' ? sizeLabel(item.size) : `Size ${sizeLabel(item.size)}`}</Chip>}
            </div>
          )}
          <p className="mt-4 text-[18px] font-semibold tabular-nums text-text">
            {item.price == null ? '—' : formatRupiah(item.price)}
          </p>
        </div>
      </div>
    </DetailCard>
  );
}
