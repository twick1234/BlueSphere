#!/usr/bin/env bash
#SPDX-License-Identifier: MIT
#SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
set -euo pipefail

# Customize these:
USER="Twick1234"
REPO="BlueSphere"

if [ "$USER" = "<YOUR_GITHUB_USERNAME>" ]; then
  echo "Please edit scripts/publish_to_github.sh and set USER to your GitHub username."
  exit 1
fi

if [ ! -d ".git" ]; then
  git init
  git branch -M main || true
fi

git remote remove origin 2>/dev/null || true
git remote add origin "https://github.com/${USER}/${REPO}.git"

git add .
git commit -m "Initial import: BlueSphere starter" || true
git push -u origin main

# Optional: create a tag and push it
git tag -a v0.10.1 -m "BlueSphere v0.10.1 initial release" || true
git push origin main --tags || true

echo "Done. Visit: https://github.com/${USER}/${REPO}"
