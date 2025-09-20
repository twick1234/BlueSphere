# BlueSphere Build Guide
*Development and Deployment Instructions*

**Copyright (c) 2025 Mark Lindon — BlueSphere**

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Development Setup](#development-setup)
4. [Build Process](#build-process)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Environment Configuration](#environment-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: Version 18.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **Git**: Latest version for version control
- **Modern Browser**: Chrome, Firefox, Safari, or Edge for testing

### Recommended Tools
- **VS Code**: With extensions for TypeScript, React, and Tailwind CSS
- **GitHub CLI**: For easier repository management
- **Vercel CLI**: For deployment (if using Vercel)

### System Requirements
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space for dependencies and builds
- **Network**: Stable internet connection for API integrations

---

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/twick1234/BlueSphere.git
cd BlueSphere/frontend/bluesphere-site
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Verify Installation
```bash
npm run dev
```
Visit `http://localhost:3000` to confirm the site loads correctly.

---

## Development Setup

### Project Structure
```
frontend/bluesphere-site/
├── components/          # React components
│   ├── Layout.tsx      # Main layout wrapper
│   ├── SharkMap.tsx    # Basic shark tracking map
│   ├── EnhancedSharkMap.tsx # Advanced tracking with timeline
│   ├── MarineHeatwaveAlerts.tsx # Alert system
│   └── StorytellingContent.tsx # Educational content
├── lib/                # Utilities and services
│   ├── shark-tracking.ts # Shark data integration
│   ├── marine-heatwave-alerts.ts # Alert system logic
│   ├── performance.ts  # Optimization utilities
│   └── data-ingestion.ts # Ocean data APIs
├── pages/              # Next.js pages
│   ├── index.tsx       # Homepage
│   ├── map.tsx         # Interactive map
│   ├── stories/        # Educational content
│   └── api/           # Backend API endpoints
├── styles/             # CSS and styling
│   └── premium-theme.css # Main styling system
├── public/             # Static assets
└── __tests__/          # Test files
```

### Environment Variables
Create `.env.local`:
```bash
NEXT_PUBLIC_API_BASE=http://localhost:3000
NOAA_API_KEY=your_noaa_api_key_here
GITHUB_TOKEN=your_github_token_here
```

### Development Commands
```bash
# Start development server
npm run dev

# Run in production mode locally
npm run build
npm run start

# Type checking
npx tsc --noEmit

# Run tests
npm test

# Run comprehensive test harness
node test-harness.js
```

---

## Build Process

### Production Build
```bash
# Create optimized build
npm run build

# Check build output
ls -la .next/

# Test production build locally
npm run start
```

### Build Verification
```bash
# Run comprehensive test harness
node test-harness.js

# Check for TypeScript errors
npx tsc --noEmit

# Verify all pages compile
npm run build 2>&1 | grep "Compiled successfully"
```

### Build Optimization
- **Static Generation**: Pages pre-rendered at build time
- **Code Splitting**: Automatic bundle optimization
- **Image Optimization**: Next.js built-in image optimization
- **CSS Minimization**: Production-ready stylesheet compression

---

## Testing

### Automated Test Harness
```bash
# Run full test suite
node test-harness.js

# Expected output:
# ✅ PASS: 67+ tests passing
# ❌ FAIL: Any critical issues
# 📊 Success Rate: 85%+ recommended
```

### Test Categories
1. **Environment Validation**: Node.js, npm versions
2. **Dependency Checks**: Required packages installed
3. **Code Quality**: TypeScript compilation, linting
4. **Build Verification**: Production build success
5. **API Connectivity**: External data sources accessible
6. **Performance**: Load times and responsiveness

### Manual Testing Checklist
- [ ] Homepage loads with climate statistics
- [ ] Map displays with shark markers
- [ ] Timeline controls work smoothly
- [ ] Stories section loads all content
- [ ] Alerts page shows heatwave data
- [ ] Mobile responsive design functions
- [ ] All navigation links work
- [ ] Error boundaries handle failures gracefully

### Performance Testing
```bash
# Check bundle size
npm run analyze

# Memory usage monitoring
node --inspect test-harness.js

# Load testing (if available)
npm run load-test
```

---

## Deployment

### Vercel Deployment (Recommended)
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Environment Variables**:
   Set in Vercel dashboard:
   - `NEXT_PUBLIC_API_BASE`
   - `NOAA_API_KEY`
   - Any other required variables

### Alternative Deployments

#### Netlify
```bash
# Build command
npm run build

# Publish directory
.next
```

#### GitHub Pages
```bash
# Add to package.json
"export": "next export",
"deploy": "npm run build && npm run export"

# Deploy
npm run deploy
```

#### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Deployment Checklist
- [ ] Environment variables configured
- [ ] Build completes successfully
- [ ] All API endpoints accessible
- [ ] Static assets load correctly
- [ ] Performance metrics acceptable
- [ ] Error tracking configured
- [ ] Analytics (if enabled) working
- [ ] Domain and SSL configured

---

## Environment Configuration

### Development Environment
```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_API_BASE=http://localhost:3000
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Production Environment
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_API_BASE=https://your-domain.com
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NOAA_API_KEY=production_key_here
```

### API Configuration
- **NOAA NDBC**: Real-time buoy data integration
- **OCEARCH**: Shark tracking data source
- **Satellite Data**: Sea surface temperature feeds
- **Rate Limiting**: Respect API quotas and limits

---

## Troubleshooting

### Common Build Issues

#### **Node Version Mismatch**
```bash
# Check version
node --version

# Use Node Version Manager
nvm install 18
nvm use 18
```

#### **Dependency Conflicts**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### **TypeScript Errors**
```bash
# Check configuration
cat tsconfig.json

# Exclude problematic directories
# Add to tsconfig.json exclude array:
"exclude": ["node_modules", "__tests__", "*.test.ts"]
```

#### **Build Memory Issues**
```bash
# Increase Node.js memory
NODE_OPTIONS="--max_old_space_size=4096" npm run build
```

### Development Issues

#### **Hot Reload Not Working**
- Check file permissions
- Restart development server
- Clear browser cache
- Verify file watch limits (Linux/Mac)

#### **API Calls Failing**
- Check network connectivity
- Verify API keys and endpoints
- Review CORS settings
- Check rate limiting

#### **Styling Issues**
- Clear Tailwind CSS cache
- Verify CSS imports
- Check browser compatibility
- Test responsive breakpoints

### Performance Issues

#### **Slow Build Times**
```bash
# Parallel processing
npm config set jobs max

# Use SWC instead of Babel
# Add to next.config.js:
module.exports = {
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  }
}
```

#### **Large Bundle Size**
- Analyze bundle with `npm run analyze`
- Implement code splitting
- Remove unused dependencies
- Optimize images and assets

---

## Advanced Configuration

### Next.js Configuration
```javascript
// next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['example.com'],
    formats: ['image/webp', 'image/avif'],
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ]
  },
}
```

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "__tests__"]
}
```

### ESLint Configuration
```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-html-link-for-pages": "off",
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

---

## Monitoring and Maintenance

### Performance Monitoring
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Bundle Analysis**: Regular size monitoring
- **API Response Times**: External service monitoring
- **Error Tracking**: Production error logging

### Regular Maintenance
- **Dependency Updates**: Monthly security updates
- **Performance Audits**: Quarterly optimization reviews
- **Content Updates**: Fresh educational material
- **Data Quality**: API endpoint health checks

### Backup and Recovery
- **Code Repository**: Git with multiple remotes
- **Database Backups**: If using persistent storage
- **Configuration Backups**: Environment variables stored securely
- **Documentation**: Keep build processes documented

---

## Contributing Guidelines

### Development Workflow
1. **Fork Repository**: Create personal fork
2. **Feature Branch**: Create descriptive branch name
3. **Development**: Follow existing code patterns
4. **Testing**: Run test harness before committing
5. **Pull Request**: Submit with detailed description

### Code Standards
- **TypeScript**: Strict typing where possible
- **React**: Functional components with hooks
- **Styling**: Tailwind CSS with custom theme
- **Performance**: Optimize for mobile-first experience
- **Accessibility**: WCAG 2.1 compliance

### Commit Messages
```bash
# Format
type(scope): description

# Examples
feat(sharks): add individual track toggle controls
fix(timeline): resolve playback speed synchronization
docs(guide): update installation instructions
perf(images): implement lazy loading optimization
```

---

*This build guide is maintained alongside the codebase. For the latest information, check the GitHub repository.*

**Last Updated**: January 2025
**Version**: 2.0.0