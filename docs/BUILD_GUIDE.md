# BlueSphere Build & CI/CD Guide

## Overview

This document provides comprehensive information about building, testing, and deploying the BlueSphere Next.js application. The project uses a robust CI/CD pipeline with GitHub Actions for automated testing, building, and deployment to GitHub Pages.

## Build Configuration

### Technology Stack
- **Framework**: Next.js 14.2.5 with TypeScript
- **Build Target**: Static export for GitHub Pages
- **Node.js**: Version 20
- **Package Manager**: npm
- **Linting**: ESLint with Next.js rules
- **UI**: Tailwind CSS, React Leaflet for maps

### Project Structure
```
frontend/bluesphere-site/
├── pages/              # Next.js pages
├── components/         # Reusable React components  
├── lib/               # Utility libraries
├── public/            # Static assets
├── styles/            # CSS and Tailwind styles
├── next.config.js     # Next.js configuration
├── tsconfig.json      # TypeScript configuration
├── .eslintrc.json     # ESLint rules
└── package.json       # Dependencies and scripts
```

## Local Development

### Prerequisites
- Node.js 20 or higher
- npm (comes with Node.js)

### Setup Instructions
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd bluesphere/frontend/bluesphere-site
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   - Server runs on `http://localhost:4000`
   - Hot reload enabled for rapid development

### Available Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `dev` | Start development server | `npm run dev` |
| `build` | Production build with static export | `npm run build` |
| `start` | Start production server | `npm start` |
| `lint` | Run ESLint code analysis | `npm run lint` |
| `lint:fix` | Auto-fix ESLint issues | `npm run lint:fix` |
| `type-check` | TypeScript type checking | `npm run type-check` |
| `test` | Run all quality checks | `npm run test` |
| `test:e2e` | Playwright end-to-end tests | `npm run test:e2e` |

## Build Process

### Local Build
```bash
# Clean previous build
rm -rf .next out

# Run production build
npm run build

# Verify output
ls -la out/
```

### Build Output
- Static files are generated in the `out/` directory
- All pages are pre-rendered as HTML files
- Assets are optimized and fingerprinted
- Build includes service worker for caching

### Build Features
- **Static Site Generation (SSG)**: All pages pre-rendered at build time
- **Image Optimization**: Disabled for static export compatibility
- **Code Splitting**: Automatic bundle splitting for optimal loading
- **Tree Shaking**: Unused code automatically removed

## CI/CD Pipeline

### GitHub Actions Workflow
Location: `.github/workflows/deploy-pages.yml`

### Pipeline Stages

#### 1. Quality Checks (`test` job)
**Triggers**: All pushes and pull requests to `master` branch

- **Checkout**: Gets the latest code
- **Node.js Setup**: Installs Node.js 20 with npm caching
- **Dependencies**: Installs packages with `npm ci`
- **TypeScript Check**: Validates TypeScript types
- **ESLint**: Code quality and style analysis
- **Build Test**: Verifies production build succeeds
- **E2E Tests**: Runs Playwright tests (if configured)

#### 2. Production Build (`build` job)  
**Triggers**: Only on `master` branch pushes and manual dispatch

- **Dependencies**: Fresh install of all packages
- **Build**: Creates optimized production build
- **Static Export**: Generates static HTML/CSS/JS files
- **Verification**: Confirms required files exist
- **Artifact Upload**: Prepares files for deployment

#### 3. Deployment (`deploy` job)
**Triggers**: After successful build

- **GitHub Pages Deploy**: Publishes to GitHub Pages
- **URL Assignment**: Makes site available at GitHub Pages URL
- **Summary**: Reports deployment status

### Environment Variables

#### Repository Level
Set in GitHub repository Settings > Secrets and Variables:

| Variable | Purpose | Required |
|----------|---------|----------|
| `GITHUB_TOKEN` | Automatic GitHub auth | Auto-provided |
| `NODE_VERSION` | Node.js version | Set to `20` |

#### Application Level  
For local development, copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

**Note**: The frontend is a static site, so runtime environment variables are not supported. All configuration must be build-time constants.

## Troubleshooting

### Common Build Issues

#### 1. "document is not defined" Error
**Problem**: Client-side code running during server-side rendering
**Solution**: Add browser check:
```typescript
if (typeof window !== 'undefined') {
  // Client-side code here
}
```

#### 2. ESLint Configuration Errors
**Problem**: Version conflicts with ESLint rules
**Solution**: Update `.eslintrc.json` with compatible rules
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-html-link-for-pages": "off"
  }
}
```

#### 3. Build Fails on API Routes
**Problem**: API routes don't work with static export
**Solution**: Remove server-side API routes or use external APIs

#### 4. Image Optimization Issues  
**Problem**: Next.js Image component requires server
**Solution**: Set `images: { unoptimized: true }` in `next.config.js`

#### 5. Dependency Installation Failures
**Problem**: Network or permission issues
**Solution**: 
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Performance

#### Optimization Strategies
1. **Bundle Analysis**: Use `npm run analyze` (if added)
2. **Code Splitting**: Lazy load heavy components
3. **Image Optimization**: Use WebP format where possible  
4. **Caching**: Configure proper cache headers

#### Monitoring Build Times
- Typical build time: 2-4 minutes
- Watch for increases indicating performance issues
- GitHub Actions provides detailed timing

## Deployment

### GitHub Pages Configuration
1. **Repository Settings** → **Pages**
2. **Source**: GitHub Actions
3. **Custom Domain**: Configure if needed
4. **HTTPS**: Always enforced

### Manual Deployment
For emergency deployments:
1. Go to GitHub Actions
2. Select "CI/CD Pipeline" workflow  
3. Click "Run workflow" button
4. Select `master` branch
5. Click "Run workflow"

### Production URLs
- **Live Site**: `https://{username}.github.io/{repository-name}/`
- **Build Status**: Check GitHub Actions tab
- **Deployment History**: Available in repository Environments

## Development Best Practices

### Code Quality
- **TypeScript**: Use strict type checking
- **ESLint**: Follow established rules
- **Testing**: Add tests for new features
- **Documentation**: Update docs with changes

### Git Workflow
- **Feature Branches**: Create branches for new features
- **Pull Requests**: Required for `master` branch
- **Code Review**: Get approval before merging
- **Quality Gates**: All checks must pass

### Performance Monitoring
- **Lighthouse**: Run performance audits
- **Bundle Size**: Monitor JavaScript bundle growth
- **Loading Speed**: Optimize for mobile networks
- **SEO**: Ensure pages are properly indexed

## Support

### Getting Help
1. **Check Build Logs**: GitHub Actions provides detailed logs
2. **Local Testing**: Reproduce issues locally first  
3. **Documentation**: Review Next.js and React docs
4. **Community**: Stack Overflow for framework questions

### Reporting Issues
When reporting build issues, include:
- Error messages (full stack trace)
- Build environment details
- Steps to reproduce
- Expected vs actual behavior

---

**Last Updated**: September 2025
**Version**: 1.0.0
**Maintainer**: BlueSphere Development Team