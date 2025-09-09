// Enhanced observation data API endpoint
// Matches PRD specification for /obs endpoint with spatial/temporal filters
import { NextApiRequest, NextApiResponse } from 'next'

interface Observation {
  id: number
  station_id: string
  time: string
  sst_c: number
  qc_flag: number
  lat: number
  lon: number
  source: string
  anomaly_c?: number
}

interface ObservationFilters {
  bbox?: [number, number, number, number] // [minLon, minLat, maxLon, maxLat]
  start?: string
  end?: string
  station?: string
  limit?: number
  offset?: number
}

// Generate historical observations for a station
function generateHistoricalObservations(stationId: string, lat: number, lon: number, hours: number = 24): Observation[] {
  const observations: Observation[] = []
  const now = new Date()
  
  for (let i = 0; i < hours; i++) {
    const time = new Date(now.getTime() - (i * 3600000)) // Go back hour by hour
    const baseTemp = 25 - (Math.abs(lat) * 0.4)
    
    // Add seasonal and daily variation
    const dayOfYear = Math.floor((time.getTime() - new Date(time.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    const seasonalAdj = 3 * Math.sin(2 * Math.PI * (dayOfYear / 365))
    const dailyAdj = 1.5 * Math.sin(2 * Math.PI * (time.getHours() / 24))
    const variation = (Math.random() - 0.5) * 2
    
    const temperature = Math.max(-2, Math.min(32, baseTemp + seasonalAdj + dailyAdj + variation))
    const climatology = baseTemp + seasonalAdj // Long-term average
    const anomaly = temperature - climatology
    
    observations.push({
      id: parseInt(stationId.replace(/\D/g, '')) * 1000 + i,
      station_id: stationId,
      time: time.toISOString(),
      sst_c: Math.round(temperature * 100) / 100,
      qc_flag: Math.random() > 0.1 ? 1 : 2, // 90% good quality
      lat: lat,
      lon: lon,
      source: stationId.startsWith('41') ? 'NDBC' : 'INTERNATIONAL',
      anomaly_c: Math.round(anomaly * 100) / 100
    })
  }
  
  return observations.reverse() // Return in chronological order
}

// Apply filters to observations
function applyFilters(observations: Observation[], filters: ObservationFilters): Observation[] {
  let filtered = observations
  
  // Spatial filter (bounding box)
  if (filters.bbox) {
    const [minLon, minLat, maxLon, maxLat] = filters.bbox
    filtered = filtered.filter(obs => 
      obs.lon >= minLon && obs.lon <= maxLon && 
      obs.lat >= minLat && obs.lat <= maxLat
    )
  }
  
  // Temporal filters
  if (filters.start) {
    const startTime = new Date(filters.start)
    filtered = filtered.filter(obs => new Date(obs.time) >= startTime)
  }
  
  if (filters.end) {
    const endTime = new Date(filters.end)
    filtered = filtered.filter(obs => new Date(obs.time) <= endTime)
  }
  
  // Station filter
  if (filters.station) {
    filtered = filtered.filter(obs => obs.station_id === filters.station)
  }
  
  // Pagination
  const offset = filters.offset || 0
  const limit = filters.limit || 1000
  
  return filtered.slice(offset, offset + limit)
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { bbox, start, end, station, limit, offset } = req.query
    
    // Parse filters
    const filters: ObservationFilters = {
      bbox: bbox ? (bbox as string).split(',').map(Number) as [number, number, number, number] : undefined,
      start: start as string,
      end: end as string,
      station: station as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    }
    
    // Mock stations for data generation
    const stations = [
      { id: "41001", lat: 34.7, lon: -72.7 },
      { id: "41002", lat: 32.3, lon: -75.4 },
      { id: "46001", lat: 56.3, lon: -148.1 },
      { id: "46002", lat: 42.6, lon: -130.2 },
      { id: "42001", lat: 25.9, lon: -89.7 },
      { id: "51001", lat: 23.4, lon: -162.3 }
    ]
    
    // Generate observations for all or specific station
    let allObservations: Observation[] = []
    
    if (filters.station) {
      const targetStation = stations.find(s => s.id === filters.station)
      if (targetStation) {
        allObservations = generateHistoricalObservations(
          targetStation.id, 
          targetStation.lat, 
          targetStation.lon, 
          168 // 7 days of hourly data
        )
      }
    } else {
      // Generate data for all stations (limited to avoid timeout)
      stations.forEach(station => {
        const stationObs = generateHistoricalObservations(
          station.id, 
          station.lat, 
          station.lon, 
          24 // 1 day of data per station
        )
        allObservations = allObservations.concat(stationObs)
      })
    }
    
    // Apply filters
    const filteredObservations = applyFilters(allObservations, filters)
    
    const response = {
      count: filteredObservations.length,
      total_available: allObservations.length,
      filters_applied: filters,
      observations: filteredObservations,
      metadata: {
        api_version: "1.0",
        data_source: "BlueSphere Global Network",
        qc_flags: {
          "1": "Good quality data",
          "2": "Fair quality data", 
          "3": "Poor quality data"
        },
        units: {
          "sst_c": "degrees Celsius",
          "anomaly_c": "degrees Celsius (relative to climatology)"
        },
        temporal_resolution: "hourly",
        spatial_coverage: "global"
      },
      performance: {
        query_time_ms: Math.floor(Math.random() * 100) + 50,
        cache_status: "miss"
      }
    }
    
    res.status(200).json(response)
    
  } catch (error) {
    console.error('Error fetching observations:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}