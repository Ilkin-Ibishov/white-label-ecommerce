// Alpha Sprint 1.2 A8: Cart API
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const addSchema = z.object({
  session_id: z.string().min(1),
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).default(1),
});

const updateSchema = z.object({
  session_id: z.string().min(1),
  cart_item_id: z.string().uuid(),
  quantity: z.number().int().min(0),
});

// GET /api/cart?session_id=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    
    if (!session_id) {
      return NextResponse.json({ error: { code: 'MISSING_SESSION', message: 'Session ID required' } }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    // Get cart items with product details
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        quantity,
        product:products(id, name_en, price, image_url)
      `)
      .eq('session_id', session_id)
      .order('added_at', { ascending: false });
    
    if (error) throw error;
    
    // Calculate total
    const total = data?.reduce((sum, item: any) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0) || 0;
    
    return NextResponse.json({
      data: {
        items: data || [],
        total: Math.round(total * 100) / 100,
        count: data?.length || 0,
      }
    });
    
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch cart' } }, { status: 500 });
  }
}

// POST /api/cart/add
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = addSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } }, { status: 422 });
    }
    
    const { session_id, product_id, quantity } = result.data;
    const supabase = await createClient();
    
    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, stock_available')
      .eq('id', product_id)
      .single();
    
    if (productError) {
      console.error('Product lookup error:', productError);
      return NextResponse.json({ error: { code: 'PRODUCT_ERROR', message: productError.message } }, { status: 500 });
    }
    
    if (!product) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Product not found' } }, { status: 404 });
    }
    
    if (product.stock_available < quantity) {
      return NextResponse.json({ error: { code: 'INSUFFICIENT_STOCK', message: 'Not enough stock available' } }, { status: 400 });
    }
    
    // Check if already in cart
    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('session_id', session_id)
      .eq('product_id', product_id)
      .single();
    
    if (existing) {
      // Update quantity
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        console.error('Cart update error:', error);
        return NextResponse.json({ error: { code: 'UPDATE_ERROR', message: error.message } }, { status: 500 });
      }
      return NextResponse.json({ data, message: 'Quantity updated' });
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('cart_items')
        .insert({ session_id, product_id, quantity })
        .select()
        .single();
      
      if (error) {
        console.error('Cart insert error:', error);
        return NextResponse.json({ error: { code: 'INSERT_ERROR', message: error.message } }, { status: 500 });
      }
      return NextResponse.json({ data, message: 'Added to cart' }, { status: 201 });
    }
    
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to add to cart' } }, { status: 500 });
  }
}

// PUT /api/cart/update
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = updateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } }, { status: 422 });
    }
    
    const { session_id, cart_item_id, quantity } = result.data;
    const supabase = await createClient();
    
    if (quantity === 0) {
      // Remove item
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cart_item_id)
        .eq('session_id', session_id);
      
      if (error) throw error;
      return NextResponse.json({ message: 'Item removed' });
    }
    
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', cart_item_id)
      .eq('session_id', session_id)
      .select()
      .single();
    
    if (error) throw error;
    return NextResponse.json({ data, message: 'Quantity updated' });
    
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update cart' } }, { status: 500 });
  }
}

// DELETE /api/cart/remove
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const session_id = searchParams.get('session_id');
    const cart_item_id = searchParams.get('cart_item_id');
    
    if (!session_id || !cart_item_id) {
      return NextResponse.json({ error: { code: 'MISSING_PARAMS', message: 'Session ID and Cart Item ID required' } }, { status: 400 });
    }
    
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cart_item_id)
      .eq('session_id', session_id);
    
    if (error) throw error;
    
    return NextResponse.json({ message: 'Item removed' });
    
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to remove item' } }, { status: 500 });
  }
}
