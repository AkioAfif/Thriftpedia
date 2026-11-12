import { statusMeta } from '@/lib/adminOrders';

export default function OrderStatusBadge({ status, className = '' }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex min-w-[6.5rem] items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${meta.badge} ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}
