import RequireBuyer from '@/components/auth/RequireBuyer';

export default function OrdersLayout({ children }) {
  return <RequireBuyer>{children}</RequireBuyer>;
}
