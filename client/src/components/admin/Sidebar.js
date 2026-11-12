'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HangerLogoIcon } from '@/components/ui/Icons';
import { BagIcon, BoxIcon, DashboardIcon } from './icons';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', Icon: DashboardIcon },
  { href: '/admin/products', label: 'Product Management', Icon: BoxIcon },
  { href: '/admin/orders', label: 'Order Management', Icon: BagIcon },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E]';

function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] ?? '?'}${parts[1]?.[0] ?? ''}`;
  return letters.toUpperCase();
}

function formatRole(role) {
  if (!role) return '';
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export default function Sidebar({ user, onLogout }) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-4 border-b border-[#e8e1d8] bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r">
      <Link
        href="/catalog"
        aria-label="Go to catalog"
        className={`group flex items-center gap-2.5 rounded-xl p-0.5 ${focusRing}`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F25A2A] shadow-sm transition-transform group-hover:scale-105">
          <HangerLogoIcon />
        </div>
        <div className="select-none font-display text-[24px] font-bold leading-none tracking-[-0.5px]">
          <span className="text-[#2B2118]">thrift</span>
          <span className="text-[#F25A2A]">pedia</span>
        </div>
      </Link>

      <nav
        aria-label="Admin navigation"
        className="flex gap-2 overflow-x-auto lg:mt-4 lg:flex-col lg:overflow-visible"
      >
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-[10px] px-4 py-3 text-sm font-medium ${focusRing} ${
                active ? 'bg-[#b4532a] text-white' : 'text-[#2b1d14] hover:bg-[#faf7f2]'
              }`}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 lg:mt-auto lg:flex-col lg:items-stretch">
        <div className="flex flex-1 items-center gap-3 rounded-xl bg-[#f5f1ea] p-3">
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
          className={`rounded-[10px] border border-[#e8e1d8] bg-white px-4 py-3 text-sm font-medium text-[#2b1d14] hover:bg-[#faf7f2] lg:w-full ${focusRing}`}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}