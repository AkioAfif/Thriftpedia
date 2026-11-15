import RequireBuyer from '@/components/auth/RequireBuyer';

export default function CheckoutLayout({ children }) {
  return <RequireBuyer>{children}</RequireBuyer>;
}
