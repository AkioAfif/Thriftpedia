'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ProductForm, {
  FormError,
  FormLoading,
  FormPageLayout,
} from '@/components/admin/products/ProductForm';
import { useAuth } from '@/context/AuthContext';
import { fetchCategories, fetchProduct, updateProduct } from '@/lib/adminProducts';

export default function EditProductPage() {
  const router = useRouter();
  // Clears token, user and thriftpedia_token together, so the Navbar is logged out too.
  const { logout } = useAuth();
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', product: null, categories: [], error: '' });
  const [attempt, setAttempt] = useState(0);

  const handleAuthError = useCallback(
    (err) => {
      if (err?.status === 401) {
        logout();
        router.replace('/login');
        return true;
      }
      return false;
    },
    [router, logout]
  );

  useEffect(() => {
    let active = true;

    Promise.all([fetchProduct(id), fetchCategories()])
      .then(([product, categories]) => {
        if (active) setState({ status: 'ready', product, categories, error: '' });
      })
      .catch((err) => {
        if (!active || handleAuthError(err)) return;
        const message = err?.status === 404 ? 'This product no longer exists.' : err.message;
        setState({ status: 'error', product: null, categories: [], error: message });
      });

    return () => {
      active = false;
    };
  }, [id, attempt, handleAuthError]);

  function retry() {
    setState({ status: 'loading', product: null, categories: [], error: '' });
    setAttempt((n) => n + 1);
  }

  async function handleSubmit(payload) {
    await updateProduct(id, payload);
    toast.success('Product updated');
    router.push('/admin/products');
  }

  return (
    <FormPageLayout title="Edit Product">
      {state.status === 'loading' && <FormLoading />}
      {state.status === 'error' && <FormError message={state.error} onRetry={retry} />}
      {state.status === 'ready' && (
        <ProductForm
          key={state.product?._id}
          mode="edit"
          product={state.product}
          categories={state.categories}
          onSubmit={handleSubmit}
          onAuthError={handleAuthError}
        />
      )}
    </FormPageLayout>
  );
}