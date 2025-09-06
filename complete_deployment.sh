#!/bin/bash
# BlueSphere Deployment Completion Script
# Run after: gh auth login --scopes "repo,workflow,admin:repo_hook" --web

set -e

echo "🚀 Completing BlueSphere deployment..."

# Push workflows and tags
echo "📤 Pushing workflows and release tag..."
git push origin main --tags

# Create GitHub release
echo "🏷️ Creating GitHub release..."
gh release create v0.16.0 --title "BlueSphere v0.16.0 - Complete Platform Deployment" --notes "🌊 **BlueSphere v0.16.0** - Complete Ocean Data Platform

## 🚀 What's New
- Complete FastAPI backend with ocean data endpoints  
- Interactive Next.js map interface with Leaflet integration
- Marketing website with theme system and content management
- Comprehensive documentation and development tools

## 🏃‍♂️ Quick Start
\`\`\`bash
# API (port 8000)
python3 -m uvicorn simple_api:app --reload --host 0.0.0.0 --port 8000

# WebApp (port 3000)  
cd frontend/ocean-ui && npm install && npm run dev

# Website (port 4000)
cd frontend/bluesphere-site && npm install && npm run dev
\`\`\`

🛠️ Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Apply branch protection
echo "🛡️ Applying branch protection..."
./scripts/protect_main.sh twick1234 BlueSphere

# Setup GitHub Pages
echo "📄 Enabling GitHub Pages..."
gh api repos/twick1234/BlueSphere/pages -X POST -f source='{
  "branch": "main",
  "path": "/"
}' || echo "Pages may already be enabled"

# Create pinned discussions
echo "💬 Creating pinned discussions..."
if [ -f scripts/create_pinned_discussions.sh ]; then
    ./scripts/create_pinned_discussions.sh twick1234 BlueSphere || echo "Discussions may already exist"
fi

echo "✅ BlueSphere deployment completed!"
echo "🌐 Repository: https://github.com/twick1234/BlueSphere" 
echo "📄 GitHub Pages: https://twick1234.github.io/BlueSphere"
echo ""
echo "📋 Manual Tasks Remaining:"
echo "1. Go to GitHub Settings → Secrets and variables → Actions"
echo "2. Add secrets: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT"
echo "3. Go to Settings → Pages → Source: GitHub Actions (if not auto-enabled)"
echo ""
echo "🎉 Your BlueSphere ocean data platform is ready!"