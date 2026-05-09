'use client';

import { getSessionId } from './session';

export interface CheckoutSummary {
  session_id: string;
  item_count: number;
  subtotal: number;
  shipping: number;
  total: number;
}

export interface ShippingAddressInput {
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  postal_code: string;
  country: string;
}

export interface SaveShippingInput {
  customer_email: string;
  customer_phone: string;
  shipping_address: ShippingAddressInput;
  payment_method: 'pay_on_delivery' | 'card';
}

export interface ConfirmOrderResult {
  order_id: string;
  order_number: string | number;
  total: number;
  status: string;
}

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

export async function initCheckout(): Promise<CheckoutSummary> {
  const session_id = getSessionId();
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'init', session_id }),
  });
  const json = await readJson<{ data: CheckoutSummary }>(response);
  return json.data;
}

export async function saveShipping(input: SaveShippingInput): Promise<void> {
  const session_id = getSessionId();
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'shipping', session_id, ...input }),
  });
  await readJson(response);
}

export async function confirmOrder(): Promise<ConfirmOrderResult> {
  const session_id = getSessionId();
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'confirm', session_id }),
  });
  const json = await readJson<{ data: ConfirmOrderResult }>(response);
  return json.data;
}
