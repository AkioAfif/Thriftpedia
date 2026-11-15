import Link from 'next/link';

function ArrowLeft({ className }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

// md and up: outline pill "Back to my orders" (the breadcrumb sits next to it).
export function OrderBackButton({ href }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-[#D9CFC1] bg-white px-4 text-sm font-semibold text-[#2B2118] transition-colors duration-150 hover:border-[#B5532E] hover:text-[#B5532E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none"
    >
      <ArrowLeft className="size-4 shrink-0" />
      Back to my orders
    </Link>
  );
}

// Below md: a 48px bar stuck under the 73px site header, full width (it cancels the page's
// 16px side padding and 24px top padding). Back link on the left, order number on the right.
export function OrderBackBar({ href, label }) {
  return (
    <div className="sticky top-[73px] z-30 -mx-margin-mobile -mt-lg mb-4 h-12 border-b border-[#EAE4DA] bg-[#FAF7F2] md:hidden">
      <div className="flex h-full items-center justify-between gap-3 px-margin-mobile">
        <Link
          href={href}
          aria-label="Back to my orders"
          className="-ml-2 inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full pr-3 text-sm font-semibold text-[#2B2118] hover:bg-[#F5F0E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]"
        >
          <span className="flex size-11 items-center justify-center">
            <ArrowLeft className="size-[18px]" />
          </span>
          My orders
        </Link>
        {label && <p className="min-w-0 truncate text-[13px] tabular-nums text-[#6F6358]">{label}</p>}
      </div>
    </div>
  );
}
