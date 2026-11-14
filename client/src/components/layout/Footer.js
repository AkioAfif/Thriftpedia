import Link from 'next/link';
import { HangerLogoIcon } from '@/components/ui/Icons';
import { FooterLinks } from './FooterLinks';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#5A3A2A]';

// Only list routes that exist in app/.
const FOOTER_LINKS = [
  { href: '/contact', label: 'Contact' },
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
];

const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL?.trim() || '';

export function Footer() {
  return (
    <footer className="relative mt-auto w-full text-white">
      <div className="bg-[#5A3A2A] px-6 pb-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 pb-8 pt-10 md:flex-row">
          <Link href="/catalog" className={`flex items-center gap-2.5 rounded-xl p-0.5 ${focusRing}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F25A2A]">
              <HangerLogoIcon />
            </div>
            <div className="font-display text-[28px] font-bold leading-none tracking-tight">
              <span className="text-white">thrift</span>
              <span className="text-[#F25A2A]">pedia</span>
            </div>
          </Link>

          {FOOTER_LINKS.length > 0 && <FooterLinks links={FOOTER_LINKS} />}

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
