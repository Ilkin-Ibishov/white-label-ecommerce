'use client';

import { getSessionId } from './session';
import { normalizeCart, type CartSummary } from './types';

async function readJson<T>(response: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    /* ignore */
  }

  if (!response.ok) {
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message ??
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as T;
}

export async function fetchCart(signal?: AbortSignal): Promise<CartSummary> {
  const sessionId = getSessionId();
  if (!sessionId) {
    return { items: [], totalCents: 0, count: 0, unitCount: 0 };
  }

  const response = await fetch(
    `/api/cart?session_id=${encodeURIComponent(sessionId)}`,
    { signal, cache: 'no-store' }
  );

  // Treat 4xx (e.g. missing session) as empty cart rather than crashing the UI.
  if (response.status >= 400 && response.status < 500) {
    return { items: [], totalCents: 0, count: 0, unitCount: 0 };
  }

  const json = await readJson<unknown>(response);
  return normalizeCart(json as Parameters<typeof normalizeCart>[0]);
}

export async function addToCart(productId: string, quantity = 1): Promise<void> {
  const sessionId = getSessionId();
  const response = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, product_id: productId, quantity }),
  });
  await readJson(response);
}

export async function updateCartItem(cartItemId: string, quantity: number): Promise<void> {
  const sessionId = getSessionId();
  const response = await fetch('/api/cart', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, cart_item_id: cartItemId, quantity }),
  });
  await readJson(response);
}

export async function removeCartItem(cartItemId: string): Promise<void> {
  // The cart API treats `quantity: 0` as removal.
  await updateCartItem(cartItemId, 0);
}
