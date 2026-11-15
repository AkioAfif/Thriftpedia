'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function RequireBuyer({ children }) {
  const { ready, isLoggedIn, user } = useAuth();
  const pathname = usePathname();
  if (!ready) return <p role="status" className="p-8 text-center">Memeriksa sesi...</p>;
  if (!isLoggedIn) return (
    <main className="p-8 text-center">
      <p>Silakan login untuk mengakses halaman ini.</p>
      <Link className="mt-4 inline-block underline" href={`/login?returnTo=${encodeURIComponent(pathname)}`}>Log in</Link>
    </main>
  );
  if (user?.role !== 'BUYER') return (
    <main className="p-8 text-center">
      <p>Halaman ini khusus akun buyer.</p>
      <Link href="/admin/dashboard" className="mt-4 inline-block underline">Buka dashboard admin</Link>
    </main>
  );
  return children;
}
