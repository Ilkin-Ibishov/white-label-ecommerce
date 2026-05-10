// Alpha Sprint 1.3 A14-A15: Admin Product Update/Delete API
// PUT - Update product, DELETE - Remove product

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const updateSchema = z.object({
  name_en: z.string().min(1).optional(),
  name_az: z.string().optional(),
  name_ru: z.string().optional(),
  description_en: z.string().optional(),
  description_az: z.string().optional(),
  description_ru: z.string().optional(),
  price: z.number().positive().optional(),
  original_price: z.number().positive().optional(),
  stock_available: z.number().int().min(0).optional(),
  category_id: z.string().uuid().optional().nullable(),
  is_featured: z.boolean().optional(),
  is_on_sale: z.boolean().optional(),
  image_url: z.string().optional(),
  image_gallery: z.array(z.string()).optional(),
});

// PUT /api/admin/products/[id] - Update product
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
    
    // Check if product exists
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError || !existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }
    
    // Update product
    const { data: product, error } = await supabase
      .from('products')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Product update error:', error);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data: product, message: 'Product updated successfully' });
    
  } catch (error) {
    console.error('Admin products PUT error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update product' } },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Check if product exists
    const { data: existing, error: checkError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .single();
    
    if (checkError || !existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Product not found' } },
        { status: 404 }
      );
    }
    
    // Remove from cart_items first (cascade)
    await supabase.from('cart_items').delete().eq('product_id', id);
    
    // Delete product
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Product delete error:', error);
      return NextResponse.json(
        { error: { code: 'DELETE_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ message: 'Product deleted successfully' });
    
  } catch (error) {
    console.error('Admin products DELETE error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete product' } },
      { status: 500 }
    );
  }
}
