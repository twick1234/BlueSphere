# 06 — API Specification

Base URL (dev): `http://localhost:8000`

## GET /stations
- **Query**: `bbox=minLon,minLat,maxLon,maxLat` (optional)
- **Returns**: array of stations
```json
[{"station_id":"41001","name":"East Hatteras","lat":34.7,"lon":-72.7,"provider":"NDBC"}]
```

## GET /obs
- **Query**: `bbox`, `start`, `end`, `station`, `limit` (<=5000), `offset`
- **Returns**: observations ordered by time desc
```json
[{"station_id":"41001","time":"2025-09-06T00:00:00Z","sst_c":29.1,"qc_flag":0,"lat":34.7,"lon":-72.7,"source":"NDBC"}]
```

## GET /obs/summary
- **Query**: same filters; groups by day
```json
[{"day":"2025-09-01T00:00:00+00:00","count":144,"avg_sst_c":28.7,"min_sst_c":27.9,"max_sst_c":29.5}]
```

## Tiles
- **SST raster**: `/tiles/sst/{z}/{x}/{y}.png` (Web Mercator)
- **Currents vector**: `/tiles/currents/{z}/{x}/{y}.mvt`

### Errors
- 400 invalid params; 404 not found; 500 internal error (with request id).

### Rate Limits (Phase 2)
- IP-based quotas; `X-RateLimit-*` headers.
