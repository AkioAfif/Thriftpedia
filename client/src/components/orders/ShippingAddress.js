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
    <div className="min-w-0 text-text">
      <p className="break-words text-[17px] font-semibold leading-snug">{address.recipientName}</p>
      <a
        href={`tel:${address.phone}`}
        aria-label={`Call ${address.phone}`}
        className="-ml-1 mt-0.5 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg px-1 text-[15px] tabular-nums text-text underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <PhoneIcon className="size-4 shrink-0 text-text-secondary" />
        <span className="min-w-0 break-all">{address.phone}</span>
      </a>
      <div className="mt-3 border-t border-border pt-3 text-[15px] leading-relaxed">
        <p className="whitespace-pre-line break-words">{address.address}</p>
        <p className="mt-1 break-words">
          <span className="font-semibold">{address.city}</span>
          {address.postalCode && <span className="tabular-nums text-text">, {address.postalCode}</span>}
        </p>
      </div>
    </div>
  );
}

function BuyerHeader({ action = null }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-primary">
        <PinIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="shipping-title" className="text-[18px] font-semibold leading-tight text-text">Delivery address</h2>
        <p className="mt-1 text-[13px] text-text-secondary">Where your piece will be sent</p>
      </div>
      {action}
    </div>
  );
}

const OUTLINE_BTN =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border-[1.5px] border-primary bg-surface px-4 text-sm font-semibold text-primary transition-colors duration-150 hover:bg-primary-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 motion-reduce:transition-none';

// Buyer order page. `canEdit` (PENDING, unpaid, no payment token yet) offers Add / Edit, which
// call `onEdit` (the page opens the address dialog). Otherwise the address is read-only.
export function BuyerShippingAddress({ address, canEdit = false, onEdit }) {
  const editable = canEdit && typeof onEdit === 'function';

  if (!address && editable) {
    return (
      <section
        aria-labelledby="shipping-title"
        className="rounded-[20px] border-[1.5px] border-dashed border-badge-warning bg-badge-warning p-4 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
            <PinIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="shipping-title" className="text-[18px] font-semibold leading-tight text-text">No delivery address</h2>
            <p className="mt-1 break-words text-sm text-text-secondary">Add one to pay online.</p>
          </div>
          <button type="button" onClick={onEdit} className={`${OUTLINE_BTN} w-full sm:w-auto`}>
            Add address
          </button>
        </div>
      </section>
    );
  }

  if (!address) {
    return (
      <section aria-labelledby="shipping-title" className="rounded-[20px] border-[1.5px] border-dashed border-border p-4 sm:p-6">
        <BuyerHeader />
        <p className="mt-3 break-words text-sm text-text-secondary">No delivery address was added.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="shipping-title" className="rounded-[20px] border border-border bg-surface p-4 sm:p-6">
      <BuyerHeader
        action={
          editable ? (
            <button
              type="button"
              onClick={onEdit}
              className="-mr-2 -mt-2 inline-flex min-h-11 shrink-0 items-center rounded-lg px-2 text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Edit address
            </button>
          ) : null
        }
      />
      <div className="mt-4">
        <AddressDetails address={address} />
      </div>
    </section>
  );
}
