import Link from 'next/link';

// One element: a 44px round icon button below md; icon + "Back to catalog" text from md.
export function BackToCatalogLink() {
  return (
    <Link
      href="/catalog"
      aria-label="Back to catalog"
      className="mb-3 inline-flex size-11 items-center justify-center rounded-full border-[1.5px] border-[#D9CFC1] bg-white text-[#2B2118] transition-colors duration-150 hover:border-[#B5532E] hover:text-[#B5532E] active:border-[#B5532E] active:text-[#B5532E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none md:size-auto md:min-h-11 md:justify-start md:gap-2 md:rounded-md md:border-0 md:bg-transparent md:text-[#6F6358]"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0 md:size-4">
        <path d="M19 12H5M11 6l-6 6 6 6" />
      </svg>
      <span className="sr-only text-sm font-semibold md:not-sr-only">Back to catalog</span>
    </Link>
  );
}
