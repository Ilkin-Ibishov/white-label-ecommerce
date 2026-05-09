import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  ProductDetail,
  ProductSummary,
  ProductsListMeta,
} from './types';

const PRODUCT_SUMMARY_FIELDS =
  'id, slug, title, short_description, price_cents, compare_at_price_cents, inventory_count, is_featured, status, created_at, category:categories(id, slug, name), images:product_images(id, url, alt_text, sort_order, is_primary)';

const PRODUCT_DETAIL_FIELDS = `
  id,
  slug,
  title,
  description,
  short_description,
  price_cents,
  compare_at_price_cents,
  inventory_count,
  inventory_track,
  weight_grams,
  is_featured,
  status,
  seo_title,
  seo_description,
  created_at,
  updated_at,
  category:categories(id, slug, name, description),
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
      .eq('status', 'active');

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
      query = query.gte('price_cents', params.minPrice);
    }
    if (typeof params.maxPrice === 'number') {
      query = query.lte('price_cents', params.maxPrice);
    }
    if (params.search) {
      query = query.ilike('title', `%${params.search}%`);
    }

    switch (sort) {
      case 'price_asc':
        query = query.order('price_cents', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price_cents', { ascending: false });
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
      .select('id, slug, name, description')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    return data ?? null;
  } catch {
    return null;
  }
}
