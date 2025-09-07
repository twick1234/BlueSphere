# Appendix B — Tiling, Projections & Colorbars

## Tiling
- Scheme: XYZ tiles, 256px, Web Mercator.
- Zoom range: z=0..6 (global overview) → extend as needed.
- SST PNG tiles; currents MVT vectors (speed/dir).

## Projections
- Data stored in WGS84 (lat/lon); rendered as EPSG:3857.

## Colorbars
- Sequential for SST: deep blue → aqua → yellow for warmer waters.
- Diverging for anomalies: blue (negative) ↔ white ↔ red (positive).
- Ensure contrast & colorblind-friendly ramps; include tick marks with units.
