// Alpha Sprint 1.2 A10: Checkout API
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { NextResponse } from 'next/server';

const initSchema = z.object({
  session_id: z.string().min(1),
});

const shippingSchema = z.object({
  session_id: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().min(10),
  shipping_address: z.object({
    full_name: z.string().min(1),
    address_line1: z.string().min(1),
    address_line2: z.string().optional(),
    city: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().default('AZ'),
  }),
  payment_method: z.enum(['pay_on_delivery', 'card']).default('pay_on_delivery'),
});

// POST /api/checkout/init - Get cart summary
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action || 'init';
    
    if (action === 'init') {
      return handleInit(body);
    } else if (action === 'shipping') {
      return handleShipping(body);
    } else if (action === 'confirm') {
      return handleConfirm(body);
    }
    
    return NextResponse.json({ error: { code: 'INVALID_ACTION', message: 'Unknown action' } }, { status: 400 });
    
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: 'Checkout failed' } }, { status: 500 });
  }
}

async function handleInit(body: any) {
  const result = initSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } }, { status: 422 });
  }
  
  const { session_id } = result.data;
  const supabase = await createClient();
  
  // Get cart items
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`quantity, product:products(price)`)
    .eq('session_id', session_id);
  
  const total = cartItems?.reduce((sum: number, item: any) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0) || 0;
  
  const itemCount = cartItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
  
  return NextResponse.json({
    data: {
      session_id,
      item_count: itemCount,
      subtotal: Math.round(total * 100) / 100,
      shipping: 0, // Free shipping for now
      total: Math.round(total * 100) / 100,
    }
  });
}

async function handleShipping(body: any) {
  const result = shippingSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } }, { status: 422 });
  }
  
  const { session_id, customer_email, customer_phone, shipping_address, payment_method } = result.data;
  const supabase = await createClient();
  const admin = createAdminClient();

  // Calculate total
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`quantity, product:products(price)`)
    .eq('session_id', session_id);

  const total = cartItems?.reduce((sum: number, item: any) => {
    return sum + (item.product?.price || 0) * item.quantity;
  }, 0) || 0;

  // Save checkout session (admin client bypasses RLS)
  const { data, error } = await admin
    .from('checkout_sessions')
    .upsert({
      session_id,
      customer_email,
      customer_phone,
      shipping_address,
      payment_method,
      total_amount: Math.round(total * 100),
      status: 'pending',
    }, { onConflict: 'session_id' })
    .select()
    .single();
  
  if (error) throw error;
  
  return NextResponse.json({
    data: {
      checkout_id: data.id,
      session_id,
      customer_email,
      shipping_address,
      payment_method,
      total: Math.round(total * 100) / 100,
    }
  });
}

async function handleConfirm(body: any) {
  const { session_id } = body;

  if (!session_id) {
    return NextResponse.json({ error: { code: 'MISSING_SESSION', message: 'Session ID required' } }, { status: 400 });
  }

  const supabase = await createClient();
  const admin = createAdminClient();

  // Get checkout session
  const { data: checkout } = await supabase
    .from('checkout_sessions')
    .select('*')
    .eq('session_id', session_id)
    .eq('status', 'pending')
    .single();

  if (!checkout) {
    return NextResponse.json({ error: { code: 'CHECKOUT_NOT_FOUND', message: 'Checkout session not found or expired' } }, { status: 404 });
  }

  // Get cart items
  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`*, product:products(id, name_en, image_url, price)`)
    .eq('session_id', session_id);

  if (!cartItems || cartItems.length === 0) {
    return NextResponse.json({ error: { code: 'EMPTY_CART', message: 'Cart is empty' } }, { status: 400 });
  }

  // Try transactional RPC first (migration 06). Falls back to multi-step if RPC doesn't exist.
  const { data: rpcResult, error: rpcError } = await admin.rpc('create_order_from_checkout', {
    p_session_id: session_id,
    p_customer_email: checkout.customer_email,
    p_customer_phone: checkout.customer_phone,
    p_shipping_address: checkout.shipping_address,
    p_payment_method: checkout.payment_method,
    p_total_amount: checkout.total_amount,
  });

  if (!rpcError && rpcResult && rpcResult.length > 0) {
    const result = rpcResult[0];
    return NextResponse.json({
      data: {
        order_id: result.order_id,
        order_number: result.order_number,
        total: result.total / 100,
        status: result.status,
      }
    }, { status: 201 });
  }

  // Fallback: multi-step order creation (not atomic, but works without RPC)
  console.warn('Checkout RPC not available, using multi-step fallback:', rpcError?.message);

  // Create order
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      customer_email: checkout.customer_email,
      customer_phone: checkout.customer_phone,
      shipping_address: checkout.shipping_address,
      payment_method: checkout.payment_method,
      total_amount: checkout.total_amount,
      status: 'pending',
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Create order items
  const orderItems = cartItems.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product?.name_en || 'Unknown',
    product_image: item.product?.image_url || '',
    price_cents: Math.round((item.product?.price || 0) * 100),
    quantity: item.quantity,
  }));

  const { error: itemsError } = await admin
    .from('order_items')
    .insert(orderItems);

  if (itemsError) throw itemsError;

  // Clear cart
  await admin.from('cart_items').delete().eq('session_id', session_id);

  // Mark checkout as completed
  await admin
    .from('checkout_sessions')
    .update({ status: 'completed' })
    .eq('id', checkout.id);

  return NextResponse.json({
    data: {
      order_id: order.id,
      order_number: order.order_number,
      total: checkout.total_amount / 100,
      status: order.status,
    }
  }, { status: 201 });
}
