#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/setup_discussions.sh <owner> <repo>
# Requires: gh (GitHub CLI) authenticated with repo:discussion scope

OWNER="${1:-}"
REPO="${2:-}"
if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "Usage: $0 <owner> <repo>"
  exit 1
fi

echo "Ensuring Discussions is enabled on $OWNER/$REPO ..."
gh api -X PATCH repos/$OWNER/$REPO -f has_discussions=true >/dev/null

echo "Fetching existing categories ..."
existing=$(gh api repos/$OWNER/$REPO/discussions/categories --jq '.[].name' || echo "")

create_cat () {
  local name="$1"; shift
  local desc="$1"; shift
  local emoji="$1"; shift
  if echo "$existing" | grep -qi "^$name$"; then
    echo "Category '$name' already exists."
  else
    echo "Creating category '$name' ..."
    gh api repos/$OWNER/$REPO/discussions/categories       -f name="$name" -f description="$desc" -f emoji="$emoji" -X POST >/dev/null
  fi
}

create_cat "Q&A" "Ask questions and get help" "❓"
create_cat "Ideas" "Share ideas and proposals" "💡"
create_cat "Announcements" "Project news and updates" "📢"

echo "Done."
