// Beta Sprint 1.3 B11-B12: Admin Order Detail & Status Update API

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// GET /api/admin/orders/[id] - Get order details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get order with items
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        total_amount,
        currency,
        payment_method,
        shipping_address,
        customer_email,
        customer_name,
        customer_phone,
        notes,
        created_at,
        updated_at,
        order_items(
          id,
          product_id,
          quantity,
          price_at_purchase,
          product:products(name_en, image_url)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Order fetch error:', error);
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    if (!order) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: order });
    
  } catch (error) {
    console.error('Admin order GET error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch order' } },
      { status: 500 }
    );
  }
}

// PUT /api/admin/orders/[id] - Update order status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = statusUpdateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 422 }
      );
    }
    
    const { status } = result.data;
    const supabase = await createClient();
    
    // Check if order exists
    const { data: existing, error: checkError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('id', id)
      .single();
    
    if (checkError || !existing) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Order not found' } },
        { status: 404 }
      );
    }
    
    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Order status update error:', error);
      return NextResponse.json(
        { error: { code: 'UPDATE_ERROR', message: error.message } },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data: order,
      message: `Order status updated to ${status}`,
    });
    
  } catch (error) {
    console.error('Admin order PUT error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update order' } },
      { status: 500 }
    );
  }
}
