'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { HeartIcon } from '@/components/ui/Icons';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const toastStyle = {
  borderRadius: '12px',
  background: '#FAF7F2',
  color: '#2B2118',
  border: '1px solid #E6DDD2',
};

export function WishlistButton({
  productId,
  productName,
  initialInWishlist = false,
  isSold = false,
  disabled = false,
}) {
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [animating, setAnimating] = useState(false);
  const { token } = useAuth();

  const handleToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (!token) {
      toast('Please log in to save items', { icon: '🔒', style: toastStyle });
      return;
    }

    const nextState = !inWishlist;
    setInWishlist(nextState);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 200);

    try {
      if (nextState) {
        await apiClient('/wishlist', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId }),
        });
        toast.success(`Saved ${productName || 'item'} to wishlist`, { style: toastStyle });
      } else {
        await apiClient(`/wishlist/${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        toast(`Removed ${productName || 'item'} from wishlist`, {
          icon: '🗑️',
          style: toastStyle,
        });
      }
    } catch (err) {
      setInWishlist(!nextState); // rollback
      toast.error(err.message || 'Failed to update wishlist', { style: toastStyle });
    }
  };

  return (
    <button
      type="button"
      aria-label={
        disabled
          ? `${productName || 'This product'} is sold. Sold items can't be saved to wishlist`
          : `Add ${productName || 'product'} to wishlist`
      }
      aria-pressed={inWishlist}
      disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      onClick={handleToggle}
      className={cn(
        'absolute top-3 right-3 z-10 w-9 h-9 rounded-full backdrop-blur-xs shadow-sm flex items-center justify-center transition-all focus-visible:ring-2 focus-visible:ring-[#B5532E] focus-visible:outline-none',
        isSold ? 'bg-white/70 text-[#5C4D40] opacity-75' : 'bg-white/90 text-[#2B2118]',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : inWishlist
            ? 'text-[#B5532E]'
            : 'hover:text-[#B5532E]',
        animating && 'scale-125'
      )}
    >
      <HeartIcon
        className={cn('w-[18px] h-[18px]', inWishlist && 'fill-[#B5532E]')}
        filled={inWishlist}
      />
    </button>
  );
}