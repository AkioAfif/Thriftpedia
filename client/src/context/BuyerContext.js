'use client';

import { createContext, useContext, useRef, useState, useSyncExternalStore } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { BuyerLoginDialog } from '@/components/auth/BuyerLoginDialog';
import { getWishlist, saveWishlistItem, removeWishlistItem } from '@/lib/services/buyerService';

const BuyerContext = createContext(null);
function subscribeScreen(callback) {
  const media = window.matchMedia('(max-width: 767px)');
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}
function Notifications() {
  const mobile = useSyncExternalStore(subscribeScreen, () => window.matchMedia('(max-width: 767px)').matches, () => false);
  return <Toaster position={mobile ? 'top-center' : 'bottom-center'} toastOptions={{ duration: 4000, className: 'buyer-toast', success: { iconTheme: { primary: 'var(--secondary)', secondary: 'var(--surface)' } } }} />;
}

function WishlistProvider({ children }) {
  const { token, user, ready, login } = useAuth();
  const client = useQueryClient();
  const [intent, setIntent] = useState(null);
  const [pending, setPending] = useState([]);
  const locks = useRef(new Set());
  const buyer = Boolean(token) && String(user?.role || 'BUYER').toUpperCase() === 'BUYER';
  const query = useQuery({ queryKey: ['wishlist', token], queryFn: ({ signal }) => getWishlist(token, signal), enabled: ready && buyer, retry: false, staleTime: 30000 });
  const items = buyer ? query.data ?? [] : [];
  const savedIds = new Set(items.map((item) => item.product._id));

  async function change(product, currentSaved, currentToken = token) {
    if (!currentToken) { setIntent({ product }); return; }
    const lockKey = `${currentToken}:${product._id}`;
    if (locks.current.has(lockKey)) return;
    locks.current.add(lockKey); setPending((old) => [...old, lockKey]);
    const key = ['wishlist', currentToken];
    try {
      try {
        if (currentSaved) await removeWishlistItem(currentToken, product._id);
        else await saveWishlistItem(currentToken, product._id);
      } catch (error) {
        // Treat a duplicate save / already-removed item as an idempotent success.
        if (!(error.status === 409 && !currentSaved) && !(error.status === 404 && currentSaved)) throw error;
      }
      await client.cancelQueries({ queryKey: key });
      client.setQueryData(key, (previous = []) => currentSaved
        ? previous.filter((item) => item.product._id !== product._id)
        : previous.some((item) => item.product._id === product._id) ? previous : [{ product }, ...previous]);
      // Reconcile populated products and items saved on another browser/device.
      await client.invalidateQueries({ queryKey: key });
      toast.success(currentSaved ? 'Removed from your wishlist.' : 'Saved to your wishlist.');
    } catch (error) {
      if (error.status === 401) setIntent({ product, currentSaved });
      toast.error(error.message || 'Couldn’t update your wishlist. Please try again.');
    } finally {
      locks.current.delete(lockKey); setPending((old) => old.filter((id) => id !== lockKey));
    }
  }

  return <BuyerContext.Provider value={{ items, count: items.length, savedIds, query, buyer, pending,
    isPending: (id) => pending.includes(`${token}:${id}`),
    toggle: (product) => change(product, savedIds.has(product._id)), requestLogin: () => setIntent({}) }}>
    {children}
    {intent && <BuyerLoginDialog productName={intent.product?.name} onClose={() => setIntent(null)}
      onSuccess={async (newToken, newUser) => {
        if (String(newUser.role).toUpperCase() !== 'BUYER' && intent.product) throw new Error('Wishlist is available for buyer accounts.');
        login(newToken, newUser); setIntent(null);
        if (intent.product) await change(intent.product, Boolean(intent.currentSaved), newToken);
      }} />}
  </BuyerContext.Provider>;
}

export function BuyerProvider({ children }) {
  const [client] = useState(() => new QueryClient());
  return <QueryClientProvider client={client}><WishlistProvider>{children}<Notifications /></WishlistProvider></QueryClientProvider>;
}
export function useWishlist() {
  const value = useContext(BuyerContext);
  if (!value) throw new Error('useWishlist requires BuyerProvider');
  return value;
}
