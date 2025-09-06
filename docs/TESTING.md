![BlueSphere](/frontend/bluesphere-site/public/brand/logo.svg)

# BlueSphere Testing & QA Strategy

## 1. Scope
Covers platform (ingestion, DB, API, UI) and website (content, chatbot, accessibility).

## 2. Test Types
- Unit (ingestion scripts, API handlers, UI components)
- Integration (ingestion → DB → API → map)
- System/E2E (auto-update cycle, freshness badges, story mode)
- Performance & Load (API throughput, tile serving)
- Security (auth for saved views, roles)
- Accessibility (WCAG 2.1 AA)
- Data Quality (QC flags, backfill, versioning)
- Acceptance (persona-driven journeys)

## 3. Tooling
- Backend: pytest, httpx
- Frontend: Jest, Playwright
- Load: k6 or Locust
- CI: GitHub Actions (run on PRs, main)
- Lint/Format: ruff/black (py), eslint/prettier (js)

## 4. KPIs
- Coverage ≥ 70% (initial), target 85%
- API p95 latency < 300ms (core endpoints)
- Ingestion success ≥ 99% monthly
- Lighthouse accessibility ≥ 90

## 5. Sample Test Cases

### Functional / API
| ID | Title | Pre-conditions | Steps | Expected |
|---|---|---|---|---|
| API-001 | List stations with bbox filter | DB seeded with 10 stations | GET `/stations?bbox=-10,-10,10,10` | 200, only stations inside bbox |
| API-002 | Station series QC filter | Obs rows with qc_flag {0..4} | GET `/stations/1/series?qc=good` | Values exclude bad flags |
| API-003 | Grid SST month query | Grid values exist for 2024-01 | GET `/grid/sst?month=2024-01` | Returns rows with `time_month=2024-01-01` |

### Ingestion
| ID | Title | Pre-conditions | Steps | Expected |
|---|---|---|---|---|
| ING-001 | Daily NDBC incremental | last_success_at set to T0 | Run `ingest_ndbc.py` | Only new rows after T0 inserted |
| ING-002 | ERSST monthly update | prior month exists | Run `ingest_ersst.py` for new month | New month grid ingested, job_run logged |
| ING-003 | Mirror fallback | Primary ERDDAP down | Run ingestion | Mirror endpoint used, job succeeds |

### System / E2E
| ID | Title | Pre-conditions | Steps | Expected |
|---|---|---|---|---|
| E2E-001 | Freshness badges update | job_run exists within 6h | Open UI → status panel | Shows green badge for hourly datasets |
| E2E-002 | Auto-refresh map | new job_run created | Reload UI | Heatmap reflects latest data (cache-busted) |
| E2E-003 | Compare mode | Grid data for 1985 & 2024 | Open compare view | Side-by-side maps display correct months |

### Accessibility
| ID | Title | Pre-conditions | Steps | Expected |
|---|---|---|---|---|
| A11Y-001 | Keyboard nav | UI up | Tab through interactive elements | All controls reachable, visible focus |
| A11Y-002 | Color contrast | UI up | Run Lighthouse/aXe | Score ≥ AA; colorblind-safe palette |

### Security
| ID | Title | Pre-conditions | Steps | Expected |
|---|---|---|---|---|
| SEC-001 | Saved views auth | user role=Viewer | GET `/views/my` | 401/403 without auth |
| SEC-002 | Role-based access | users: Admin, Viewer | Access admin endpoint as Viewer | 403 forbidden |

### Website / Chatbot
| ID | Title | Pre-conditions | Steps | Expected |
|---|---|---|---|---|
| WEB-001 | FAQ page loads | Website running | Visit `/faq` | 200, Q&A sections visible |
| BOT-001 | Chatbot greets | Bot enabled | Type "What is SST?" | Friendly, accurate, age-appropriate reply |

## 6. Release Checklist
- [ ] Unit & integration tests pass (CI green)
- [ ] Ingestion run successful (last 24–48h)
- [ ] /status badges green/yellow by cadence
- [ ] A11y audit ≥ 90, mobile pass
- [ ] Changelog & version updated
- [ ] Tag & release created

---
*Authored by Mark Lindon — BlueSphere*
