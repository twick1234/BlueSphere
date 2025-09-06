#!/usr/bin/env bash
set -euo pipefail
# Protect main branch: require PR, require CI checks, enforce code owners
# Usage: ./scripts/protect_main.sh <owner> <repo>
OWNER="${1:-}"; REPO="${2:-}"
if [ -z "$OWNER" ] || [ -z "$REPO" ]; then echo "Usage: $0 <owner> <repo>"; exit 1; fi
gh api -X PUT repos/$OWNER/$REPO/branches/main/protection -f required_pull_request_reviews='{"require_code_owner_reviews":true}' -f enforce_admins=true -f restrictions='' -f required_status_checks='{"strict":true,"contexts":["CI (Node & Playwright)"]}' >/dev/null
echo "Branch protection applied to $OWNER/$REPO main."
