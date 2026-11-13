'use client';

import { usePathname } from 'next/navigation';

export default function HideOnAdmin({ children }) {
  const pathname = usePathname();
  if (pathname && pathname.startsWith('/admin')) return null;
  return children;
}