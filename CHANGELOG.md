# Changelog

## 2025-09-06
- Enhanced **PRD** with additional dimensions (personas, governance, APIs, collaboration, performance, ethics, accessibility, outreach, predictive analytics, sustainability, roadmap, stretch ideas).
- Synced updated PRD into `docs/ocean_prd.md`.
- Rebuilt repository bundle (`bluesphere-starter.zip`).

## [v0.1.0] - 2025-09-06
- Introduced semantic versioning for releases.
- This marks release **v0.1.0** of the bluesphere starter repo.

## [v0.2.0] - 2025-09-06
- Expanded PRD with operational & technical requirements (monitoring, performance, QC, security, UI/UX, integration, governance).  
- Represents step towards engineering + ops blueprint.  

## [v0.3.0] - 2025-09-06
- Added **Smart Auto-Update Features**: daily ingestion, incremental updates, self-healing, auto-refreshing UI, versioned snapshots, and future alerting.
- Introduced new GitHub Actions workflow for automated ingestion.

## [v0.3.0] - 2025-09-06
- Added **Smart Auto-Update & Self-Healing Ingestion** section to PRD.
- Introduced **daily-smart-ingestion** GitHub Actions workflow with matrix & retry.
- Added ingestion placeholders for NDBC, Argo, Currents.
- Updated README with auto-update notes.

## [v0.4.0] - 2025-09-06
- Added **/status** API endpoint (backend) to report dataset freshness.
- Implemented **freshness badges & last-updated panel** in Next.js UI.
- PRD updated with UI auto-refresh & freshness indicators.
- README updated with status panel documentation.

## [v0.5.0] - 2025-09-06
- Expanded PRD with **climate trends, drivers, impacts, and solutions**.
- Positioned BlueSphere as a climate action framework (not just data access).
- README updated with **environmental mission statement**.

## [v0.6.0] - 2025-09-06
- Added full **BlueSphere pitch deck** (PPTX + PDF) under `assets/pitch/`.
- Expanded deck with climate trends, impacts, drivers, solutions, and future vision.

## [v0.7.0] - 2025-09-06
- Added **charts** (SST anomaly trend, CO₂ vs SST, heatwave frequency, sea level rise, projections) to pitch deck.
- New file: `assets/pitch/BlueSphere_Pitch_WithCharts.pptx`.

## [v0.8.0] - 2025-09-06
- Generated **clean PRD PDF** (`assets/docs/BlueSphere_PRD_Clean.pdf`) from Markdown.
- README updated with pointers to both developer PRD and pitch deck.

## [v0.9.0] - 2025-09-06
- Added **Executive Summary** (Markdown + PDF) under `assets/docs/`.
- Updated README with clear separation of Clean, Pitch-Ready, and Summary tracks.

## [v0.10.0] - 2025-09-06
- Added **visual repo map diagram** (`assets/docs/BlueSphere_Repo_Map.png`) to illustrate Clean, Pitch, and Summary tracks.
- Updated README to embed the diagram.

## [v0.10.1] - 2025-09-06
- Added `docs/INSTRUCTIONS_CLAUDE_CODE.md` with step-by-step GitHub publishing and setup guide.

## [v0.10.2] - 2025-09-06
- Added a **copy/paste command block** to `docs/INSTRUCTIONS_CLAUDE_CODE.md`.
- Added helper script `scripts/publish_to_github.sh` for fast publishing to GitHub.

## [v0.11.0] - 2025-09-06
- Prepared **BlueSphere v0.11.0** release.
- Updated instructions to assume GitHub repo name is `BlueSphere` (case-sensitive).
- Added ready-to-tag block for release publishing.

## [v0.11.1] - 2025-09-06
- Added `docs/RELEASE_NOTES_TEMPLATE.md` to standardize GitHub release drafting.

## [v0.12.0] - 2025-09-06
- Added **BRD.md**, **VISION.md**, and **TESTING.md** (with sample test cases).
- Created **website/** descriptors and copy for Home, About, Impact, Marine Life, Education, FAQ, Get Involved, Contact.
- Updated pitch deck with slides on sustainability enablers and biodiversity.
- README updated to reference new documents.
\n## [v0.13.0] - 2025-09-06
- Scaffolded **Next.js website** (`frontend/bluesphere-site`) that renders Markdown from `/website`.
- Added **Playwright E2E tests** and CI workflow (`.github/workflows/ci-node.yml`).
- README updated with website + E2E instructions.

## [v0.14.0] - 2025-09-06
- Added **Chatbot** placeholder (Phase 1) with FAQ-based replies; global widget.
- Added **Phase 2** Chatbot API stub at `pages/api/chatbot.ts` for future LLM integration.
- Implemented **FAQ search** with quick topic filters.
- Introduced **Design System** (buttons/typography/colors) and **logo.svg** used as favicon.
- Updated README with chatbot, FAQ search, and design system notes.

## [v0.15.0] - 2025-09-06
- Added **Stories** section (index + dynamic pages) with sample explainers.
- Implemented **FAQ API** (`/api/faq`) and upgraded Chatbot with retrieval from real FAQ content.
- Navigation updated to include Stories; README updated.

## [v0.16.0] - 2025-09-06
- Added **multi‑agent runbook** (`docs/AGENT_RUNBOOK.md`), **agent plan** (`tasks/agent_plan.yaml`), and **backlog**.
- Included **one‑line kickoff** prompt for Claude (`docs/CLAUDE_ONE_LINER.txt`) and `scripts/bootstrap_agents.sh`.
- README updated with multi‑agent kickoff pointers.

## [v0.16.1] - 2025-09-06
- Added `tasks/issues_import.json` for bulk GitHub issue creation from backlog.

## [v0.16.1] - 2025-09-06
- Added **GitHub Issues importer**: `tasks/issues_seed.jsonl` + `scripts/import_issues.sh` (uses gh + jq).
- README updated with bulk issue creation instructions.

## [v0.16.2] - 2025-09-06
- Added GitHub issue templates under `.github/ISSUE_TEMPLATE/` for bug, feature, and docs.
- Added config.yml to disable blank issues and link to Discussions.

## [v0.16.3] - 2025-09-06
- Added **Pull Request template** under `.github/PULL_REQUEST_TEMPLATE/`.
- Updated README with PR template usage.

## [v0.16.4] - 2025-09-06
- Added `.github/CODEOWNERS` to auto-assign reviewers for docs, frontend, and ingestion paths.
- Updated README with CODEOWNERS info.

## [v0.16.5] - 2025-09-06
- Added **CONTRIBUTING.md** with setup guide, branching workflow, commit conventions, PR process, and code style.
- Updated README with Contributing section.

## [v0.16.5] - 2025-09-06
- Added `CONTRIBUTING.md` with setup steps, commit style, tests, and PR process.
- README updated with contributing section.

## [v0.16.6] - 2025-09-06
- Added `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1).
- Added `SECURITY.md` with responsible disclosure instructions.
- Updated README with governance & security pointers.

## [v0.16.7] - 2025-09-06
- Added `AUTHORS.md` with Mark Lindon as Founder & Lead Author of BlueSphere.
- Updated LICENSE copyright to "Mark Lindon — BlueSphere".
- Appended authorship footers to docs (BRD, VISION, TESTING, CONTRIBUTING, CoC, Security).
- Updated README with attribution; package.json author set to Mark Lindon — BlueSphere.
- CODEOWNERS fallback updated to @marklindon.

## [v0.16.7] - 2025-09-06
- Set **Mark Lindon** as the main author across artefacts.
- Added `AUTHORS.md` and updated `LICENSE` (MIT) with **Mark Lindon — BlueSphere**.
- Appended attribution footers to PRD/BRD/VISION/TESTING and key docs.
- Updated README with “Created by Mark Lindon” line.
- Updated CODEOWNERS default to `@marklindon`.
- Added authored footers to pitch decks.

## [v0.16.8] - 2025-09-06
- Added `docs/SPDX_HEADER.txt` snippet.
- Inserted SPDX headers across JS/TS, shell scripts, and Python ingestion files.
- README updated with SPDX licensing section.

## [v0.16.9] - 2025-09-06
- Added `LICENSES/THIRD_PARTY.md` scaffold and scripts to render JS/Python license tables.
- Introduced `.pre-commit-config.yaml` with SPDX header enforcement and hygiene hooks.
- README updated with licensing and pre-commit instructions.

## [v0.17.0] - 2025-09-06
- Added **Release CI** (`release-attach-licenses.yml`) to generate and attach third‑party license manifests to GitHub Releases.
- README updated with release compliance details.

## [v0.18.0] - 2025-09-06
- Added **Release Drafter** config & workflow for automated release notes.
- Added **Dependabot** config for npm, pip, Docker, and GitHub Actions updates.
- Added optional **Snyk** security scan workflow (requires `SNYK_TOKEN` secret).
- README updated with automation details.

## [v0.18.1] - 2025-09-06
- Added badges (CI, Release, License, Dependabot, Snyk) to README header.

## [v0.18.1] - 2025-09-06
- Added README badges for CI, Release version, License, Dependabot, and Snyk.
- Replace `<YOUR_GITHUB_USERNAME>` with your actual GitHub handle after publishing.

## [v0.18.2] - 2025-09-06
- Replaced `<YOUR_GITHUB_USERNAME>` with `Twick1234` across README badges, CODEOWNERS, and config files.
- Auto-set repo links to https://github.com/Twick1234/BlueSphere

## [v0.18.2] - 2025-09-06
- Replaced all `<YOUR_GITHUB_USERNAME>` placeholders with `Twick1234`.
- Updated badges and links to point to https://github.com/Twick1234/BlueSphere.

## [v0.18.3] - 2025-09-06
- Added `.github/discussions.yml` with pre-defined categories: Q&A, Ideas, Announcements.
- README updated with Discussions info.

## [v0.18.3] - 2025-09-06
- Added Discussions setup script (`scripts/setup_discussions.sh`) and workflow (`setup-discussions.yml`).
- Added **Discussion templates** (Q&A, Ideas, Announcements) under `.github/DISCUSSION_TEMPLATE/`.
- README updated with Discussions section and direct link.

## [v0.20.0] - 2025-09-06
- Added public `docs/ROADMAP.md` and auto-posted it into the pinned Roadmap Discussion via script.
- Added GitHub Pages deployment workflow (`deploy-pages.yml`) for the Next.js site (static export).
- Updated Runbook, Agent Plan, and README with deployment and roadmap details.

## [v0.20.1] - 2025-09-06
- Added **GitHub Pages** badge in README and linked to public site.
- Created **roadmap.svg** (brand-aligned) and embedded it in `docs/ROADMAP.md` and website Home.
- Enhanced discussions script to post the roadmap visual into the pinned Roadmap thread.

## [v0.21.0] - 2025-09-06
- Added **FastAPI backend skeleton** with `/status`, `/stations`, `/grid/sst`, `/currents` (stubs) and Docker setup.
- Added **ingestion stubs**: `ingest_ndbc.py`, `ingest_ersst.py`, plus `.env.example` and sample data folder.
- Scaffolded **ocean map UI** app (`frontend/ocean-ui`) and basic API fetch.
- Added **PRIVACY.md** and **TERMS.md`.
- Added **branch protection** script (`scripts/protect_main.sh`).
- Added **uptime monitor** workflow (`uptime.yml`) for Pages + API.
- Authored **DATA_DICTIONARY.md** and **DATA_LICENSES.md`.
- Authored **MODEL_CARD_TEMPLATE.md** and **MODEL_EVAL_PLAN.md`.

## [v0.22.0] - 2025-09-06
- Upgraded ingestion scripts with concrete logic templates (NDBC/ERSST).
- Added FastAPI tile endpoints for SST & currents (placeholder PNG tiles).
- Wired **Leaflet** map layers in `ocean-ui` at `/map` to display API tiles.
- Docs updated with map & tiles run instructions.

## [v0.23.0] - 2025-09-06
- Added xarray/netCDF pipeline and script `ingestion/make_sst_tiles.py` to precompute SST PNG tiles.
- Added currents **MVT** generator `ingestion/make_currents_mvt.py`; API serves `/tiles/currents/{z}/{x}/{y}.mvt`.
- API now serves cached tiles from `tiles/cache/*`, with PNG fallback placeholders if missing.
- UI map now loads **VectorGrid** MVT overlay for currents + PNG fallback.
- README updated with data-backed tiles workflow.

## [v0.24.0] - 2025-09-06
- **UI**: VectorGrid now styles current lines by speed; cleaned up layering. 
- **CI**: Added `daily-tiles-refresh.yml` to rebuild tiles cache daily (uses `ERSST_URL` secret if present).
- **Ingestion**: Added `ingestion/erddap_adapter.py` for tabledap/griddap pulls from ERDDAP.
- **Docs**: README and Runbook updated with ERDDAP usage and cache maintenance.

## [v0.25.0] - 2025-09-06
- Added **Postgres** service and Adminer in docker-compose.
- Implemented **SQLAlchemy models** (Station, BuoyObs, JobRun) and `create_tables.py` bootstrap.
- API `/stations` & `/status` now read from DB.
- Wired ingestion stubs to include **DB upsert** helpers and **JobRun** logging.
- Added `ingestion/erddap_to_parquet.py` for a quick ERDDAP slice → parquet demo.
- Updated README and Runbook with data-layer instructions.

## [v0.26.0] - 2025-09-06
- Implemented robust **NDBC realtime2** parser (`ingestion/ndbc_parser.py`) extracting WTMP → SST (°C).
- Wired `ingestion/ingest_ndbc.py` to use the parser and upsert rows.
- Added `/obs` API endpoint with `bbox`, `start`, `end`, `station`, `limit`, `offset` filters.
- README updated with end-to-end instructions.

## [v0.27.0] - 2025-09-06
- Added `/obs/summary` endpoint for daily aggregates with optional bbox/station/time filters.
- Introduced **Playwright E2E** tests (`tests/e2e`) validating API health, tile endpoints, and map page.
- Docs updated with E2E instructions.
\n## [v0.27.1] - 2025-09-06
- Added GitHub Actions workflow `ci-e2e.yml` to run Playwright E2E on PRs and main.
- README updated with CI E2E details.

## [v0.27.2] - 2025-09-06
- Added **docs/CONSISTENCY_REPORT.md** and a website page at `/consistency` mirroring the report.
- README updated with a "Bundle Consistency" section.

## [v0.27.3] - 2025-09-06
- Website homepage now includes a **Bundle Consistency** card linking to `/consistency`.

## [v0.28.0] - 2025-09-06
- Added site-wide **top navigation bar** via Layout component.
- Included minimal CSS that works out-of-the-box, plus **TailwindCSS** scaffolding for richer styling.
- Wrapped all MDX/JSX pages using `_app.tsx` so the nav appears site-wide.

## [v0.29.0] - 2025-09-06
- Added full **brand pack** in `frontend/bluesphere-site/public/brand/` (main + variants + favicon).
- Created `docs/BRAND_GUIDE.md` describing palette, typography, and usage.
- Updated README and Architecture docs with brand references.

## [v0.29.0] - 2025-09-06
- Added a **full brand pack**: SVG master, monochrome variants, wordmark, PNG export, and favicon.
- Integrated logo into site navigation and document headers.
- Added `docs/BRAND_GUIDE.md` with usage guidelines.

## [v0.30.0] - 2025-09-06
- Added **dark mode** with automatic logo swap (light/dark variants).
- Generated **Open Graph** and **Twitter** social preview images and injected meta tags via `HeadMeta`.
- Added docs: `DARK_MODE.md`, `SOCIAL_PREVIEW.md`. Updated README.
\n## [v0.31.0] - 2025-09-06
- Added **Theme Toggle** (Light/Dark/System) with persistence and HTML `[data-theme]` overrides.
- Auto-swaps header logo based on effective theme.
- Docs added: `THEME_TOGGLE.md`.
\n## [v0.32.0] - 2025-09-06
- Added a comprehensive **About** page (`/about`) with mission, environmental goals, data sources, and brand story.
- Linked **About** in the top navigation.
- Updated README.
\n## [v0.33.0] - 2025-09-06
- Added **Data Sources** page (`/sources`) listing NDBC, ERSST v5, ERDDAP, and roadmap datasets.
- Added `docs/DATA_SOURCES.md` with detailed dataset info.
- Linked Sources in navbar.
- Updated README.
\n## [v0.33.0] - 2025-09-06
- Added **Data Sources** page (`/sources`) with live status badge.
- Linked **Sources** in top navigation.
- Added `docs/DATA_SOURCES.md`; updated README.
