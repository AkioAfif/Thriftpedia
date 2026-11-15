'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

// Only internal paths ("/..." but not "//...") are followed; anything else falls back to /catalog.
const safeHref = (href) => (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') ? href : '/catalog');

function ArrowLeft() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

// `label` comes from resolveBack (lib/navigation.js): "Back to catalog", "Back to order", ...
// variant="button": lg and up, outline pill with the label (the only way back; no breadcrumb).
// variant="bar": below lg, a 48px bar stuck under the 73px site header with an icon-only back
// button (aria-label = label); once the product title has scrolled away, its name shows.
export default function BackToCatalog({ href, label = 'Back to catalog', name = '', variant = 'button' }) {
  const target = safeHref(href);
  const [titleGone, setTitleGone] = useState(false);

  // Watch the product <h1> (it appears once the product loads). State changes only in the
  // observer callback, never directly in the effect.
  useEffect(() => {
    if (variant !== 'bar' || !name || typeof IntersectionObserver === 'undefined') return undefined;
    const title = document.querySelector('main h1');
    if (!title) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setTitleGone(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(title);
    return () => observer.disconnect();
  }, [variant, name]);

  if (variant === 'bar') {
    return (
      <div className="sticky top-[73px] z-30 h-12 border-b border-[#EAE4DA] bg-[#FAF7F2] lg:hidden">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-8">
          <Link
            href={target}
            aria-label={label}
            title={label}
            className="-ml-2 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[#2B2118] hover:bg-[#F5F0E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]"
          >
            <ArrowLeft />
          </Link>
          {/* Always rendered (fixed bar height); only its visibility changes, so nothing shifts. */}
          <p
            aria-hidden={!titleGone || undefined}
            className={`min-w-0 truncate text-[13px] text-[#6F6358] transition-opacity duration-150 motion-reduce:transition-none ${
              titleGone && name ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={target}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-[#D9CFC1] bg-white px-4 text-sm font-semibold text-[#2B2118] transition-colors hover:border-[#B5532E] hover:bg-[#F5F0E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <ArrowLeft />
      {label}
    </Link>
  );
}
