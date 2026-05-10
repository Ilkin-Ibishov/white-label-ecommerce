// Beta Agent - Task B4: Products List API
// Sprint 1.1 | Paginated list with filters (category, price, search)

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(24),
  category: z.string().optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  search: z.string().max(100).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'featured']).default('featured'),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query = {
      page: searchParams.get('page') || '1',
      per_page: searchParams.get('per_page') || '24',
      category: searchParams.get('category') || undefined,
      min_price: searchParams.get('min_price') || undefined,
      max_price: searchParams.get('max_price') || undefined,
      search: searchParams.get('search') || undefined,
      sort: searchParams.get('sort') || 'featured',
    };
    
    const result = querySchema.safeParse(query);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    const { page, per_page, category, min_price, max_price, search, sort } = result.data;
    
    const supabase = await createClient();
    
    // Build query - using actual DB schema
    let dbQuery = supabase
      .from('products')
      .select(
        'id, slug, name_en, description_en, price, original_price, stock_available, is_featured, is_on_sale, created_at, category:categories(id, slug, name_en), image_url',
        { count: 'exact' }
      );
    
    // Apply category filter
    if (category) {
      // Join with categories to filter by category slug
      const { data: categoryData } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single();
      
      if (categoryData) {
        // Get all child category IDs for hierarchical filtering
        const { data: childCategories } = await supabase
          .from('categories')
          .select('id')
          .eq('parent_id', categoryData.id);
        
        const categoryIds = [categoryData.id, ...(childCategories?.map(c => c.id) || [])];
        dbQuery = dbQuery.in('category_id', categoryIds);
      }
    }
    
    // Apply price filters (convert dollars to cents)
    if (min_price !== undefined) {
      dbQuery = dbQuery.gte('price', min_price / 100);
    }
    if (max_price !== undefined) {
      dbQuery = dbQuery.lte('price', max_price / 100);
    }
    
    // Apply search filter
    if (search) {
      dbQuery = dbQuery.ilike('name_en', `%${search}%`);
    }
    
    // Apply sorting
    switch (sort) {
      case 'price_asc':
        dbQuery = dbQuery.order('price', { ascending: true });
        break;
      case 'price_desc':
        dbQuery = dbQuery.order('price', { ascending: false });
        break;
      case 'newest':
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
      case 'featured':
      default:
        dbQuery = dbQuery.order('is_featured', { ascending: false });
        dbQuery = dbQuery.order('created_at', { ascending: false });
        break;
    }
    
    // Apply pagination
    const from = (page - 1) * per_page;
    dbQuery = dbQuery.range(from, from + per_page - 1);
    
    // Execute query
    const { data, error, count } = await dbQuery;
    
    if (error) {
      console.error('Products query error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
        { status: 500 }
      );
    }
    
    const total = count || 0;
    const totalPages = Math.ceil(total / per_page);
    
    return NextResponse.json(
      {
        data: data || [],
        meta: {
          page,
          per_page,
          total,
          total_pages: totalPages,
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
