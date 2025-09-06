from fastapi import FastAPI, Query, HTTPException
from pydantic import BaseModel
from typing import Union
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def db_conn():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB","ocean"),
        user=os.getenv("POSTGRES_USER","ocean_app"),
        password=os.getenv("POSTGRES_PASSWORD","changeme"),
        host=os.getenv("POSTGRES_HOST","localhost"),
        port=int(os.getenv("POSTGRES_PORT","5432"))
    )

app = FastAPI(title="BlueSphere API", version="0.1.0")

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/stations")
def stations(bbox: Union[str, None] = Query(None, description="minLon,minLat,maxLon,maxLat"),
             platform: Union[str, None] = None, limit: int = 200):
    q = """
    SELECT station_id, external_id, name, platform_type,
           ST_X(ST_AsText(geom::geometry)) AS lon,
           ST_Y(ST_AsText(geom::geometry)) AS lat
    FROM ocean.station s
    WHERE 1=1
    """
    params = []
    if platform:
        q += " AND platform_type = %s"
        params.append(platform)
    if bbox:
        try:
            minLon, minLat, maxLon, maxLat = [float(x) for x in bbox.split(",")]
        except Exception:
            raise HTTPException(400, "Invalid bbox format, expected minLon,minLat,maxLon,maxLat")
        q += " AND ST_Intersects(geom, ST_MakeEnvelope(%s,%s,%s,%s,4326)::geography)"
        params += [minLon, minLat, maxLon, maxLat]
    q += " LIMIT %s"
    params.append(limit)
    with db_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(q, params)
        rows = cur.fetchall()
    return {"stations": rows}

@app.get("/stations/{station_id}/series")
def station_series(station_id: int, var: str = "sst", start: Union[str, None] = None, end: Union[str, None] = None, qc: str = "good"):
    col = {"sst":"sst_c","sss":"sss_psu"}.get(var, "sst_c")
    q = f"SELECT observed_at, {col} as value, qc_flag FROM ocean.obs_surface WHERE station_id=%s"
    params = [station_id]
    if start:
        q += " AND observed_at >= %s"
        params.append(start)
    if end:
        q += " AND observed_at <= %s"
        params.append(end)
    if qc == "good":
        q += " AND qc_flag IN (0,1,2)"
    q += " ORDER BY observed_at"
    with db_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(q, params)
        rows = cur.fetchall()
    return {"series": rows}

@app.get("/grid/sst")
def grid_sst(month: str, bbox: Union[str, None] = None, anomaly: bool = False, limit: int = 100000):
    value_col = "sst_anom_c" if anomaly else "sst_c"
    q = f"""
    SELECT gv.time_month, gv.{value_col} as value,
           ST_X(ST_AsText(gc.centroid::geometry)) AS lon,
           ST_Y(ST_AsText(gc.centroid::geometry)) AS lat
    FROM ocean.grid_value gv
    JOIN ocean.grid_cell gc USING (cell_id)
    WHERE gv.time_month = %s
    """
    params = [month + "-01" if len(month)==7 else month]
    if bbox:
        minLon, minLat, maxLon, maxLat = [float(x) for x in bbox.split(",")]
        q += " AND ST_Intersects(gc.centroid, ST_MakeEnvelope(%s,%s,%s,%s,4326)::geography)"
        params += [minLon, minLat, maxLon, maxLat]
    q += " LIMIT %s"
    params.append(limit)
    with db_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(q, params)
        rows = cur.fetchall()
    return {"grid": rows, "anomaly": anomaly}


@app.get("/status")
def status():
    """
    Returns freshness info per dataset based on latest finished job_run.
    Output:
      {
        "datasets": [
          {"dataset_id": 1, "name": "NDBC_STD_MET sst", "last_finished_at": "...", "status": "green|yellow|red"}
        ]
      }
    """
    sql = """
    WITH latest AS (
      SELECT j.dataset_id, MAX(j.finished_at) AS last_finished_at
      FROM ocean.job_run j
      WHERE j.status = 'succeeded'
      GROUP BY j.dataset_id
    )
    SELECT d.dataset_id,
           (s.name || ' ' || d.code || ' ' || d.variable) AS name,
           l.last_finished_at
    FROM ocean.dataset d
    JOIN ocean.source s ON s.source_id = d.source_id
    LEFT JOIN latest l ON l.dataset_id = d.dataset_id
    ORDER BY d.dataset_id;
    """
    from datetime import datetime, timezone, timedelta
    with db_conn() as conn, conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(sql)
        rows = cur.fetchall()
    now = datetime.now(timezone.utc)
    out = []
    for r in rows:
        t = r.get("last_finished_at")
        status = "red"
        if t:
            age = (now - t).total_seconds() / 3600.0
            # Heuristic thresholds: monthly datasets can be "green" if <45 days; daily <36h; hourly <6h
            # Use cadence to pick thresholds (fallback to 36h)
            cadence_sql = "SELECT cadence FROM ocean.dataset WHERE dataset_id=%s"
            with db_conn() as conn, conn.cursor() as cur2:
                cur2.execute(cadence_sql, (r["dataset_id"],))
                cad = cur2.fetchone()[0] if cur2.rowcount else None
            if cad == "monthly":
                status = "green" if age <= (24*45) else ("yellow" if age <= (24*90) else "red")
            elif cad in ("hourly","realtime"):
                status = "green" if age <= 6 else ("yellow" if age <= 24 else "red")
            else:
                status = "green" if age <= 36 else ("yellow" if age <= 72 else "red")
        out.append({
            "dataset_id": r["dataset_id"],
            "name": r["name"],
            "last_finished_at": t.isoformat() if t else None,
            "status": status
        })
    return {"datasets": out}
