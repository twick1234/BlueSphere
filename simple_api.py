from fastapi import FastAPI
from typing import Union

app = FastAPI(title="BlueSphere API", version="0.16.0")

@app.get("/health")
def health():
    return {"ok": True, "status": "running"}

@app.get("/status")
def status():
    return {
        "datasets": [
            {"dataset_id": 1, "name": "NDBC buoys", "last_finished_at": None, "status": "red"},
            {"dataset_id": 2, "name": "ERSST monthly", "last_finished_at": None, "status": "red"},
            {"dataset_id": 3, "name": "Surface currents", "last_finished_at": None, "status": "red"},
        ]
    }

@app.get("/stations")
def stations():
    return {"count": 0, "stations": []}

@app.get("/docs")
def docs():
    return {"message": "API documentation available at /docs"}