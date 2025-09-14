# 🚨 BlueSphere Crash Recovery Guide

**CRITICAL:** If our session crashes, use this guide to restore context immediately.

## 📋 Current State (September 14, 2025)

### ✅ Recently Completed
- **Fixed render issues** - All pages use Layout component (no more useTheme errors)
- **Enhanced documentation** - Added consistency.md, crisis.md, expanded about.md
- **Created architecture page** - /architecture route with complete system overview
- **Automated data refresh** - GitHub Actions workflow for 6-hour updates
- **Persistent TODO list** - Located at `/TODO.md`

### 🔄 Currently Working On
1. **Real NDBC data integration** - Replace mock data with actual NOAA feeds
2. **5-year historical cycling** - Core PRD requirement for temporal visualization
3. **Mobile optimization** - Performance and responsive design improvements
4. **Educational content** - Storytelling features for climate advocacy

### 🎯 Priority Gap Analysis (PRD vs Implementation)

**CRITICAL GAPS:**
- **Data:** Still using mock data instead of real NDBC/ERSST feeds
- **Historical:** Missing 5-year cycling animation (PRD's key differentiator)
- **ML:** Models not trained on real oceanographic data
- **Mobile:** Limited mobile optimization
- **Education:** Missing storytelling content for activists/educators

## 🔧 Technical Context

**Architecture:**
- Next.js 14 with TypeScript
- Database: Mock implementation (needs PostgreSQL)
- Models: Station, BuoyObservation, JobRun (in `lib/data-ingestion.ts`)
- QC System: Comprehensive validation (in `lib/database/validation.ts`)
- APIs: 9 endpoints for data access and ingestion

**Key Files:**
- `/TODO.md` - Persistent todo list
- `/ARCHITECTURE.md` - Complete system documentation
- `/PRD.md` - Product requirements (very comprehensive)
- `pages/architecture.tsx` - Public architecture page
- `lib/data-ingestion.ts` - Data models and ingestion
- `lib/database/validation.ts` - Quality control system

**Git Status:**
- Last commit: Enhanced documentation and render fixes
- Clean working tree
- On branch: main

## 🚀 Next Immediate Actions

1. **Real Data Integration** (High Priority)
   - Replace mock NDBC fetcher with real NOAA API calls
   - Implement PostgreSQL database
   - Set up automated 6-hour refresh via GitHub Actions

2. **5-Year Historical Feature** (Core PRD)
   - Add time slider for 5-year data cycling
   - Implement ERSST v5 integration for historical data
   - Create animation controls for temporal visualization

3. **Mobile & Performance**
   - Optimize for mobile users (major user segment)
   - Add PWA capabilities
   - Implement CDN and caching

4. **Educational Features**
   - Add climate storytelling content
   - Create educational narratives
   - Implement social sharing

## 📊 Success Metrics (PRD Targets)
- **Users:** 50K monthly active users within 12 months
- **Engagement:** 12+ minute sessions
- **Impact:** 100+ scientific citations, 25+ policy reports
- **Education:** 500+ institutions using curriculum

## 🔗 Important Links
- Repository: `/Users/marklindon/BlueSphere/bluesphere/`
- Frontend: `/Users/marklindon/BlueSphere/bluesphere/frontend/bluesphere-site/`
- Live site: http://localhost:4000 (dev)
- Architecture page: http://localhost:4000/architecture

## 🆘 Emergency Commands
```bash
# Navigate to project
cd /Users/marklindon/BlueSphere/bluesphere/frontend/bluesphere-site/

# Start dev server
npm run dev

# Check git status
git status

# View current todo list
cat /Users/marklindon/BlueSphere/bluesphere/TODO.md

# Check build status
npm run build
```

---
*Keep this file updated after major changes*