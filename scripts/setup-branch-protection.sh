#!/usr/bin/env bash
# Apply Sprint 1.1 branch protection rules to `main`.
#
# Required env:
#   GITHUB_TOKEN  Personal access token with repo-admin scope
#   REPO          owner/repo (default: Ilkin-Ibishov/white-label-ecommerce)
#
# Run AFTER the CI workflow has executed at least once on `main`, otherwise
# GitHub will reject the required status check names as "unknown".

set -euo pipefail

REPO="${REPO:-Ilkin-Ibishov/white-label-ecommerce}"
BRANCH="${BRANCH:-main}"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: GITHUB_TOKEN must be set (token needs repo-admin scope)." >&2
  exit 1
fi

read -r -d '' PAYLOAD <<'JSON' || true
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Lint (ESLint)",
      "Type Check (tsc)",
      "Unit Tests (Vitest)",
      "Build (Next.js)",
      "E2E Smoke (Playwright)",
      "CI Summary"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 2,
    "require_last_push_approval": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": true
}
JSON

echo "Applying branch protection to ${REPO}@${BRANCH}..."

curl --fail-with-body -sS \
  -X PUT \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${REPO}/branches/${BRANCH}/protection" \
  -d "${PAYLOAD}"

echo
echo "Branch protection applied successfully."
