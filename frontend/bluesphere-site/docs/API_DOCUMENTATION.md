# 📡 BlueSphere API Documentation

## Overview

The BlueSphere API provides programmatic access to global ocean monitoring data, marine heatwave alerts, and climate predictions. This RESTful API serves real-time and historical oceanographic data from 200+ monitoring stations worldwide.

**Base URL**: `https://bluesphere.org/api`  
**Current Version**: `v1`  
**Protocol**: HTTPS only  
**Data Format**: JSON  

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Core Endpoints](#core-endpoints)
  - [Stations](#stations-api)
  - [Observations](#observations-api)
  - [Alerts](#alerts-api)
  - [Predictions](#predictions-api)
  - [Status](#status-api)
- [Specialized Endpoints](#specialized-endpoints)
- [Data Models](#data-models)
- [Code Examples](#code-examples)
- [SDK Libraries](#sdk-libraries)

## Authentication

### API Keys

All API requests require authentication via API key in the request header:

```http
X-API-Key: your_api_key_here
```

### Getting API Keys

1. Register at [https://bluesphere.org/developers](https://bluesphere.org/developers)
2. Verify your email address
3. Generate API key from your dashboard
4. Choose your usage tier:

#### Usage Tiers

| Tier | Rate Limit | Features | Price |
|------|------------|----------|-------|
| **Free** | 1,000 requests/day | Basic data access | Free |
| **Researcher** | 10,000 requests/day | Historical data, exports | $29/month |
| **Institution** | 100,000 requests/day | Bulk access, webhooks | $199/month |
| **Enterprise** | Unlimited | Custom integrations, SLA | Contact us |

## Rate Limiting

Rate limits are enforced per API key:

- **Free Tier**: 1,000 requests/day, 100 requests/hour
- **Researcher Tier**: 10,000 requests/day, 500 requests/hour
- **Institution Tier**: 100,000 requests/day, 2,000 requests/hour
- **Enterprise Tier**: No rate limits

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Retry after 3600 seconds.",
    "retry_after": 3600
  }
}
```

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error
- `503` - Service Unavailable

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid parameter: start_time must be ISO 8601 format",
    "details": {
      "parameter": "start_time",
      "received": "2023-13-01",
      "expected": "ISO 8601 datetime string"
    }
  }
}
```

## Core Endpoints

### Stations API

#### Get All Stations

```http
GET /api/stations
```

Returns metadata for all monitoring stations in the global network.

**Response**:
```json
{
  "count": 156,
  "total_network": 189,
  "stations": [
    {
      "station_id": "41001",
      "name": "East Hatteras",
      "lat": 34.7,
      "lon": -72.7,
      "provider": "NOAA NDBC",
      "country": "United States",
      "active": true,
      "station_type": "moored_buoy",
      "water_depth": 2900,
      "last_observation": "2025-09-11T08:15:00Z",
      "current_data": {
        "sea_surface_temperature": 24.8,
        "air_temperature": 26.2,
        "barometric_pressure": 1013.2,
        "timestamp": "2025-09-11T08:15:00Z",
        "quality_flags": {
          "sst": 1,
          "overall": "good"
        }
      }
    }
  ],
  "data_sources": [
    "NOAA NDBC",
    "Australian BOM",
    "Canadian Marine Service",
    "European EMSO",
    "Japanese Oceanographic Network",
    "Brazilian Ocean Network",
    "Global Ocean Observing System"
  ],
  "coverage": {
    "countries": ["United States", "Australia", "Canada", "..."],
    "providers": ["NOAA NDBC", "Australian BOM", "..."]
  },
  "climate_emergency": {
    "marine_heatwaves_detected": 23,
    "temperature_anomaly": "+1.54°C above pre-industrial",
    "coral_bleaching_risk": "HIGH"
  }
}
```

#### Get Station by ID

```http
GET /api/stations/{station_id}
```

**Parameters**:
- `station_id` (required) - Station identifier

**Example**:
```http
GET /api/stations/41001
```

### Observations API

#### Get Station Observations

```http
GET /api/obs?station_id={station_id}&start_time={start}&end_time={end}&parameters={params}
```

**Parameters**:
- `station_id` (required) - Station identifier
- `start_time` (required) - ISO 8601 datetime string
- `end_time` (required) - ISO 8601 datetime string  
- `parameters` (optional) - Comma-separated list: `sst,air_temp,pressure,wind_speed,wave_height`
- `quality_filter` (optional) - Quality flag filter: `1,2,3,4,5`
- `format` (optional) - Response format: `json` (default), `csv`

**Example**:
```http
GET /api/obs?station_id=41001&start_time=2025-09-01T00:00:00Z&end_time=2025-09-10T00:00:00Z&parameters=sst,air_temp
```

**Response**:
```json
{
  "station_id": "41001",
  "station_name": "East Hatteras",
  "time_range": {
    "start": "2025-09-01T00:00:00Z",
    "end": "2025-09-10T00:00:00Z"
  },
  "parameters": ["sea_surface_temperature", "air_temperature"],
  "data_points": 240,
  "observations": [
    {
      "timestamp": "2025-09-01T00:00:00Z",
      "sea_surface_temperature": 24.5,
      "air_temperature": 25.1,
      "quality_flags": {
        "sst": 1,
        "air_temp": 1
      }
    }
  ],
  "units": {
    "sea_surface_temperature": "celsius",
    "air_temperature": "celsius"
  },
  "quality_legend": {
    "1": "Good",
    "2": "Fair", 
    "3": "Poor",
    "4": "Bad",
    "5": "Missing"
  }
}
```

#### Get Observations Summary

```http
GET /api/obs/summary?station_id={station_id}&period={period}
```

**Parameters**:
- `station_id` (required) - Station identifier
- `period` (optional) - Time period: `24h`, `7d`, `30d`, `1y` (default: `24h`)

**Response**:
```json
{
  "station_id": "41001",
  "period": "24h",
  "summary": {
    "sea_surface_temperature": {
      "current": 24.8,
      "min": 23.2,
      "max": 25.4,
      "mean": 24.1,
      "trend": "increasing"
    },
    "data_completeness": 98.5,
    "last_updated": "2025-09-11T08:15:00Z"
  }
}
```

### Alerts API

#### Get Marine Heatwave Alerts

```http
GET /api/alerts/marine-heatwaves?active={true|false}&severity={level}
```

**Parameters**:
- `active` (optional) - Filter for active alerts only: `true|false`
- `severity` (optional) - Filter by severity: `Moderate|High|Extreme`
- `region` (optional) - Geographic region filter

**Response**:
```json
{
  "active_alerts": 7,
  "marine_heatwaves": [
    {
      "station_id": "HW1000",
      "name": "Great Barrier Reef Monitor",
      "lat": -16.3,
      "lon": 145.8,
      "current_temp": 30.2,
      "expected_temp": 26.1,
      "anomaly": 4.1,
      "severity": "High",
      "alert_time": "2025-09-11T08:00:00Z",
      "risk_level": "HIGH - Widespread ecosystem stress"
    }
  ],
  "alert_threshold": "4°C above regional average",
  "emergency_status": "HIGH",
  "climate_impact": {
    "coral_reefs_at_risk": 5,
    "ecosystem_threat_level": "UNPRECEDENTED"
  }
}
```

### Predictions API

#### Get Temperature Forecasts

```http
GET /api/predictions/forecast?station_id={station_id}&horizon={hours}&model={model_type}
```

**Parameters**:
- `station_id` (required) - Station identifier
- `horizon` (optional) - Forecast horizon in hours: `24|72|168|336` (default: `72`)
- `model` (optional) - Model type: `arima|lstm|ensemble` (default: `ensemble`)
- `include_uncertainty` (optional) - Include confidence intervals: `true|false`

**Response**:
```json
{
  "station_id": "41001",
  "prediction_time": "2025-09-11T08:00:00Z",
  "model_used": "Ensemble v2.1",
  "forecast_horizon_hours": 72,
  "predictions": [
    {
      "target_time": "2025-09-12T00:00:00Z",
      "predicted_sst": 24.3,
      "uncertainty": {
        "standard_deviation": 0.8,
        "confidence_68": {
          "lower": 23.5,
          "upper": 25.1
        },
        "confidence_95": {
          "lower": 22.7,
          "upper": 25.9
        }
      },
      "skill_score": 0.87
    }
  ],
  "model_info": {
    "training_data": "5 years historical",
    "last_retrained": "2025-09-01T00:00:00Z",
    "accuracy_7day": 0.91
  }
}
```

#### Get Model Status

```http
GET /api/predictions/models
```

**Response**:
```json
{
  "models": [
    {
      "name": "ARIMA",
      "status": "active",
      "accuracy": 0.85,
      "last_retrained": "2025-09-10T00:00:00Z",
      "forecasts_generated": 15420
    },
    {
      "name": "LSTM",
      "status": "active", 
      "accuracy": 0.89,
      "last_retrained": "2025-09-09T00:00:00Z",
      "forecasts_generated": 12100
    }
  ],
  "ensemble_weights": {
    "arima": 0.3,
    "lstm": 0.7
  }
}
```

### Status API

#### Get System Status

```http
GET /api/status
```

**Response**:
```json
{
  "system_status": "operational",
  "data_freshness": "12 minutes",
  "active_stations": 156,
  "last_updated": "2025-09-11T08:00:00Z",
  "services": {
    "data_ingestion": "operational",
    "predictions": "operational", 
    "alerts": "operational",
    "database": "operational"
  },
  "performance": {
    "avg_response_time": "245ms",
    "uptime_24h": "99.8%",
    "errors_1h": 2
  }
}
```

## Specialized Endpoints

### Data Ingestion

#### Trigger Data Ingestion

```http
POST /api/ingestion/run
```

Manually trigger data ingestion from external sources (Admin only).

#### Get Ingestion Status

```http
GET /api/ingestion/status
```

**Response**:
```json
{
  "last_run": "2025-09-11T08:00:00Z",
  "status": "completed",
  "records_processed": 1247,
  "errors": 0,
  "next_scheduled": "2025-09-11T08:10:00Z"
}
```

### Tile Services

#### Sea Surface Temperature Tiles

```http
GET /api/tiles/sst/{z}/{x}/{y}.png?time={timestamp}
```

Returns temperature heatmap tiles for map visualization.

#### Ocean Current Tiles

```http
GET /api/tiles/currents/{z}/{x}/{y}.png?time={timestamp}
```

Returns current velocity and direction tiles.

### Interactive Features

#### Chatbot API

```http
POST /api/chatbot
Content-Type: application/json

{
  "message": "What's the current temperature at station 41001?",
  "context": {
    "user_id": "optional",
    "conversation_id": "optional"
  }
}
```

**Response**:
```json
{
  "response": "The current sea surface temperature at East Hatteras (station 41001) is 24.8°C, recorded at 08:15 UTC. This is slightly above the seasonal average of 24.1°C for this time of year.",
  "confidence": 0.95,
  "data_sources": ["station_41001"],
  "conversation_id": "conv_12345"
}
```

#### FAQ API

```http
GET /api/faq?category={category}&search={query}
```

**Parameters**:
- `category` (optional) - FAQ category filter
- `search` (optional) - Search query for FAQ content

## Data Models

### Station Model
```typescript
interface Station {
  station_id: string          // Unique identifier
  name: string                // Human-readable name
  lat: number                 // Latitude in decimal degrees
  lon: number                 // Longitude in decimal degrees  
  provider: string            // Data source organization
  country: string             // Country or region
  active: boolean             // Operational status
  station_type: string        // moored_buoy | drifting_buoy | platform
  water_depth?: number        // Depth in meters
  last_observation?: string   // ISO 8601 datetime
  current_data: CurrentData   // Latest observations
}

interface CurrentData {
  sea_surface_temperature?: number
  air_temperature?: number
  barometric_pressure?: number
  wind_speed?: number
  wind_direction?: number
  wave_height?: number
  timestamp: string
  quality_flags: QualityFlags
}

interface QualityFlags {
  sst: number                 // 1-5 scale (1=good, 5=missing)
  overall: string             // good | fair | poor
}
```

### Observation Model
```typescript
interface Observation {
  timestamp: string           // ISO 8601 datetime
  station_id: string          // Station identifier
  parameters: {
    sea_surface_temperature?: number
    air_temperature?: number
    barometric_pressure?: number
    wind_speed?: number
    wind_direction?: number
    wave_height?: number
    wave_period?: number
  }
  quality_flags: QualityFlags
  source: string              // Original data provider
}
```

### Alert Model
```typescript
interface MarineHeatwaveAlert {
  station_id: string          // Station identifier  
  name: string                // Station name
  lat: number                 // Latitude
  lon: number                 // Longitude
  current_temp: number        // Current temperature (°C)
  expected_temp: number       // Expected temperature (°C)
  anomaly: number             // Temperature anomaly (°C)
  severity: 'Moderate' | 'High' | 'Extreme'
  alert_time: string          // ISO 8601 datetime
  risk_level: string          // Risk assessment text
}
```

### Prediction Model
```typescript
interface Prediction {
  station_id: string          // Target station
  prediction_time: string     // When prediction was made
  target_time: string         // Future time being predicted
  parameter: string           // What is being predicted
  predicted_value: number     // Forecast value
  uncertainty?: {
    standard_deviation: number
    confidence_68: { lower: number, upper: number }
    confidence_95: { lower: number, upper: number }
  }
  skill_score: number         // Model accuracy (0-1)
  model_version: string       // Model identifier
}
```

## Code Examples

### Python

```python
import requests
import pandas as pd
from datetime import datetime, timedelta

class BlueSphereAPI:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "https://bluesphere.org/api"
        self.headers = {"X-API-Key": api_key}
    
    def get_stations(self):
        response = requests.get(f"{self.base_url}/stations", headers=self.headers)
        return response.json()
    
    def get_observations(self, station_id, start_time, end_time, parameters=None):
        params = {
            "station_id": station_id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        if parameters:
            params["parameters"] = ",".join(parameters)
            
        response = requests.get(f"{self.base_url}/obs", 
                              params=params, headers=self.headers)
        return response.json()
    
    def get_marine_heatwaves(self):
        response = requests.get(f"{self.base_url}/alerts/marine-heatwaves", 
                              headers=self.headers)
        return response.json()

# Usage example
api = BlueSphereAPI("your_api_key_here")

# Get all active stations
stations = api.get_stations()
print(f"Found {stations['count']} active stations")

# Get recent temperature data
end_time = datetime.now()
start_time = end_time - timedelta(days=7)
data = api.get_observations("41001", start_time, end_time, ["sst"])

# Convert to DataFrame for analysis
df = pd.DataFrame(data['observations'])
df['timestamp'] = pd.to_datetime(df['timestamp'])
print(df.describe())

# Check for marine heatwaves
alerts = api.get_marine_heatwaves()
if alerts['active_alerts'] > 0:
    print(f"⚠️ {alerts['active_alerts']} marine heatwave alerts active")
```

### JavaScript/Node.js

```javascript
const axios = require('axios');

class BlueSphereAPI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://bluesphere.org/api';
    this.headers = { 'X-API-Key': apiKey };
  }

  async getStations() {
    const response = await axios.get(`${this.baseURL}/stations`, {
      headers: this.headers
    });
    return response.data;
  }

  async getObservations(stationId, startTime, endTime, parameters = null) {
    const params = {
      station_id: stationId,
      start_time: startTime,
      end_time: endTime
    };
    if (parameters) {
      params.parameters = parameters.join(',');
    }

    const response = await axios.get(`${this.baseURL}/obs`, {
      params,
      headers: this.headers
    });
    return response.data;
  }

  async getMarineHeatwaves() {
    const response = await axios.get(`${this.baseURL}/alerts/marine-heatwaves`, {
      headers: this.headers
    });
    return response.data;
  }
}

// Usage example
async function main() {
  const api = new BlueSphereAPI('your_api_key_here');
  
  try {
    // Get station data
    const stations = await api.getStations();
    console.log(`Found ${stations.count} active stations`);
    
    // Get recent observations
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    const data = await api.getObservations('41001', 
      weekAgo.toISOString(), 
      now.toISOString(), 
      ['sst', 'air_temp']
    );
    
    console.log(`Retrieved ${data.data_points} observations`);
    
    // Check alerts
    const alerts = await api.getMarineHeatwaves();
    if (alerts.active_alerts > 0) {
      console.log(`⚠️ ${alerts.active_alerts} marine heatwave alerts active`);
    }
    
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

main();
```

### R

```r
library(httr)
library(jsonlite)
library(dplyr)

# BlueSphere API client
get_stations <- function(api_key) {
  response <- GET("https://bluesphere.org/api/stations",
                  add_headers("X-API-Key" = api_key))
  
  if (status_code(response) == 200) {
    return(fromJSON(content(response, "text", encoding = "UTF-8")))
  } else {
    stop("API request failed: ", status_code(response))
  }
}

get_observations <- function(api_key, station_id, start_time, end_time, parameters = NULL) {
  query_params <- list(
    station_id = station_id,
    start_time = start_time,
    end_time = end_time
  )
  
  if (!is.null(parameters)) {
    query_params$parameters <- paste(parameters, collapse = ",")
  }
  
  response <- GET("https://bluesphere.org/api/obs",
                  query = query_params,
                  add_headers("X-API-Key" = api_key))
  
  if (status_code(response) == 200) {
    return(fromJSON(content(response, "text", encoding = "UTF-8")))
  } else {
    stop("API request failed: ", status_code(response))
  }
}

# Usage example
api_key <- "your_api_key_here"

# Get stations
stations_data <- get_stations(api_key)
cat("Found", stations_data$count, "active stations\n")

# Get observations for analysis
end_time <- Sys.time()
start_time <- end_time - as.difftime(7, units = "days")

observations <- get_observations(api_key, "41001", 
                               format(start_time, "%Y-%m-%dT%H:%M:%SZ"),
                               format(end_time, "%Y-%m-%dT%H:%M:%SZ"),
                               c("sst"))

# Convert to data frame
df <- as.data.frame(observations$observations)
df$timestamp <- as.POSIXct(df$timestamp)

# Basic statistics
summary(df$sea_surface_temperature)
```

## SDK Libraries

### Official SDKs

- **Python**: `pip install bluesphere-api`
- **JavaScript/Node.js**: `npm install bluesphere-api`
- **R**: `install.packages("bluesphere")`

### Community SDKs

- **Go**: [github.com/bluesphere/go-sdk](https://github.com/bluesphere/go-sdk)
- **Java**: [github.com/bluesphere/java-sdk](https://github.com/bluesphere/java-sdk)
- **C#**: [nuget.org/packages/BlueSphere.API](https://nuget.org/packages/BlueSphere.API)

## Webhooks

For real-time notifications, BlueSphere supports webhooks for critical events:

### Setup Webhook

```http
POST /api/webhooks
Content-Type: application/json
Authorization: Bearer your_api_key

{
  "url": "https://your-server.com/webhook",
  "events": ["marine_heatwave", "station_offline", "data_quality_alert"],
  "secret": "your_webhook_secret"
}
```

### Webhook Payload

```json
{
  "event": "marine_heatwave",
  "timestamp": "2025-09-11T08:00:00Z",
  "data": {
    "station_id": "41001",
    "current_temp": 28.5,
    "anomaly": 4.2,
    "severity": "High"
  }
}
```

## Support

### Developer Resources

- **API Explorer**: [https://bluesphere.org/api/explorer](https://bluesphere.org/api/explorer)
- **Postman Collection**: [Download](https://bluesphere.org/postman)
- **OpenAPI Spec**: [Download](https://bluesphere.org/api/openapi.json)

### Community & Support

- **Developer Forum**: [https://community.bluesphere.org](https://community.bluesphere.org)
- **Discord**: [https://discord.gg/bluesphere](https://discord.gg/bluesphere)
- **GitHub Issues**: [https://github.com/bluesphere/api-issues](https://github.com/bluesphere/api-issues)
- **Email Support**: [api-support@bluesphere.org](mailto:api-support@bluesphere.org)

### Status Page

Monitor API status and planned maintenance at [https://status.bluesphere.org](https://status.bluesphere.org)

---

**Last Updated**: September 11, 2025  
**API Version**: v1.0.0  
**Documentation Version**: 2.1.0