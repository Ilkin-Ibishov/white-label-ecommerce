/**
 * Normalized cart line item used by the Gamma UI. The Alpha cart API references
 * legacy `products` columns (`name_en`, `price`, `image_url`) that do not exist
 * in Beta's actual schema (`title`, `price_cents`, separate `product_images`
 * table). This type lets the UI work against either response shape.
 */
export interface CartProduct {
  id: string;
  slug?: string | null;
  title: string;
  priceCents: number;
  imageUrl: string | null;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: CartProduct;
}

export interface CartSummary {
  items: CartItem[];
  totalCents: number;
  /** Number of distinct line items (not summed quantity). */
  count: number;
  /** Sum of all line-item quantities. */
  unitCount: number;
}

interface RawProductImage {
  url?: string | null;
  is_primary?: boolean | null;
}

interface RawProduct {
  id?: string;
  slug?: string | null;
  title?: string | null;
  name_en?: string | null;
  name?: string | null;
  price_cents?: number | null;
  price?: number | null;
  image_url?: string | null;
  images?: RawProductImage[] | null;
}

interface RawCartItem {
  id?: string;
  quantity?: number;
  product?: RawProduct | null;
}

interface RawCartResponse {
  data?: {
    items?: RawCartItem[] | null;
    total?: number | null;
    count?: number | null;
  } | null;
}

export function normalizeCart(raw: RawCartResponse | null | undefined): CartSummary {
  const rawItems = raw?.data?.items ?? [];
  const items: CartItem[] = rawItems
    .map((item) => normalizeItem(item))
    .filter((item): item is CartItem => item !== null);

  const totalCents = items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0
  );
  const unitCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    totalCents,
    count: items.length,
    unitCount,
  };
}

function normalizeItem(raw: RawCartItem): CartItem | null {
  if (!raw?.id || !raw?.product) return null;
  const quantity = typeof raw.quantity === 'number' ? raw.quantity : 0;
  if (quantity <= 0) return null;

  return {
    id: raw.id,
    quantity,
    product: normalizeProduct(raw.product),
  };
}

function normalizeProduct(raw: RawProduct): CartProduct {
  const title = raw.title ?? raw.name_en ?? raw.name ?? 'Product';
  const priceCents =
    typeof raw.price_cents === 'number'
      ? raw.price_cents
      : typeof raw.price === 'number'
        ? Math.round(raw.price * 100)
        : 0;

  const primaryImage = raw.images?.find((img) => img?.is_primary)?.url;
  const firstImage = raw.images?.[0]?.url;
  const imageUrl = primaryImage ?? firstImage ?? raw.image_url ?? null;

  return {
    id: raw.id ?? '',
    slug: raw.slug ?? null,
    title,
    priceCents,
    imageUrl,
  };
}
