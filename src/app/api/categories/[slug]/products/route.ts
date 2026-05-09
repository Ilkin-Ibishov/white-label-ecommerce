// Beta Agent - Task B4: Products by Category API
// Sprint 1.1 | List products for a specific category (including children)

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const paramsSchema = z.object({
  slug: z.string().min(1).max(255),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(24),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'featured']).default('featured'),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Validate slug
    const paramsResult = paramsSchema.safeParse({ slug });
    if (!paramsResult.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid category slug' } },
        { status: 422 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query = {
      page: searchParams.get('page') || '1',
      per_page: searchParams.get('per_page') || '24',
      sort: searchParams.get('sort') || 'featured',
    };
    
    const queryResult = querySchema.safeParse(query);
    if (!queryResult.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: queryResult.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    const { page, per_page, sort } = queryResult.data;
    
    const supabase = await createClient();
    
    // Get category by slug
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('id, slug, name, description, parent_id')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    
    if (catError || !category) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }
    
    // Get all child category IDs (recursive)
    const getAllCategoryIds = async (parentId: string): Promise<string[]> => {
      const ids = [parentId];
      const { data: children } = await supabase
        .from('categories')
        .select('id')
        .eq('parent_id', parentId)
        .eq('is_active', true);
      
      if (children && children.length > 0) {
        for (const child of children) {
          const childIds = await getAllCategoryIds(child.id);
          ids.push(...childIds);
        }
      }
      
      return ids;
    };
    
    const categoryIds = await getAllCategoryIds(category.id);
    
    // Build products query
    let dbQuery = supabase
      .from('products')
      .select(
        'id, slug, title, short_description, price_cents, compare_at_price_cents, inventory_count, is_featured, status, created_at, category:categories(id, slug, name), images:product_images(url, alt_text, is_primary)',
        { count: 'exact' }
      )
      .in('category_id', categoryIds)
      .eq('status', 'active');
    
    // Apply sorting
    switch (sort) {
      case 'price_asc':
        dbQuery = dbQuery.order('price_cents', { ascending: true });
        break;
      case 'price_desc':
        dbQuery = dbQuery.order('price_cents', { ascending: false });
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
      console.error('Category products query error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
        { status: 500 }
      );
    }
    
    const total = count || 0;
    const totalPages = Math.ceil(total / per_page);
    
    return NextResponse.json(
      {
        data: {
          category: {
            id: category.id,
            slug: category.slug,
            name: category.name,
            description: category.description,
          },
          products: data || [],
        },
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
    console.error('Category products API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
