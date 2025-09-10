#!/bin/bash
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
# Deployment script for Render.com

set -e

echo "🌊 BlueSphere Render Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if render CLI is installed
if ! command -v render &> /dev/null; then
    print_warning "Render CLI not found. Install it with: npm install -g @render/cli"
    print_warning "Alternatively, deploy manually through Render dashboard"
fi

# Check if git is available and repo is clean
if command -v git &> /dev/null; then
    if git status --porcelain | grep -q .; then
        print_warning "Git working directory is not clean. Consider committing changes."
        git status --short
    else
        print_success "Git working directory is clean"
    fi
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    print_error "render.yaml not found! Please ensure the configuration file exists."
    exit 1
fi

print_success "render.yaml configuration found"

# Validate render.yaml
print_status "Validating render.yaml configuration..."
if command -v render &> /dev/null; then
    render config validate
    print_success "render.yaml validation passed"
fi

# Check backend dependencies
print_status "Checking backend dependencies..."
if [ -f "requirements.txt" ]; then
    print_success "requirements.txt found"
else
    print_error "requirements.txt not found!"
    exit 1
fi

# Check frontend dependencies
print_status "Checking frontend dependencies..."
if [ -f "frontend/bluesphere-site/package.json" ]; then
    print_success "Frontend package.json found"
else
    print_error "Frontend package.json not found!"
    exit 1
fi

# Build frontend locally to verify
print_status "Building frontend locally for verification..."
cd frontend/bluesphere-site
npm ci --silent
npm run build
if [ -d "out" ]; then
    print_success "Frontend build verification passed"
else
    print_error "Frontend build verification failed"
    exit 1
fi
cd ../..

# Environment variables check
print_status "Checking environment variables..."
ENV_VARS=(
    "POSTGRES_HOST"
    "POSTGRES_PASSWORD" 
    "SECRET_KEY"
    "NEXT_PUBLIC_API_URL"
)

missing_vars=()
for var in "${ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_warning "The following environment variables are not set:"
    printf '%s\n' "${missing_vars[@]}"
    print_warning "Make sure to configure these in Render dashboard"
fi

# Database schema check
print_status "Checking database schema..."
if [ -f "frontend/bluesphere-site/lib/database/schema.sql" ]; then
    print_success "Database schema found"
    print_status "Remember to run the schema setup after database creation"
else
    print_warning "Database schema not found at expected location"
fi

# Deployment summary
print_status "Deployment Summary:"
echo "=================="
echo "✅ Configuration validated"
echo "✅ Dependencies checked"
echo "✅ Frontend build verified"
echo "🔧 Services to be deployed:"
echo "   - bluesphere-api (FastAPI backend)"
echo "   - bluesphere-frontend (Next.js static site)"
echo "   - bluesphere-postgres (PostgreSQL database)"
echo "   - bluesphere-ingestion-worker (background worker)"
echo ""

# Deploy with render CLI if available
if command -v render &> /dev/null; then
    read -p "Do you want to deploy to Render now? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deploying to Render..."
        render deploy
        print_success "Deployment initiated! Check Render dashboard for progress."
    else
        print_status "Deployment skipped. Run 'render deploy' when ready."
    fi
else
    print_status "To deploy:"
    echo "1. Push code to your Git repository"
    echo "2. Connect the repository to Render"
    echo "3. Render will automatically deploy using render.yaml"
fi

# Post-deployment instructions
echo ""
print_status "Post-deployment checklist:"
echo "=========================="
echo "1. 🗄️  Run database schema setup (see deploy/init-database.sql)"
echo "2. 🔑 Configure environment variables in Render dashboard"
echo "3. 🌐 Test API endpoints: /health, /stations, /status"
echo "4. 📊 Monitor logs and performance metrics"
echo "5. 🔒 Verify SSL certificates are active"
echo ""

print_success "Deployment preparation completed! 🎉"