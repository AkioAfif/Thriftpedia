'use client';

import { useState } from 'react';
import Image from 'next/image';
import { canOptimizeImage } from '@/lib/imageHosts';
import { cn } from '@/lib/utils';

// next/image (fill) that falls back to a solid colour block with the name when the
// photo is missing or fails to load. The parent must be `relative` and sized.
export function LandingPhoto({ src, alt, fallbackLabel, sizes, priority = false, fallbackClass = 'bg-surface-muted', className }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={cn('absolute inset-0 flex items-center justify-center p-md text-center', fallbackClass)}>
        <span className="body-md font-semibold text-text">{fallbackLabel ?? alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={!canOptimizeImage(src)}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}
