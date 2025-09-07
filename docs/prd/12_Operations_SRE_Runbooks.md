# 12 — Operations, SRE & Runbooks

## Runbooks
- Ingestion failure: re-run job with `--since` and inspect `job_runs`.
- Tile cache cold: trigger rebuild workflow; verify CDN headers.
- API degradation: roll back to last green; check error rate & DB health.

## On-call
- Pager policy for API 5xx > threshold; tiles error spike.

## Backups
- Nightly Postgres snapshots; 7/30/180 day retention tiers.

## Config Management
- Env via secrets store; config-as-code; versioned workflows.
