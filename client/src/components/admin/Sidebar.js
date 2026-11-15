'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HangerLogoIcon } from '@/components/ui/Icons';
import { HangerIcon } from '@/components/ui/icons/HangerIcon';
import { BagIcon, DashboardIcon } from './icons';

export const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/admin/products', label: 'Product Management', Icon: HangerIcon },
  { href: '/admin/orders', label: 'Order Management', Icon: BagIcon },
];

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

export function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] ?? '?'}${parts[1]?.[0] ?? ''}`;
  return letters.toUpperCase();
}

export function formatRole(role) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export const isActivePath = (pathname, href) => pathname === href || pathname.startsWith(`${href}/`);

// Brand mark linking to the catalog; shared by the desktop sidebar and the mobile nav.
export function SidebarLogo() {
  return (
    <Link
      href="/catalog"
      aria-label="Go to catalog"
      className={`group flex items-center gap-2.5 rounded-xl p-0.5 ${focusRing}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary shadow-sm transition-transform group-hover:scale-105">
        <HangerLogoIcon />
      </div>
      <div className="select-none font-display text-[24px] font-bold leading-none tracking-[-0.5px]">
        <span className="text-text">thrift</span>
        <span className="text-primary">pedia</span>
      </div>
    </Link>
  );
}

// Desktop only (lg and up). Below lg, AdminMobileNav renders the top bar and drawer.
export default function Sidebar({ user, onLogout }) {
  const pathname = usePathname();

  return (
    <aside className="hidden flex-col gap-4 border-b border-border bg-surface p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <SidebarLogo />
      <nav
        aria-label="Admin navigation"
        className="flex gap-2 overflow-x-auto lg:mt-4 lg:flex-col lg:overflow-visible"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = isActivePath(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium ${focusRing} ${
                active ? 'bg-primary text-on-primary' : 'text-text hover:bg-canvas'
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 lg:mt-auto lg:flex-col lg:items-stretch">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-surface-muted p-3">
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
          className={`rounded-[10px] border border-border bg-surface px-4 py-3 text-sm font-medium text-text hover:bg-canvas lg:w-full ${focusRing}`}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}