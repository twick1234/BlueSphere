#!/bin/bash
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
# Build script for BlueSphere Frontend

set -e

echo "🌊 Building BlueSphere Frontend..."

# Navigate to frontend directory
cd "$(dirname "$0")/../frontend/bluesphere-site"

# Check Node.js version
NODE_VERSION=$(node --version)
echo "📦 Using Node.js version: $NODE_VERSION"

# Install dependencies
echo "📥 Installing dependencies..."
npm ci --production=false

# Type checking
echo "🔍 Running type checks..."
npm run type-check

# Linting
echo "🧹 Running linter..."
npm run lint

# Build for production
echo "🚀 Building for production..."
export NODE_ENV=production
npm run build

# Verify build output
if [ -d "out" ]; then
    echo "✅ Frontend build completed successfully"
    echo "📊 Build stats:"
    du -sh out/
    echo "📁 Files in build output:"
    find out/ -type f | wc -l | xargs echo "   Total files:"
    find out/ -name "*.js" | wc -l | xargs echo "   JavaScript files:"
    find out/ -name "*.css" | wc -l | xargs echo "   CSS files:"
    find out/ -name "*.html" | wc -l | xargs echo "   HTML files:"
else
    echo "❌ Frontend build failed - output directory not found"
    exit 1
fi

echo "🎉 Frontend build process completed!"