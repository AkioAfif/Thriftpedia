import Link from 'next/link';

// Floating "Add product" button for screens under md (the header button takes over from md).
// z-30 keeps it under the nav drawer overlay (z-40) and the Filters sheet (z-50), so both cover it.
export default function AddProductFab() {
  return (
    <Link
      href="/admin/products/new"
      aria-label="Add product"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-30 flex size-14 items-center justify-center rounded-full bg-[#B5532E] text-white shadow-[0_6px_16px_rgba(43,33,24,0.18)] transition-[background-color,transform] duration-150 hover:bg-[#9C4425] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 active:scale-[0.96] active:bg-[#9C4425] motion-reduce:transition-none motion-reduce:active:scale-100 md:hidden"
    >
      <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    </Link>
  );
}
