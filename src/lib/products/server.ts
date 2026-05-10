import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  ProductDetail,
  ProductSummary,
  ProductsListMeta,
} from './types';

const PRODUCT_SUMMARY_FIELDS =
  'id, slug, name_en, name_az, name_ru, price, original_price, stock_available, stock_sold, is_featured, is_on_sale, is_top_rated, rating, review_count, image_url, created_at, category:categories(id, slug, name_en, name_az, name_ru), images:product_images(id, url, alt_text, sort_order, is_primary)';

const PRODUCT_DETAIL_FIELDS = `
  id,
  slug,
  name_en,
  name_az,
  name_ru,
  description_en,
  description_az,
  description_ru,
  price,
  original_price,
  stock_available,
  stock_sold,
  is_featured,
  is_on_sale,
  is_top_rated,
  is_deal_of_day,
  rating,
  review_count,
  image_url,
  created_at,
  updated_at,
  category:categories(id, slug, name_en, name_az, name_ru),
  images:product_images(id, url, alt_text, sort_order, is_primary)
`;

export interface ProductListParams {
  page?: number;
  perPage?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'featured';
}

export interface ProductListResult {
  products: ProductSummary[];
  meta: ProductsListMeta;
  error?: string;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  if (!slug) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('products')
      .select(PRODUCT_DETAIL_FIELDS)
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;
    return data as unknown as ProductDetail;
  } catch {
    return null;
  }
}

export async function listProducts(params: ProductListParams = {}): Promise<ProductListResult> {
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Math.floor(params.perPage ?? 24)));
  const sort = params.sort ?? 'featured';

  const empty: ProductListResult = {
    products: [],
    meta: { page, per_page: perPage, total: 0, total_pages: 0 },
  };

  try {
    const supabase = await createClient();

    let query = supabase
      .from('products')
      .select(PRODUCT_SUMMARY_FIELDS, { count: 'exact' })
      .gt('stock_available', 0);

    if (params.category && params.category !== 'all') {
      const { data: categoryRow } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', params.category)
        .single();

      if (!categoryRow) {
        return empty;
      }

      const { data: childCategories } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', categoryRow.id);

      const categoryIds = [
        categoryRow.id,
        ...((childCategories ?? []).map((c) => c.id) as string[]),
      ];
      query = query.in('category_id', categoryIds);
    }

    if (typeof params.minPrice === 'number') {
      query = query.gte('price', params.minPrice);
    }
    if (typeof params.maxPrice === 'number') {
      query = query.lte('price', params.maxPrice);
    }
    if (params.search) {
      query = query.ilike('name_en', `%${params.search}%`);
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'featured':
      default:
        query = query
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false });
    }

    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data, count, error } = await query;
    if (error) {
      return { ...empty, error: error.message };
    }

    const total = count ?? 0;
    return {
      products: (data ?? []) as unknown as ProductSummary[],
      meta: {
        page,
        per_page: perPage,
        total,
        total_pages: Math.max(1, Math.ceil(total / perPage)),
      },
    };
  } catch (error) {
    return {
      ...empty,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function getCategoryBySlug(slug: string) {
  if (!slug || slug === 'all') return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('categories')
      .select('id, slug, name_en, name_az, name_ru, icon, parent_id, sort_order')
      .eq('slug', slug)
      .single();
    return data ? { ...data, name: data.name_en } : null;
  } catch {
    return null;
  }
}
