# 10 — Testing & Quality

## Test Pyramid
- **Unit**: parsers, utils, schema validators.
- **Integration**: ingestion → DB → API.
- **E2E (Playwright)**: map renders, tiles respond, API healthy.

## Data Validation
- Range checks on SST; missing value handling; station existence.
- Ingest vs vendor counts within ±5% threshold → else alert.

## Performance & Load
- Tiles QPS tests; API soak for 24h.
- Lighthouse CI: performance ≥ 90, accessibility ≥ 95.

## Release Gates
- All tests green; CHANGELOG updated; docs build passes.
