'use client';

import Image from 'next/image';
import { HeartIcon } from '@/components/ui/Icons';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/context/BuyerContext';

export function WishlistButton({ productId, productName, product, inline = false, labelled = false }) {
  const { savedIds, isPending, toggle, query, buyer } = useWishlist();
  const saved = savedIds.has(productId);
  const pending = isPending(productId);
  const waiting = buyer && query.isPending;
  const name = productName || product?.name || 'this product';
  return <button type="button" disabled={pending || waiting} aria-pressed={saved} aria-busy={pending}
    aria-label={`${saved ? 'Remove' : 'Save'} ${name} ${saved ? 'from' : 'to'} wishlist`}
    onClick={(event) => { event.preventDefault(); event.stopPropagation(); void toggle(product || { _id: productId, name }); }}
    className={cn('buyer-control flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-sm rounded-full border border-border bg-surface text-primary disabled:cursor-wait disabled:opacity-50', !inline && 'absolute right-3 top-3 z-10', labelled && 'w-full rounded-md px-md py-sm text-text')}>
    {pending || waiting ? <span role="status" aria-label={saved ? 'Removing' : 'Saving'} className="buyer-spinner" />
      : saved ? <Image src="/icons/wishlist-filled.svg" width={20} height={20} alt="" /> : <HeartIcon className="size-5" />}
    {labelled && <span className="body-md font-semibold">{pending ? saved ? 'Removing…' : 'Saving…' : saved ? 'Remove from Wishlist' : 'Add to Wishlist'}</span>}
  </button>;
}
