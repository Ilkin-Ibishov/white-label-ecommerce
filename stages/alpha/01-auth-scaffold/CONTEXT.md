# Stage Contract: Auth System Scaffold

**Agent**: Alpha  
**Sprint**: 1.1  
**Stage**: 01-auth-scaffold  
**Goal**: Set up Supabase Auth, users table, RLS policies, auth middleware

---

## Inputs

| Source | File/Location | Section | Why |
|--------|--------------|---------|-----|
| Store config | `config/store.config.ts` | Features, Payment | Auth requirements |
| Supabase docs | `_config/supabase-auth-patterns.md` | Full file | Implementation patterns |
| Previous output | N/A (first stage) | — | Starting fresh |

---

## Process

1. **Configure Supabase Auth**
   - Enable email/password auth in Supabase Dashboard
   - Set up email templates (customize for white-label)
   
2. **Create Users Table**
   - Extend Supabase `auth.users` with profile data
   - Fields: `id`, `email`, `role` (customer|admin|editor|viewer), `created_at`
   
3. **RLS Policies**
   - Users can read own profile only
   - Admins can read all users
   - Users can update own profile only
   
4. **Supabase SSR Setup**
   - Configure `supabase-ssr` client
   - Set up auth middleware (`middleware.ts`)
   
5. **API Routes**
   - `POST /api/auth/signup` — customer registration
   - `POST /api/auth/login` — login
   - `POST /api/auth/logout` — logout
   - `POST /api/auth/reset-password` — password reset

6. **Admin Login Page**
   - Form with email/password
   - Error handling
   - Redirect to `/admin/dashboard` on success

---

## Checkpoints

- [ ] After RLS policies: Verify with test query
- [ ] After API routes: Test with curl/Postman
- [ ] After login page: Manual UI test

---

## Outputs

| Artifact | Location | Format |
|----------|----------|--------|
| Auth middleware | `src/middleware.ts` | TypeScript |
| API routes | `src/app/api/auth/*.ts` | TypeScript |
| Login page | `src/app/(admin)/login/page.tsx` | TSX |
| RLS policies | `supabase/migrations/alpha/01_auth.sql` | SQL |
| Test queries | `tests/rls/auth.spec.ts` | TypeScript |

---

## Definition of Done

- [ ] `/api/auth/login` returns session for valid credentials
- [ ] `/api/auth/signup` creates user with role="customer"
- [ ] RLS policy test passes (user can only read own data)
- [ ] Admin login page accessible at `/admin/login`
- [ ] Login redirects to `/admin/dashboard`
- [ ] Handoff doc written: `handoffs/alpha-2026-05-10.md`
