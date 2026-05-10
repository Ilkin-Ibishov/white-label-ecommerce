// Alpha Sprint 1.3 A16: Admin Categories CRUD API
// GET - List all, POST - Create, PUT - Update, DELETE - Remove

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const categorySchema = z.object({
  name_en: z.string().min(1),
  name_az: z.string().optional(),
  name_ru: z.string().optional(),
  description_en: z.string().optional(),
  description_az: z.string().optional(),
  description_ru: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().default(0),
});

// GET /api/admin/categories - List all categories
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, name_en, name_az, name_ru, description_en, parent_id, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('name_en', { ascending: true });
    
    if (error) {
      console.error('Categories fetch error:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data });
    
  } catch (error) {
    console.error('Admin categories GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch categories' } },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Create category
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = categorySchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    const data = result.data;
    const supabase = await createClient();
    
    // Generate slug
    const slug = data.name_en
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({ ...data, slug })
      .select()
      .single();
    
    if (error) {
      console.error('Category create error:', error);
      return NextResponse.json(
        { error: { code: 'CREATE_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: category, message: 'Category created successfully' }, { status: 201 });
    
  } catch (error) {
    console.error('Admin categories POST error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create category' } },
      { status: 500 }
    );
  }
}
