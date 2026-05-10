// Beta Sprint 1.2 B8: Orders API
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
});

// GET /api/orders?email=xxx or /api/orders (admin)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const order_number = searchParams.get('order_number');
    
    const supabase = await createClient();
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });
    
    if (order_number) {
      query = query.eq('order_number', order_number);
    } else if (email) {
      query = query.eq('customer_email', email);
    }
    
    // Limit to recent orders
    query = query.limit(50);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return NextResponse.json({ data: data || [] });
    
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } }, { status: 500 });
  }
}

// PATCH /api/orders/[id]/status (admin only)
export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const orderId = pathParts[pathParts.length - 2]; // /api/orders/[id]/status
    
    if (!orderId) {
      return NextResponse.json({ error: { code: 'MISSING_ORDER_ID', message: 'Order ID required' } }, { status: 400 });
    }
    
    const body = await request.json();
    const result = statusUpdateSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } }, { status: 422 });
    }
    
    const { status } = result.data;
    const supabase = await createClient();

    // Check if admin
    const { data: user } = await supabase.auth.getUser();
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.user?.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Admin access required' } }, { status: 403 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (!data) {
      return NextResponse.json({ error: { code: 'NOT_FOUND', message: 'Order not found' } }, { status: 404 });
    }
    
    return NextResponse.json({ data, message: 'Status updated' });
    
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update status' } }, { status: 500 });
  }
}
