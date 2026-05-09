'use client';

const STORAGE_KEY = 'cart_session';

/**
 * Get (or lazily create) the per-browser cart session id used by Alpha's
 * cart/checkout APIs. Always invoked from the client; returns an empty string
 * during SSR so callers can detect "not ready yet" without throwing.
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  try {
    let sessionId = window.localStorage.getItem(STORAGE_KEY);
    if (!sessionId) {
      sessionId = generateUuid();
      window.localStorage.setItem(STORAGE_KEY, sessionId);
    }
    return sessionId;
  } catch {
    // localStorage can throw in private mode / when storage is full. Fall back
    // to a per-page-load id so the app keeps working (cart will be ephemeral).
    return generateUuid();
  }
}

export function clearSessionId(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for older runtimes (tests, very old browsers).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
