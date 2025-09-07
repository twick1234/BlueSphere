# 04 — Functional Requirements

## Ingestion
- Fetch NDBC realtime2 text; parse WTMP; handle `MM` missing; UTC stamps.
- ERSST v5 NetCDF discovery; per-month import; anomalies computed or sourced.
- ERDDAP adapter: tabledap/griddap pulls with retries & backoff.
- Job tracking (`JobRun`): id, source, started, ended, status, metrics.

## Storage
- Postgres schemas: `stations`, `buoy_obs`, `job_runs` (see 05_Data_Specs).
- Indexing on (`station_id`, `time`), bbox indexes for lat/lon.

## API
- `/status` — health endpoints
- `/stations` — station metadata & extents
- `/obs` — observation query (bbox, station, time, paging)
- `/obs/summary` — aggregations by day (count/avg/min/max)
- Tiles: `/tiles/sst/{z}/{x}/{y}.png`, `/tiles/currents/{z}/{x}/{y}.mvt`

## Frontend
- Map view: layer controls (SST, currents, anomalies). Legend + units.
- Time controls: date picker + scrubbing.
- Station panel: metadata + sparkline timeseries.
- Export: PNG snapshot with caption & citation.

## Education (Phase 2)
- Story pages with “Explain like I’m 12/18/Pro” toggles.
- Quiz widgets; shareable classroom links.

## Chatbot (Phase 2)
- Q&A over curated knowledge; cites sources; avoids speculation.

## Predictive (Phase 2)
- 7–14 day outlook; uncertainty bands; model card (see 13_Predictive...).
