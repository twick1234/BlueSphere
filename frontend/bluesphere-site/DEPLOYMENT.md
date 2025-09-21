# 🚀 BlueSphere Deployment Guide

**Version:** 1.0.0
**Last Updated:** September 21, 2025
**Platforms:** Vercel, Render, AWS, Docker

---

## 📋 Table of Contents

- [Overview](#overview)
- [Environment Setup](#environment-setup)
- [Deployment Platforms](#deployment-platforms)
- [CI/CD Pipeline](#cicd-pipeline)
- [Database Deployment](#database-deployment)
- [CDN & Performance](#cdn--performance)
- [Monitoring & Logging](#monitoring--logging)
- [Security Configuration](#security-configuration)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

---

## 🌟 Overview

BlueSphere supports multiple deployment strategies designed for production-scale ocean monitoring applications. This guide covers deployment to various platforms with emphasis on performance, reliability, and cost optimization.

### Deployment Architectures

#### **Single Platform (Recommended for MVP)**
- **Frontend + API**: Next.js on Vercel/Render
- **Database**: PostgreSQL with TimescaleDB
- **CDN**: Automatic edge distribution
- **Monitoring**: Built-in platform monitoring

#### **Multi-Cloud (Enterprise)**
- **Frontend**: Vercel with global CDN
- **API**: AWS Lambda with API Gateway
- **Database**: AWS RDS with read replicas
- **Cache**: Redis on AWS ElastiCache
- **Monitoring**: CloudWatch + custom dashboards

#### **Containerized (Self-hosted)**
- **Platform**: Docker + Kubernetes
- **Load Balancer**: NGINX/Traefik
- **Database**: PostgreSQL in containers
- **Orchestration**: Docker Compose/Helm charts

---

## 🔧 Environment Setup

### Environment Variables

Create environment files for each deployment stage:

#### `.env.production`
```bash
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://bluesphere.org
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@host:5432/bluesphere_prod
DATABASE_SSL=true
DATABASE_POOL_SIZE=20

# APIs & External Services
NDBC_API_KEY=your_production_ndbc_key
NOAA_API_KEY=your_production_noaa_key
BOM_API_KEY=your_production_bom_key
EMSO_API_KEY=your_production_emso_key

# Security
NEXTAUTH_SECRET=your_super_secure_secret_here
NEXTAUTH_URL=https://bluesphere.org
JWT_SECRET=your_jwt_secret_here

# Monitoring & Analytics
SENTRY_DSN=https://your-sentry-dsn
NEXT_PUBLIC_ANALYTICS_ID=GA_MEASUREMENT_ID
UPTIME_ROBOT_API_KEY=your_uptime_robot_key

# Performance
REDIS_URL=redis://username:password@host:6379
CDN_URL=https://cdn.bluesphere.org

# Rate Limiting
RATE_LIMIT_REDIS_URL=redis://rate-limit-host:6379
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=3600000

# Email & Notifications
SENDGRID_API_KEY=your_sendgrid_key
SLACK_WEBHOOK_URL=your_slack_webhook
```

#### `.env.staging`
```bash
# Application
NODE_ENV=staging
NEXT_PUBLIC_APP_URL=https://staging.bluesphere.org
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@staging-host:5432/bluesphere_staging
DATABASE_SSL=true
DATABASE_POOL_SIZE=10

# APIs (using sandbox/test endpoints)
NDBC_API_KEY=your_staging_ndbc_key
NOAA_API_KEY=your_staging_noaa_key

# Security
NEXTAUTH_SECRET=staging_secret_different_from_prod
NEXTAUTH_URL=https://staging.bluesphere.org

# Monitoring
SENTRY_DSN=https://your-staging-sentry-dsn
```

### Build Configuration

#### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Production optimizations
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
  },

  // Image optimization
  images: {
    domains: [
      'api.bluesphere.org',
      'cdn.bluesphere.org',
      'www.ndbc.noaa.gov'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=600'
          }
        ]
      }
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

  // Bundle analyzer (development only)
  webpack: (config, { dev, isServer }) => {
    if (process.env.ANALYZE === 'true') {
      const withBundleAnalyzer = require('@next/bundle-analyzer')({
        enabled: true,
      })
      return withBundleAnalyzer(config)
    }
    return config
  },
}

module.exports = nextConfig
```

---

## 🏗️ Deployment Platforms

### Vercel Deployment (Recommended)

#### 1. Setup Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Initialize project
vercel --cwd ./frontend/bluesphere-site

# Set environment variables
vercel env add NDBC_API_KEY production
vercel env add DATABASE_URL production
# ... add all production environment variables
```

#### 2. Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "name": "bluesphere",
  "alias": ["bluesphere.org", "www.bluesphere.org"],
  "regions": ["iad1", "sfo1", "lhr1", "nrt1"],
  "build": {
    "env": {
      "NODE_ENV": "production"
    }
  },
  "functions": {
    "pages/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "https://bluesphere.org"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "X-Requested-With, Content-Type, Authorization, X-API-Key"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/v1/(.*)",
      "destination": "/api/$1"
    }
  ]
}
```

#### 3. Deploy to Vercel

```bash
# Deploy to production
vercel --prod

# Deploy to preview (staging)
vercel

# Set custom domain
vercel domains add bluesphere.org
vercel domains add www.bluesphere.org
```

### Render Deployment

#### 1. Render Configuration

Create `render.yaml`:

```yaml
services:
  - type: web
    name: bluesphere-frontend
    env: node
    region: oregon
    plan: pro
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: DATABASE_URL
        fromDatabase:
          name: bluesphere-db
          property: connectionString
      - key: NDBC_API_KEY
        sync: false
    domains:
      - bluesphere.org
      - www.bluesphere.org

databases:
  - name: bluesphere-db
    databaseName: bluesphere
    plan: pro
    region: oregon
    postgresMajorVersion: 15
```

#### 2. Deploy to Render

```bash
# Connect repository to Render
# Deploy automatically on git push to main branch

# Manual deployment
render deploy --service-id srv-xxxxx
```

### AWS Deployment (Advanced)

#### 1. Infrastructure as Code (Terraform)

Create `infrastructure/main.tf`:

```hcl
provider "aws" {
  region = "us-east-1"
}

# VPC Configuration
resource "aws_vpc" "bluesphere_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "bluesphere-vpc"
  }
}

# RDS Database
resource "aws_db_instance" "bluesphere_db" {
  identifier = "bluesphere-production"

  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.t3.medium"

  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "bluesphere"
  username = "bluesphere_admin"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.bluesphere.name

  backup_retention_period = 7
  backup_window          = "07:00-09:00"
  maintenance_window     = "sun:09:00-sun:10:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "bluesphere-final-snapshot"

  tags = {
    Name = "bluesphere-production-db"
  }
}

# Lambda Functions for API
resource "aws_lambda_function" "api" {
  filename         = "api.zip"
  function_name    = "bluesphere-api"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 1024

  environment {
    variables = {
      DATABASE_URL = "postgresql://${aws_db_instance.bluesphere_db.username}:${var.db_password}@${aws_db_instance.bluesphere_db.endpoint}/${aws_db_instance.bluesphere_db.db_name}"
      NODE_ENV     = "production"
    }
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "bluesphere_cdn" {
  origin {
    domain_name = aws_s3_bucket.bluesphere_frontend.bucket_regional_domain_name
    origin_id   = "S3-bluesphere-frontend"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-bluesphere-frontend"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.bluesphere_cert.arn
    ssl_support_method  = "sni-only"
  }

  aliases = ["bluesphere.org", "www.bluesphere.org"]
}
```

#### 2. Deploy AWS Infrastructure

```bash
# Initialize Terraform
cd infrastructure
terraform init

# Plan deployment
terraform plan -var="db_password=your_secure_password"

# Apply infrastructure
terraform apply -var="db_password=your_secure_password"
```

### Docker Deployment

#### 1. Dockerfile

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### 2. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://bluesphere:password@db:5432/bluesphere
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - bluesphere-network

  db:
    image: timescale/timescaledb:latest-pg15
    environment:
      - POSTGRES_DB=bluesphere
      - POSTGRES_USER=bluesphere
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - bluesphere-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - bluesphere-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - bluesphere-network

volumes:
  postgres_data:
  redis_data:

networks:
  bluesphere-network:
    driver: bridge
```

#### 3. Deploy with Docker

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3

# Stop services
docker-compose down
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy BlueSphere

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: bluesphere_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/bluesphere-site/package-lock.json

      - name: Install dependencies
        working-directory: frontend/bluesphere-site
        run: npm ci

      - name: Run type checking
        working-directory: frontend/bluesphere-site
        run: npm run type-check

      - name: Run linting
        working-directory: frontend/bluesphere-site
        run: npm run lint

      - name: Run unit tests
        working-directory: frontend/bluesphere-site
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bluesphere_test

      - name: Run E2E tests
        working-directory: frontend/bluesphere-site
        run: |
          npx playwright install --with-deps
          npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/bluesphere_test

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: frontend/bluesphere-site/coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: frontend/bluesphere-site/package-lock.json

      - name: Install dependencies
        working-directory: frontend/bluesphere-site
        run: npm ci

      - name: Build application
        working-directory: frontend/bluesphere-site
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: frontend/bluesphere-site/.next

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend/bluesphere-site
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Run smoke tests
        run: |
          npm install -g wait-on
          wait-on https://staging.bluesphere.org/api/health
          curl -f https://staging.bluesphere.org/api/stations || exit 1

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: frontend/bluesphere-site
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Run production smoke tests
        run: |
          npm install -g wait-on
          wait-on https://bluesphere.org/api/health
          curl -f https://bluesphere.org/api/stations || exit 1

      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()

  docker-build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix=sha-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: frontend/bluesphere-site
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

### Deployment Scripts

#### `scripts/deploy.sh`
```bash
#!/bin/bash
set -e

ENVIRONMENT=${1:-staging}
BRANCH=${2:-develop}

echo "🚀 Deploying BlueSphere to $ENVIRONMENT..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if on correct branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$ENVIRONMENT" == "production" && "$CURRENT_BRANCH" != "main" ]]; then
    echo "❌ Production deployments must be from main branch"
    exit 1
fi

# Run pre-deployment checks
echo "🔍 Running pre-deployment checks..."
npm run type-check
npm run lint
npm run test

# Build application
echo "🏗️ Building application..."
npm run build

# Deploy based on environment
if [[ "$ENVIRONMENT" == "staging" ]]; then
    echo "📦 Deploying to staging..."
    vercel --token "$VERCEL_TOKEN"
else
    echo "🌟 Deploying to production..."
    vercel --prod --token "$VERCEL_TOKEN"
fi

# Run post-deployment tests
echo "🧪 Running post-deployment tests..."
if [[ "$ENVIRONMENT" == "staging" ]]; then
    API_URL="https://staging.bluesphere.org"
else
    API_URL="https://bluesphere.org"
fi

# Health check
curl -f "$API_URL/api/health" || {
    echo "❌ Health check failed"
    exit 1
}

# API validation
curl -f "$API_URL/api/stations" || {
    echo "❌ API validation failed"
    exit 1
}

echo "✅ Deployment to $ENVIRONMENT completed successfully!"

# Send notification
if command -v slack &> /dev/null; then
    slack chat send \
        --channel "#deployments" \
        --text "🚀 BlueSphere deployed to $ENVIRONMENT successfully!"
fi
```

---

## 🗄️ Database Deployment

### PostgreSQL with TimescaleDB

#### 1. Database Setup Script

```sql
-- init.sql
-- Create TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create application database
CREATE DATABASE bluesphere;

-- Connect to the database
\c bluesphere;

-- Create application user
CREATE USER bluesphere_app WITH PASSWORD 'secure_password_here';
GRANT CONNECT ON DATABASE bluesphere TO bluesphere_app;

-- Create schema
CREATE SCHEMA IF NOT EXISTS ocean_data;
GRANT USAGE ON SCHEMA ocean_data TO bluesphere_app;

-- Stations table
CREATE TABLE ocean_data.stations (
    station_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    latitude DECIMAL(8,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    water_depth DECIMAL(8,2),
    deployment_date TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ocean_data.stations TO bluesphere_app;

-- Observations hypertable
CREATE TABLE ocean_data.observations (
    station_id VARCHAR(20) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    water_temperature DECIMAL(5,2),
    air_temperature DECIMAL(5,2),
    wave_height DECIMAL(5,2),
    wave_period DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    wind_direction DECIMAL(5,2),
    atmospheric_pressure DECIMAL(7,2),
    qc_flags JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (station_id) REFERENCES ocean_data.stations(station_id)
);

-- Convert to hypertable
SELECT create_hypertable('ocean_data.observations', 'timestamp');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ocean_data.observations TO bluesphere_app;

-- Create indexes
CREATE INDEX idx_stations_location ON ocean_data.stations USING GIST (ST_Point(longitude, latitude));
CREATE INDEX idx_stations_provider ON ocean_data.stations (provider);
CREATE INDEX idx_stations_active ON ocean_data.stations (is_active) WHERE is_active = true;
CREATE INDEX idx_observations_station_time ON ocean_data.observations (station_id, timestamp DESC);
CREATE INDEX idx_observations_temperature ON ocean_data.observations (water_temperature) WHERE water_temperature IS NOT NULL;

-- Create materialized views for performance
CREATE MATERIALIZED VIEW ocean_data.station_latest_observations AS
SELECT DISTINCT ON (station_id)
    station_id,
    timestamp,
    water_temperature,
    air_temperature,
    wave_height,
    wind_speed,
    atmospheric_pressure
FROM ocean_data.observations
ORDER BY station_id, timestamp DESC;

CREATE UNIQUE INDEX idx_station_latest_observations ON ocean_data.station_latest_observations (station_id);
GRANT SELECT ON ocean_data.station_latest_observations TO bluesphere_app;

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_latest_observations()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY ocean_data.station_latest_observations;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 15 minutes
SELECT cron.schedule('refresh-latest-observations', '*/15 * * * *', 'SELECT refresh_latest_observations();');
```

#### 2. Database Migration Scripts

```bash
#!/bin/bash
# migrate.sh

set -e

DB_URL=${DATABASE_URL}
MIGRATIONS_DIR="./migrations"

echo "🗄️ Running database migrations..."

# Check if database is accessible
psql "$DB_URL" -c "SELECT 1;" || {
    echo "❌ Cannot connect to database"
    exit 1
}

# Create migrations table if it doesn't exist
psql "$DB_URL" << EOF
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW()
);
EOF

# Run pending migrations
for migration in "$MIGRATIONS_DIR"/*.sql; do
    if [[ -f "$migration" ]]; then
        VERSION=$(basename "$migration" .sql)

        # Check if migration already applied
        APPLIED=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM schema_migrations WHERE version = '$VERSION';")

        if [[ $APPLIED -eq 0 ]]; then
            echo "📝 Applying migration: $VERSION"
            psql "$DB_URL" -f "$migration"
            psql "$DB_URL" -c "INSERT INTO schema_migrations (version) VALUES ('$VERSION');"
            echo "✅ Migration $VERSION applied successfully"
        else
            echo "⏭️ Migration $VERSION already applied"
        fi
    fi
done

echo "✅ All migrations completed successfully"
```

### Database Backup Strategy

#### Automated Backup Script

```bash
#!/bin/bash
# backup.sh

set -e

DB_URL=${DATABASE_URL}
BACKUP_DIR="/var/backups/bluesphere"
S3_BUCKET="bluesphere-backups"
RETENTION_DAYS=30

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="bluesphere_backup_$DATE.sql"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

echo "🗄️ Starting database backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Create database dump
pg_dump "$DB_URL" --clean --if-exists --create > "$BACKUP_PATH"

# Compress backup
gzip "$BACKUP_PATH"
BACKUP_PATH="$BACKUP_PATH.gz"

# Upload to S3
aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/daily/"

# Clean up local files older than 7 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

# Clean up S3 files older than retention period
aws s3 ls "s3://$S3_BUCKET/daily/" | \
    awk '{print $4}' | \
    while read -r file; do
        file_date=$(echo "$file" | grep -oE '[0-9]{8}')
        if [[ -n "$file_date" ]]; then
            file_epoch=$(date -d "$file_date" +%s)
            cutoff_epoch=$(date -d "$RETENTION_DAYS days ago" +%s)
            if [[ $file_epoch -lt $cutoff_epoch ]]; then
                aws s3 rm "s3://$S3_BUCKET/daily/$file"
                echo "Deleted old backup: $file"
            fi
        fi
    done

echo "✅ Backup completed successfully: $BACKUP_FILE.gz"

# Send notification
curl -X POST "$SLACK_WEBHOOK_URL" \
    -H 'Content-type: application/json' \
    --data "{\"text\":\"🗄️ BlueSphere database backup completed: $BACKUP_FILE.gz\"}"
```

---

## 🚀 CDN & Performance

### Vercel Edge Configuration

```javascript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Cache API responses
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  }

  // Cache static assets
  if (request.nextUrl.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|webp|avif)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/static/:path*', '/_next/:path*']
}
```

### CloudFront Configuration

```json
{
  "CacheBehaviors": [
    {
      "PathPattern": "/api/*",
      "TargetOriginId": "bluesphere-api",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
      "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
      "TTL": {
        "DefaultTTL": 300,
        "MaxTTL": 3600,
        "MinTTL": 0
      }
    },
    {
      "PathPattern": "/_next/static/*",
      "TargetOriginId": "bluesphere-static",
      "ViewerProtocolPolicy": "redirect-to-https",
      "TTL": {
        "DefaultTTL": 31536000,
        "MaxTTL": 31536000,
        "MinTTL": 31536000
      },
      "Compress": true
    }
  ]
}
```

---

## 📊 Monitoring & Logging

### Application Monitoring

#### Sentry Configuration

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // Filter out expected errors
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.type === 'ChunkLoadError') {
        return null
      }
    }
    return event
  },
  integrations: [
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', 'bluesphere.org', /^\//],
    }),
  ],
})
```

#### Custom Metrics

```javascript
// lib/monitoring.js
import { metrics } from '@opentelemetry/api-metrics'

const meter = metrics.getMeter('bluesphere', '1.0.0')

// Create custom metrics
const apiRequestDuration = meter.createHistogram('api_request_duration', {
  description: 'Duration of API requests',
  unit: 'ms',
})

const dbQueryDuration = meter.createHistogram('db_query_duration', {
  description: 'Duration of database queries',
  unit: 'ms',
})

const activeStationsGauge = meter.createGauge('active_stations_count', {
  description: 'Number of active monitoring stations',
})

export function recordApiRequest(endpoint, duration, status) {
  apiRequestDuration.record(duration, {
    endpoint,
    status_code: status.toString(),
  })
}

export function recordDbQuery(query, duration) {
  dbQueryDuration.record(duration, {
    query_type: query,
  })
}

export function updateActiveStations(count) {
  activeStationsGauge.record(count)
}
```

### Health Check Endpoints

```javascript
// pages/api/health.js
import { connectToDatabase } from '../../lib/database'

export default async function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    checks: {}
  }

  try {
    // Database health check
    const startDb = Date.now()
    await connectToDatabase()
    const dbTime = Date.now() - startDb

    health.checks.database = {
      status: 'healthy',
      response_time: `${dbTime}ms`
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.database = {
      status: 'unhealthy',
      error: error.message
    }
  }

  // External API health check
  try {
    const startApi = Date.now()
    const response = await fetch('https://www.ndbc.noaa.gov/rss/ndbc_obs_search.php?lat=40N&lon=70W&radius=100')
    const apiTime = Date.now() - startApi

    health.checks.external_api = {
      status: response.ok ? 'healthy' : 'degraded',
      response_time: `${apiTime}ms`,
      status_code: response.status
    }
  } catch (error) {
    health.checks.external_api = {
      status: 'unhealthy',
      error: error.message
    }
  }

  const statusCode = health.status === 'healthy' ? 200 : 503
  res.status(statusCode).json(health)
}
```

### Log Management

```javascript
// lib/logger.js
import winston from 'winston'

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'bluesphere',
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV
  },
  transports: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'logs/combined.log' })
    ] : [])
  ]
})

export default logger
```

---

## 🔒 Security Configuration

### Environment Security

```bash
# .env.example
# Copy to .env.local and fill in your values

# Required in production
NODE_ENV=production
NEXTAUTH_SECRET=generate_a_super_secure_secret_here
DATABASE_URL=postgresql://username:password@host:5432/database

# API Keys (keep secure)
NDBC_API_KEY=your_ndbc_api_key_here
NOAA_API_KEY=your_noaa_api_key_here

# Optional monitoring
SENTRY_DSN=https://your-sentry-dsn
UPTIME_ROBOT_API_KEY=your_uptime_robot_key
```

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name bluesphere.org www.bluesphere.org;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name bluesphere.org www.bluesphere.org;
    return 301 https://$server_name$request_uri;
}
```

---

## 💾 Backup & Recovery

### Automated Backup Strategy

```bash
#!/bin/bash
# Full system backup script

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/bluesphere"
S3_BUCKET="bluesphere-backups"

echo "🔄 Starting full system backup..."

# Database backup
echo "📦 Backing up database..."
pg_dump "$DATABASE_URL" --clean --if-exists > "$BACKUP_DIR/database_$BACKUP_DATE.sql"

# Application code backup
echo "📦 Backing up application..."
tar -czf "$BACKUP_DIR/application_$BACKUP_DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=.next \
    --exclude=logs \
    ./

# Environment configuration backup
echo "📦 Backing up configuration..."
cp .env.production "$BACKUP_DIR/env_$BACKUP_DATE.txt"

# Upload to S3
echo "☁️ Uploading to S3..."
aws s3 sync "$BACKUP_DIR" "s3://$S3_BUCKET/backups/$BACKUP_DATE/"

# Cleanup old backups
echo "🧹 Cleaning up old backups..."
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed successfully"
```

### Disaster Recovery Plan

```bash
#!/bin/bash
# disaster-recovery.sh

set -e

BACKUP_DATE=${1}
S3_BUCKET="bluesphere-backups"
RECOVERY_DIR="/tmp/recovery"

if [[ -z "$BACKUP_DATE" ]]; then
    echo "Usage: ./disaster-recovery.sh BACKUP_DATE"
    echo "Available backups:"
    aws s3 ls "s3://$S3_BUCKET/backups/" --recursive | grep "database_"
    exit 1
fi

echo "🚨 Starting disaster recovery for backup: $BACKUP_DATE"

# Create recovery directory
mkdir -p "$RECOVERY_DIR"

# Download backup files
echo "⬇️ Downloading backup files..."
aws s3 cp "s3://$S3_BUCKET/backups/$BACKUP_DATE/" "$RECOVERY_DIR/" --recursive

# Restore database
echo "🗄️ Restoring database..."
dropdb --if-exists bluesphere_recovery
createdb bluesphere_recovery
psql bluesphere_recovery < "$RECOVERY_DIR/database_$BACKUP_DATE.sql"

# Extract application files
echo "📦 Extracting application..."
tar -xzf "$RECOVERY_DIR/application_$BACKUP_DATE.tar.gz" -C "$RECOVERY_DIR/"

# Restore environment
echo "⚙️ Restoring configuration..."
cp "$RECOVERY_DIR/env_$BACKUP_DATE.txt" .env.recovery

echo "✅ Disaster recovery completed"
echo "📋 Next steps:"
echo "1. Review recovered files in $RECOVERY_DIR"
echo "2. Update database connection to point to bluesphere_recovery"
echo "3. Test application functionality"
echo "4. Switch to production when ready"
```

---

## 🔧 Troubleshooting

### Common Deployment Issues

#### Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Check for linting errors
npm run lint --fix
```

#### Database Connection Issues

```javascript
// Test database connection
const testDbConnection = async () => {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT NOW()')
    console.log('Database connected:', result.rows[0])
    client.release()
  } catch (error) {
    console.error('Database connection failed:', error.message)

    // Common solutions
    if (error.code === 'ENOTFOUND') {
      console.log('Check: Database host is correct')
    } else if (error.code === 'ECONNREFUSED') {
      console.log('Check: Database is running and port is correct')
    } else if (error.code === '28P01') {
      console.log('Check: Username and password are correct')
    }
  }
}
```

#### Performance Issues

```javascript
// Monitor API response times
const measureApiPerformance = async (endpoint) => {
  const start = Date.now()
  try {
    const response = await fetch(endpoint)
    const duration = Date.now() - start
    console.log(`${endpoint}: ${duration}ms`)

    if (duration > 1000) {
      console.warn(`Slow response detected: ${endpoint} took ${duration}ms`)
    }

    return response
  } catch (error) {
    console.error(`API error: ${endpoint}`, error.message)
  }
}
```

### Monitoring Commands

```bash
# Check application health
curl -f https://bluesphere.org/api/health

# Monitor logs in real-time
docker-compose logs -f app

# Check database performance
psql "$DATABASE_URL" -c "
  SELECT query, mean_time, calls, total_time
  FROM pg_stat_statements
  ORDER BY total_time DESC
  LIMIT 10;
"

# Monitor system resources
docker stats

# Check SSL certificate
openssl s_client -connect bluesphere.org:443 -servername bluesphere.org
```

### Recovery Procedures

#### Application Recovery

```bash
# Quick rollback to previous version
vercel --prod --force

# Rollback database migration
psql "$DATABASE_URL" -c "DELETE FROM schema_migrations WHERE version = 'problematic_version';"

# Restart application
docker-compose restart app

# Clear cache
redis-cli FLUSHALL
```

#### Data Recovery

```bash
# Restore from backup
aws s3 cp s3://bluesphere-backups/latest/database_backup.sql ./
psql "$DATABASE_URL" < database_backup.sql

# Rebuild search indexes
psql "$DATABASE_URL" -c "REINDEX DATABASE bluesphere;"

# Refresh materialized views
psql "$DATABASE_URL" -c "REFRESH MATERIALIZED VIEW CONCURRENTLY ocean_data.station_latest_observations;"
```

---

## 📞 Support & Resources

### Emergency Contacts

- **On-call Engineer**: +1-555-0123
- **DevOps Team**: devops@bluesphere.org
- **Database Admin**: dba@bluesphere.org

### Monitoring Dashboards

- **Application**: [grafana.bluesphere.org](https://grafana.bluesphere.org)
- **Infrastructure**: [cloudwatch.aws.amazon.com](https://cloudwatch.aws.amazon.com)
- **Uptime**: [status.bluesphere.org](https://status.bluesphere.org)

### Documentation

- **Runbooks**: [docs.bluesphere.org/runbooks](https://docs.bluesphere.org/runbooks)
- **API Docs**: [api.bluesphere.org](https://api.bluesphere.org)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Deployment Guide Version**: 1.0.0
**Last Updated**: September 21, 2025
**Maintained by**: BlueSphere DevOps Team

---

*🌊 Keeping the world's ocean monitoring infrastructure running smoothly, one deployment at a time.*