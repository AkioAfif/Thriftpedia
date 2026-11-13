'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/context/BuyerContext';
import toast from 'react-hot-toast';
import { HangerLogoIcon, MenuIcon } from '@/components/ui/Icons';
import { useAuth } from '@/context/AuthContext';
import { MobileMenu } from './MobileMenu';

const focusRing =
  'focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none';

const toastStyle = {
  borderRadius: '12px',
  background: '#FAF7F2',
  color: '#2B2118',
  border: '1px solid #E6DDD2',
};

function getInitials(name) {
  if (!name) return 'U';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

export function Navbar() {
  const router = useRouter();
  const { count, query } = useWishlist();
  const { user, isLoggedIn, ready, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setMobileMenuOpen(false);
    toast('You have been logged out', { icon: '👋', style: toastStyle });
  };

  const handleWishlistClick = () => {
    router.push('/wishlist');
  };

  const initials = getInitials(user?.name);

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6DDD2] py-3.5 px-4 sm:px-8 flex items-center transition-all"
        id="main-header"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/catalog"
            className={`flex items-center gap-2.5 group rounded-xl p-0.5 ${focusRing}`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#F25A2A] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <HangerLogoIcon />
            </div>
            <div className="font-display font-bold text-[18px] sm:text-[28px] tracking-[-0.5px] leading-none select-none">
              <span className="text-[#2B2118]">thrift</span>
              <span className="text-[#F25A2A]">pedia</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center justify-center gap-10 text-sm font-medium">
            <Link
              href="#"
              className={`text-[#5C4D40] hover:text-[#2B2118] transition-colors py-1 rounded ${focusRing}`}
            >
              Home
            </Link>
            <Link
              href="/catalog"
              aria-current="page"
              className={`text-[#2B2118] font-bold border-b-2 border-[#B5532E] py-1 pb-0.5 tracking-tight rounded ${focusRing}`}
            >
              Catalog
            </Link>
            {isLoggedIn && (
              <Link
                href="#"
                className={`text-[#5C4D40] hover:text-[#2B2118] transition-colors py-1 rounded ${focusRing}`}
              >
                About
              </Link>
            )}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 min-h-[44px]">
            {ready && !isLoggedIn && (
              <div className="hidden md:flex items-center gap-3">
                <Link
                  href="/login"
                  className={`min-h-[44px] px-3 flex items-center text-sm font-semibold text-[#2B2118] hover:text-[#B5532E] transition-colors rounded-xl ${focusRing}`}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className={`min-h-[44px] px-5 flex items-center text-sm font-semibold rounded-xl border border-[#B5532E] text-[#B5532E] hover:bg-[#FBEDE6] transition-colors ${focusRing}`}
                >
                  Register
                </Link>
              </div>
            )}

            {ready && isLoggedIn && (
              <>
                <button
                  type="button"
                  aria-label={`Wishlist, ${query.isPending ? 'loading' : count + ' items'}`}
                  onClick={handleWishlistClick}
                  className={`relative min-w-[44px] min-h-[44px] rounded-full text-[#5C4D40] hover:text-[#2B2118] hover:bg-[#F1EBE1] flex items-center justify-center transition-colors ${focusRing}`}
                >
                  <Image src="/icons/wishlist-badge.svg" width={18} height={18} alt="" />
                  <span className="ml-1 font-metadata text-xs" aria-live="polite">{query.isPending ? '…' : count}</span>
                </button>

                <div className="relative flex items-center pl-2 border-l border-[#E6DDD2]">
                  <button
                    type="button"
                    aria-label="Account menu"
                    aria-expanded={profileOpen}
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-xs text-[#2B2118] bg-[#E7DCD0] hover:bg-[#DBCABA] transition-colors cursor-pointer select-none border border-[#CFBEAE] ${focusRing}`}
                    title={user?.name || 'Account'}
                  >
                    {initials}
                  </button>

                  {profileOpen && (
                    <>
                      <button
                        type="button"
                        aria-label="Close account menu"
                        className="fixed inset-0 z-40 cursor-default"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 w-56 z-50 bg-white rounded-xl border border-[#E6DDD2] shadow-lg p-2">
                        <Link href="/orders" onClick={() => setProfileOpen(false)} className="buyer-secondary">Your orders</Link>
                        <div className="px-3 py-2 border-b border-[#E6DDD2]/60">
                          <p className="font-bold text-sm text-[#2B2118] truncate">
                            {user?.name || 'Account'}
                          </p>
                          {user?.email && (
                            <p className="text-xs text-[#5C4D40] truncate">{user.email}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className={`mt-1 w-full min-h-[44px] px-3 text-left text-sm font-medium text-[#BA1A1A] hover:bg-[#F1EBE1] rounded-lg transition-colors ${focusRing}`}
                        >
                          Log out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Hamburger for mobile */}
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[#2B2118] hover:bg-[#F1EBE1] rounded-xl transition-colors ${focusRing}`}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}
