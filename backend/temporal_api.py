# SPDX-License-Identifier: MIT
# © 2024–2025 Mark Lindon — BlueSphere
"""
Temporal temperature API endpoints for the BlueSphere ocean monitoring platform.
Provides comprehensive access to historical temperature data, anomalies, and marine heatwaves.
"""

from typing import Optional, List, Dict, Any
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Query, HTTPException, Depends
from pydantic import BaseModel, Field
import redis
import json
from functools import lru_cache

from backend.temporal_db import temporal_data_manager, TemporalDataManager

router = APIRouter(prefix="/temporal", tags=["temporal"])

# Pydantic models for API responses
class TemperatureDataPoint(BaseModel):
    """Single temperature data point"""
    id: str
    date: str
    lat: float
    lon: float
    sst_c: Optional[float] = None
    avg_sst_c: Optional[float] = None
    min_sst_c: Optional[float] = None
    max_sst_c: Optional[float] = None
    std_sst_c: Optional[float] = None
    count: Optional[int] = None
    dataset: str
    resolution: Optional[str] = None
    quality_flag: Optional[int] = None

class TemperatureResponse(BaseModel):
    """Response model for temperature data queries"""
    count: int
    resolution: str
    start_date: str
    end_date: str
    bbox: Optional[List[float]] = None
    dataset: Optional[str] = None
    data: List[TemperatureDataPoint]
    
class AnomalyDataPoint(BaseModel):
    """Single temperature anomaly data point"""
    id: str
    date: str
    lat: float
    lon: float
    anomaly_c: float
    baseline_period: str
    dataset: str

class AnomalyResponse(BaseModel):
    """Response model for temperature anomaly queries"""
    count: int
    baseline_period: str
    start_date: str
    end_date: str
    bbox: Optional[List[float]] = None
    data: List[AnomalyDataPoint]

class HeatwaveEvent(BaseModel):
    """Marine heatwave event"""
    id: str
    start_date: str
    end_date: str
    duration_days: int
    lat: float
    lon: float
    max_intensity_c: float
    mean_intensity_c: float
    cumulative_intensity: float
    threshold_percentile: int
    dataset: str

class HeatwaveResponse(BaseModel):
    """Response model for marine heatwave queries"""
    count: int
    start_date: str
    end_date: str
    min_duration: int
    threshold_percentile: int
    bbox: Optional[List[float]] = None
    events: List[HeatwaveEvent]

class DataAvailability(BaseModel):
    """Data availability summary"""
    dataset: str
    resolution: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_records: int
    spatial_bounds: Optional[Dict[str, float]] = None

# Cache for expensive queries
try:
    redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
    redis_client.ping()
    CACHE_ENABLED = True
except:
    redis_client = None
    CACHE_ENABLED = False

def get_cache_key(endpoint: str, **kwargs) -> str:
    """Generate cache key for endpoint with parameters"""
    params = "&".join([f"{k}={v}" for k, v in sorted(kwargs.items()) if v is not None])
    return f"bluesphere:temporal:{endpoint}:{hash(params)}"

def get_cached_result(cache_key: str, ttl: int = 3600):
    """Get cached result if available"""
    if not CACHE_ENABLED:
        return None
    
    try:
        cached = redis_client.get(cache_key)
        if cached:
            return json.loads(cached)
    except:
        pass
    return None

def set_cached_result(cache_key: str, data: Any, ttl: int = 3600):
    """Cache result with TTL"""
    if not CACHE_ENABLED:
        return
    
    try:
        redis_client.setex(cache_key, ttl, json.dumps(data, default=str))
    except:
        pass

def parse_bbox(bbox_str: str) -> tuple:
    """Parse bbox string to tuple of floats"""
    try:
        coords = [float(x.strip()) for x in bbox_str.split(",")]
        if len(coords) != 4:
            raise ValueError("BBox must have 4 coordinates")
        min_lon, min_lat, max_lon, max_lat = coords
        
        # Validate coordinate ranges
        if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        if min_lat >= max_lat or min_lon >= max_lon:
            raise ValueError("Invalid bounding box: min values must be less than max values")
            
        return min_lon, min_lat, max_lon, max_lat
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid bbox format: {str(e)}")

@router.get("/temperatures", response_model=TemperatureResponse)
async def get_temperatures(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    resolution: str = Query("monthly", description="Data resolution: daily, monthly, yearly, grid"),
    bbox: Optional[str] = Query(None, description="Bounding box: min_lon,min_lat,max_lon,max_lat"),
    dataset: Optional[str] = Query(None, description="Dataset filter (ERSST, OISST, etc.)"),
    limit: int = Query(5000, ge=1, le=10000, description="Maximum number of records"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    data_manager: TemporalDataManager = Depends(lambda: temporal_data_manager)
):
    """
    Retrieve historical temperature data with date range and spatial filtering.
    
    - **start_date**: Start date for data query (YYYY-MM-DD format)
    - **end_date**: End date for data query (YYYY-MM-DD format)  
    - **resolution**: Data resolution (daily, monthly, yearly, grid)
    - **bbox**: Optional bounding box (min_lon,min_lat,max_lon,max_lat)
    - **dataset**: Optional dataset filter
    - **limit**: Maximum records to return (1-10000)
    - **offset**: Offset for pagination
    """
    
    # Cache key for this request
    cache_key = get_cache_key("temperatures", 
                             start_date=start_date, end_date=end_date,
                             resolution=resolution, bbox=bbox, dataset=dataset,
                             limit=limit, offset=offset)
    
    # Check cache first
    cached_result = get_cached_result(cache_key)
    if cached_result:
        return cached_result
    
    try:
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        if start_dt > end_dt:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        # Parse bbox if provided
        bbox_coords = None
        if bbox:
            bbox_coords = parse_bbox(bbox)
        
        # Query data
        data = data_manager.get_temperature_data(
            start_date=start_dt,
            end_date=end_dt,
            bbox=bbox_coords,
            dataset=dataset,
            resolution=resolution,
            limit=limit,
            offset=offset
        )
        
        response = TemperatureResponse(
            count=len(data),
            resolution=resolution,
            start_date=start_date,
            end_date=end_date,
            bbox=list(bbox_coords) if bbox_coords else None,
            dataset=dataset,
            data=[TemperatureDataPoint(**item) for item in data]
        )
        
        # Cache result for 1 hour
        set_cached_result(cache_key, response.dict(), ttl=3600)
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/anomalies", response_model=AnomalyResponse)
async def get_temperature_anomalies(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    baseline: str = Query("1991-2020", description="Baseline period (YYYY-YYYY)"),
    bbox: Optional[str] = Query(None, description="Bounding box: min_lon,min_lat,max_lon,max_lat"),
    dataset: Optional[str] = Query(None, description="Dataset filter"),
    threshold: Optional[float] = Query(None, description="Minimum anomaly threshold (absolute value)"),
    limit: int = Query(5000, ge=1, le=10000, description="Maximum number of records"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    data_manager: TemporalDataManager = Depends(lambda: temporal_data_manager)
):
    """
    Retrieve temperature anomaly data calculated against climate baselines.
    
    - **start_date**: Start date for anomaly data
    - **end_date**: End date for anomaly data
    - **baseline**: Baseline period for anomaly calculation (e.g., "1991-2020")
    - **bbox**: Optional bounding box
    - **dataset**: Optional dataset filter
    - **threshold**: Optional minimum anomaly threshold (°C)
    - **limit**: Maximum records to return
    - **offset**: Offset for pagination
    """
    
    cache_key = get_cache_key("anomalies",
                             start_date=start_date, end_date=end_date,
                             baseline=baseline, bbox=bbox, dataset=dataset,
                             threshold=threshold, limit=limit, offset=offset)
    
    cached_result = get_cached_result(cache_key)
    if cached_result:
        return cached_result
    
    try:
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        if start_dt > end_dt:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        # Validate baseline period format
        if not baseline.count('-') == 1:
            raise HTTPException(status_code=400, detail="Baseline must be in format YYYY-YYYY")
        
        # Parse bbox if provided
        bbox_coords = None
        if bbox:
            bbox_coords = parse_bbox(bbox)
        
        # Query data
        data = data_manager.get_temperature_anomalies(
            start_date=start_dt,
            end_date=end_dt,
            baseline=baseline,
            bbox=bbox_coords,
            dataset=dataset,
            threshold=threshold,
            limit=limit,
            offset=offset
        )
        
        response = AnomalyResponse(
            count=len(data),
            baseline_period=baseline,
            start_date=start_date,
            end_date=end_date,
            bbox=list(bbox_coords) if bbox_coords else None,
            data=[AnomalyDataPoint(**item) for item in data]
        )
        
        # Cache result for 1 hour
        set_cached_result(cache_key, response.dict(), ttl=3600)
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/heatwaves", response_model=HeatwaveResponse)
async def get_marine_heatwaves(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    bbox: Optional[str] = Query(None, description="Bounding box: min_lon,min_lat,max_lon,max_lat"),
    threshold: int = Query(90, ge=85, le=99, description="Temperature percentile threshold (85-99)"),
    duration: int = Query(5, ge=3, le=365, description="Minimum duration in days"),
    dataset: Optional[str] = Query(None, description="Dataset filter"),
    limit: int = Query(1000, ge=1, le=5000, description="Maximum number of events"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    data_manager: TemporalDataManager = Depends(lambda: temporal_data_manager)
):
    """
    Retrieve marine heatwave events detected from temperature data.
    
    - **start_date**: Start date for heatwave search
    - **end_date**: End date for heatwave search  
    - **bbox**: Optional bounding box
    - **threshold**: Temperature percentile threshold (85-99)
    - **duration**: Minimum duration in days (3-365)
    - **dataset**: Optional dataset filter
    - **limit**: Maximum events to return
    - **offset**: Offset for pagination
    """
    
    cache_key = get_cache_key("heatwaves",
                             start_date=start_date, end_date=end_date,
                             bbox=bbox, threshold=threshold, duration=duration,
                             dataset=dataset, limit=limit, offset=offset)
    
    cached_result = get_cached_result(cache_key)
    if cached_result:
        return cached_result
    
    try:
        # Parse dates
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        if start_dt > end_dt:
            raise HTTPException(status_code=400, detail="Start date must be before end date")
        
        # Parse bbox if provided
        bbox_coords = None
        if bbox:
            bbox_coords = parse_bbox(bbox)
        
        # Query data
        data = data_manager.get_marine_heatwaves(
            start_date=start_dt,
            end_date=end_dt,
            bbox=bbox_coords,
            min_duration=duration,
            threshold_percentile=threshold,
            dataset=dataset,
            limit=limit,
            offset=offset
        )
        
        response = HeatwaveResponse(
            count=len(data),
            start_date=start_date,
            end_date=end_date,
            min_duration=duration,
            threshold_percentile=threshold,
            bbox=list(bbox_coords) if bbox_coords else None,
            events=[HeatwaveEvent(**item) for item in data]
        )
        
        # Cache result for 2 hours (heatwave data changes less frequently)
        set_cached_result(cache_key, response.dict(), ttl=7200)
        
        return response
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/availability", response_model=List[DataAvailability])
async def get_data_availability(
    dataset: Optional[str] = Query(None, description="Filter by dataset"),
    resolution: str = Query("monthly", description="Data resolution"),
    data_manager: TemporalDataManager = Depends(lambda: temporal_data_manager)
):
    """
    Get data availability summary for temporal temperature datasets.
    
    - **dataset**: Optional dataset filter
    - **resolution**: Data resolution to check (daily, monthly, yearly)
    """
    
    cache_key = get_cache_key("availability", dataset=dataset, resolution=resolution)
    
    cached_result = get_cached_result(cache_key)
    if cached_result:
        return cached_result
    
    try:
        if dataset:
            datasets = [dataset]
        else:
            # Get all available datasets
            datasets = ["ERSST", "OISST", "AVHRR", "MODIS"]
        
        availability = []
        for ds in datasets:
            availability.append(
                DataAvailability(**data_manager.get_data_availability(ds, resolution))
            )
        
        # Cache result for 6 hours (availability changes infrequently)
        set_cached_result(cache_key, [item.dict() for item in availability], ttl=21600)
        
        return availability
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/stats/summary")
async def get_temporal_summary(
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)"),
    bbox: Optional[str] = Query(None, description="Bounding box: min_lon,min_lat,max_lon,max_lat"),
    dataset: Optional[str] = Query(None, description="Dataset filter"),
    resolution: str = Query("monthly", description="Data resolution"),
    data_manager: TemporalDataManager = Depends(lambda: temporal_data_manager)
):
    """
    Get statistical summary of temperature data for a region and time period.
    
    Returns aggregate statistics including mean, min, max temperatures,
    data coverage, and anomaly information.
    """
    
    cache_key = get_cache_key("summary",
                             start_date=start_date, end_date=end_date,
                             bbox=bbox, dataset=dataset, resolution=resolution)
    
    cached_result = get_cached_result(cache_key, ttl=1800)  # 30 min cache
    if cached_result:
        return cached_result
    
    try:
        # Parse dates and bbox
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        
        bbox_coords = None
        if bbox:
            bbox_coords = parse_bbox(bbox)
        
        # Get temperature data for statistics
        temp_data = data_manager.get_temperature_data(
            start_date=start_dt,
            end_date=end_dt,
            bbox=bbox_coords,
            dataset=dataset,
            resolution=resolution,
            limit=10000  # Large limit for stats
        )
        
        if not temp_data:
            return {
                "period": {"start_date": start_date, "end_date": end_date},
                "spatial_bounds": list(bbox_coords) if bbox_coords else None,
                "dataset": dataset,
                "resolution": resolution,
                "statistics": None,
                "message": "No data available for specified parameters"
            }
        
        # Calculate statistics
        temps = [d.get('avg_sst_c') or d.get('sst_c') for d in temp_data if (d.get('avg_sst_c') or d.get('sst_c')) is not None]
        
        if temps:
            import statistics
            stats = {
                "count": len(temp_data),
                "temperature_statistics": {
                    "mean_sst_c": statistics.mean(temps),
                    "median_sst_c": statistics.median(temps),
                    "min_sst_c": min(temps),
                    "max_sst_c": max(temps),
                    "std_sst_c": statistics.stdev(temps) if len(temps) > 1 else 0.0
                },
                "spatial_coverage": {
                    "unique_locations": len(set((d['lat'], d['lon']) for d in temp_data)),
                    "lat_range": [min(d['lat'] for d in temp_data), max(d['lat'] for d in temp_data)],
                    "lon_range": [min(d['lon'] for d in temp_data), max(d['lon'] for d in temp_data)]
                }
            }
        else:
            stats = {
                "count": len(temp_data),
                "temperature_statistics": None,
                "spatial_coverage": None
            }
        
        summary = {
            "period": {"start_date": start_date, "end_date": end_date},
            "spatial_bounds": list(bbox_coords) if bbox_coords else None,
            "dataset": dataset,
            "resolution": resolution,
            "statistics": stats
        }
        
        # Cache for 30 minutes
        set_cached_result(cache_key, summary, ttl=1800)
        
        return summary
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/cache/clear")
async def clear_cache():
    """Clear all cached temporal data results"""
    if not CACHE_ENABLED:
        return {"message": "Cache not enabled"}
    
    try:
        keys = redis_client.keys("bluesphere:temporal:*")
        if keys:
            redis_client.delete(*keys)
            return {"message": f"Cleared {len(keys)} cached results"}
        else:
            return {"message": "No cached results to clear"}
    except Exception as e:
        return {"error": f"Failed to clear cache: {str(e)}"}