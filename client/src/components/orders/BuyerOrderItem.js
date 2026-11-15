import Link from 'next/link';
import { OrderThumb } from '@/components/orders/OrderThumb';
import { formatRupiah, sizeLabel } from '@/lib/adminProducts';
import { productHrefFrom } from '@/lib/navigation';

function Chip({ children }) {
  return <span className="inline-flex items-center rounded-full bg-[#F5F0E8] px-3 py-1 text-[13px] font-medium text-[#2B2118]">{children}</span>;
}

// The ordered piece (snapshot data). "View piece" only when the product still exists.
// `fromPath` (this order's page) rides along as ?from= so the product page links back here.
export function BuyerOrderItem({ item, productId, fromPath }) {
  return (
    <section aria-labelledby="order-item-title" className="rounded-[20px] border border-[#D9CFC1] bg-white p-4 sm:p-5">
      <h2 id="order-item-title" className="sr-only">Item</h2>
      <div className="flex gap-4 sm:gap-5">
        <OrderThumb src={item.photo} alt={item.name} sizes="128px" className="size-24 rounded-2xl md:size-32" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="break-words text-[20px] font-semibold leading-snug text-[#2B2118]">{item.name}</p>
          {(item.brand || item.size) && (
            <div className="flex flex-wrap gap-2">
              {item.brand && <Chip>{item.brand}</Chip>}
              {item.size && <Chip>{item.size === 'FREE' ? sizeLabel(item.size) : `Size ${sizeLabel(item.size)}`}</Chip>}
            </div>
          )}
          <p className="text-base font-semibold tabular-nums text-[#2B2118]">{formatRupiah(item.price)}</p>
          {productId && (
            <Link
              href={fromPath ? productHrefFrom(productId, fromPath) : `/catalog/${productId}`}
              className="mt-1 inline-flex min-h-11 w-fit items-center gap-1.5 rounded-xl border-[1.5px] border-[#B5532E] bg-white px-4 text-sm font-semibold text-[#B5532E] transition-colors duration-150 hover:bg-[#FBE6DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2 motion-reduce:transition-none"
            >
              View piece
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
