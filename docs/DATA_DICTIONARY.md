# Data Dictionary (Initial)

## Observations (buoy_obs)
- station_id: text
- time: timestamptz
- sst_c: float (QC flags applied)
- qc_flag: int (0=good, 4=bad)
- lat, lon: float
- source: text (e.g., NDBC)

## SST Grid Monthly (sst_grid_monthly)
- time_month: date (first of month)
- lat, lon: float (grid centers)
- sst_c: float
- sst_anom_c: float
- source_version: text (e.g., ERSSTv5 <yyyymm>)
