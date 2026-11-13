import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/services/orderService';
import { ProductDetail } from '@/components/catalog/ProductDetail';

export default async function ProductPage({ params }) {
  const { productId } = await params;
  if (!/^[a-f\d]{24}$/i.test(productId)) notFound();
  let product;
  try { product = await getProduct(productId); }
  catch (error) { if (error.status === 404) notFound(); throw error; }
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
