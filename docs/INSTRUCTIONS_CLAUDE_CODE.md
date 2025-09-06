# Instructions for Claude Code: Publish BlueSphere Bundle to GitHub & Set Up Project

This checklist tells you exactly what to do to create a new GitHub repo, push the **BlueSphere** code, configure CI, and verify the app locally. Replace placeholders like `Twick1234` and `<REPO_NAME>`.

---

## 1) Prepare Repository Locally
1. **Unzip** the provided bundle `bluesphere-starter.zip` so the root folder is `bluesphere/`.
2. Open a terminal at the `bluesphere/` folder.

```bash
cd bluesphere
git init
git branch -M main
```

---

## 2) Create GitHub Repo & Add Remote
Create a new GitHub repository (no README/license) named `<REPO_NAME>` (e.g., `bluesphere`). Then:

```bash
git remote add origin https://github.com/Twick1234/<REPO_NAME>.git
git add .
git commit -m "Initial import: BlueSphere v0.10.0 (PRD, architecture, backend, frontend, ingestion, docs, pitch deck)"
git push -u origin main
```

---

## 3) Configure GitHub Secrets (for CI Ingestion)
Go to **Settings → Secrets and variables → Actions** and add:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

These are used by the daily ingestion workflow: `.github/workflows/daily-smart-ingestion.yml`.

---

## 4) Optional: Auto-Release on Tag
This repo includes `.github/workflows/release-on-tag.yml`. To publish a release:

```bash
git tag -a v0.10.0 -m "BlueSphere v0.10.0 initial release"
git push origin main --tags
```

A GitHub Release will be created automatically for annotated tags (`v*.*.*`).

---

## 5) Start the Stack Locally (Docker)
Requires Docker + Docker Compose.

```bash
cp .env.example .env
# edit the .env values as needed
docker compose up --build
```

- Postgres (with PostGIS) will start and auto-load `db/schema.sql`.
- API will start: http://localhost:8000 (see `/docs` for Swagger).
- Frontend (Next.js) is scaffolded under `frontend/ocean-ui` (run separately for dev).

### Frontend Dev
```bash
cd frontend/ocean-ui
cp .env.local.example .env.local  # set NEXT_PUBLIC_API_BASE and Mapbox token
npm install
npm run dev
# open http://localhost:3000
```

---

## 6) Verify Smart Auto-Update & Freshness
- Daily ingestion workflow: `.github/workflows/daily-smart-ingestion.yml` (runs at 02:00 SGT / 18:00 UTC).
- UI shows freshness badges (green/yellow/red). Backend endpoint: `GET /status`.
- To test locally without real data, insert mock `job_run` rows or manually call `/status` with seed data.

---

## 7) Documentation Tracks (Know What to Share)
- **Clean (Developers)**  
  - `docs/ocean_prd.md`  
  - `assets/docs/BlueSphere_PRD_Clean.pdf`
- **Pitch-Ready (Stakeholders)**  
  - `assets/pitch/BlueSphere_Pitch_WithCharts.pptx`  
  - (Optionally export `assets/pitch/BlueSphere_Pitch.pdf`)
- **Executive Summary**  
  - `assets/docs/BlueSphere_Summary.md`  
  - `assets/docs/BlueSphere_Summary.pdf`
- **Repo Map**  
  - `assets/docs/BlueSphere_Repo_Map.png`

---

## 8) Versioning & Releases
- Follow **SemVer** (`docs/VERSIONING.md`).
- Update `CHANGELOG.md` each iteration.
- Tag releases to trigger auto-release workflow.

Example next release:
```bash
git add .
git commit -m "Release v0.11.0: <summary of changes>"
git tag -a v0.11.0 -m "BlueSphere v0.11.0: <summary>"
git push origin main --tags
```

---

## 9) Project Structure (high level)
```
bluesphere/
  backend/                # FastAPI app (API)
  db/schema.sql           # Postgres + PostGIS schema
  docs/                   # PRD, setup, releases, versioning, instructions (this file)
  frontend/ocean-ui/      # Next.js + Mapbox UI scaffold
  ingestion/              # Ingestion placeholders (ERSST, NDBC, Argo, Currents)
  tileserver/             # Static tiles nginx server
  assets/docs/            # Clean PRD, Executive Summary, Repo Map
  assets/pitch/           # Pitch decks
  .github/workflows/      # CI for ingestion + releases
  docker-compose.yml
  README.md
  CHANGELOG.md
```

---

## 10) Common Tasks
- **Run API locally (without Docker):**
  ```bash
  export $(grep -v '^#' .env | xargs)
  uvicorn backend.app.main:app --reload --port 8000
  ```

- **Install backend deps locally:**
  ```bash
  pip install -r backend/requirements.txt
  ```

- **Run UI dev server:**
  ```bash
  cd frontend/ocean-ui && npm install && npm run dev
  ```

- **Check API docs:** http://localhost:8000/docs

---

## 11) After Publishing
- Create a new issue: “Set real ERDDAP endpoints and implement ingestion.”
- Create tasks for **data freshness badges** validation and **map overlays** polish.
- Share `assets/docs/BlueSphere_Summary.pdf` with stakeholders.

---

_This file was generated to help automate onboarding. Keep it updated as the project evolves._


---

## 🚀 One-Command Copy/Paste (Customize USER/REPO)

**Option A — Using plain git (no GitHub CLI needed):**
```bash
# set these:
USER=Twick1234
REPO=BlueSphere

# unzip locally then run:
cd bluesphere
git init
git branch -M main
git remote add origin https://github.com/$USER/$REPO.git
git add .
git commit -m "Initial import: BlueSphere starter"
git push -u origin main

# (optional) create a versioned release tag
git tag -a v0.10.1 -m "BlueSphere v0.10.1 initial release"
git push origin main --tags
```

**Option B — If you have GitHub CLI (`gh`) installed:**
```bash
USER=Twick1234
REPO=BlueSphere

cd bluesphere
git init
git branch -M main
gh repo create $USER/$REPO --public --confirm  # or --private
git remote add origin https://github.com/$USER/$REPO.git
git add .
git commit -m "Initial import: BlueSphere starter"
git push -u origin main
git tag -a v0.10.1 -m "BlueSphere v0.10.1 initial release"
git push origin main --tags
```


---
*Authored by Mark Lindon. © 2025 Mark Lindon — BlueSphere.*
