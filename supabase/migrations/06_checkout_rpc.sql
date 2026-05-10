-- Migration: 06 - Checkout RPC (transactional order creation)
-- Replaces the 4 separate DB calls in handleConfirm with a single atomic function.

CREATE OR REPLACE FUNCTION create_order_from_checkout(
  p_session_id TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address JSONB,
  p_payment_method TEXT,
  p_total_amount INTEGER
)
RETURNS TABLE (
  order_id UUID,
  order_number TEXT,
  total INTEGER,
  status TEXT
) AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_cart_item RECORD;
BEGIN
  -- 1. Create the order
  INSERT INTO public.orders (customer_email, customer_phone, shipping_address, payment_method, total_amount, status)
  VALUES (p_customer_email, p_customer_phone, p_shipping_address, p_payment_method, p_total_amount, 'pending')
  RETURNING id, order_number INTO v_order_id, v_order_number;

  -- 2. Copy cart items to order_items
  FOR v_cart_item IN
    SELECT ci.product_id, ci.quantity, p.name_en, p.image_url, p.price
    FROM public.cart_items ci
    JOIN public.products p ON p.id = ci.product_id
    WHERE ci.session_id = p_session_id
  LOOP
    INSERT INTO public.order_items (order_id, product_id, product_name, product_image, price_cents, quantity)
    VALUES (
      v_order_id,
      v_cart_item.product_id,
      v_cart_item.name_en,
      v_cart_item.image_url,
      ROUND(v_cart_item.price * 100),
      v_cart_item.quantity
    );
  END LOOP;

  -- 3. Clear the cart
  DELETE FROM public.cart_items WHERE session_id = p_session_id;

  -- 4. Mark checkout session as completed
  UPDATE public.checkout_sessions
  SET status = 'completed'
  WHERE session_id = p_session_id AND status = 'pending';

  -- Return the order
  RETURN QUERY
  SELECT v_order_id, v_order_number, p_total_amount, 'pending'::TEXT;
END;
$$ LANGUAGE plpgsql;
