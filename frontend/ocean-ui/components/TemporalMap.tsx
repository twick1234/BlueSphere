import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface TemporalData {
  date: string
  lat: number
  lon: number
  temperature: number
  anomaly?: number
}

interface TemporalMapProps {
  startDate: string
  endDate: string
  currentDate: string
  onDateChange: (date: string) => void
  resolution: 'daily' | 'monthly' | 'yearly'
  showAnomalies: boolean
  isPlaying: boolean
}

// Temperature heatmap overlay component
function TemperatureHeatmapLayer({ data, showAnomalies }: { data: TemporalData[], showAnomalies: boolean }) {
  const map = useMap()
  const heatmapRef = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    if (heatmapRef.current) {
      map.removeLayer(heatmapRef.current)
    }

    if (data && data.length > 0) {
      // Create temperature gradient overlay
      const bounds = L.latLngBounds(
        data.map(d => [d.lat, d.lon] as L.LatLngTuple)
      )
      
      // Generate heatmap canvas
      const canvas = document.createElement('canvas')
      canvas.width = 360 * 4 // 0.25 degree resolution
      canvas.height = 180 * 4
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
        // Create temperature gradient
        data.forEach(point => {
          const x = Math.floor((point.lon + 180) * 4)
          const y = Math.floor((90 - point.lat) * 4)
          
          const value = showAnomalies ? (point.anomaly || 0) : point.temperature
          const color = getTemperatureColor(value, showAnomalies)
          
          ctx.fillStyle = color
          ctx.fillRect(x, y, 4, 4)
        })
        
        // Create image overlay
        const imageUrl = canvas.toDataURL()
        heatmapRef.current = L.imageOverlay(imageUrl, [[-90, -180], [90, 180]], {
          opacity: 0.6,
          className: 'temperature-heatmap'
        }).addTo(map)
      }
    }

    return () => {
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current)
      }
    }
  }, [map, data, showAnomalies])

  return null
}

// Get color for temperature or anomaly
function getTemperatureColor(value: number, isAnomaly: boolean): string {
  if (isAnomaly) {
    // Diverging color scheme for anomalies (-5°C to +5°C)
    const normalized = Math.max(-1, Math.min(1, value / 5))
    if (normalized < 0) {
      const intensity = Math.abs(normalized)
      return `rgba(0, 100, 255, ${0.3 + intensity * 0.7})` // Blue for negative
    } else {
      const intensity = normalized
      return `rgba(255, 50, 0, ${0.3 + intensity * 0.7})` // Red for positive
    }
  } else {
    // Sequential color scheme for absolute temperatures (-2°C to 32°C)
    const normalized = Math.max(0, Math.min(1, (value + 2) / 34))
    
    if (normalized < 0.2) {
      return `rgba(0, 0, 139, ${0.5 + normalized * 2.5})` // Dark blue
    } else if (normalized < 0.4) {
      return `rgba(0, 100, 255, ${0.5 + (normalized - 0.2) * 2.5})` // Blue
    } else if (normalized < 0.6) {
      return `rgba(0, 255, 255, ${0.5 + (normalized - 0.4) * 2.5})` // Cyan
    } else if (normalized < 0.8) {
      return `rgba(255, 255, 0, ${0.5 + (normalized - 0.6) * 2.5})` // Yellow
    } else {
      return `rgba(255, 0, 0, ${0.5 + (normalized - 0.8) * 2.5})` // Red
    }
  }
}

export default function TemporalMap({
  startDate,
  endDate,
  currentDate,
  onDateChange,
  resolution,
  showAnomalies,
  isPlaying
}: TemporalMapProps) {
  const [temperatureData, setTemperatureData] = useState<TemporalData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch temperature data for current date
  useEffect(() => {
    const fetchTemperatureData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const endpoint = showAnomalies ? '/temporal/anomalies' : '/temporal/temperatures'
        const params = new URLSearchParams({
          start_date: currentDate,
          end_date: currentDate,
          resolution: resolution,
          ...(showAnomalies && { baseline: '1991-2020' })
        })
        
        const response = await fetch(`http://localhost:8000${endpoint}?${params}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch temperature data: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        // Transform API response to TemporalData format
        const transformedData: TemporalData[] = data.data?.map((item: any) => ({
          date: item.date || currentDate,
          lat: item.latitude || item.lat,
          lon: item.longitude || item.lon,
          temperature: item.temperature || item.sst,
          anomaly: item.anomaly
        })) || []
        
        setTemperatureData(transformedData)
      } catch (err) {
        console.error('Error fetching temperature data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load temperature data')
        
        // Generate mock data for demonstration
        const mockData: TemporalData[] = generateMockTemperatureData(currentDate, showAnomalies)
        setTemperatureData(mockData)
      } finally {
        setLoading(false)
      }
    }

    fetchTemperatureData()
  }, [currentDate, resolution, showAnomalies])

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <TemperatureHeatmapLayer data={temperatureData} showAnomalies={showAnomalies} />
      </MapContainer>

      {/* Loading indicator */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 1000
        }}>
          Loading temperature data...
        </div>
      )}

      {/* Error indicator */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 0, 0, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          {error}
        </div>
      )}

      {/* Color legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 1000,
        minWidth: '150px'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
          {showAnomalies ? 'Temperature Anomaly (°C)' : 'Sea Surface Temperature (°C)'}
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {showAnomalies ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '12px', background: 'rgba(0, 100, 255, 0.8)' }}></div>
                <span>-5°C (Much Cooler)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '12px', background: 'rgba(255, 255, 255, 0.8)', border: '1px solid #ccc' }}></div>
                <span>0°C (Normal)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '12px', background: 'rgba(255, 50, 0, 0.8)' }}></div>
                <span>+5°C (Much Warmer)</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '12px', background: 'rgba(0, 0, 139, 0.8)' }}></div>
                <span>-2°C</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '12px', background: 'rgba(0, 255, 255, 0.8)' }}></div>
                <span>15°C</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '16px', height: '12px', background: 'rgba(255, 0, 0, 0.8)' }}></div>
                <span>32°C</span>
              </div>
            </>
          )}
        </div>
        
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#666' }}>
          Date: {new Date(currentDate).toLocaleDateString()}
        </div>
      </div>

      {/* Data quality indicator */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(255, 255, 255, 0.9)',
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div>📊 Data Points: {temperatureData.length.toLocaleString()}</div>
        <div>🎯 Resolution: {resolution}</div>
        <div>📡 {showAnomalies ? 'Anomaly Mode' : 'Absolute Temperature'}</div>
      </div>
    </div>
  )
}

// Generate mock temperature data for demonstration
function generateMockTemperatureData(date: string, showAnomalies: boolean): TemporalData[] {
  const data: TemporalData[] = []
  const currentDate = new Date(date)
  const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  
  // Generate grid data (simplified 2-degree resolution)
  for (let lat = -88; lat <= 88; lat += 4) {
    for (let lon = -178; lon <= 178; lon += 4) {
      // Base temperature with latitudinal gradient
      let baseTemp = 30 - Math.abs(lat) * 0.8
      
      // Seasonal cycle
      const seasonalAmplitude = 15 - Math.abs(lat) * 0.2
      const seasonalPhase = lat > 0 ? dayOfYear : dayOfYear + 182.5
      const seasonalTemp = seasonalAmplitude * Math.cos((seasonalPhase / 365.25) * 2 * Math.PI)
      
      // Ocean warming trend (more pronounced in recent years)
      const yearsSince1980 = currentDate.getFullYear() - 1980
      const warmingTrend = yearsSince1980 * 0.02 // 0.02°C per year
      
      // Regional variations
      const regionalVar = Math.sin(lat * Math.PI / 90) * Math.cos(lon * Math.PI / 180) * 2
      
      const temperature = baseTemp + seasonalTemp + warmingTrend + regionalVar
      const anomaly = showAnomalies ? seasonalTemp + warmingTrend + regionalVar - 1 : undefined
      
      data.push({
        date,
        lat,
        lon,
        temperature: Math.round(temperature * 10) / 10,
        anomaly: anomaly ? Math.round(anomaly * 10) / 10 : undefined
      })
    }
  }
  
  return data
}