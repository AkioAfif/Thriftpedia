import { PRIVACY_SECTIONS } from '@/lib/legalContent';
import { LegalLayout } from '@/components/legal/LegalLayout';

export const metadata = {
  title: 'Privacy Policy — Thriftpedia',
  description: 'What personal data Thriftpedia collects, how it is used and stored, and the choices you have.',
};

export default function PrivacyPage() {
  return <LegalLayout title="Privacy Policy" crumb="Privacy" sections={PRIVACY_SECTIONS} />;
}
