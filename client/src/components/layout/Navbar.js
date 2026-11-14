'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useWishlist } from '@/context/BuyerContext';
import toast from 'react-hot-toast';
import { HangerLogoIcon, MenuIcon } from '@/components/ui/Icons';
import { useAuth } from '@/context/AuthContext';
import AuthDialog from '@/components/auth/AuthDialog';
import { MobileMenu } from './MobileMenu';
import { BagIcon, DashboardIcon } from '@/components/admin/icons';

const focusRing =
  'focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none';

// Existing desktop nav styles: active = bold with terracotta underline.
// Buyer Orders / Wishlist: 44x44 tile (radius 12) below md, pill (padding 14, full radius) from md.
const buyerPill =
  'flex size-11 shrink-0 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none md:h-11 md:w-auto md:rounded-full md:px-3.5';
const buyerPillIdle = 'bg-[#F5F0E8] text-[#2B2118] hover:bg-[#EDE5D8]';
const buyerPillActive = 'bg-[#FBE6DC] text-[#B5532E]';

// Avatar dropdown items: 44px, radius 12, padding 12, 20px line icon + 14px label, 12px apart.
const menuItem =
  'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#B5532E] motion-reduce:transition-none';
const menuItemIdle = 'text-[#2B2118] hover:bg-[#F5F0E8] hover:text-[#B5532E]';
const menuItemActive = 'bg-[#FBE6DC] text-[#B5532E]';

const navIdle = 'text-[#5C4D40] hover:text-[#2B2118] transition-colors py-1 rounded';
const navActive = 'text-[#2B2118] font-bold border-b-2 border-[#B5532E] py-1 pb-0.5 tracking-tight rounded';

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

  const initials = getInitials(user?.name);
  // Admins get a way back to the dashboard and no buyer-only wishlist/orders entries.
  const isAdmin = String(user?.role ?? '').toUpperCase() === 'ADMIN';
  const isHome = pathname === '/';
  const isCatalog = pathname?.startsWith('/catalog') ?? false;
  const isOrders = pathname?.startsWith('/orders') ?? false;
  const isWishlist = pathname?.startsWith('/wishlist') ?? false;
  const isBuyerUser = ready && isLoggedIn && !isAdmin;

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E6DDD2] py-3.5 px-4 sm:px-8 flex items-center transition-all"
        id="main-header"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className={`flex items-center gap-2.5 group rounded-xl p-0.5 ${focusRing}`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#F25A2A] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105">
              <HangerLogoIcon />
            </div>
            {/* Buyer below sm: the wordmark is screen-reader only so Orders, Wishlist, avatar and menu fit at 375px. */}
            <div className={`font-display font-bold text-[18px] sm:text-[28px] tracking-[-0.5px] leading-none select-none ${isBuyerUser ? 'max-sm:sr-only' : ''}`}>
              <span className="text-[#2B2118]">thrift</span>
              <span className="text-[#F25A2A]">pedia</span>
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
                  className={`min-h-[44px] px-3 flex items-center text-sm font-semibold text-[#2B2118] hover:text-[#B5532E] transition-colors rounded-xl ${focusRing}`}
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => openAuth('register')}
                  className={`min-h-[44px] px-5 flex items-center justify-center text-sm font-semibold leading-none rounded-xl border border-[#B5532E] text-[#B5532E] hover:bg-[#FBEDE6] transition-colors ${focusRing}`}
                >
                  Register
                </button>
              </div>
            )}

            {ready && isLoggedIn && (
              <>
                {/* Buyer only: Orders and Wishlist. One element each: a 44x44 icon tile below md,
                    an icon + label pill from md. Active (current section): #FBE6DC with #B5532E. */}
                {!isAdmin && (
                  <Link
                    href="/orders"
                    aria-label="Your orders"
                    title="Your orders"
                    aria-current={isOrders ? 'page' : undefined}
                    className={`${buyerPill} ${isOrders ? buyerPillActive : buyerPillIdle}`}
                  >
                    <BagIcon width={24} height={24} strokeWidth={1.75} className="size-6 shrink-0 md:size-[22px]" />
                    <span className="sr-only md:not-sr-only">Orders</span>
                  </Link>
                )}
                {!isAdmin && (
                  <Link
                    href="/wishlist"
                    aria-label={query.isPending ? 'Your wishlist' : `Your wishlist, ${count} ${count === 1 ? 'item' : 'items'}`}
                    title="Your wishlist"
                    aria-current={isWishlist ? 'page' : undefined}
                    className={`relative ${buyerPill} ${isWishlist ? buyerPillActive : buyerPillIdle}`}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" className="size-6 shrink-0 md:size-[22px]">
                      <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
                    </svg>
                    <span className="sr-only md:not-sr-only">Wishlist</span>
                    {!query.isPending && count > 0 && (
                      <>
                        {/* md and up: round badge after the label (gap 8 from the pill). */}
                        <span aria-hidden="true" className="hidden h-5 min-w-5 items-center justify-center rounded-full bg-[#B5532E] px-1.5 text-xs font-semibold leading-none tabular-nums text-white md:inline-flex">
                          {count > 99 ? '99+' : count}
                        </span>
                        {/* Below md: 18px badge off the icon's top-right corner, clear of the heart. */}
                        <span aria-hidden="true" className="absolute -right-1.5 -top-1.5 flex size-[18px] items-center justify-center rounded-full bg-[#B5532E] text-[11px] font-semibold leading-none text-white ring-2 ring-[#FAF7F2] md:hidden">
                          {count > 9 ? '9+' : count}
                        </span>
                      </>
                    )}
                  </Link>
                )}

                {/* Admin only, in the wishlist's spot: a 44x44 dashboard icon below md, a labelled pill from md. */}
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    aria-label="Admin dashboard"
                    className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-[#B5532E] text-sm font-semibold text-white hover:bg-[#9C4425] transition-colors md:px-4 ${focusRing} focus-visible:ring-offset-2`}
                  >
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1.5" />
                      <rect x="14" y="3" width="7" height="7" rx="1.5" />
                      <rect x="3" y="14" width="7" height="7" rx="1.5" />
                      <rect x="14" y="14" width="7" height="7" rx="1.5" />
                    </svg>
                    <span className="hidden whitespace-nowrap md:inline">Admin dashboard</span>
                  </Link>
                )}

                <div ref={profileAreaRef} className="relative flex items-center pl-2 border-l border-[#E6DDD2]">
                  <button
                    ref={profileButtonRef}
                    type="button"
                    aria-label="Account menu"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    onClick={() => setProfileOpen((prev) => !prev)}
                    className={`min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center font-bold text-xs text-[#2B2118] bg-[#E7DCD0] hover:bg-[#DBCABA] transition-colors cursor-pointer select-none border border-[#CFBEAE] ${focusRing}`}
                    title={user?.name || 'Account'}
                  >
                    {initials}
                  </button>

                  {profileOpen && (
                    <>
                      <div className="absolute right-0 top-full z-50 mt-2 w-[264px] rounded-2xl border border-[#D9CFC1] bg-white p-2 shadow-[0_8px_24px_rgba(43,33,24,0.08)]">
                        {/* Account card: information only, not a menu item. */}
                        <div className="flex items-center gap-3 px-2 pb-3 pt-1">
                          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E9DFD3] text-sm font-bold text-[#2B2118]">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[15px] font-semibold text-[#2B2118]">{user?.name || 'Account'}</p>
                            {user?.email && <p className="truncate text-[13px] text-[#6F6358]">{user.email}</p>}
                          </div>
                        </div>
                        <div aria-hidden="true" className="-mx-2 mb-1 border-t border-[#EAE4DA]" />

                        {isAdmin ? (
                          <Link href="/admin/dashboard" onClick={() => setProfileOpen(false)} className={`${menuItem} ${menuItemIdle}`}>
                            <DashboardIcon width={20} height={20} strokeWidth={1.75} className="shrink-0" />
                            Dashboard
                          </Link>
                        ) : (
                          <>
                            <Link
                              href="/orders"
                              onClick={() => setProfileOpen(false)}
                              aria-current={isOrders ? 'page' : undefined}
                              className={`${menuItem} ${isOrders ? menuItemActive : menuItemIdle}`}
                            >
                              <BagIcon width={20} height={20} strokeWidth={1.75} className="shrink-0" />
                              Your orders
                            </Link>
                            <Link
                              href="/wishlist"
                              onClick={() => setProfileOpen(false)}
                              aria-current={isWishlist ? 'page' : undefined}
                              className={`${menuItem} ${isWishlist ? menuItemActive : menuItemIdle}`}
                            >
                              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" className="shrink-0">
                                <path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z" />
                              </svg>
                              Your wishlist
                            </Link>
                          </>
                        )}

                        <div aria-hidden="true" className="-mx-2 my-1 border-t border-[#EAE4DA]" />
                        <button
                          type="button"
                          onClick={handleLogout}
                          className={`${menuItem} text-[#B3402A] hover:bg-[#FBE9E5]`}
                        >
                          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                            <path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4" />
                            <path d="M15 8l4 4-4 4M19 12H9" />
                          </svg>
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
              className={`md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center text-[#2B2118] hover:bg-[#F1EBE1] rounded-xl transition-colors ${focusRing}`}
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
          hideForgotPassword
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
