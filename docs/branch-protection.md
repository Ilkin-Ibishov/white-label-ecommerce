# Branch Protection — `main`

This document describes the branch protection ruleset Gamma applies to `main`
and how to (re)apply it via the GitHub API.

## Required rules (per `stages/gamma/01-cicd/context.json`)

- `require_2_reviews` — at least 2 approving reviews before merge
- `require_ci_pass` — all required status checks must pass
- `no_direct_push` — pushes to `main` are blocked outside of PRs

## Required status checks

The CI pipeline (`.github/workflows/ci.yml`) exposes the following check
names. All must be green for a PR to merge:

- `Lint (ESLint)`
- `Type Check (tsc)`
- `Unit Tests (Vitest)`
- `Build (Next.js)`
- `E2E Smoke (Playwright)`
- `CI Summary`

## Apply via GitHub API

Run [`scripts/setup-branch-protection.sh`](../scripts/setup-branch-protection.sh)
locally, **after** the CI workflow has run at least once on `main` (so GitHub
knows the check names exist):

```bash
GITHUB_TOKEN=<personal-access-token-with-repo-admin> \
  REPO=Ilkin-Ibishov/white-label-ecommerce \
  ./scripts/setup-branch-protection.sh
```

The token must have `repo` scope (or `administration:write` fine-grained) on
the target repository.

## Apply via GitHub UI

1. Go to <https://github.com/Ilkin-Ibishov/white-label-ecommerce/settings/branches>.
2. Click **Add branch ruleset** → **New ruleset** (or **Add classic branch
   protection rule**).
3. Branch name pattern: `main`.
4. Enable:
   - **Require a pull request before merging**
     - Require approvals: **2**
     - Dismiss stale pull request approvals when new commits are pushed
     - Require review from Code Owners (optional)
   - **Require status checks to pass before merging**
     - Require branches to be up to date before merging
     - Add the six status checks listed above.
   - **Require conversation resolution before merging**
   - **Block force pushes**
   - **Restrict deletions**
5. Save.

## Notes

- `devin-ai-integration[bot]` (the account Devin runs as in CI) is not a repo
  admin, so it cannot apply branch protection on its own. The repo owner
  (`Ilkin-Ibishov`) must run the script above or use the UI.
- After protection is active, all changes — including by `Ilkin-Ibishov` —
  must go through PRs. To bypass for emergency hotfixes, temporarily disable
  the rule from Settings → Branches.
