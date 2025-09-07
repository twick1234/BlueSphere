import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom icons for different buoy statuses
const createBuoyIcon = (status: string, temp?: number) => {
  let color = '#3b82f6' // default blue
  let iconChar = '●'
  
  if (status === 'active') {
    if (temp && temp > 25) {
      color = '#ef4444' // red for hot
      iconChar = '🔥'
    } else if (temp && temp > 20) {
      color = '#f59e0b' // orange for warm
      iconChar = '🌡️'
    } else {
      color = '#10b981' // green for normal/cool
      iconChar = '❄️'
    }
  } else if (status === 'warning') {
    color = '#f59e0b'
    iconChar = '⚠️'
  } else {
    color = '#6b7280'
    iconChar = '○'
  }

  return L.divIcon({
    html: `<div style="
      background-color: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">${iconChar}</div>`,
    className: 'custom-buoy-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  })
}

interface BuoyData {
  station_id: string
  name: string
  lat: number
  lon: number
  last_temp?: number
  status: 'active' | 'inactive' | 'warning'
}

interface OceanMapProps {
  buoys: BuoyData[]
  onBuoySelect: (buoy: BuoyData | null) => void
  selectedBuoy: BuoyData | null
}

// Component to handle temperature overlay
function TemperatureOverlay() {
  const map = useMap()
  
  useEffect(() => {
    // Add a simple temperature gradient overlay
    const temperatureLayer = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=YOUR_API_KEY', {
      attribution: 'Temperature data © OpenWeatherMap',
      opacity: 0.3,
      maxZoom: 18,
    })
    
    // For demo purposes, we'll skip the actual overlay since it requires an API key
    // temperatureLayer.addTo(map)
    
    return () => {
      // temperatureLayer.removeFrom(map)
    }
  }, [map])
  
  return null
}

export default function OceanMap({ buoys, onBuoySelect, selectedBuoy }: OceanMapProps) {
  const mapRef = useRef<L.Map>(null)

  const getTemperatureColor = (temp?: number) => {
    if (!temp) return '#3b82f6'
    if (temp > 28) return '#dc2626' // Very hot - red
    if (temp > 25) return '#ea580c' // Hot - orange-red
    if (temp > 22) return '#f59e0b' // Warm - orange
    if (temp > 18) return '#eab308' // Mild - yellow
    if (temp > 15) return '#22c55e' // Cool - green
    if (temp > 10) return '#06b6d4' // Cold - cyan
    return '#1d4ed8' // Very cold - blue
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[20, 0]} // Centered on equator
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <TemperatureOverlay />
        
        {buoys.map((buoy) => (
          <Marker
            key={buoy.station_id}
            position={[buoy.lat, buoy.lon]}
            icon={createBuoyIcon(buoy.status, buoy.last_temp)}
            eventHandlers={{
              click: () => onBuoySelect(buoy),
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>
                  {buoy.name}
                </h3>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  <strong>Station ID:</strong> {buoy.station_id}
                </p>
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  <strong>Location:</strong> {buoy.lat.toFixed(3)}°, {buoy.lon.toFixed(3)}°
                </p>
                {buoy.last_temp && (
                  <p style={{ margin: '4px 0', fontSize: '14px' }}>
                    <strong>Temperature:</strong>{' '}
                    <span style={{ 
                      color: getTemperatureColor(buoy.last_temp),
                      fontWeight: 'bold'
                    }}>
                      {buoy.last_temp.toFixed(1)}°C
                    </span>
                  </p>
                )}
                <p style={{ margin: '4px 0', fontSize: '14px' }}>
                  <strong>Status:</strong>{' '}
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: 
                      buoy.status === 'active' ? '#10b981' :
                      buoy.status === 'warning' ? '#f59e0b' : '#6b7280',
                    color: 'white'
                  }}>
                    {buoy.status}
                  </span>
                </p>
                
                {buoy.status === 'active' && buoy.last_temp && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '4px',
                    fontSize: '12px'
                  }}>
                    {buoy.last_temp > 26 && (
                      <p style={{ margin: '0', color: '#dc2626' }}>
                        ⚠️ High temperature detected - monitor for coral bleaching risk
                      </p>
                    )}
                    {buoy.last_temp > 23 && buoy.last_temp <= 26 && (
                      <p style={{ margin: '0', color: '#f59e0b' }}>
                        🌡️ Elevated temperature - track for marine heatwave development
                      </p>
                    )}
                    {buoy.last_temp <= 23 && (
                      <p style={{ margin: '0', color: '#10b981' }}>
                        ✅ Temperature within normal range
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>Buoy Status</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: '#10b981' 
            }}></div>
            <span>Active (Normal)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: '#f59e0b' 
            }}></div>
            <span>Active (Warm)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: '#ef4444' 
            }}></div>
            <span>Active (Hot)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: '#6b7280' 
            }}></div>
            <span>Inactive</span>
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#6b7280' }}>
          Click markers for details
        </div>
      </div>
      
      {/* Climate impact indicator */}
      {selectedBuoy && selectedBuoy.last_temp && selectedBuoy.last_temp > 26 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          maxWidth: '300px',
          zIndex: 1000
        }}>
          <h4 style={{ margin: '0 0 4px 0' }}>🚨 Climate Alert</h4>
          <p style={{ margin: 0, fontSize: '12px' }}>
            High ocean temperatures detected at {selectedBuoy.name}. 
            Increased risk of coral bleaching and marine ecosystem stress.
          </p>
        </div>
      )}
    </div>
  )
}