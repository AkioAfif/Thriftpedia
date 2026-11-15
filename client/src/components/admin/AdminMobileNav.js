'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminTopBar } from './MobileBackBar';
import { NAV_ITEMS, SidebarLogo, focusRing, formatRole, getInitials, isActivePath } from './Sidebar';

const LG_QUERY = '(min-width: 1024px)';
const FOCUSABLE = 'a[href], button:not([disabled])';
const iconBtn = `flex size-11 items-center justify-center rounded-xl text-text hover:bg-surface-muted ${focusRing}`;

function MenuIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function BackIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

// Below lg only: sticky top bar with a hamburger that opens a left drawer (menu + account).
export default function AdminMobileNav({ user, onLogout }) {
  const pathname = usePathname();
  // Set by a page through <MobileBackBar>; null shows the logo.
  const backBar = useAdminTopBar();
  const drawerId = useId();
  const menuButtonRef = useRef(null);
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);

  // The drawer belongs to the path it was opened on, so any route change closes it
  // without an effect calling setState.
  const [openPath, setOpenPath] = useState(null);
  const open = openPath !== null && openPath === pathname;

  function close({ refocus = false } = {}) {
    setOpenPath(null);
    if (refocus) menuButtonRef.current?.focus();
  }

  // Focus moves into the drawer when it opens.
  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  // Lock page scroll while open; restored on close and on unmount.
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Widening to lg (desktop sidebar takes over) closes the drawer; state is set in the listener.
  useEffect(() => {
    if (!open) return undefined;
    const media = window.matchMedia(LG_QUERY);
    const onChange = (e) => {
      if (e.matches) setOpenPath(null);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [open]);

  function onDrawerKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close({ refocus: true });
      return;
    }
    if (e.key !== 'Tab') return;
    const items = Array.from(drawerRef.current?.querySelectorAll(FOCUSABLE) ?? []);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border bg-canvas px-4 lg:hidden">
        {backBar ? (
          <div className="-ml-2 flex min-w-0 flex-1 items-center gap-1">
            <Link href={backBar.href} aria-label={`Back to ${backBar.label}`} className={`${iconBtn} shrink-0`}>
              <BackIcon />
            </Link>
            <p className="min-w-0 truncate text-base font-semibold text-text">{backBar.title}</p>
          </div>
        ) : (
          <SidebarLogo />
        )}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={() => setOpenPath(pathname)}
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls={drawerId}
          className={iconBtn}
        >
          <MenuIcon />
        </button>
      </header>

      <div
        aria-hidden="true"
        onClick={() => close({ refocus: true })}
        className={`fixed inset-0 z-40 bg-text/40 transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        ref={drawerRef}
        id={drawerId}
        role="dialog"
        aria-modal="true"
        aria-label="Admin menu"
        inert={!open}
        onKeyDown={onDrawerKeyDown}
        className={`fixed inset-y-0 left-0 z-50 flex w-[288px] max-w-[85vw] flex-col border-r border-border bg-surface transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <SidebarLogo />
          <button ref={closeButtonRef} type="button" onClick={() => close({ refocus: true })} aria-label="Close menu" className={iconBtn}>
            <CloseIcon />
          </button>
        </div>

        <nav aria-label="Admin navigation" className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => close()}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-[10px] px-4 text-sm font-medium ${focusRing} ${
                  active ? 'bg-primary text-on-primary' : 'text-text hover:bg-canvas'
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface-muted p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-border text-xs font-bold text-text">
              {getInitials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-text">{user.name}</p>
              <p className="text-xs text-text-secondary">{formatRole(user.role)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className={`min-h-11 w-full rounded-[10px] border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-canvas ${focusRing}`}
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
