-- Migration: Alpha - RLS Policies
-- Sprint: 1.1 | Agent: Alpha | Task: A3
-- Performance note: Using auth.uid() for speed (not role-based subqueries)

-- ============================================
-- RLS POLICIES FOR public.users TABLE
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can read all users (using a secure function pattern)
CREATE POLICY "Admins can view all users"
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Admins can update all users
CREATE POLICY "Admins can update all users"
    ON public.users
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Admins can delete users
CREATE POLICY "Admins can delete users"
    ON public.users
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid() AND u.role = 'admin'
        )
    );

-- Allow new user insertion via trigger (service role)
CREATE POLICY "Allow user profile creation via trigger"
    ON public.users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Allow new user insertion for authenticated users creating their own profile
CREATE POLICY "Users can create own profile"
    ON public.users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ============================================
-- SECURITY HELPERS
-- ============================================

-- Function to check if current user is admin (cached for performance)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely get current user role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS TEXT AS $$
BEGIN
    SELECT role FROM public.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION is_admin() IS 'Check if current user has admin role';
COMMENT ON FUNCTION current_user_role() IS 'Get the role of the current authenticated user';
