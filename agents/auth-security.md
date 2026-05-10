# Auth & Security Context

## Authentication
- Supabase Auth with `@supabase/ssr` (not deprecated `@supabase/auth-helpers-nextjs`)
- Session: JWT in httponly cookie, 7-day expiry, rotate on access
- Password policy: min 8 chars, no complexity requirement (NIST-aligned)
- Admin user: `admin@whitelabel.dev` (in `public.users` table, role: admin)

## Middleware
- `src/middleware.ts` refreshes session on every request
- Admin routes (`/admin/*`) require admin role — checked via DB query per request (no caching yet)
- Unauthenticated users redirected to `/admin/login`

## RLS Policies
- `is_admin()` helper function exists but `current_user_role()` has a bug (SELECT without INTO/RETURN QUERY)
- All tables have RLS enabled
- Cart items: NO policy allows anonymous inserts — this is the P0 bug
- Orders: users see own orders by email, admins see all

## Security Checklist (SEC Gatekeeper)
- [ ] RLS policies prevent unauthorized access
- [ ] Zod validation on all routes
- [ ] No secrets in code (SUPABASE_SERVICE_ROLE_KEY, DB_PASSWORD never committed)
- [ ] Rate limiting configured (login: 5/15min, signup: 3/hour, checkout: 5/hour)
- [ ] No SQL injection (use Supabase query builder, never concatenate)
- [ ] XSS vectors reviewed (React escapes by default, no dangerouslySetInnerHTML)
- [ ] Client-safe env vars only: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Known Security Issues
- LoginForm.tsx has "Create Admin User" button visible in production with hardcoded credentials
- Middleware DB query per request — no caching, performance impact
- `current_user_role()` SQL function broken — doesn't return a value
