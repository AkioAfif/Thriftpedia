import { CONTACT_INTRO } from '@/lib/legalContent';
import { PageHeader } from '@/components/legal/PageHeader';
import { ContactCards } from '@/components/legal/ContactCards';

export const metadata = {
  title: 'Contact — Thriftpedia',
  description: 'Questions about a piece or an order? Email the Thriftpedia team.',
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pb-24 pt-6 sm:px-8 lg:px-28">
      <PageHeader title="Contact us" crumb="Contact" subtitle={CONTACT_INTRO} />
      <ContactCards />
    </main>
  );
}
