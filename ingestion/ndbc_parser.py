# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
NDBC realtime2 .txt parser
- Handles comment headers (#), whitespace-delimited tables
- Maps standard columns; extracts WTMP (water temp, °C) and position if present
- Skips missing values (MM) and bad rows
"""
from __future__ import annotations
import datetime as dt

def _to_float(tok: str) -> float|None:
    if tok in ("MM", "99.0", "99.00", "999.0", "999.0", "9999.0", "9999"):
        return None
    try:
        return float(tok)
    except Exception:
        return None

def parse_realtime2(text: str, station_id: str) -> list[dict]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    # Find header line (last line starting with # or the first non-# line)
    header = None
    data_start_idx = 0
    for i, ln in enumerate(lines):
        if ln.startswith("#"):
            header = ln.lstrip("#").strip()
            data_start_idx = i + 1
        else:
            if header is None:
                header = ln
                data_start_idx = i + 1
                break
            else:
                break
    if header is None:
        return []
    cols = header.split()
    # Common first columns: YYYY MM DD hh mm ...  (some files use YY instead of YYYY)
    out = []
    for ln in lines[data_start_idx:]:
        if ln.startswith("#"):
            continue
        toks = ln.split()
        if len(toks) < len(cols):
            # some rows may be short; skip
            continue
        row = dict(zip(cols, toks))
        # Build timestamp (prefer YYYY else YY)
        try:
            if "YYYY" in cols:
                y = int(row.get("YYYY"))
            else:
                y = 2000 + int(row.get("YY"))
            M = int(row.get("MM", "1"))
            d = int(row.get("DD", "1"))
            hh = int(row.get("hh", "0"))
            mm = int(row.get("mm", "0"))
            t = dt.datetime(y, M, d, hh, mm, tzinfo=dt.timezone.utc)
        except Exception:
            continue
        # Water temperature
        wtmp = _to_float(row.get("WTMP", "MM"))
        # Position: some realtime2 files include latitude/longitude columns; if not, set None
        lat = _to_float(row.get("LAT", row.get("latitude", "MM")))
        lon = _to_float(row.get("LON", row.get("longitude", "MM")))
        # Air temp as a fallback (not used for SST but kept for future)
        # atmp = _to_float(row.get("ATMP", "MM"))
        if wtmp is None:
            # no SST, skip
            continue
        out.append({
            "station_id": station_id,
            "time": t,
            "sst_c": wtmp,
            "qc_flag": 0,
            "lat": lat if lat is not None else 0.0,
            "lon": lon if lon is not None else 0.0,
            "source": "NDBC"
        })
    return out
