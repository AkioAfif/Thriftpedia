'use client';

import toast from 'react-hot-toast';
import DetailCard, { detailFocusRing } from './DetailCard';
import { AddressDetails, PinIcon } from '@/components/orders/ShippingAddress';
import { addressLines } from '@/lib/shippingAddress';

function CopyIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

// Admin order detail: where to ship. Copy puts name, phone, street and "city postal code" on
// the clipboard, one per line.
export default function ShippingAddressCard({ address }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(addressLines(address).join('\n'));
      toast.success('Address copied');
    } catch {
      toast.error('Couldn’t copy. Select the address and copy it manually.');
    }
  }

  const title = (
    <span className="flex items-center gap-2.5">
      <PinIcon className="size-5 shrink-0 text-[#B5532E]" />
      Delivery address
    </span>
  );

  return (
    <DetailCard titleId="order-address-title" title={title} bodyClassName="">
      {address ? (
        <>
          <div className="p-5 sm:p-6">
            <AddressDetails address={address} />
          </div>
          <div className="flex justify-end border-t border-[#EAE4DA] px-5 py-3 sm:px-6">
            <button
              type="button"
              onClick={copy}
              className={`inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border-[1.5px] border-[#B5532E] bg-white px-4 text-sm font-semibold text-[#B5532E] hover:bg-[#FBE6DC] sm:w-auto ${detailFocusRing}`}
            >
              <CopyIcon />
              Copy address
            </button>
          </div>
        </>
      ) : (
        <p className="p-5 text-sm text-[#5C4D40] sm:p-6">No delivery address provided.</p>
      )}
    </DetailCard>
  );
}
