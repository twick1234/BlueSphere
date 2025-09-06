#!/usr/bin/env bash
#SPDX-License-Identifier: MIT
#SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
set -euo pipefail

# Requires: GitHub CLI (gh), logged in: gh auth login
# Usage: ./scripts/import_issues.sh <owner> <repo>
# Example: ./scripts/import_issues.sh YOUR_GITHUB_USERNAME BlueSphere

OWNER="${1:-}"
REPO="${2:-}"
if [ -z "$OWNER" ] || [ -z "$REPO" ]; then
  echo "Usage: $0 <owner> <repo>"
  exit 1
fi

FILE="tasks/issues_seed.jsonl"
if [ ! -f "$FILE" ]; then
  echo "Cannot find $FILE"; exit 1
fi

while IFS= read -r line; do
  title=$(echo "$line" | jq -r '.title')
  body=$(echo "$line"  | jq -r '.body')
  labels=$(echo "$line"| jq -r '.labels | join(",")')
  if [ -z "$title" ]; then continue; fi
  echo "Creating issue: $title"
  gh issue create --repo "$OWNER/$REPO" --title "$title" --body "$body" $( [ -n "$labels" ] && echo --label "$labels" )
done < "$FILE"
