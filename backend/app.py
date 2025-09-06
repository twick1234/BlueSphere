# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import List, Optional
import os

app = FastAPI(title="BlueSphere API", version="0.1.0", description="Status, stations, grids, and currents.")

class DatasetStatus(BaseModel):
    name: str
    cadence: str
    last_run: Optional[str]
    freshness: str

@app.get("/status", response_model=List[DatasetStatus])
def status():
    # TODO: compute from job_run table
    return [
        DatasetStatus(name="NDBC buoys", cadence="hourly", last_run=None, freshness="red"),
        DatasetStatus(name="ERSST (monthly)", cadence="monthly", last_run=None, freshness="red"),
        DatasetStatus(name="Surface currents", cadence="daily", last_run=None, freshness="red"),
    ]

@app.get("/stations")
def stations(bbox: Optional[str] = Query(None, description="minLon,minLat,maxLon,maxLat")):
    # TODO: query DB; stub response
    return {"count": 0, "bbox": bbox, "items": []}

@app.get("/grid/sst")
def grid_sst(month: Optional[str] = None, bbox: Optional[str] = None):
    # TODO: query monthly grid; stub response
    return {"month": month, "bbox": bbox, "tiles": "xyz://sst/{z}/{x}/{y}.png"}

@app.get("/currents")
def currents(bbox: Optional[str] = None, date: Optional[str] = None):
    # TODO: vector tiles; stub response
    return {"date": date, "bbox": bbox, "vectors": "mvt://currents/{z}/{x}/{y}.mvt"}

from backend.tiles import router as tiles_router
app.include_router(tiles_router)

from backend.tiles_cached import router as tiles_cached_router
app.include_router(tiles_cached_router)

from sqlalchemy import select, func
from backend.db import get_session
from backend.models import Station, JobRun

@app.get("/stations")
def stations(bbox: Optional[str] = Query(None, description="minLon,minLat,maxLon,maxLat")):
    sess = get_session()
    q = select(Station)
    if bbox:
        minLon, minLat, maxLon, maxLat = [float(x) for x in bbox.split(",")]
        # crude bbox via filtering
        q = q.where(Station.lon>=minLon, Station.lon<=maxLon, Station.lat>=minLat, Station.lat<=maxLat)
    items = [
        {"station_id": s.station_id, "name": s.name, "lat": s.lat, "lon": s.lon, "source": s.source}
        for s in sess.execute(q).scalars()
    ]
    return {"count": len(items), "items": items}

@app.get("/status")
def status():
    sess = get_session()
    # summarize last job runs by job name
    rows = sess.execute(select(JobRun.job, func.max(JobRun.finished_at)).group_by(JobRun.job)).all()
    status = []
    for job, last in rows:
        status.append({"name": job, "last_run": str(last), "freshness": "green" if last else "red", "cadence": "scheduled"})
    return status


from sqlalchemy import select, and_
from backend.db import get_session
from backend.models import BuoyObs

@app.get("/obs")
def obs(
    bbox: str | None = Query(None, description="minLon,minLat,maxLon,maxLat"),
    start: str | None = Query(None, description="ISO8601 start (UTC)"),
    end: str | None = Query(None, description="ISO8601 end (UTC)"),
    station: str | None = Query(None, description="Filter by station_id"),
    limit: int = Query(500, ge=1, le=5000),
    offset: int = Query(0, ge=0)
):
    sess = get_session()
    q = select(BuoyObs)
    if station:
        q = q.where(BuoyObs.station_id == station)
    if bbox:
        minLon, minLat, maxLon, maxLat = [float(x) for x in bbox.split(",")]
        q = q.where(BuoyObs.lon >= minLon, BuoyObs.lon <= maxLon,
                    BuoyObs.lat >= minLat, BuoyObs.lat <= maxLat)
    if start:
        from datetime import datetime
        q = q.where(BuoyObs.time >= datetime.fromisoformat(start.replace("Z","+00:00")))
    if end:
        from datetime import datetime
        q = q.where(BuoyObs.time <= datetime.fromisoformat(end.replace("Z","+00:00")))
    q = q.order_by(BuoyObs.time.desc()).limit(limit).offset(offset)
    rows = sess.execute(q).scalars().all()
    return [{
        "station_id": r.station_id,
        "time": r.time.isoformat() if hasattr(r.time, "isoformat") else str(r.time),
        "sst_c": r.sst_c,
        "qc_flag": r.qc_flag,
        "lat": r.lat,
        "lon": r.lon,
        "source": r.source
    } for r in rows]


from sqlalchemy import func
from backend.models import BuoyObs

@app.get("/obs/summary")
def obs_summary(
    bbox: str | None = Query(None, description="minLon,minLat,maxLon,maxLat"),
    start: str | None = Query(None, description="ISO8601 start (UTC)"),
    end: str | None = Query(None, description="ISO8601 end (UTC)"),
    station: str | None = Query(None, description="Filter by station_id")
):
    sess = get_session()
    q = sess.query(
        func.date_trunc('day', BuoyObs.time).label('day'),
        func.count().label('n'),
        func.avg(BuoyObs.sst_c).label('avg_sst_c'),
        func.min(BuoyObs.sst_c).label('min_sst_c'),
        func.max(BuoyObs.sst_c).label('max_sst_c'),
    )
    if station:
        q = q.filter(BuoyObs.station_id == station)
    if bbox:
        minLon, minLat, maxLon, maxLat = [float(x) for x in bbox.split(",")]
        q = q.filter(BuoyObs.lon >= minLon, BuoyObs.lon <= maxLon,
                     BuoyObs.lat >= minLat, BuoyObs.lat <= maxLat)
    if start:
        from datetime import datetime
        q = q.filter(BuoyObs.time >= datetime.fromisoformat(start.replace("Z","+00:00")))
    if end:
        from datetime import datetime
        q = q.filter(BuoyObs.time <= datetime.fromisoformat(end.replace("Z","+00:00")))
    q = q.group_by(func.date_trunc('day', BuoyObs.time)).order_by(func.date_trunc('day', BuoyObs.time))
    rows = q.all()
    return [{
        "day": (d.isoformat() if hasattr(d, "isoformat") else str(d)),
        "count": int(n or 0),
        "avg_sst_c": float(avg or 0),
        "min_sst_c": float(mn or 0),
        "max_sst_c": float(mx or 0),
    } for d, n, avg, mn, mx in rows]
