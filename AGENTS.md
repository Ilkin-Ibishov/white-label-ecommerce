# Agent Context

This file provides persistent project context for AI coding agents. It contains only what agents cannot discover from reading the codebase itself.

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (needs NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY)
npm run lint         # ESLint (flat config, eslint.config.mjs)
npm run type-check   # tsc --noEmit
npm run test:ci      # Vitest unit tests
npx playwright test  # E2E smoke tests
```

## Non-Negotiable Constraints

1. **Test against the live database before claiming something works.** The Supabase project is at `foiktbisxazqxztbammn.supabase.co`. Schema assumptions are wrong until verified.
2. **One fix per commit.** Don't batch unrelated changes. Each logical fix is its own commit with a clear message.
3. **Run the security checklist before merge.** RLS policies prevent unauthorized access, Zod validation on all routes, no secrets in code, no SQL injection vectors.

## Things That Look Wrong But Are Intentional

- **Price is numeric AZN, not integer cents.** The live DB uses `price` (numeric, e.g. 1199.00). The migrations say `price_cents` — they were never applied. The seed script created the real schema.
- **Migrations don't match the live database.** The files in `supabase/migrations/` define a different schema than what's actually running. The live DB is the truth. Migrations need to be rewritten to match.
- **Cart uses session_id, not auth.** Anonymous users can add to cart. The `cart_items` table uses `session_id` from localStorage, not `auth.uid()`.
- **Server-side Supabase client needs two keys.** `src/lib/supabase/server.ts` uses the anon/publishable key for reads. Write operations that bypass RLS need the secret key via a separate admin client.
- **No `status` column on products.** Products use flags (`is_featured`, `is_on_sale`, `is_deal_of_day`) instead of a status enum.
- **TanStack Query only.** No Zustand, no Redux, no Context for server state. Project rule.

## Conflict Resolution

When instructions conflict: current user request > workspace rules (modular files) > this file.

## Modular Context Files

Domain-specific context lives in `agents/` and loads when relevant files are in scope:

| File | When it loads |
|------|---------------|
| `agents/api-conventions.md` | Working in `src/app/api/**` |
| `agents/database.md` | Working in `supabase/**` or any DB-related code |
| `agents/auth-security.md` | Working in `src/middleware.ts`, `src/app/api/auth/**`, `supabase/migrations/alpha/**` |
| `agents/storefront-ui.md` | Working in `src/app/(shop)/**`, `src/components/storefront/**` |
| `agents/admin-ui.md` | Working in `src/app/admin/**`, `src/components/admin/**` |
| `agents/testing.md` | Working in `tests/**` |
| `agents/deployment.md` | Working in `.github/**`, `vercel.json`, `next.config.ts` |
