// Delivery address, shared by the buyer order page and the admin order detail.
// Fields: recipientName, phone, address, city, postalCode (shown exactly as stored).

export function PinIcon({ className = 'size-5' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function PhoneIcon({ className = 'size-4' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 4h3.5l1.5 4-2.2 1.4a11 11 0 0 0 6.8 6.8L16 14l4 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}

// Name, then a tel: link, then (after a hairline) the street and a separate "City, Postal code" line.
export function AddressDetails({ address }) {
  return (
    <div className="min-w-0 text-[#2B2118]">
      <p className="break-words text-[17px] font-semibold leading-snug">{address.recipientName}</p>
      <a
        href={`tel:${address.phone}`}
        aria-label={`Call ${address.phone}`}
        className="-ml-1 mt-0.5 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg px-1 text-[15px] tabular-nums text-[#2B2118] underline-offset-4 hover:text-[#B5532E] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:ring-offset-2"
      >
        <PhoneIcon className="size-4 shrink-0 text-[#6F6358]" />
        <span className="min-w-0 break-all">{address.phone}</span>
      </a>
      <div className="mt-3 border-t border-[#EAE4DA] pt-3 text-[15px] leading-relaxed">
        <p className="whitespace-pre-line break-words">{address.address}</p>
        <p className="mt-1 break-words">
          <span className="font-semibold">{address.city}</span>
          {address.postalCode && <span className="tabular-nums text-[#4A3F35]">, {address.postalCode}</span>}
        </p>
      </div>
    </div>
  );
}

function BuyerHeader() {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-[#B5532E]">
        <PinIcon className="size-5" />
      </span>
      <div className="min-w-0">
        <h2 id="shipping-title" className="text-[18px] font-semibold leading-tight text-[#2B2118]">Delivery address</h2>
        <p className="mt-1 text-[13px] text-[#6F6358]">Where your piece will be sent</p>
      </div>
    </div>
  );
}

// Buyer order page: white card with the address, or a dashed note when none was added.
export function BuyerShippingAddress({ address }) {
  if (!address) {
    return (
      <section
        aria-labelledby="shipping-title"
        className="rounded-[20px] border-[1.5px] border-dashed border-[#D9CFC1] p-4 sm:p-6"
      >
        <BuyerHeader />
        <p className="mt-3 break-words text-sm text-[#5C4D40]">
          No delivery address was added, so online payment isn’t available for this order.
        </p>
      </section>
    );
  }
  return (
    <section aria-labelledby="shipping-title" className="rounded-[20px] border border-[#D9CFC1] bg-white p-4 sm:p-6">
      <BuyerHeader />
      <div className="mt-4">
        <AddressDetails address={address} />
      </div>
    </section>
  );
}
