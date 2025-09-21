# BlueSphere Docker Deployment Guide

## Overview

This guide explains how to run BlueSphere marine monitoring platform in Docker containers for both development and production environments. Docker provides isolation, consistency, and easier deployment to Render.

## Current Agent Status

**No Docker containers or specialized agents currently running.** The system is currently using native development server on port 4000.

## Docker Setup Benefits

### 1. Development Safety
- **Environment Isolation**: Your host system remains clean
- **Consistent Dependencies**: Same Node.js version across all environments
- **Easy Reset**: Destroy and recreate containers without affecting your system
- **Database Included**: PostgreSQL and Redis containers for realistic development

### 2. Deployment Advantages
- **Render Compatibility**: Render natively supports Docker deployments
- **Production Parity**: Development environment matches production exactly
- **Automated Builds**: Render builds directly from Dockerfile
- **Better Security**: Container isolation and non-root user execution

## Quick Start

### Development Environment
```bash
# Start development environment
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f bluesphere-app

# Stop all services
docker-compose down

# Complete cleanup (removes volumes)
docker-compose down -v
```

### Production Testing
```bash
# Build production image
docker build -t bluesphere-frontend .

# Run production container
docker run -p 3000:3000 --name bluesphere-prod bluesphere-frontend

# Test health check
curl http://localhost:3000/health
```

## Docker Files Created

### Core Configuration
- **Dockerfile**: Production-optimized multi-stage build
- **Dockerfile.dev**: Development image with hot reloading
- **docker-compose.yml**: Complete development stack
- **docker-compose.override.yml**: Development overrides
- **.dockerignore**: Optimized build context

### Deployment Configuration
- **render-docker.yaml**: Render platform deployment with Docker
- **healthcheck.js**: Container health monitoring

### Supporting Infrastructure
- **docker/nginx/nginx.conf**: Production reverse proxy
- **docker/postgres/init.sql**: Database initialization with marine data

## Service Architecture

### Development Stack (docker-compose up)
- **bluesphere-app**: Next.js development server (port 4000)
- **bluesphere-db**: PostgreSQL with PostGIS for marine data
- **bluesphere-redis**: Redis for caching and real-time features
- **bluesphere-api**: Future API service for marine data processing

### Production Stack (Render)
- **bluesphere-frontend**: Optimized Next.js production build
- **bluesphere-postgres**: Managed PostgreSQL with PostGIS
- **bluesphere-redis**: Managed Redis cache
- **Load Balancing**: Automatic scaling based on CPU/memory

## Render Deployment Impact

### How Docker Affects Render

#### ✅ Advantages
1. **Consistent Builds**: Same environment locally and in production
2. **Faster Deployments**: Docker layer caching reduces build times
3. **Better Security**: Non-root container execution
4. **Simplified Configuration**: All dependencies included in image
5. **Database Integration**: Automatic service linking via render-docker.yaml

#### ⚠️ Considerations
1. **Build Time**: Initial builds take longer than native Node.js
2. **Image Size**: Multi-stage build mitigates this (~50MB final image)
3. **Memory Usage**: Slightly higher due to container overhead
4. **Debugging**: Requires container access for troubleshooting

### GitHub Integration
When you commit Docker configuration to GitHub:
1. **Render Auto-Deploy**: Detects Dockerfile and switches to Docker mode
2. **Environment Variables**: Automatically mapped from render-docker.yaml
3. **Service Discovery**: Database and Redis URLs injected automatically
4. **Health Checks**: Container health monitoring enabled

## Migration Strategy

### Phase 1: Local Development
```bash
# Install Docker Desktop (if not installed)
# Start development stack
docker-compose up --build

# Access application
open http://localhost:4000
```

### Phase 2: Render Configuration
1. Update Render dashboard to use Docker deployment
2. Configure environment variables from render-docker.yaml
3. Enable PostgreSQL and Redis services
4. Test deployment pipeline

### Phase 3: Production Optimization
- Enable Docker layer caching
- Configure auto-scaling parameters
- Set up monitoring and alerts
- Implement blue-green deployments

## Database Schema

The Docker setup includes a complete PostgreSQL database with:
- **PostGIS Extension**: Geospatial queries for marine tracking
- **Marine Species Catalog**: Scientific names and conservation status
- **Shark Tracking Data**: Real-time movement and behavior data
- **Monitoring Stations**: Ocean sensor infrastructure
- **Citizen Science Reports**: Community contributions

## Security Features

### Container Security
- **Non-root execution**: All processes run as user 'nextjs'
- **Minimal base image**: Alpine Linux reduces attack surface
- **Health checks**: Automatic container restart on failure
- **Resource limits**: Prevent resource exhaustion

### NGINX Security Headers
- **HSTS**: Force HTTPS connections
- **XSS Protection**: Cross-site scripting prevention
- **Content Security Policy**: Restrict resource loading
- **Rate Limiting**: API abuse prevention

## Monitoring and Debugging

### Health Checks
```bash
# Check container health
docker-compose ps

# View application logs
docker-compose logs bluesphere-app

# Database connection test
docker-compose exec bluesphere-db psql -U bluesphere_admin -d bluesphere_marine
```

### Performance Monitoring
- Container resource usage
- Database query performance
- Redis cache hit rates
- NGINX request metrics

## Next Steps

1. **Install Docker Desktop** (if not already installed)
2. **Test local development**: `docker-compose up --build`
3. **Commit Docker configuration** to GitHub
4. **Update Render deployment** to use Docker
5. **Monitor production performance**

## Support

For Docker-related issues:
- Check container logs: `docker-compose logs service-name`
- Restart services: `docker-compose restart service-name`
- Reset environment: `docker-compose down -v && docker-compose up --build`