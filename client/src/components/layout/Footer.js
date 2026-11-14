import Link from 'next/link';
import { HangerLogoIcon } from '@/components/ui/Icons';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#5A3A2A]';

// Contact, Terms and Privacy only render once their route exists in app/ (/contact, /terms,
// /privacy). None exist yet, so the list is empty; add an entry when the page ships.
const FOOTER_LINKS = [];

const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL?.trim() || '';

export function Footer() {
  return (
    <footer className="relative mt-auto w-full text-white">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 1200 48" preserveAspectRatio="none" className="pointer-events-none block h-12 w-full">
        <path d="M0,24 C300,48 800,0 1200,24 L1200,48 L0,48 Z" fill="#5A3A2A" stroke="none" />
      </svg>

      <div className="bg-[#5A3A2A] px-6 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 pb-8 pt-4 md:flex-row">
          <Link href="/catalog" className={`flex items-center gap-2.5 rounded-xl p-0.5 ${focusRing}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F25A2A]">
              <HangerLogoIcon />
            </div>
            <div className="font-display text-[28px] font-bold leading-none tracking-tight">
              <span className="text-white">thrift</span>
              <span className="text-[#F25A2A]">pedia</span>
            </div>
          </Link>

          {FOOTER_LINKS.length > 0 && (
            <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[15px] font-medium">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className={`inline-flex min-h-11 items-center rounded hover:text-primary-tint ${focusRing}`}>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {DEMO_VIDEO_URL ? (
            <a
              href={DEMO_VIDEO_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Watch the Thriftpedia demo video on YouTube (opens in a new tab)"
              className={`flex size-11 items-center justify-center rounded-full bg-white/12 text-white transition-colors hover:bg-primary ${focusRing}`}
            >
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
            </a>
          ) : (
            <span aria-hidden="true" className="hidden size-11 md:block" />
          )}
        </div>

        <div className="mx-auto mb-10 max-w-7xl border-t border-white/15" />
        <p className="text-center text-[13px] text-white/70">© 2026 Thriftpedia. Every piece curated with intention.</p>
      </div>
    </footer>
  );
}
