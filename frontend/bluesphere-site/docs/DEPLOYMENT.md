# 🚀 BlueSphere Deployment Guide

This guide covers deployment procedures for BlueSphere across different environments.

## Deployment Environments

### Development (localhost:4000)
- **Purpose**: Local development and testing
- **Trigger**: Manual start with `npm run dev`
- **Database**: Local/mock data
- **APIs**: Mock endpoints or staging APIs

### Staging (staging.bluesphere.org)
- **Purpose**: Pre-production testing and validation
- **Trigger**: Push to `develop` branch
- **Infrastructure**: Reduced capacity AWS/Vercel
- **Database**: Staging database with sample data

### Production (bluesphere.org)
- **Purpose**: Live production system
- **Trigger**: Push to `main` branch (manual approval required)
- **Infrastructure**: Full production AWS/Vercel
- **Database**: Production database with real data

## Prerequisites

- Node.js 18.0+
- AWS CLI configured
- Vercel CLI installed
- GitHub repository access
- Environment variables configured

## Deployment Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start

# Export static files
npm run export

# Deploy to staging
npm run deploy:staging

# Deploy to production (requires approval)
npm run deploy:production
```

## Environment Configuration

Create appropriate `.env` files for each environment:

```bash
# .env.local (development)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NODE_ENV=development

# .env.staging
NEXT_PUBLIC_API_BASE_URL=https://api-staging.bluesphere.org
NODE_ENV=production

# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.bluesphere.org
NODE_ENV=production
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
name: Deploy BlueSphere

on:
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test
      - name: Run type check
        run: npm run type-check
      - name: Run lint
        run: npm run lint

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel Staging
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Vercel Production
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## Infrastructure as Code

### Terraform Configuration

```hcl
# main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "static_assets" {
  bucket = "${var.project_name}-assets-${var.environment}"
}

resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.static_assets.bucket_domain_name
    origin_id   = "S3-${aws_s3_bucket.static_assets.bucket}"
  }
}
```

## Monitoring and Health Checks

### Health Check Endpoints

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    environment: process.env.NODE_ENV,
    services: {
      database: 'healthy',
      external_apis: 'healthy'
    }
  }
  
  res.status(200).json(health)
}
```

### Monitoring Setup

- **Application monitoring**: Sentry for error tracking
- **Performance monitoring**: Vercel Analytics
- **Uptime monitoring**: StatusCake or Pingdom
- **Log aggregation**: CloudWatch or DataDog

## Rollback Procedures

### Automatic Rollback

```bash
# Rollback to previous deployment
vercel rollback

# Rollback to specific deployment
vercel rollback --url=deployment-url
```

### Manual Rollback

1. Identify last known good deployment
2. Revert problematic commits
3. Trigger new deployment
4. Verify system functionality
5. Update monitoring and alerts

## Database Migrations

### Production Migration Process

1. **Backup database**
   ```bash
   pg_dump -h host -U user -d database > backup.sql
   ```

2. **Run migrations in staging**
   ```bash
   npm run db:migrate:staging
   ```

3. **Test thoroughly in staging**
4. **Schedule maintenance window**
5. **Run production migrations**
   ```bash
   npm run db:migrate:production
   ```

6. **Verify data integrity**
7. **Update application**

## Security Considerations

### Secrets Management

- Use environment variables for sensitive data
- Store secrets in AWS Secrets Manager or Vercel env vars
- Never commit secrets to version control
- Rotate secrets regularly
- Use different secrets for each environment

### SSL/TLS Configuration

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ]
  }
}
```

## Performance Optimization

### Build Optimization

```javascript
// next.config.js
module.exports = {
  swcMinify: true,
  compress: true,
  generateEtags: true,
  images: {
    formats: ['image/webp', 'image/avif']
  },
  webpack: (config) => {
    config.optimization.splitChunks.chunks = 'all'
    return config
  }
}
```

### CDN Configuration

- Enable compression (Gzip/Brotli)
- Set appropriate cache headers
- Use edge functions for dynamic content
- Implement cache invalidation strategy

## Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node modules
rm -rf node_modules && npm ci

# Check for TypeScript errors
npm run type-check
```

**Memory Issues**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Environment Variables Not Loading**
- Verify `.env` file exists and is properly named
- Check variable names have `NEXT_PUBLIC_` prefix for client-side variables
- Restart development server after changes

### Debug Commands

```bash
# Analyze bundle size
npm run build && npx @next/bundle-analyzer

# Check for unused dependencies
npx depcheck

# Audit for security vulnerabilities
npm audit

# Generate build info
npm run build -- --debug
```

## Disaster Recovery

### Backup Strategy

1. **Code**: Git repository with multiple remotes
2. **Database**: Daily automated backups
3. **Assets**: S3 with cross-region replication
4. **Configuration**: Infrastructure as Code in Git

### Recovery Procedures

1. **Assess scope of outage**
2. **Activate incident response team**
3. **Restore from backups if needed**
4. **Verify system functionality**
5. **Update monitoring and documentation**
6. **Conduct post-incident review**

This deployment guide ensures reliable, secure, and scalable deployments of BlueSphere across all environments.