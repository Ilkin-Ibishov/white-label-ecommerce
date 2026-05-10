# Deployment Context

## Infrastructure
- Hosting: Vercel (auto-deploys from `main` branch)
- Production: https://white-label-ecommerce-kappa.vercel.app
- Database: Supabase (project ref: `foiktbisxazqxztbammn`)
- CI: GitHub Actions (`.github/workflows/ci.yml`)

## CI Pipeline
Jobs run in parallel: lint → type-check → unit tests → build → E2E smoke → CI summary gate
- Concurrency: cancels in-progress runs for same PR
- Build: requires `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
- E2E: separate job that depends on build, uses cached Playwright browsers
- All 6 jobs must pass for CI summary to green-light

## Branch Protection
- Documented but NOT yet active (requires repo admin to apply)
- Rules: 2 required approvals, dismiss stale reviews, strict status checks, no force pushes

## Vercel Env Vars (production)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` (needed for admin client — not yet configured)

## Sprint 1.1 Deployment Note
- Gamma set up CI/CD pipeline (PR #1, all 9 checks passing)
- Branch protection script at `scripts/setup-branch-protection.sh` — owner must run manually
