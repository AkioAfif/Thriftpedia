import Link from 'next/link';
import { CONTACT_REPLY_NOTE, TEAM } from '@/lib/legalContent';
import { EmailLink } from './EmailLink';

const card = 'rounded-3xl border border-border bg-surface p-6 sm:p-8';

export function ContactCards() {
  return (
    <>
      <div className="mt-10 grid grid-cols-1 items-start gap-6 lg:grid-cols-[480px_minmax(0,1fr)]">
        <section aria-labelledby="contact-email-title" className={card}>
          <h2 id="contact-email-title" className="text-2xl font-medium text-text">Email</h2>
          <p className="mt-6 text-lg sm:text-[22px]">
            <EmailLink />
          </p>
          <p className="mt-6 text-sm text-text-secondary">{CONTACT_REPLY_NOTE}</p>
        </section>

        <section aria-labelledby="contact-team-title" className={card}>
          <h2 id="contact-team-title" className="text-2xl font-medium text-text">Team</h2>
          <ul className="mt-4 divide-y divide-border">
            {TEAM.map((member) => (
              <li key={member.name} className="py-4 last:pb-0">
                <p className="font-semibold text-text">{member.name}</p>
                <p className="mt-1 text-sm text-text-secondary">{member.role}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <Link
        href="/catalog"
        className="mt-10 flex min-h-12 w-full items-center justify-center rounded-lg bg-primary px-10 text-[15px] font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:inline-flex sm:w-auto"
      >
        Browse catalog
      </Link>
    </>
  );
}
