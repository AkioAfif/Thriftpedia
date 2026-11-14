import Link from 'next/link';
import { SearchOffIcon } from '@/components/ui/Icons';

export default function NotFound() {
  return (
    <main className="w-full flex-1 flex items-center justify-center px-4 py-16">
      <div className="bg-white rounded-2xl border border-[#E6DDD2] p-10 sm:p-14 flex flex-col items-center justify-center text-center gap-3 shadow-card max-w-[28rem] w-full">
        <div className="w-14 h-14 rounded-full bg-[#FBEDE6] flex items-center justify-center text-primary mb-1">
          <SearchOffIcon className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-bold text-2xl text-text">Page not found</h1>
        <p className="text-sm text-[#5C4D40]">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/catalog"
          className="mt-3 min-h-[40px] px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          Back to Catalog
        </Link>
      </div>
    </main>
  );
}
