import { TERMS_SECTIONS } from '@/lib/legalContent';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Terms & Conditions — Thriftpedia',
  description: 'The terms for using Thriftpedia: accounts, one-of-a-kind items, orders, cancellation and reviews.',
};

export default function TermsPage() {
  return <LegalLayout title="Terms & Conditions" crumb="Terms" sections={TERMS_SECTIONS} />;
}
