export interface ProductImage {
  id?: string;
  url: string;
  alt_text?: string | null;
  sort_order?: number | null;
  is_primary?: boolean | null;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
}

export interface ProductSummary {
  id: string;
  slug: string;
  title: string;
  short_description?: string | null;
  price_cents: number;
  compare_at_price_cents?: number | null;
  inventory_count?: number | null;
  is_featured?: boolean | null;
  status?: string;
  images?: ProductImage[] | null;
  category?: ProductCategory | null;
}

export interface ProductDetail extends ProductSummary {
  description?: string | null;
  inventory_track?: boolean | null;
  weight_grams?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  related_products?: Array<Pick<ProductSummary, 'id' | 'slug' | 'title' | 'price_cents'>>;
}

export interface ProductsListMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ProductsListResponse {
  data: ProductSummary[];
  meta: ProductsListMeta;
}

export interface ProductDetailResponse {
  data: ProductDetail;
}

export function getPrimaryImage(images: ProductImage[] | null | undefined): ProductImage | null {
  if (!images?.length) return null;
  const primary = images.find((img) => img.is_primary);
  if (primary) return primary;
  const sorted = [...images].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );
  return sorted[0] ?? null;
}
