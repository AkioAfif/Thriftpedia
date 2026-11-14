'use client';

import Link from 'next/link';

const linkBase = 'text-base py-2 border-b border-[#E6DDD2]/50';

export function MobileMenu({ isOpen, onClose, isLoggedIn = false, user = null, onLogout, menuRef }) {
  if (!isOpen) return null;

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
      <Link
        href="#"
        onClick={onClose}
        className={`${linkBase} text-[#5C4D40] font-medium hover:text-[#2B2118]`}
      >
        Home
      </Link>
      <Link
        href="/catalog"
        onClick={onClose}
        className={`${linkBase} text-[#B5532E] font-bold`}
      >
        Catalog
      </Link>

      {isLoggedIn ? (
        <>
          <Link href="/wishlist" onClick={onClose} className={`${linkBase} buyer-control min-h-11`}>Your wishlist</Link>
          <Link href="/orders" onClick={onClose} className={`${linkBase} buyer-control min-h-11`}>Your orders</Link>
          <Link
            href="#"
            onClick={onClose}
            className={`${linkBase} text-[#5C4D40] font-medium hover:text-[#2B2118]`}
          >
            About
          </Link>

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
          <Link
            href="/login"
            onClick={onClose}
            className="min-h-[44px] flex items-center justify-center rounded-xl border border-[#E6DDD2] bg-white text-sm font-semibold text-[#2B2118] hover:bg-[#F1EBE1] transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            onClick={onClose}
            className="min-h-[44px] flex items-center justify-center rounded-xl border border-[#B5532E] text-sm font-semibold text-[#B5532E] hover:bg-[#FBEDE6] transition-colors"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  );
}
