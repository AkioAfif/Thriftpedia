// Only invalidate the session which actually sent the rejected request.
export function rejectSession(token) {
  if (typeof window === 'undefined' || !token) return;
  if (window.localStorage.getItem('token') === token) {
    window.dispatchEvent(new window.CustomEvent('auth:unauthorized'));
  }
}
