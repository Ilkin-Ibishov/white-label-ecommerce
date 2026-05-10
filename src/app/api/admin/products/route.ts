// Alpha Sprint 1.3 A12-A13: Admin Products API
// GET - List products with filters, POST - Create new product

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  per_page: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category_id: z.string().uuid().optional(),
  stock_status: z.enum(['in_stock', 'low_stock', 'out_of_stock']).optional(),
  is_featured: z.coerce.boolean().optional(),
  sort_by: z.enum(['name', 'price', 'stock', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

const createSchema = z.object({
  name_en: z.string().min(1),
  name_az: z.string().optional(),
  name_ru: z.string().optional(),
  description_en: z.string().optional(),
  description_az: z.string().optional(),
  description_ru: z.string().optional(),
  price: z.number().positive(),
  original_price: z.number().positive().optional(),
  stock_available: z.number().int().min(0).default(0),
  category_id: z.string().uuid().optional(),
  is_featured: z.boolean().default(false),
  is_on_sale: z.boolean().default(false),
  image_url: z.string().optional(),
  image_gallery: z.array(z.string()).default([]),
});

// GET /api/admin/products - List products
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const result = querySchema.safeParse(params);
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    const { page, per_page, search, category_id, stock_status, is_featured, sort_by, sort_order } = result.data;
    
    const supabase = await createClient();
    
    // Build query
    let query = supabase
      .from('products')
      .select(
        'id, name_en, name_az, name_ru, price, original_price, stock_available, is_featured, is_on_sale, created_at, slug, category:categories(id, name_en), image_url',
        { count: 'exact' }
      );
    
    // Apply filters
    if (search) {
      query = query.ilike('name_en', `%${search}%`);
    }
    
    if (category_id) {
      query = query.eq('category_id', category_id);
    }
    
    if (is_featured !== undefined) {
      query = query.eq('is_featured', is_featured);
    }
    
    // Stock status filter
    if (stock_status) {
      switch (stock_status) {
        case 'in_stock':
          query = query.gt('stock_available', 10);
          break;
        case 'low_stock':
          query = query.lte('stock_available', 10).gt('stock_available', 0);
          break;
        case 'out_of_stock':
          query = query.eq('stock_available', 0);
          break;
      }
    }
    
    // Apply sorting
    const sortColumn = sort_by === 'name' ? 'name_en' : 
                       sort_by === 'stock' ? 'stock_available' : 
                       sort_by;
    query = query.order(sortColumn, { ascending: sort_order === 'asc' });
    
    // Pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Admin products fetch error:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data,
      meta: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      },
    });
    
  } catch (error) {
    console.error('Admin products GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch products' } },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create product
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = createSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    const data = result.data;
    const supabase = await createClient();
    
    // Generate slug from name_en
    const slug = data.name_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);
    
    const admin = createAdminClient();
    
    // Create product
    const { data: product, error } = await admin
      .from('products')
      .insert({
        ...data,
        slug,
        image_gallery: data.image_gallery || [],
      })
      .select()
      .single();
    
    if (error) {
      console.error('Product create error:', error);
      return NextResponse.json(
        { error: { code: 'CREATE_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: product, message: 'Product created successfully' }, { status: 201 });
    
  } catch (error) {
    console.error('Admin products POST error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' } },
      { status: 500 }
    );
  }
}
