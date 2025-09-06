# GitHub Setup Guide

## 1) Create the Repo
- New repository → `bluesphere`
- Private or public (your choice)
- Do **not** initialize with a README (this repo already has one)

## 2) Push Locally
```bash
git init
git branch -M main
git remote add origin https://github.com/<you>/bluesphere.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## 3) Secrets for Workflows (Optional)
Go to **Settings → Secrets and variables → Actions** and add:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## 4) Nightly Ingestion
- See `.github/workflows/ingestion.yml`
- Adjust schedule or trigger manually from **Actions**

## 5) Releases & Tags
- See `docs/RELEASES.md` and `docs/VERSIONING.md`
- Create tags and publish GitHub Releases accordingly

## 6) Issues & PRs
- Use GitHub Issues for tracking work
- PRs require at least one review (recommended)
