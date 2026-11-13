// Hosts that next/image may optimise. Mirrors images.remotePatterns in next.config.mjs:
// next/image throws (not onError) for any other host, so those URLs render `unoptimized`
// and still fall back gracefully when they fail to load.
const OPTIMIZED_HOSTS = [
  { protocol: 'https:', hostname: 'res.cloudinary.com' },
  { protocol: 'https:', hostname: 'placehold.co' },
  { protocol: 'https:', hostname: 'lh3.googleusercontent.com' },
  { protocol: 'https:', hostname: 'example.com' },
  { protocol: 'http:', hostname: 'localhost', port: '5000', pathPrefix: '/uploads/' },
  { protocol: 'http:', hostname: 'localhost', port: '3000', pathPrefix: '/uploads/' },
];

export function canOptimizeImage(src) {
  if (typeof src !== 'string' || src.length === 0) return false;
  if (src.startsWith('/') && !src.startsWith('//')) return true; // same-origin path
  let url;
  try {
    url = new URL(src);
  } catch {
    return false;
  }
  return OPTIMIZED_HOSTS.some(
    (h) =>
      h.protocol === url.protocol &&
      h.hostname === url.hostname &&
      (h.port === undefined || h.port === url.port) &&
      (h.pathPrefix === undefined || url.pathname.startsWith(h.pathPrefix))
  );
}
