# 03 — Scope & Success Criteria

## In Scope (Phase 1)
- NDBC WTMP ingestion; ERSST v5 monthly grids; ERDDAP pulls (selected).
- Global interactive map: SST heatmap tiles + currents vectors overlay.
- APIs: /status, /stations, /obs, /obs/summary, tiles endpoints.
- Daily auto-update via CI; nightly tiles refresh.
- Docs: data dictionary, API reference, tutorials, brand basics.

## Out of Scope (Phase 1)
- User accounts & private data; write access; fine-grained RBAC.
- Complex predictive models in production (Phase 2+).
- Full offline support.

## Success Criteria (Phase 1)
- 95%+ of targeted stations ingested & queryable.
- Map loads first meaningful paint < 2s on median connection.
- CI refresh completes nightly < 60 min.
- A11y audit passes WCAG 2.1 AA critical checks.
