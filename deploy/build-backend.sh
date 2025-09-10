#!/bin/bash
# SPDX-License-Identifier: MIT
# SPDX-FileCopyrightText: 2024–2025 Mark Lindon — BlueSphere
# Build script for BlueSphere Backend

set -e

echo "🌊 Building BlueSphere Backend..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Check Python version
PYTHON_VERSION=$(python3 --version)
echo "🐍 Using Python version: $PYTHON_VERSION"

# Install dependencies
echo "📥 Installing Python dependencies..."
pip install -r requirements.txt

# Run backend tests (if available)
if [ -f "backend/test_main.py" ]; then
    echo "🧪 Running backend tests..."
    python -m pytest backend/ -v
fi

# Check if FastAPI app can be imported
echo "🔍 Validating FastAPI application..."
python -c "from backend.app.main import app; print('✅ FastAPI app imported successfully')"

# Create production environment file template
echo "📝 Creating production environment template..."
cat > .env.production.template << EOF
# BlueSphere Production Environment Configuration
# Copy this file to .env and fill in the actual values

# Database Configuration
POSTGRES_HOST=your-render-postgres-host
POSTGRES_PORT=5432
POSTGRES_DB=bluesphere
POSTGRES_USER=bluesphere_user
POSTGRES_PASSWORD=your-secure-password
DATABASE_URL=postgresql://user:password@host:port/database

# API Configuration
API_V1_STR=/api/v1
PROJECT_NAME=BlueSphere API
ENVIRONMENT=production
SECRET_KEY=your-very-secure-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
CORS_ORIGINS=https://bluesphere-frontend.onrender.com
BACKEND_CORS_ORIGINS=["https://bluesphere-frontend.onrender.com"]

# Ocean Data Sources
NDBC_BASE_URL=https://www.ndbc.noaa.gov/data
ERDDAP_BASE_URL=https://coastwatch.pfeg.noaa.gov/erddap
DATA_CACHE_TTL=3600

# Performance Settings
MAX_WORKERS=4
WORKER_CLASS=uvicorn.workers.UvicornWorker
TIMEOUT=120

# Logging
LOG_LEVEL=INFO
EOF

echo "✅ Backend preparation completed successfully!"
echo "📄 Environment template created at .env.production.template"

# Build Docker image if Docker is available
if command -v docker &> /dev/null; then
    echo "🐳 Docker found. Building production image..."
    docker build -t bluesphere-backend:latest .
    echo "✅ Docker image built successfully!"
else
    echo "ℹ️  Docker not found. Skipping image build."
fi

echo "🎉 Backend build process completed!"