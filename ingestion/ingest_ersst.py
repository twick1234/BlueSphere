# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
ERSST ingestion (monthly grids).
- Finds latest ERSST v5 NetCDF filename from index listing.
- Streams download and writes grid to DB or parquet/tiles.
- Computes anomaly vs 30-year climatology if desired.
This script outlines the approach; fill DB details for production.
"""
import os, sys, re, datetime as dt
from dotenv import load_dotenv
import httpx

load_dotenv()
ERSST_BASE = os.getenv("ERSST_BASE", "https://www.ncei.noaa.gov/pub/data/cmb/ersst/v5/netcdf")

def discover_latest_filename(index_text: str) -> str|None:
    # crude find *.nc pattern with dates
    candidates = re.findall(r'ersst.v5.\d{4}\d{2}.nc', index_text)
    return sorted(candidates)[-1] if candidates else None

def main():
    try:
        with httpx.Client(timeout=60) as client:
            idx = client.get(ERSST_BASE).text
        latest = discover_latest_filename(idx)
        if not latest:
            print("[ERSST] No NetCDF files found in index.")
            return 1
        url = f"{ERSST_BASE}/{latest}"
        # In production: stream to disk, open via xarray, write to DB or parquet.
        print(f"[ERSST] Latest: {latest} -> {url}")
    except Exception as e:
        print("[ERSST] Error:", e)
        return 1
    return 0

if __name__ == "__main__":
    sys.exit(main())


# --- DB JobRun tracker for ERSST ---
from backend.db import get_session
from backend.models import JobRun
from datetime import datetime, timezone

def record_job_result(status, note=""):
    sess = get_session()
    jr = JobRun(job="ERSST", status=status, started_at=datetime.now(timezone.utc), finished_at=datetime.now(timezone.utc), note=note)
    sess.add(jr); sess.commit()
