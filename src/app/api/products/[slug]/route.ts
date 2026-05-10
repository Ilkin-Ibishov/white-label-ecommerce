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
    
    // Fetch product (live schema) - separate queries to avoid join issues
    const { data: product, error } = await supabase
      .from('products')
      .select(
        `
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
        is_featured,
        is_on_sale,
        is_top_rated,
        is_deal_of_day,
        rating,
        review_count,
        image_url,
        created_at,
        updated_at,
        category_id
      `
      )
      .eq('slug', slug)
      .gt('stock_available', 0)
      .single();
    
    if (error) {
      console.error('Product detail query error:', JSON.stringify(error));
      if (error.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Product not found' } },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to fetch product' } },
        { status: 500 }
      );
    }
    
    // Fetch category separately
    let category = null;
    if (product.category_id) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id, slug, name_en, name_az, name_ru')
        .eq('id', product.category_id)
        .single();
      category = cat;
    }

    // Fetch product images separately
    const { data: images } = await supabase
      .from('product_images')
      .select('id, url, alt_text, sort_order, is_primary')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true });

    // Get related products (same category, excluding current)
    let relatedProducts: any[] = [];
    if (product.category_id) {
      const { data: related } = await supabase
        .from('products')
        .select('id, slug, name_en, price')
        .eq('category_id', product.category_id)
        .gt('stock_available', 0)
        .neq('id', product.id)
        .limit(4);
      
      relatedProducts = related || [];
    }
    
    return NextResponse.json(
      {
        data: {
          ...product,
          category,
          images: images || [],
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
