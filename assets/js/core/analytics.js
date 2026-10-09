// GA4 / Meta pixel hook. Events queue here until a tag manager reads them.
// Guarded so section modules stay importable outside the browser (pre-rendering).
export function track(event, data = {}) {
  if (typeof window === 'undefined') return;
  (window.dataLayer = window.dataLayer || []).push({ event, ...data });
}
