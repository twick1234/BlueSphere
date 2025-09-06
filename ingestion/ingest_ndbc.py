# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
NDBC ingestion (incremental).
- Discovers station list (CSV) and fetches hourly/daily obs.
- Supports If-Modified-Since and ETag caching.
- Applies simple QC: exclude missing, use NDBC quality flags where available.
- Upserts into database using COPY or batched INSERTS (placeholder hooks provided).
"""
import os, sys, csv, io, time, datetime as dt
from typing import Iterable, Dict, Any
from dotenv import load_dotenv
import httpx
from ingestion.ndbc_parser import parse_realtime2

load_dotenv()
NDBC_BASE = os.getenv("NDBC_BASE", "https://www.ndbc.noaa.gov")

def parse_csv(content: str) -> Iterable[Dict[str, Any]]:
    reader = csv.DictReader(io.StringIO(content), delimiter=",")
    for row in reader:
        yield row

def upsert_buoy_obs(rows: Iterable[Dict[str, Any]]):
    # TODO: replace with DB upsert (psycopg2/SQLAlchemy)
    count = 0
    for _ in rows:
        count += 1
    print(f"[NDBC] Upserted {count} rows (stub).")

def fetch_with_cache(url: str, etag: str|None=None, last_mod: str|None=None):
    headers = {}
    if etag:
        headers["If-None-Match"] = etag
    if last_mod:
        headers["If-Modified-Since"] = last_mod
    with httpx.Client(timeout=60) as client:
        r = client.get(url, headers=headers)
        if r.status_code == 304:
            return None, etag, last_mod
        r.raise_for_status()
        return r.text, r.headers.get("ETag"), r.headers.get("Last-Modified")

def main():
    # Example endpoint (replace with station discovery + per-station fetch):
    url = f"{NDBC_BASE}/data/realtime2/41001.txt"  # example buoy file
    try:
        text, etag, last_mod = fetch_with_cache(url)
    except Exception as e:
        print("[NDBC] Fetch failed:", e)
        return 1
    if text is None:
        print("[NDBC] Not modified.")
        return 0
    # NDBC realtime2 .txt are whitespace delimited; adapt parser as needed.
    # For simplicity, convert whitespace to CSV header mapping here (left as exercise).
    # In real impl: parse columns (YY MM DD hh mm WDIR WSPD GST ... WTMP etc.).
    # Filter for WTEMP/WTMP into SST (°C) if Fahrenheit, convert to C.
    # rows = transform_to_rows(text)
    rows = parse_realtime2(text, station_id='41001')  # example buoy
    upsert_buoy_obs(rows)
    print("[NDBC] Done.")
    return 0

if __name__ == "__main__":
    sys.exit(main())


# --- DB helpers (SQLAlchemy) ---
from sqlalchemy import insert
from sqlalchemy.dialects.postgresql import insert as pg_upsert
from backend.db import get_session
from backend.models import Station, BuoyObs, JobRun
from datetime import datetime, timezone

def record_job(sess, job, status, note=""):
    jr = JobRun(job=job, status=status, started_at=datetime.now(timezone.utc), finished_at=datetime.now(timezone.utc), note=note)
    sess.add(jr); sess.commit()

def upsert_station(sess, station_id, name, lat, lon, source="NDBC"):
    # naive upsert (replace with pg_upsert if needed)
    s = sess.query(Station).filter(Station.station_id==station_id).one_or_none()
    if not s:
        s = Station(station_id=station_id, name=name, lat=lat, lon=lon, source=source)
        sess.add(s)
    else:
        s.name=name; s.lat=lat; s.lon=lon; s.source=source
    sess.commit()

def upsert_obs_batch(sess, rows):
    # rows: list of dicts with station_id,time,sst_c,qc_flag,lat,lon
    for r in rows:
        # try unique insert; fallback update
        try:
            sess.add(BuoyObs(**r)); sess.commit()
        except Exception:
            sess.rollback()
            existing = sess.query(BuoyObs).filter(BuoyObs.station_id==r['station_id'], BuoyObs.time==r['time']).one_or_none()
            if existing:
                existing.sst_c=r.get('sst_c'); existing.qc_flag=r.get('qc_flag',0); existing.lat=r.get('lat',existing.lat); existing.lon=r.get('lon',existing.lon)
                sess.commit()

