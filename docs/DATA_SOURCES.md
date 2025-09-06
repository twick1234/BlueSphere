# DATA_SOURCES

**Version:** v0.33.0 • **Date:** 2025-09-06

This document lists the datasets BlueSphere uses or plans to use, including coverage, update cadence, formats, access endpoints, and license notes.

## Current
### NDBC (NOAA National Data Buoy Center)
- **What**: Realtime2 buoy observations; we extract **WTMP** (water temperature, °C).
- **Coverage**: Global stations; coastal/ocean buoys.
- **Cadence**: Hourly updates.
- **Formats**: ASCII tables (whitespace-delimited).
- **Access**: https://www.ndbc.noaa.gov/
- **License**: Public domain (US Government).

### ERSST v5 (NOAA/NCEI)
- **What**: Monthly global sea-surface temperature (and anomalies).
- **Coverage**: Global; ~2° grid.
- **Cadence**: Monthly (typically ~1 month lag).
- **Formats**: NetCDF.
- **Access**: https://www.ncei.noaa.gov/products/extended-reconstructed-sst
- **License**: Public domain (US Government).

### ERDDAP (NOAA CoastWatch et al.)
- **What**: **tabledap** (CSV/JSON) and **griddap** (NetCDF) dataset server.
- **Coverage**: Varies by dataset.
- **Cadence**: Varies by dataset and host.
- **Formats**: CSV, JSON, NetCDF.
- **Access**: https://coastwatch.pfeg.noaa.gov/erddap
- **License**: Dataset-specific; many NOAA datasets are public domain.

## Planned
- **OSCAR surface currents** — 5-day averaged surface currents.
- **Argo** — floats with temperature/salinity profiles.
- **Satellite SST** — multi-sensor merged products.

## How data flows
1. **Ingestion** pulls text/NetCDF via scripts in `ingestion/` or via `erddap_adapter.py`.
2. **DB upserts** (Postgres) normalize station metadata and observations.
3. **Tiles** are generated (PNG for SST, MVT for currents) in `tiles/cache/*` for map serving.
4. **API** exposes `/stations`, `/obs`, `/obs/summary`, and tile endpoints to the frontend.
