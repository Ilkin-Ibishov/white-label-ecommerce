// Alpha Sprint 1.3 A16: Admin Category Update/Delete API

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const updateSchema = z.object({
  name_en: z.string().min(1).optional(),
  name_az: z.string().optional(),
  name_ru: z.string().optional(),
  description_en: z.string().optional(),
  description_az: z.string().optional(),
  description_ru: z.string().optional(),
  parent_id: z.string().uuid().optional().nullable(),
  sort_order: z.number().int().optional(),
});

// PUT /api/admin/categories/[id] - Update category
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    const data = result.data;
    const supabase = await createClient();
    
    // Check if category exists
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError || !existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }
    
    // Update category
    const admin = createAdminClient();
    const { data: category, error } = await admin
      .from('categories')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Category update error:', error);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: category, message: 'Category updated successfully' });
    
  } catch (error) {
    console.error('Admin categories PUT error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update category' } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories/[id] - Delete category
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check if category exists
    const { data: existing, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError || !existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Category not found' } },
        { status: 404 }
      );
    }
    
    // Check if category has products
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);
    
    if (countError) {
      console.error('Product count error:', countError);
    }
    
    if (count && count > 0) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Cannot delete category with existing products' } },
        { status: 409 }
      );
    }
    
    // Delete category
    const admin = createAdminClient();
    const { error } = await admin
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Category delete error:', error);
      return NextResponse.json(
        { error: { code: 'DELETE_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Category deleted successfully' });
    
  } catch (error) {
    console.error('Admin categories DELETE error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete category' } },
      { status: 500 }
    );
  }
}
