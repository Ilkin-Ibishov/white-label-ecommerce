'use client';

/**
 * Lightweight event bus used by client islands (e.g. Add-to-Cart button on the
 * product detail page) to tell the header cart component to refetch. We keep
 * it standalone so we don't have to wire a TanStack Query provider through the
 * whole app for a single counter.
 */
const EVENT_NAME = 'cart:changed';

export function emitCartChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function onCartChanged(handler: () => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = () => handler();
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
