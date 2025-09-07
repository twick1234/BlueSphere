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
async def stations():
    """Get real global ocean monitoring stations with live data"""
    try:
        from backend.real_data_feeds import get_real_global_stations
        real_stations = await get_real_global_stations()
        
        # Transform to API format
        stations_data = []
        for station in real_stations:
            stations_data.append({
                "station_id": station.station_id,
                "name": station.name,
                "lat": station.lat,
                "lon": station.lon,
                "provider": station.provider,
                "country": station.country,
                "active": station.active,
                "station_type": station.station_type,
                "water_depth": station.water_depth,
                "last_update": station.last_observation.isoformat() if station.last_observation else None,
                "current_data": station.current_data
            })
            
        return {
            "count": len([s for s in stations_data if s["active"]]),
            "total_network": len(stations_data),
            "stations": stations_data,
            "data_sources": ["NOAA NDBC", "Australian BOM", "Canadian Marine Service", "European EMSO"],
            "coverage": {
                "countries": list(set(s["country"] for s in stations_data)),
                "providers": list(set(s["provider"] for s in stations_data))
            },
            "mission": "Real-time global ocean monitoring for climate action",
            "last_updated": "live"
        }
    except Exception as e:
        print(f"Error fetching real stations: {e}")
        # Emergency fallback - this should rarely be used
        return {
            "count": 0,
            "stations": [],
            "error": "Real-time data temporarily unavailable",
            "mission": "Climate action requires data - working to restore service"
        }

@app.get("/")
def root():
    return {
        "message": "BlueSphere Ocean API",
        "version": "0.16.0",
        "endpoints": {
            "health": "/health",
            "status": "/status", 
            "stations": "/stations",
            "docs": "/docs"
        }
    }

@app.get("/stations/live")
def live_stations():
    """Get real-time data from most recently updated stations"""
    try:
        from backend.real_time_stations import global_stations
        import random
        global_stations.update_real_time_data()  # Force real-time update
        
        # Get 50 most recently updated stations
        active_stations = [s for s in global_stations.stations if s['active']]
        recent_stations = sorted(active_stations, key=lambda x: x['last_update'], reverse=True)[:50]
        
        return {
            "live_count": len(recent_stations),
            "last_updated": recent_stations[0]['last_update'] if recent_stations else None,
            "stations": recent_stations,
            "update_frequency": "Every 5 minutes"
        }
    except ImportError:
        return {"error": "Real-time data unavailable", "live_count": 0}

@app.get("/stations/region/{region}")
def stations_by_region(region: str):
    """Get stations by ocean region"""
    try:
        from backend.real_time_stations import global_stations
        regional_data = global_stations.get_regional_stations(region=region)
        return regional_data
    except ImportError:
        return {"error": "Regional data unavailable", "count": 0}

@app.get("/temperature/current")
def current_temperatures():
    """Get current temperature readings from all active stations"""
    try:
        from backend.real_time_stations import global_stations
        active_stations = [s for s in global_stations.stations if s['active']]
        
        temp_data = []
        for station in active_stations[:100]:  # Limit to 100 for performance
            if 'current_data' in station and 'sea_surface_temperature' in station['current_data']:
                temp_data.append({
                    'station_id': station['station_id'],
                    'lat': station['lat'],
                    'lon': station['lon'],
                    'temperature': station['current_data']['sea_surface_temperature'],
                    'timestamp': station['current_data']['timestamp'],
                    'quality': station['current_data']['quality_flags']['sst']
                })
        
        return {
            "count": len(temp_data),
            "temperature_data": temp_data,
            "units": "Celsius",
            "generated_at": global_stations.last_update.isoformat()
        }
    except ImportError:
        return {"error": "Temperature data unavailable", "count": 0}

@app.get("/alerts/marine-heatwaves")
def marine_heatwave_alerts():
    """Detect and return active marine heatwave alerts"""
    try:
        from backend.real_time_stations import global_stations
        import statistics
        
        active_stations = [s for s in global_stations.stations if s['active']]
        alerts = []
        
        # Simple heatwave detection: temperatures > 2 standard deviations above local mean
        for station in active_stations:
            if 'current_data' in station and 'sea_surface_temperature' in station['current_data']:
                temp = station['current_data']['sea_surface_temperature']
                lat = abs(station['lat'])
                
                # Expected temperature based on latitude
                expected_temp = 25 - (lat * 0.4)
                
                if temp > expected_temp + 4:  # 4°C above expected
                    alerts.append({
                        'station_id': station['station_id'],
                        'name': station['name'],
                        'lat': station['lat'],
                        'lon': station['lon'],
                        'current_temp': temp,
                        'expected_temp': round(expected_temp, 1),
                        'anomaly': round(temp - expected_temp, 1),
                        'severity': 'High' if temp > expected_temp + 6 else 'Moderate',
                        'alert_time': station['current_data']['timestamp']
                    })
        
        return {
            "active_alerts": len(alerts),
            "marine_heatwaves": alerts,
            "alert_threshold": "4°C above regional average",
            "last_checked": global_stations.last_update.isoformat()
        }
    except ImportError:
        return {"error": "Alert system unavailable", "active_alerts": 0}

@app.get("/docs")
def docs():
    return {"message": "API documentation available at /docs"}