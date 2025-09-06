# Contributing to BlueSphere

Thank you for helping build an open, impactful ocean & climate platform 💙

## Getting Started
1. **Fork** the repo and create a branch from `main`:
   ```bash
   git checkout -b feat/<short-topic>
   ```
2. **Set up** dev environment:
   - API: `docker compose up --build` → http://localhost:8000
   - Web App (map): `cd frontend/ocean-ui && npm install && npm run dev` → http://localhost:3000
   - Website (docs): `cd frontend/bluesphere-site && npm install && npm run dev` → http://localhost:4000

## Commit & Branching
- Use concise messages: `feat: add timeline component`, `fix: bbox filter bug`
- Keep PRs small and focused; include tests when possible
- Link issues: `Closes #123`

## Tests & Quality
- **Backend**: `pytest` (add stubs if missing)
- **Website**: `npm run test:e2e` (Playwright)
- Lint/format: ESLint/Prettier (JS), Ruff/Black (Python) where applicable
- Accessibility: aim for Lighthouse **≥ 90**

## PR Process
1. Ensure CI is green (Node & Playwright).  
2. Update `CHANGELOG.md` (Unreleased or new version).  
3. Fill PR template (description, tests, screenshots).  
4. Request review (auto via CODEOWNERS).

## Issue Templates
Use `.github/ISSUE_TEMPLATE/` for **bugs**, **features**, and **docs**.

## Code of Conduct
Be kind, inclusive, and constructive. This project is for everyone. Harassment or disrespect will not be tolerated.

## License
By contributing, you agree that your contributions are licensed under the **MIT License**.

---
*Authored by Mark Lindon — BlueSphere*
