# Testing Context

## Stack
- Unit: Vitest (`vitest.config.ts`)
- E2E: Playwright (`playwright.config.ts`, chromium-only in CI)
- Integration: Supabase connection tests (require live DB)

## Commands
```bash
npm run test:ci          # Vitest unit tests
npx playwright test       # E2E (runs `next start` in CI, `next dev` locally)
npx playwright install    # Install browser binaries
```

## Test Files
- `tests/unit/utils.test.ts` — 3 tests, passing
- `tests/e2e/smoke.spec.ts` — 3 passing, 1 skipped (product grid, needs Beta UI fix)
- `tests/rls/auth.spec.ts` — written but needs Supabase connection

## CI Test Environment
- Build uses placeholder env vars: `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co`
- E2E runs against `next start` (not dev server) for parity with Vercel
- Playwright browsers cached by version in GitHub Actions
- Playwright report uploaded as artifact on completion

## Conventions
- E2E smoke tests: homepage loads, health check returns OK, login page renders, product grid renders
- No integration tests against live Supabase yet (would need service role key in CI)
- All new features should include at least one E2E test
