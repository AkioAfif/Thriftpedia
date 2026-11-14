'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useWishlist } from '@/context/BuyerContext';
import toast from 'react-hot-toast';
import { HangerLogoIcon, MenuIcon } from '@/components/ui/Icons';
import { useAuth } from '@/context/AuthContext';
import AuthDialog from '@/components/auth/AuthDialog';
import { MobileMenu } from './MobileMenu';

const focusRing =
  'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none';

// Existing desktop nav styles: active = bold with terracotta underline.
const navIdle = 'text-[#5C4D40] hover:text-text transition-colors py-1 rounded';
const navActive = 'text-text font-bold border-b-2 border-primary py-1 pb-0.5 tracking-tight rounded';

const toastStyle = {
  borderRadius: '12px',
  background: 'var(--canvas)',
  color: 'var(--text)',
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

// Closes an open menu on a pointerdown outside its areas, or on Escape (focus returns to the trigger).
function useDismiss(open, close, triggerRef, areaRef, extraAreaRef) {
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (areaRef.current?.contains(event.target) || extraAreaRef?.current?.contains(event.target)) return;
      close();
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      close();
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close, triggerRef, areaRef, extraAreaRef]);
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { count, query } = useWishlist();
  const { user, isLoggedIn, ready, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // One auth dialog for Log in and Register: null | 'login' | 'register'.
  const [authTab, setAuthTab] = useState(null);
  const [menuPath, setMenuPath] = useState(pathname);
  const profileAreaRef = useRef(null);
  const profileButtonRef = useRef(null);
  const hamburgerRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Route changed: close both menus (adjusting state during render, no effect needed).
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setProfileOpen(false);
    setMobileMenuOpen(false);
  }

  const closeProfile = useCallback(() => setProfileOpen(false), []);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const closeAuth = useCallback(() => setAuthTab(null), []);
  // Navbar dialog only: after login/register go to the admin dashboard or the catalog.
  // AuthDialog sends the API user { id, name, email, role } and closes itself afterwards.
  const handleAuthSuccess = useCallback(
    (authUser) => {
      setAuthTab(null);
      router.push(String(authUser?.role ?? '').toUpperCase() === 'ADMIN' ? '/admin/dashboard' : '/catalog');
    },
    [router]
  );
  const openAuth = useCallback((tab) => {
    setMobileMenuOpen(false);
    setAuthTab(tab);
  }, []);
  useDismiss(profileOpen, closeProfile, profileButtonRef, profileAreaRef);
  useDismiss(mobileMenuOpen, closeMobileMenu, hamburgerRef, mobileMenuRef, hamburgerRef);

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
  const isHome = pathname === '/';
  const isCatalog = pathname?.startsWith('/catalog') ?? false;

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-canvas/95 backdrop-blur-md border-b border-[#E6DDD2] py-3.5 px-4 sm:px-8 flex items-center transition-all"
        id="main-header"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 group rounded-xl p-0.5 ${focusRing}`}
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <HangerLogoIcon />
            </div>
            <div className="font-display font-bold text-[18px] sm:text-[28px] tracking-[-0.5px] leading-none select-none">
              <span className="text-text">thrift</span>
              <span className="text-primary">pedia</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center justify-center gap-10 text-sm font-medium">
            <Link
              href="/"
              aria-current={isHome ? 'page' : undefined}
              className={`${isHome ? navActive : navIdle} ${focusRing}`}
            >
              Home
            </Link>
            <Link
              href="/catalog"
              aria-current={isCatalog ? 'page' : undefined}
              className={`${isCatalog ? navActive : navIdle} ${focusRing}`}
            >
              Catalog
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3 min-h-[44px]">
            {ready && !isLoggedIn && (
              <div className="hidden md:flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => openAuth('login')}
                  className={`min-h-[44px] px-3 flex items-center text-sm font-semibold text-text hover:text-primary transition-colors rounded-xl ${focusRing}`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className={`min-h-[44px] px-5 flex items-center justify-center text-sm font-semibold leading-none rounded-xl border border-primary text-primary hover:bg-[#FBEDE6] transition-colors ${focusRing}`}
                >
                  Register
                </button>
              </div>
            )}

            {ready && isLoggedIn && (
              <>
                <button
                  type="button"
                  aria-label={`Wishlist, ${query.isPending ? 'loading' : count + ' items'}`}
                  onClick={handleWishlistClick}
                  className={`relative min-w-[44px] min-h-[44px] rounded-full text-[#5C4D40] hover:text-text hover:bg-[#F1EBE1] flex items-center justify-center transition-colors ${focusRing}`}
                >
                  <Image src="/icons/wishlist-badge.svg" width={18} height={18} alt="" />
                  <span className="ml-1 font-metadata text-xs" aria-live="polite">{query.isPending ? '…' : count}</span>
                </button>

                <div ref={profileAreaRef} className="relative flex items-center pl-2 border-l border-[#E6DDD2]">
                  <button
                    ref={profileButtonRef}
                    type="button"
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-xs text-text bg-[#E7DCD0] hover:bg-[#DBCABA] transition-colors cursor-pointer select-none border border-[#CFBEAE] ${focusRing}`}
                    title={user?.name || 'Account'}
                  >
                    {initials}
                  </button>

                  {profileOpen && (
                    <>
                      <div className="absolute right-0 top-full mt-2 w-56 z-50 bg-white rounded-xl border border-[#E6DDD2] shadow-lg p-2">
                        <Link href="/orders" onClick={() => setProfileOpen(false)} className="buyer-secondary">Your orders</Link>
                        <div className="px-3 py-2 border-b border-[#E6DDD2]/60">
                          <p className="font-bold text-sm text-text truncate">
                            {user?.name || 'Account'}
                          </p>
                          {user?.email && (
                            <p className="text-xs text-[#5C4D40] truncate">{user.email}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className={`mt-1 w-full min-h-[44px] px-3 text-left text-sm font-medium text-error hover:bg-[#F1EBE1] rounded-lg transition-colors ${focusRing}`}
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
              ref={hamburgerRef}
              type="button"
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-text hover:bg-[#F1EBE1] rounded-xl transition-colors ${focusRing}`}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        menuRef={mobileMenuRef}
        onClose={closeMobileMenu}
        isLoggedIn={isLoggedIn}
        user={user}
        onLogout={handleLogout}
        onAuth={openAuth}
      />

      {/* key remounts the dialog so initialTab applies each time it opens. onSuccess makes
          Register log in straight away and then redirects; AuthDialog closes itself after login. */}
      {authTab && (
        <AuthDialog
          key={authTab}
          open
          onClose={closeAuth}
          initialTab={authTab}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
