'use client';

import StatusChips from '@/components/ui/StatusChips';
import { formatNumber } from '@/lib/adminProducts';

// Thin wrapper: same props as before. Renders the shared chip row (identical to /orders) as an
// ARIA tablist: role="tab", aria-selected, aria-controls={panelId}, ids "order-tab-<STATUS|ALL>",
// roving tabindex and Arrow/Home/End. Counts come straight from the list response (`counts`):
// they follow the search but ignore the active status; "–" until they arrive.
export default function OrderStatusTabs({ counts, active, onSelect, panelId }) {
  return (
    <StatusChips
      mode="tabs"
      value={active}
      counts={counts}
      panelId={panelId}
      placeholderCount
      formatCount={formatNumber}
      onSelect={onSelect}
    />
  );
}
