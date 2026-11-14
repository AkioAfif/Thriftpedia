import { statusMeta } from '@/lib/orderView';

const SIZES = {
  md: 'min-w-[6.5rem] px-3 py-1.5 text-xs',
  // Header of the admin order detail page.
  lg: 'min-h-9 px-4 py-1.5 text-sm',
};

export default function OrderStatusBadge({ status, size = 'md', className = '' }) {
  const meta = statusMeta(status);
  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 rounded-full font-semibold ${SIZES[size] ?? SIZES.md} ${meta.badge} ${className}`}
    >
      {meta.label}
    </span>
  );
}
