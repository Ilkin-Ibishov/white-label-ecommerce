-- Migration: Beta - RLS Policies for Product Catalog
-- Sprint: 1.1 | Agent: Beta | Task: B2
-- Pattern: public_read_admin_write (research finding - sufficient for MVP)

-- ============================================
-- CATEGORIES RLS
-- ============================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read active categories
CREATE POLICY "Categories are publicly readable"
    ON public.categories
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Only admins can modify categories
CREATE POLICY "Only admins can insert categories"
    ON public.categories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update categories"
    ON public.categories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete categories"
    ON public.categories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PRODUCTS RLS
-- ============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can read active products
CREATE POLICY "Products are publicly readable"
    ON public.products
    FOR SELECT
    TO anon, authenticated
    USING (status = 'active');

-- Only admins can insert products
CREATE POLICY "Only admins can insert products"
    ON public.products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update products"
    ON public.products
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete products"
    ON public.products
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- PRODUCT IMAGES RLS
-- ============================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Everyone can read product images (for product detail pages)
CREATE POLICY "Product images are publicly readable"
    ON public.product_images
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE id = product_images.product_id AND status = 'active'
        )
    );

-- Only admins can modify product images
CREATE POLICY "Only admins can insert product images"
    ON public.product_images
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can update product images"
    ON public.product_images
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Only admins can delete product images"
    ON public.product_images
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- SERVICE ROLE BYPASS (for seed scripts)
-- ============================================
-- Allow service role to bypass RLS for seeding data
ALTER TABLE public.categories FORCE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;
ALTER TABLE public.product_images FORCE ROW LEVEL SECURITY;

COMMENT ON TABLE public.categories IS 'Categories with public_read_admin_write RLS';
COMMENT ON TABLE public.products IS 'Products with public_read_admin_write RLS';
COMMENT ON TABLE public.product_images IS 'Product images with public_read_admin_write RLS';
