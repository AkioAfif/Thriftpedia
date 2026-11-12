'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ProductForm, {
  FormError,
  FormLoading,
  FormPageLayout,
} from '@/components/admin/products/ProductForm';
import { clearToken } from '@/lib/adminAuth';
import { createProduct, fetchCategories } from '@/lib/adminProducts';

export default function NewProductPage() {
  const router = useRouter();
  const [state, setState] = useState({ status: 'loading', categories: [], error: '' });
  const [attempt, setAttempt] = useState(0);

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status === 401) {
        clearToken();
        router.replace('/login');
        return true;
      }
      return false;
    },
    [router]
  );

  useEffect(() => {
    let active = true;

    fetchCategories()
      .then((categories) => {
        if (active) setState({ status: 'ready', categories, error: '' });
      })
      .catch((err) => {
        if (!active || handleAuthError(err)) return;
        setState({ status: 'error', categories: [], error: err.message });
      });

    return () => {
      active = false;
    };
  }, [attempt, handleAuthError]);

  function retry() {
    setState({ status: 'loading', categories: [], error: '' });
    setAttempt((n) => n + 1);
  }

  async function handleSubmit(payload) {
    await createProduct(payload);
    toast.success('Product added');
    router.push('/admin/products');
  }

  return (
    <FormPageLayout title="Add Product">
      {state.status === 'loading' && <FormLoading />}
      {state.status === 'error' && <FormError message={state.error} onRetry={retry} />}
      {state.status === 'ready' && (
        <ProductForm
          mode="create"
          product={null}
          categories={state.categories}
          onSubmit={handleSubmit}
          onAuthError={handleAuthError}
        />
      )}
    </FormPageLayout>
  );
}