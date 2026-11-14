'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_ITEMS, SidebarLogo, focusRing, formatRole, getInitials, isActivePath } from './Sidebar';

const LG_QUERY = '(min-width: 1024px)';
const FOCUSABLE = 'a[href], button:not([disabled])';
const iconBtn = `flex size-11 items-center justify-center rounded-xl text-[#2B2118] hover:bg-[#F5F0E8] ${focusRing}`;

function MenuIcon() {
  return (
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
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
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#D9CFC1] bg-[#FAF7F2] px-4 lg:hidden">
        <SidebarLogo />
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
        className={`fixed inset-0 z-40 bg-[#2B2118]/40 transition-opacity duration-200 motion-reduce:transition-none lg:hidden ${
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
        className={`fixed inset-y-0 left-0 z-50 flex w-[288px] max-w-[85vw] flex-col border-r border-[#D9CFC1] bg-white transition-transform duration-200 motion-reduce:transition-none lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#EAE4DA] px-4">
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
                  active ? 'bg-[#b4532a] text-white' : 'text-[#2b1d14] hover:bg-[#faf7f2]'
                }`}
              >
                <Icon />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-[#EAE4DA] p-4">
          <div className="flex items-center gap-3 rounded-xl bg-[#f5f1ea] p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8e1d8] text-xs font-bold text-[#2b1d14]">
              {getInitials(user.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#2b1d14]">{user.name}</p>
              <p className="text-xs text-[#6b5d52]">{formatRole(user.role)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className={`min-h-11 w-full rounded-[10px] border border-[#D9CFC1] bg-white px-4 text-sm font-medium text-[#2b1d14] hover:bg-[#faf7f2] ${focusRing}`}
          >
            Log out
          </button>
        </div>
      </div>
    </>
  );
}
