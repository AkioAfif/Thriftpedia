// Turns a `?from=` value into a safe in-app back link. Only same-site paths are accepted:
// a string that starts with "/" (not "//"), has no backslash, whitespace or control
// characters, and is at most 200 characters. Anything else falls back.
const MAX_FROM = 200;

function isSafePath(from) {
  return (
    typeof from === 'string' &&
    from.length > 0 &&
    from.length <= MAX_FROM &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !from.includes('\\') &&
    !/[\s\u0000-\u001F\u007F]/.test(from)
  );
}

/**
 * @param {string | null | undefined} from  raw ?from= value (already URL-decoded)
 * @param {string} fallback  href used when `from` is missing or unsafe (last catalog URL)
 * @returns {{ href: string, label: string }}
 */
export function resolveBack(from, fallback = '/catalog') {
  const fallbackBack = { href: fallback, label: 'Back to catalog' };
  if (!isSafePath(from)) return fallbackBack;

  const path = from.split(/[?#]/)[0];
  if (/^\/orders\/[A-Za-z0-9_-]+$/.test(path)) return { href: path, label: 'Back to order' };
  if (path === '/orders') return { href: from, label: 'Back to my orders' };
  if (path === '/wishlist') return { href: '/wishlist', label: 'Back to wishlist' };
  if (path === '/catalog' || path.startsWith('/catalog/')) return { href: from, label: 'Back to catalog' };
  return fallbackBack;
}

// "/catalog/<id>?from=<current path>": product links that should lead back here.
export const productHrefFrom = (productId, fromPath) =>
  `/catalog/${encodeURIComponent(productId)}?from=${encodeURIComponent(fromPath)}`;
