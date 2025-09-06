# BlueSphere Multi‑Agent Runbook

This runbook defines roles, tasks, and hand‑offs for AI agents (Claude Code / others).

## Agent Roles
- **Agent-Repo**: Initialize GitHub repo `BlueSphere`, push code, set up tags & releases.
- **Agent-API**: Stand up FastAPI backend (Docker & local), verify `/status` and core endpoints.
- **Agent-Ingestion**: Configure GH Actions secrets; enable `.github/workflows/daily-smart-ingestion.yml`; dry-run ingestion.
- **Agent-WebApp**: Run `frontend/ocean-ui` and verify map loads & freshness panel.
- **Agent-Website**: Build `frontend/bluesphere-site`, ensure Markdown pages render, Stories routes work, chatbot widget visible.
- **Agent-Branding**: Confirm `public/logo.svg` is used for favicon; polish README badges (optional).
- **Agent-QA**: Run tests: backend (pytest), website E2E (Playwright), Lighthouse checks (optional); produce report.
- **Agent-Docs**: Draft `v0.16.0` GitHub release notes from CHANGELOG + template and publish tag & release.

## Global Constraints
- Use repo name **BlueSphere** (case-sensitive).
- Follow `docs/INSTRUCTIONS_CLAUDE_CODE.md` for publishing.
- Do not commit secrets; use GitHub Actions Secrets only.

## Success Criteria
- Repo live on GitHub with `main` pushed and tag `v0.16.0` created.
- CI green for Node/Playwright and (optional) backend tests.
- Website (Next.js) builds & serves pages; Chatbot + FAQ search working.
- Pitch deck present; documents (PRD, BRD, TESTING, VISION) accessible.


## Website Deployment
- Ensure GitHub Pages is enabled (Settings → Pages → Source: GitHub Actions).
- Push to `main` to trigger `.github/workflows/deploy-pages.yml` which builds and exports Next.js to Pages.
- Public URL: https://Twick1234.github.io/BlueSphere/


## Tiles Cache Maintenance
- Optional daily refresh via `daily-tiles-refresh.yml` (02:00 UTC). 
- Set `ERSST_URL` secret to the desired NetCDF file for SST tile rebuilds.
- Currents MVT are synthesized for demo; replace with OSCAR ingestion when ready.


## Data Layer Bootstrap
1) `docker compose up -d db adminer`
2) `pip install -r backend/requirements.txt`
3) `python backend/create_tables.py`
4) Run ingestion stubs to populate tables; verify in Adminer (localhost:8080).

## API + UI
- Start API: `docker compose up api`
- UI reads `/status` and `/stations` (once stations are ingested). Map tiles continue to serve from cache.


## QA: Smoke E2E
- Start API (`docker compose up api`) and UI (`npm run dev` in `frontend/ocean-ui`).
- In `tests/e2e`: `npm install && npx playwright install --with-deps && npm test`.
- The suite checks `/status`, tiles endpoints, `/obs`, and loads the map page.
