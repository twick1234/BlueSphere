# 🌊 BlueSphere API Documentation

**Version:** 1.0.0
**Base URL:** `https://api.bluesphere.org/v1`
**Protocol:** HTTPS
**Authentication:** API Key

---

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Core Endpoints](#core-endpoints)
- [Data Models](#data-models)
- [Predictive Analytics](#predictive-analytics)
- [Real-time Features](#real-time-features)
- [SDKs & Libraries](#sdks--libraries)
- [Examples](#examples)

---

## 🌟 Overview

The BlueSphere API provides programmatic access to the world's most comprehensive ocean monitoring dataset, including:

- **200+ Global Stations**: Real-time data from buoys, moorings, and coastal stations
- **5-Year Historical Archive**: Complete time-series data with quality control flags
- **Predictive Analytics**: ML-powered temperature and current forecasting
- **Marine Heatwave Detection**: Real-time alerts with severity classification
- **Data Export**: Multiple formats (JSON, CSV, NetCDF)

### API Features

- **RESTful Design**: Standard HTTP methods and status codes
- **Real-time Updates**: WebSocket support for live data streams
- **High Performance**: <200ms response times globally
- **Comprehensive**: 15+ data parameters per observation
- **Quality Assured**: Automated QC with manual validation
- **Scalable**: Rate limiting and caching for production use

---

## 🔐 Authentication

### API Key Authentication

All API requests require an API key provided in the request header:

```http
X-API-Key: your_api_key_here
```

### Getting an API Key

1. **Free Tier**: Register at [api.bluesphere.org](https://api.bluesphere.org)
   - 1,000 requests/month
   - Basic rate limiting
   - Community support

2. **Professional Tier**: $99/month
   - 100,000 requests/month
   - Priority support
   - Advanced features

3. **Enterprise Tier**: Custom pricing
   - Unlimited requests
   - White-label options
   - Dedicated support

### Authentication Example

```bash
curl -H "X-API-Key: your_api_key_here" \
     https://api.bluesphere.org/v1/stations
```

```javascript
const response = await fetch('https://api.bluesphere.org/v1/stations', {
  headers: {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  }
})
```

---

## ⚡ Rate Limiting

### Rate Limits by Tier

| Tier | Requests/Hour | Requests/Day | Burst Limit |
|------|---------------|--------------|-------------|
| Free | 100 | 1,000 | 20/min |
| Professional | 10,000 | 100,000 | 200/min |
| Enterprise | Unlimited | Unlimited | 1000/min |

### Rate Limit Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 3600
```

### Handling Rate Limits

```javascript
const handleRateLimit = async (response) => {
  if (response.status === 429) {
    const retryAfter = response.headers.get('X-RateLimit-Retry-After')
    console.log(`Rate limit exceeded. Retry after ${retryAfter} seconds`)

    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
    return fetch(response.url, response.config)
  }
  return response
}
```

---

## 🚨 Error Handling

### HTTP Status Codes

| Status Code | Description | Action |
|-------------|-------------|---------|
| 200 | Success | Continue processing |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Verify API key |
| 403 | Forbidden | Check permissions |
| 404 | Not Found | Verify endpoint/resource |
| 429 | Rate Limited | Implement backoff |
| 500 | Server Error | Retry with exponential backoff |

### Error Response Format

```json
{
  "error": {
    "code": "STATION_NOT_FOUND",
    "message": "Station with ID 'invalid-id' not found",
    "details": {
      "parameter": "station_id",
      "value": "invalid-id",
      "valid_values": ["46001", "46002", "46003"]
    },
    "documentation_url": "https://docs.bluesphere.org/api/errors#station-not-found"
  },
  "request_id": "req_1640995200_abc123"
}
```

### Error Handling Best Practices

```javascript
const apiCall = async (endpoint) => {
  try {
    const response = await fetch(`https://api.bluesphere.org/v1/${endpoint}`, {
      headers: { 'X-API-Key': process.env.BLUESPHERE_API_KEY }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(`API Error [${response.status}]:`, error.error.message)

      // Handle specific error types
      switch (error.error.code) {
        case 'RATE_LIMITED':
          await handleRateLimit(response)
          return apiCall(endpoint) // Retry
        case 'STATION_NOT_FOUND':
          throw new Error(`Invalid station: ${error.error.details.value}`)
        default:
          throw new Error(error.error.message)
      }
    }

    return await response.json()
  } catch (error) {
    console.error('Request failed:', error.message)
    throw error
  }
}
```

---

## 🗂️ Core Endpoints

### System Status

#### GET /status
Returns system operational status and health metrics.

**Response:**
```json
{
  "status": "operational",
  "version": "1.0.0",
  "uptime": "99.97%",
  "response_time": "127ms",
  "data_freshness": "5 minutes",
  "active_stations": 198,
  "last_updated": "2025-09-21T12:00:00Z",
  "services": {
    "api": "operational",
    "database": "operational",
    "ml_pipeline": "operational",
    "data_ingestion": "degraded"
  }
}
```

### Station Management

#### GET /stations
Retrieve all monitoring stations with metadata.

**Parameters:**
- `region` (optional): Filter by geographic region
- `provider` (optional): Filter by data provider
- `active` (optional): Filter by active status
- `limit` (optional): Limit results (default: 100, max: 1000)
- `offset` (optional): Pagination offset

**Response:**
```json
{
  "stations": [
    {
      "station_id": "46001",
      "name": "Gulf of Alaska - 150NM South of Valdez, AK",
      "provider": "NDBC",
      "location": {
        "latitude": 56.3,
        "longitude": -148.0,
        "water_depth": 3200
      },
      "status": "active",
      "last_observation": "2025-09-21T11:50:00Z",
      "parameters": ["water_temperature", "wave_height", "wind_speed"],
      "metadata": {
        "deployment_date": "2020-05-15",
        "hull_type": "3-meter discus",
        "watch_circle_radius": "1650 yards"
      }
    }
  ],
  "pagination": {
    "total": 198,
    "limit": 100,
    "offset": 0,
    "has_more": true
  }
}
```

#### GET /stations/{station_id}
Get detailed information for a specific station.

**Response:**
```json
{
  "station_id": "46001",
  "name": "Gulf of Alaska - 150NM South of Valdez, AK",
  "provider": "NDBC",
  "location": {
    "latitude": 56.3,
    "longitude": -148.0,
    "water_depth": 3200,
    "timezone": "America/Anchorage"
  },
  "status": "active",
  "last_observation": "2025-09-21T11:50:00Z",
  "observation_frequency": "1 hour",
  "parameters": [
    {
      "name": "water_temperature",
      "unit": "celsius",
      "precision": 0.1,
      "sensor_depth": 0.6
    }
  ],
  "data_availability": {
    "start_date": "2020-01-01",
    "end_date": "2025-09-21",
    "coverage_percentage": 97.2
  },
  "quality_metrics": {
    "recent_qc_pass_rate": 98.5,
    "sensor_status": "good",
    "last_maintenance": "2025-08-15"
  }
}
```

### Observational Data

#### GET /observations
Retrieve observational data across multiple stations.

**Parameters:**
- `station_ids` (required): Comma-separated station IDs
- `start_time` (required): ISO 8601 start datetime
- `end_time` (required): ISO 8601 end datetime
- `parameters` (optional): Comma-separated parameter names
- `quality_flags` (optional): Include QC flags (default: true)
- `format` (optional): Response format (json, csv, netcdf)

**Example Request:**
```http
GET /observations?station_ids=46001,46002&start_time=2025-09-20T00:00:00Z&end_time=2025-09-21T00:00:00Z&parameters=water_temperature,wave_height
```

**Response:**
```json
{
  "observations": [
    {
      "station_id": "46001",
      "timestamp": "2025-09-21T11:00:00Z",
      "parameters": {
        "water_temperature": {
          "value": 12.4,
          "unit": "celsius",
          "qc_flag": 1,
          "qc_description": "good"
        },
        "wave_height": {
          "value": 2.1,
          "unit": "meters",
          "qc_flag": 1,
          "qc_description": "good"
        }
      },
      "location": {
        "latitude": 56.3,
        "longitude": -148.0
      }
    }
  ],
  "metadata": {
    "total_records": 48,
    "time_range": {
      "start": "2025-09-20T00:00:00Z",
      "end": "2025-09-21T00:00:00Z"
    },
    "data_quality": {
      "pass_rate": 97.9,
      "interpolated_values": 2,
      "missing_values": 1
    }
  }
}
```

#### GET /observations/{station_id}/latest
Get the most recent observation for a station.

**Response:**
```json
{
  "station_id": "46001",
  "timestamp": "2025-09-21T11:50:00Z",
  "parameters": {
    "water_temperature": 12.4,
    "air_temperature": 8.2,
    "wave_height": 2.1,
    "wave_period": 7.8,
    "wind_speed": 12.5,
    "wind_direction": 245,
    "atmospheric_pressure": 1013.2
  },
  "quality_flags": {
    "overall": 1,
    "details": {
      "water_temperature": 1,
      "air_temperature": 1,
      "wave_height": 1,
      "wave_period": 1,
      "wind_speed": 1,
      "wind_direction": 1,
      "atmospheric_pressure": 1
    }
  },
  "data_age_minutes": 10
}
```

### Marine Heatwave Alerts

#### GET /alerts/marine-heatwaves
Retrieve current marine heatwave alerts.

**Parameters:**
- `severity` (optional): Filter by severity (moderate, high, extreme)
- `region` (optional): Filter by geographic region
- `active_only` (optional): Only active alerts (default: true)

**Response:**
```json
{
  "alerts": [
    {
      "alert_id": "mhw_2025_091_001",
      "severity": "high",
      "status": "active",
      "region": {
        "name": "Northeast Pacific",
        "bounds": {
          "north": 60.0,
          "south": 30.0,
          "east": -120.0,
          "west": -180.0
        }
      },
      "affected_stations": ["46001", "46002", "46005"],
      "temperature_anomaly": {
        "peak": 4.2,
        "current": 3.8,
        "baseline_period": "1991-2020"
      },
      "duration": {
        "start_date": "2025-09-15",
        "days_active": 6,
        "predicted_end": "2025-09-28"
      },
      "impacts": {
        "coral_bleaching_risk": "high",
        "marine_ecosystem_stress": "moderate",
        "fisheries_impact": "moderate"
      },
      "forecasts": {
        "7_day": "intensifying",
        "14_day": "stable",
        "30_day": "weakening"
      }
    }
  ],
  "summary": {
    "total_active": 3,
    "by_severity": {
      "extreme": 0,
      "high": 1,
      "moderate": 2
    },
    "global_coverage": "12% of monitoring network affected"
  }
}
```

---

## 🤖 Predictive Analytics

### Machine Learning Models

#### GET /predictions/models
List available prediction models and their performance metrics.

**Response:**
```json
{
  "models": [
    {
      "model_id": "sst_arima_v2",
      "name": "Sea Surface Temperature ARIMA",
      "type": "time_series",
      "version": "2.1.0",
      "parameters": ["water_temperature"],
      "forecast_horizons": [1, 3, 7, 14],
      "performance_metrics": {
        "rmse_1day": 0.85,
        "rmse_7day": 1.42,
        "r_squared": 0.89,
        "skill_score": 0.76
      },
      "last_trained": "2025-09-15T06:00:00Z",
      "training_data_period": "2020-2025",
      "status": "active"
    },
    {
      "model_id": "sst_ensemble_v1",
      "name": "Ensemble Temperature Forecast",
      "type": "ensemble",
      "version": "1.3.0",
      "parameters": ["water_temperature"],
      "forecast_horizons": [1, 3, 7, 14, 30],
      "performance_metrics": {
        "rmse_1day": 0.72,
        "rmse_7day": 1.28,
        "rmse_14day": 1.85,
        "r_squared": 0.92,
        "skill_score": 0.84
      },
      "ensemble_components": ["arima", "lstm", "gradient_boost"],
      "uncertainty_quantification": true,
      "last_trained": "2025-09-20T02:00:00Z"
    }
  ]
}
```

#### POST /predictions/forecast
Generate temperature forecasts for specific stations.

**Request Body:**
```json
{
  "station_ids": ["46001", "46002"],
  "forecast_horizon": 7,
  "model_id": "sst_ensemble_v1",
  "include_uncertainty": true,
  "include_confidence_intervals": true
}
```

**Response:**
```json
{
  "predictions": [
    {
      "station_id": "46001",
      "model_used": "sst_ensemble_v1",
      "forecast_generated": "2025-09-21T12:00:00Z",
      "forecasts": [
        {
          "forecast_time": "2025-09-22T12:00:00Z",
          "hours_ahead": 24,
          "predicted_temperature": 12.1,
          "uncertainty_std": 0.8,
          "confidence_intervals": {
            "68_percent": [11.3, 12.9],
            "95_percent": [10.5, 13.7]
          },
          "prediction_quality": "high"
        },
        {
          "forecast_time": "2025-09-28T12:00:00Z",
          "hours_ahead": 168,
          "predicted_temperature": 11.4,
          "uncertainty_std": 1.5,
          "confidence_intervals": {
            "68_percent": [9.9, 12.9],
            "95_percent": [8.4, 14.4]
          },
          "prediction_quality": "moderate"
        }
      ],
      "model_performance": {
        "expected_rmse": 1.28,
        "skill_score": 0.84,
        "last_validation": "2025-09-15"
      }
    }
  ],
  "metadata": {
    "total_forecasts": 14,
    "computation_time": "2.3 seconds",
    "cache_expires": "2025-09-21T13:00:00Z"
  }
}
```

### Historical Analysis

#### GET /analysis/trends/{station_id}
Analyze long-term trends for a station.

**Parameters:**
- `period` (optional): Analysis period (1year, 5year, decade)
- `parameter` (optional): Parameter to analyze (default: water_temperature)
- `baseline` (optional): Baseline period for anomaly calculation

**Response:**
```json
{
  "station_id": "46001",
  "parameter": "water_temperature",
  "analysis_period": "5year",
  "baseline_period": "1991-2020",
  "trends": {
    "linear_trend": {
      "slope": 0.023,
      "slope_units": "celsius_per_year",
      "confidence_interval": [0.018, 0.028],
      "p_value": 0.001,
      "significance": "highly_significant"
    },
    "seasonal_cycle": {
      "amplitude": 8.4,
      "amplitude_units": "celsius",
      "peak_month": "August",
      "minimum_month": "February"
    },
    "anomaly_statistics": {
      "current_anomaly": 1.8,
      "max_positive_anomaly": 4.2,
      "max_negative_anomaly": -2.1,
      "anomaly_frequency": {
        "positive": 0.62,
        "negative": 0.38
      }
    }
  },
  "extreme_events": [
    {
      "event_type": "marine_heatwave",
      "start_date": "2025-07-15",
      "end_date": "2025-08-22",
      "duration_days": 38,
      "peak_intensity": 4.2,
      "cumulative_intensity": 89.4
    }
  ]
}
```

---

## 🔄 Real-time Features

### WebSocket Streaming

Connect to real-time data streams using WebSockets:

```javascript
const ws = new WebSocket('wss://api.bluesphere.org/v1/stream')

ws.onopen = () => {
  // Subscribe to stations
  ws.send(JSON.stringify({
    action: 'subscribe',
    stations: ['46001', '46002'],
    parameters: ['water_temperature', 'wave_height']
  }))
}

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Real-time data:', data)
}
```

### Server-Sent Events

For simpler real-time integration:

```javascript
const eventSource = new EventSource(
  'https://api.bluesphere.org/v1/stream/sse?stations=46001,46002&api_key=your_key'
)

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('New observation:', data)
}
```

### Webhook Notifications

Register webhooks for event notifications:

#### POST /webhooks
```json
{
  "url": "https://your-app.com/webhooks/bluesphere",
  "events": ["new_observation", "marine_heatwave_alert", "station_offline"],
  "filters": {
    "stations": ["46001", "46002"],
    "severity": ["high", "extreme"]
  },
  "secret": "your_webhook_secret"
}
```

---

## 📚 Data Models

### Station Object

```typescript
interface Station {
  station_id: string
  name: string
  provider: 'NDBC' | 'BOM' | 'EMSO' | 'JMA' | 'OTHER'
  location: {
    latitude: number
    longitude: number
    water_depth?: number
    timezone?: string
  }
  status: 'active' | 'inactive' | 'maintenance'
  last_observation: string // ISO 8601
  observation_frequency: string
  parameters: Parameter[]
  metadata: Record<string, any>
}
```

### Observation Object

```typescript
interface Observation {
  station_id: string
  timestamp: string // ISO 8601
  parameters: Record<string, {
    value: number
    unit: string
    qc_flag: number
    qc_description: string
  }>
  location: {
    latitude: number
    longitude: number
  }
}
```

### Prediction Object

```typescript
interface Prediction {
  station_id: string
  model_used: string
  forecast_generated: string // ISO 8601
  forecasts: Array<{
    forecast_time: string // ISO 8601
    hours_ahead: number
    predicted_temperature: number
    uncertainty_std?: number
    confidence_intervals?: {
      '68_percent': [number, number]
      '95_percent': [number, number]
    }
    prediction_quality: 'high' | 'moderate' | 'low'
  }>
}
```

### Marine Heatwave Alert

```typescript
interface MarineHeatwaveAlert {
  alert_id: string
  severity: 'moderate' | 'high' | 'extreme'
  status: 'active' | 'ended' | 'watch'
  region: {
    name: string
    bounds: {
      north: number
      south: number
      east: number
      west: number
    }
  }
  affected_stations: string[]
  temperature_anomaly: {
    peak: number
    current: number
    baseline_period: string
  }
  duration: {
    start_date: string
    days_active: number
    predicted_end?: string
  }
}
```

---

## 🛠️ SDKs & Libraries

### Official SDKs

#### JavaScript/TypeScript
```bash
npm install @bluesphere/api-client
```

```javascript
import { BlueSphereClient } from '@bluesphere/api-client'

const client = new BlueSphereClient({
  apiKey: process.env.BLUESPHERE_API_KEY,
  baseUrl: 'https://api.bluesphere.org/v1'
})

// Get station data
const stations = await client.stations.list()
const observations = await client.observations.get({
  stationIds: ['46001'],
  startTime: '2025-09-20T00:00:00Z',
  endTime: '2025-09-21T00:00:00Z'
})

// Generate predictions
const forecasts = await client.predictions.forecast({
  stationIds: ['46001'],
  horizonHours: 168,
  includeUncertainty: true
})
```

#### Python
```bash
pip install bluesphere-api
```

```python
from bluesphere import BlueSphereClient
from datetime import datetime, timedelta

client = BlueSphereClient(api_key='your_api_key_here')

# Get recent observations
end_time = datetime.utcnow()
start_time = end_time - timedelta(days=1)

observations = client.observations.get(
    station_ids=['46001', '46002'],
    start_time=start_time,
    end_time=end_time,
    parameters=['water_temperature', 'wave_height']
)

# Generate temperature forecasts
forecasts = client.predictions.forecast(
    station_ids=['46001'],
    horizon_hours=168,
    model_id='sst_ensemble_v1'
)
```

#### R
```r
# Install from CRAN
install.packages("bluesphere")

library(bluesphere)

# Setup client
client <- bluesphere_client(api_key = Sys.getenv("BLUESPHERE_API_KEY"))

# Get station data
stations <- get_stations(client)
observations <- get_observations(
  client,
  station_ids = c("46001", "46002"),
  start_time = "2025-09-20T00:00:00Z",
  end_time = "2025-09-21T00:00:00Z"
)

# Plot temperature trends
plot_temperature_trends(observations, station_id = "46001")
```

### Community SDKs

- **Go**: [github.com/community/bluesphere-go](https://github.com/community/bluesphere-go)
- **Java**: [github.com/community/bluesphere-java](https://github.com/community/bluesphere-java)
- **Ruby**: [github.com/community/bluesphere-ruby](https://github.com/community/bluesphere-ruby)
- **PHP**: [github.com/community/bluesphere-php](https://github.com/community/bluesphere-php)

---

## 💡 Examples

### Basic Data Retrieval

```javascript
// Get all active stations
const stations = await fetch('https://api.bluesphere.org/v1/stations?active=true', {
  headers: { 'X-API-Key': 'your_api_key' }
}).then(r => r.json())

// Get latest temperature readings
for (const station of stations.stations) {
  const latest = await fetch(
    `https://api.bluesphere.org/v1/observations/${station.station_id}/latest`,
    { headers: { 'X-API-Key': 'your_api_key' } }
  ).then(r => r.json())

  console.log(`${station.name}: ${latest.parameters.water_temperature}°C`)
}
```

### Historical Analysis

```python
import requests
import pandas as pd
import matplotlib.pyplot as plt

# Get 30 days of temperature data
response = requests.get(
    'https://api.bluesphere.org/v1/observations',
    params={
        'station_ids': '46001',
        'start_time': '2025-08-22T00:00:00Z',
        'end_time': '2025-09-21T00:00:00Z',
        'parameters': 'water_temperature'
    },
    headers={'X-API-Key': 'your_api_key'}
)

data = response.json()

# Convert to DataFrame
df = pd.DataFrame([
    {
        'timestamp': obs['timestamp'],
        'temperature': obs['parameters']['water_temperature']['value']
    }
    for obs in data['observations']
])

df['timestamp'] = pd.to_datetime(df['timestamp'])

# Plot temperature trends
plt.figure(figsize=(12, 6))
plt.plot(df['timestamp'], df['temperature'])
plt.title('30-Day Temperature Trend - Station 46001')
plt.xlabel('Date')
plt.ylabel('Temperature (°C)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()
```

### Real-time Marine Heatwave Monitoring

```javascript
class MarineHeatwaveMonitor {
  constructor(apiKey) {
    this.apiKey = apiKey
    this.alertThresholds = {
      moderate: 2.0,
      high: 3.0,
      extreme: 4.0
    }
  }

  async checkHeatwaves() {
    const response = await fetch(
      'https://api.bluesphere.org/v1/alerts/marine-heatwaves',
      { headers: { 'X-API-Key': this.apiKey } }
    )

    const alerts = await response.json()

    for (const alert of alerts.alerts) {
      if (alert.severity === 'extreme') {
        this.sendCriticalAlert(alert)
      }
    }

    return alerts
  }

  sendCriticalAlert(alert) {
    console.log(`🚨 CRITICAL: ${alert.region.name} experiencing extreme marine heatwave`)
    console.log(`Temperature anomaly: +${alert.temperature_anomaly.peak}°C`)
    console.log(`Duration: ${alert.duration.days_active} days`)

    // Integrate with your alerting system
    // slack.send(), email.send(), etc.
  }

  startMonitoring(intervalMinutes = 15) {
    setInterval(() => {
      this.checkHeatwaves()
    }, intervalMinutes * 60 * 1000)
  }
}

const monitor = new MarineHeatwaveMonitor('your_api_key')
monitor.startMonitoring()
```

### Predictive Dashboard

```typescript
interface DashboardData {
  currentTemperature: number
  forecast: Array<{
    date: string
    temperature: number
    confidence: [number, number]
  }>
  heatwaveRisk: 'low' | 'moderate' | 'high' | 'extreme'
}

class OceanDashboard {
  private apiKey: string
  private stationId: string

  constructor(apiKey: string, stationId: string) {
    this.apiKey = apiKey
    this.stationId = stationId
  }

  async getDashboardData(): Promise<DashboardData> {
    // Get current conditions
    const current = await this.fetchLatestObservation()

    // Get 7-day forecast
    const forecast = await this.fetchForecast(7)

    // Check heatwave risk
    const alerts = await this.fetchHeatwaveAlerts()

    return {
      currentTemperature: current.parameters.water_temperature,
      forecast: forecast.predictions[0].forecasts.map(f => ({
        date: f.forecast_time.split('T')[0],
        temperature: f.predicted_temperature,
        confidence: f.confidence_intervals['95_percent']
      })),
      heatwaveRisk: this.calculateHeatwaveRisk(alerts)
    }
  }

  private async fetchLatestObservation() {
    const response = await fetch(
      `https://api.bluesphere.org/v1/observations/${this.stationId}/latest`,
      { headers: { 'X-API-Key': this.apiKey } }
    )
    return response.json()
  }

  private async fetchForecast(days: number) {
    const response = await fetch(
      'https://api.bluesphere.org/v1/predictions/forecast',
      {
        method: 'POST',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          station_ids: [this.stationId],
          forecast_horizon: days,
          include_confidence_intervals: true
        })
      }
    )
    return response.json()
  }

  // Additional methods...
}
```

---

## 🔧 Advanced Features

### Batch Operations

For processing multiple requests efficiently:

```javascript
// Batch station data requests
const batchRequest = {
  requests: [
    { method: 'GET', path: '/stations/46001' },
    { method: 'GET', path: '/stations/46002' },
    { method: 'GET', path: '/observations/46001/latest' },
    { method: 'GET', path: '/observations/46002/latest' }
  ]
}

const response = await fetch('https://api.bluesphere.org/v1/batch', {
  method: 'POST',
  headers: {
    'X-API-Key': 'your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(batchRequest)
})

const results = await response.json()
// results.responses[0] = station 46001 data
// results.responses[1] = station 46002 data
// etc.
```

### Data Export Options

```javascript
// Export as CSV
const csvData = await fetch(
  'https://api.bluesphere.org/v1/observations?station_ids=46001&format=csv',
  { headers: { 'X-API-Key': 'your_api_key' } }
).then(r => r.text())

// Export as NetCDF (for scientific applications)
const netcdfData = await fetch(
  'https://api.bluesphere.org/v1/observations?station_ids=46001&format=netcdf',
  { headers: { 'X-API-Key': 'your_api_key' } }
).then(r => r.arrayBuffer())
```

### Custom Aggregations

```javascript
// Get monthly averages for the past year
const monthlyAvgs = await fetch(
  'https://api.bluesphere.org/v1/aggregations/monthly?station_id=46001&parameter=water_temperature&months=12',
  { headers: { 'X-API-Key': 'your_api_key' } }
).then(r => r.json())
```

---

## 📞 Support & Resources

### Documentation
- **API Reference**: [api.bluesphere.org](https://api.bluesphere.org)
- **User Guides**: [docs.bluesphere.org](https://docs.bluesphere.org)
- **Code Examples**: [github.com/bluesphere/examples](https://github.com/bluesphere/examples)

### Community
- **GitHub Issues**: [github.com/bluesphere/api](https://github.com/bluesphere/api)
- **Discord**: [discord.gg/bluesphere](https://discord.gg/bluesphere)
- **Stack Overflow**: Tag `bluesphere-api`

### Contact
- **Technical Support**: api-support@bluesphere.org
- **Partnership Inquiries**: partnerships@bluesphere.org
- **Status Page**: [status.bluesphere.org](https://status.bluesphere.org)

---

**API Version**: 1.0.0
**Last Updated**: September 21, 2025
**License**: MIT with Attribution

---

*Built with ❤️ for the ocean monitoring community. Help us fight climate change through better data access.*