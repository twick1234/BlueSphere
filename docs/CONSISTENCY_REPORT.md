![BlueSphere](/frontend/bluesphere-site/public/brand/logo.svg)

# BlueSphere Bundle Consistency Report

**Version:** v0.27.2  
**Date:** 2025-09-06

This report summarizes the key artefacts and their current status so contributors (and automation agents) can verify the bundle is synced.

## Source Code & Services
- **Backend**
  - `backend/app.py` — `/status`, `/stations`, `/obs`, `/obs/summary`, tile routers (cached & fallback).
  - `backend/db.py`, `backend/models.py`, `backend/create_tables.py` — Postgres + SQLAlchemy base.
- **Ingestion**
  - `ingestion/ndbc_parser.py` — NDBC realtime2 WTMP parser.
  - `ingestion/ingest_ndbc.py` — uses parser; upserts to DB with JobRun logging.
  - `ingestion/ingest_ersst.py` — ERSST discovery + JobRun.
  - `ingestion/make_sst_tiles.py` — NetCDF→PNG tiles.
  - `ingestion/make_currents_mvt.py` — synthetic MVT currents.
  - `ingestion/erddap_adapter.py`, `ingestion/erddap_to_parquet.py` — ERDDAP on-ramp.
- **Frontend**
  - `frontend/ocean-ui/pages/map.tsx` — Leaflet map with SST tiles + vector currents (speed-colored).
- **Tests**
  - `tests/e2e/` — Playwright smoke checks for API, tiles, and map page.

## Documentation & Artefacts
- **Architecture.md**, **PRD.md**, **BRD.md**, **Vision.md**, **Testing.md** — updated for v0.27.x.
- **AGENT_RUNBOOK.md**, **tasks/agent_plan.yaml** — task graph for Repo/API/Ingestion/WebApp/Website/QA/Community/WebsiteDeploy.
- **README.md** — DB setup, ingestion, ERDDAP, tiles, APIs, E2E, CI.
- **ROADMAP.md** + `roadmap.svg` visual.
- **Policies** — `PRIVACY.md`, `TERMS.md`.
- **CHANGELOG.md** — latest entries v0.27.0 and v0.27.1 (CI E2E).

## Automation & CI/CD
- GitHub Actions: `deploy-pages.yml`, `release-drafter.yml`, `daily-tiles-refresh.yml`, `uptime.yml`, `release-attach-licenses.yml`, `snyk.yml`, `ci-e2e.yml`.
- Scripts: `setup_discussions.sh`, `create_pinned_discussions.sh`, `import_issues.sh`, `protect_main.sh`.

## Governance & Community
- `.github/ISSUE_TEMPLATE/*` — bug/feature/docs templates.
- Discussions setup + pinned threads (Welcome, Roadmap, Help).

---

### How to keep this report fresh
- The **CHANGELOG** is the source of truth for versions.  
- When adding features, update:
  - `docs/AGENT_RUNBOOK.md`
  - `tasks/agent_plan.yaml`
  - Relevant docs (PRD/BRD/Architecture/Testing/Vision)
  - `README.md` and `CHANGELOG.md`
- This report should be viewed as a quick index; details live in the files above.
