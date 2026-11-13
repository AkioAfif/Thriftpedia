'use client';

import { useState } from 'react';
import Image from 'next/image';
import { canOptimizeImage } from '@/lib/imageHosts';
import { cn } from '@/lib/utils';

// Product photo from the order snapshot. Falls back to a plain tile when missing or broken.
export function OrderThumb({ src, alt, sizes, className }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={cn('relative shrink-0 overflow-hidden rounded-lg bg-surface-muted', className)}>
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized={!canOptimizeImage(src)}
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-body-sm text-text-muted">No photo</span>
      )}
    </div>
  );
}
