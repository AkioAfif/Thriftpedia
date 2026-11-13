'use client';

import { useState } from 'react';
import AuthDialog from '@/components/auth/AuthDialog';
import { Button } from '@/components/ui/Button';

export default function AuthPreviewPage() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState('checkout');
  const [initialTab, setInitialTab] = useState('login');

  const [previewKey, setPreviewKey] = useState(0);

  function openPreview(selectedContext, selectedTab) {
    setContext(selectedContext);
    setInitialTab(selectedTab);
    setPreviewKey((previous) => previous + 1);
    setOpen(true);
  }

  function handleSubmit({ mode, values }) {
  console.log('Auth preview:', {
    mode,
    email: values.email,
  });
}

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-lg px-md py-xl">
      <div className="flex flex-col gap-sm">
        <h1 className="headline-sm text-text">
          Authentication Preview
        </h1>

        <p className="body-md text-text-secondary">
          Preview tampilan authentication Thriftpedia
          sebelum diintegrasikan dengan backend.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <Button
          onClick={() => openPreview('checkout', 'login')}
        >
          Checkout - Log in
        </Button>

        <Button
          variant="outline"
          onClick={() => openPreview('checkout', 'register')}
        >
          Checkout - Sign up
        </Button>

        <Button
          onClick={() => openPreview('wishlist', 'login')}
        >
          Wishlist - Log in
        </Button>

        <Button
          variant="outline"
          onClick={() => openPreview('wishlist', 'register')}
        >
          Wishlist - Sign up
        </Button>

        <Button onClick={() => openPreview('general', 'login')}>
          General - Log in
        </Button>

        <Button
          variant="outline"
          onClick={() => openPreview('general', 'register')}
        >
          General - Sign up
        </Button>
      </div>

      <AuthDialog
        key={previewKey}
        open={open}
        onClose={() => setOpen(false)}
        context={context}
        initialTab={initialTab}
      />
    </main>
  );
}
