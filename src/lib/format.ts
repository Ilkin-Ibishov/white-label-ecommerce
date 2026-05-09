import { storeConfig } from '../../config/store.config';

/**
 * Format a price (in cents/minor units) into a localized string with the
 * configured currency symbol. Falls back to a simple "₼ X.XX" rendering when
 * `Intl.NumberFormat` rejects the configured currency code.
 */
export function formatPriceCents(cents: number | null | undefined): string {
  const safe = typeof cents === 'number' && Number.isFinite(cents) ? cents : 0;
  const value = safe / 100;
  const { code, symbol } = storeConfig.currency;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).format(value);
  } catch {
    return `${symbol}${value.toFixed(2)}`;
  }
}

/**
 * Format a numeric (major-unit) price. Useful for APIs that already return
 * normalized totals in major units (e.g. `total: 199.99`).
 */
export function formatPrice(amount: number | null | undefined): string {
  const cents = typeof amount === 'number' && Number.isFinite(amount)
    ? Math.round(amount * 100)
    : 0;
  return formatPriceCents(cents);
}
