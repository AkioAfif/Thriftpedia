import Link from 'next/link';

const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

// Breadcrumb "Home > <page>", the page's single h1 and an optional subtitle line.
export function PageHeader({ title, crumb, subtitle }) {
  return (
    <header>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-[13px] text-text-secondary">
          <li>
            <Link href="/" className={`inline-flex min-h-11 items-center rounded hover:text-primary ${focusRing}`}>
              Home
            </Link>
          </li>
          <li aria-hidden="true">&gt;</li>
          <li aria-current="page" className="text-text">
            {crumb}
          </li>
        </ol>
      </nav>
      <h1 className="mt-6 text-[40px] font-semibold leading-[1.1] tracking-tight text-text sm:text-[52px]">{title}</h1>
      {subtitle && <p className="mt-4 text-[15px] text-text-secondary sm:text-base">{subtitle}</p>}
    </header>
  );
}
