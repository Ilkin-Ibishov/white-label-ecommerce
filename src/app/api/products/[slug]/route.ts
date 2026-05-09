// Beta Agent - Task B4: Product Detail API
// Sprint 1.1 | Single product by slug

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const paramsSchema = z.object({
  slug: z.string().min(1).max(255),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Validate slug
    const result = paramsSchema.safeParse({ slug });
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid product slug' } },
        { status: 422 }
      );
    }
    
    const supabase = await createClient();
    
    // Fetch product with category and images
    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
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
      `
      )
      .eq('slug', slug)
      .eq('status', 'active')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Product not found' } },
          { status: 404 }
        );
      }
      
      console.error('Product detail error:', error);
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch product' } },
        { status: 500 }
      );
    }
    
    // Get related products (same category, excluding current)
    let relatedProducts: any[] = [];
    if (product.category && (product.category as any).id) {
      const categoryId = (product.category as any).id;
      const { data: related } = await supabase
        .from('products')
        .select('id, slug, title, price_cents')
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .neq('id', product.id)
        .limit(4);
      
      relatedProducts = related || [];
    }
    
    return NextResponse.json(
      {
        data: {
          ...product,
          related_products: relatedProducts,
        },
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Product detail API error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
