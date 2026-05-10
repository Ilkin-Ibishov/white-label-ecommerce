-- Migration: 04 - RLS Policies
-- Matches the LIVE database. Admin client (SUPABASE_SECRET_KEY) bypasses RLS for writes.

-- Users: read own, admin reads all
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.users FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
    ON public.users FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY "Admins can update all users"
    ON public.users FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Allow user profile creation via trigger (service role)
CREATE POLICY "Allow user profile creation via trigger"
    ON public.users FOR INSERT TO service_role
    WITH CHECK (true);

CREATE POLICY "Users can create own profile"
    ON public.users FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Categories: public read, admin write
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are publicly readable"
    ON public.categories FOR SELECT TO anon, authenticated
    USING (true);

-- Products: public read, admin write
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable"
    ON public.products FOR SELECT TO anon, authenticated
    USING (true);

-- Product images: public read
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product images are publicly readable"
    ON public.product_images FOR SELECT TO anon, authenticated
    USING (true);

-- Cart items: public read/write by session_id (server-side uses admin client)
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cart items readable by session"
    ON public.cart_items FOR SELECT TO anon, authenticated
    USING (true);

-- Checkout sessions: public read by session_id
ALTER TABLE public.checkout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Checkout sessions readable by session"
    ON public.checkout_sessions FOR SELECT TO anon, authenticated
    USING (true);

-- Orders: read by email, admin reads all
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Orders readable by customer email"
    ON public.orders FOR SELECT TO anon, authenticated
    USING (true);

-- Order items: same as orders
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Order items readable"
    ON public.order_items FOR SELECT TO anon, authenticated
    USING (true);

-- Force RLS (service role bypasses, anon/auth don't)
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product_images FORCE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.order_items FORCE ROW LEVEL SECURITY;
