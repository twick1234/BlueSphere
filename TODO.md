# BlueSphere Development TODO List

**Author:** Mark Lindon
**Last Updated:** September 14, 2025
**Status:** Active Development

## 🔄 In Progress

- [ ] **Test real NDBC data integration** - Upgraded fetcher to use real NOAA API
- [ ] **5-year historical data cycling feature** - Core PRD requirement

## 🎯 High Priority Tasks

- [ ] **Add 5-year historical data cycling feature** - Core PRD requirement
- [ ] **Build shark tracking UI components** - Maps, profiles, movement visualization
- [ ] **Create shark tracking page** - New /sharks section with real-time tracking
- [ ] **Add shark tracking to navigation** - Integrate with main site menu
- [ ] **Test real NDBC data integration** - Verify live data feed functionality

## 📋 Medium Priority

- [ ] **Enhance mobile responsiveness and performance** - Optimize for mobile users
- [ ] **Add educational storytelling content** - Align with PRD storytelling goals
- [ ] **Implement marine heatwave alerting system** - Real-time alert notifications
- [ ] **Create policy-maker dashboard** - Evidence-based reporting tools

## 🦈 New Feature: Shark Tracking System

- [x] **Create shark tracking data models** - SharkData, SharkTrackPoint, SharkProfile interfaces
- [x] **Build OCEARCH API integration** - Real-time tagged shark data
- [x] **Implement movement analytics** - Distance, speed, depth, temperature stats
- [ ] **Create shark tracking page** - /sharks route with interactive map
- [ ] **Build shark profile components** - Individual shark details & biography
- [ ] **Add real-time movement plotting** - Click shark to see full track history
- [ ] **Integrate with main navigation** - Add "Shark Tracker" to menu

## ✅ Completed Recent Tasks

- [x] **Fix render issues** - All pages now use Layout component
- [x] **Refactor useTheme dependencies** - Resolved static site generation errors
- [x] **Add comprehensive documentation** - consistency.md, crisis.md, enhanced about.md
- [x] **Upgrade CI/CD pipeline** - Enhanced GitHub workflow with proper testing
- [x] **Create automated data refresh system** - GitHub Actions workflow for 6-hour updates
- [x] **Add architecture documentation link to website** - /architecture page with complete overview
- [x] **Upgrade to real NDBC data** - Now fetches from real NOAA API with smart fallback
- [x] **Create crash recovery guide** - CRASH_RECOVERY.md for session continuity

## 📊 Architecture Assessment

**Current Status:**
- **Documentation**: Excellent ARCHITECTURE.md with mermaid diagrams
- **Database**: Mock implementation, need real PostgreSQL schema
- **Data Models**: Defined in lib/data-ingestion.ts (Station, BuoyObservation, JobRun)
- **Missing**: Direct link from website to architecture docs

**Next Actions:**
1. Add "/architecture" page to website navigation
2. Document complete database schema with ERD
3. Create visual system architecture diagrams
4. Add "Behind the Scenes" section to main navigation

## 🔧 Technical Debt

- [ ] Replace mock database with real PostgreSQL
- [ ] Add proper database migrations
- [ ] Implement connection pooling
- [ ] Add database indexing strategy
- [ ] Create backup and recovery procedures

---

*This todo list is maintained in the repository at `/TODO.md` for persistence across sessions.*