'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const linkBase = 'text-base py-2 border-b border-[#E6DDD2]/50';
// Existing mobile styles: active = terracotta bold.
const linkIdle = 'text-[#5C4D40] font-medium hover:text-[#2B2118]';
const linkActive = 'text-[#B5532E] font-bold';

export function MobileMenu({ isOpen, onClose, isLoggedIn = false, user = null, onLogout, onAuth, menuRef }) {
  const pathname = usePathname();
  if (!isOpen) return null;

  const isHome = pathname === '/';
  const isCatalog = pathname?.startsWith('/catalog') ?? false;
  // Admins: "Back to dashboard" on top, no buyer-only wishlist/orders links.
  const isAdmin = isLoggedIn && String(user?.role ?? '').toUpperCase() === 'ADMIN';

  const name = user?.name || 'Account';
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

  return (
    <div
      ref={menuRef}
      id="mobile-nav-menu"
      className="md:hidden fixed inset-x-0 top-[65px] bg-[#FAF7F2] border-b border-[#E6DDD2] px-5 py-5 shadow-lg flex flex-col gap-3 transition-all z-40"
    >
      {isAdmin && (
        <Link
          href="/admin/dashboard"
          onClick={onClose}
          className="flex min-h-12 w-full items-center gap-3 rounded-xl bg-[#B5532E] px-4 text-sm font-semibold text-white hover:bg-[#9C4425] transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          Back to dashboard
        </Link>
      )}
      <Link
        href="/"
        onClick={onClose}
        aria-current={isHome ? 'page' : undefined}
        className={`${linkBase} ${isHome ? linkActive : linkIdle}`}
      >
        Home
      </Link>
      <Link
        href="/catalog"
        onClick={onClose}
        aria-current={isCatalog ? 'page' : undefined}
        className={`${linkBase} ${isCatalog ? linkActive : linkIdle}`}
      >
        Catalog
      </Link>

      {isLoggedIn ? (
        <>
          {!isAdmin && (
            <>
              <Link href="/wishlist" onClick={onClose} className={`${linkBase} buyer-control min-h-11`}>Your wishlist</Link>
              <Link href="/orders" onClick={onClose} className={`${linkBase} buyer-control min-h-11`}>Your orders</Link>
            </>
          )}
          <div className="pt-2 flex flex-col gap-2">
            <div className="p-3 bg-white rounded-xl border border-[#E6DDD2] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#E7DCD0] text-[#2B2118] font-bold text-xs flex items-center justify-center border border-[#CFBEAE] shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-[#2B2118] truncate">{name}</p>
                {user?.email && (
                  <p className="text-[11px] text-[#5C4D40] truncate">{user.email}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] rounded-xl border border-[#E6DDD2] bg-white text-sm font-semibold text-[#BA1A1A] hover:bg-[#F1EBE1] transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none"
            >
              Log out
            </button>
          </div>
        </>
      ) : (
        <div className="pt-2 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onAuth?.('login')}
            className="min-h-[44px] flex items-center justify-center rounded-xl border border-[#E6DDD2] bg-white text-sm font-semibold text-[#2B2118] hover:bg-[#F1EBE1] transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => onAuth?.('register')}
            className="min-h-[44px] flex items-center justify-center rounded-xl border border-[#B5532E] text-sm font-semibold text-[#B5532E] hover:bg-[#FBEDE6] transition-colors focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none"
          >
            Register
          </button>
        </div>
      )}
    </div>
  );
}
