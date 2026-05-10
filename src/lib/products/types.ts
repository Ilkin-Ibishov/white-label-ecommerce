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
  name_en: string;
  name_az: string;
  name_ru: string;
  name?: string; // Computed from name_en for convenience
  icon?: string | null;
  parent_id?: string | null;
  sort_order?: number;
}

export interface ProductSummary {
  id: string;
  slug: string;
  name_en: string;
  name_az?: string | null;
  name_ru?: string | null;
  // Legacy aliases for compatibility
  title?: string;
  short_description?: string | null;
  description_en?: string | null;
  price: number;
  original_price?: number | null;
  // Legacy price aliases
  price_cents?: number;
  compare_at_price_cents?: number | null;
  stock_available: number;
  stock_sold?: number;
  // Legacy inventory alias
  inventory_count?: number;
  is_featured?: boolean;
  is_on_sale?: boolean;
  is_top_rated?: boolean;
  is_deal_of_day?: boolean;
  rating?: number;
  review_count?: number;
  image_url?: string | null;
  images?: ProductImage[] | null;
  category?: ProductCategory | null;
  created_at?: string;
}

export interface ProductDetail extends ProductSummary {
  description_az?: string | null;
  description_ru?: string | null;
  related_products?: Array<Pick<ProductSummary, 'id' | 'slug' | 'name_en' | 'price'>>;
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
