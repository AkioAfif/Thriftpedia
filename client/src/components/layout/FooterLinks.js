'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#5A3A2A]';

// Footer page links; the current page gets a terracotta underline.
export function FooterLinks({ links }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[15px] font-medium">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex min-h-11 items-center rounded border-b-2 hover:text-primary-tint ${active ? 'border-primary' : 'border-transparent'} ${focusRing}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
