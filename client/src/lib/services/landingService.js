import { apiClient } from '../api';
import { getPhotoSrc } from '../adminProducts';

// Landing data is cached and refreshed every 60 seconds (ISR).
const REVALIDATE = { next: { revalidate: 60 } };

export const LANDING_CATEGORY_SLUGS = ['jackets', 'hats', 'accessories', 'tops', 'knitwear', 'pants'];

async function fetchProducts(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await apiClient(`/products?${qs}`, REVALIDATE);
  return Array.isArray(res?.data) ? res.data : [];
}

const withPhoto = (product) => getPhotoSrc(product) !== '';

// Each section resolves on its own: { ok: true, items } or { ok: false, items: [] }.
async function settle(promise) {
  try {
    return { ok: true, items: await promise };
  } catch {
    return { ok: false, items: [] };
  }
}

// Hero: the three newest AVAILABLE pieces that have a first photo.
function getHeroProducts() {
  return fetchProducts({ status: 'AVAILABLE', sort: 'newest', limit: '12' }).then((list) =>
    list.filter(withPhoto).slice(0, 3)
  );
}

function getNewArrivals() {
  return fetchProducts({ sort: 'newest', limit: '4' });
}

// First photo of the newest product in a category that has one, or '' when none does.
async function getCategoryPhoto(slug) {
  const list = await fetchProducts({ category: slug, sort: 'newest', limit: '3' });
  const product = list.find(withPhoto);
  return product ? { src: getPhotoSrc(product), alt: product.name || slug } : null;
}

export async function getLandingData() {
  const [hero, arrivals, ...categoryResults] = await Promise.all([
    settle(getHeroProducts()),
    settle(getNewArrivals()),
    ...LANDING_CATEGORY_SLUGS.map((slug) => settle(getCategoryPhoto(slug))),
  ]);

  const categoryPhotos = Object.fromEntries(
    LANDING_CATEGORY_SLUGS.map((slug, i) => [slug, categoryResults[i].ok ? categoryResults[i].items : null])
  );

  return { hero, arrivals, categoryPhotos };
}
