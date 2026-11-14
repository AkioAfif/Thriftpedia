'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

// A tiny store (not React state) so registering from an effect never triggers a setState
// loop: pages write { href, label, title }, the mobile top bar subscribes to it.
function createTopBarStore() {
  let config = null;
  const listeners = new Set();
  return {
    get: () => config,
    set(next) {
      config = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const AdminTopBarContext = createContext(null);

export function AdminTopBarProvider({ children }) {
  const [store] = useState(createTopBarStore);
  return <AdminTopBarContext.Provider value={store}>{children}</AdminTopBarContext.Provider>;
}

const serverSnapshot = () => null;

// Current back-bar config, or null (then the top bar shows the logo).
export function useAdminTopBar() {
  const store = useContext(AdminTopBarContext);
  return useSyncExternalStore(store?.subscribe ?? (() => () => {}), store?.get ?? serverSnapshot, serverSnapshot);
}

// Renders nothing. While mounted, the mobile top bar shows a back link to `href`
// ("Back to {label}") and `title`. Cleared on unmount, unless another page set its own.
export default function MobileBackBar({ href, label, title }) {
  const store = useContext(AdminTopBarContext);
  useEffect(() => {
    if (!store) return undefined;
    const config = { href, label, title };
    store.set(config);
    return () => {
      if (store.get() === config) store.set(null);
    };
  }, [store, href, label, title]);
  return null;
}
