import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet'
import L from 'leaflet'

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Temperature color mapping for professional heatmap visualization
const getTemperatureColor = (temp: number, opacity: number = 1): string => {
  // Advanced temperature color mapping like NASA visualizations
  if (temp >= 30) return `rgba(139, 0, 0, ${opacity})` // Dark red - Extreme heat
  if (temp >= 28) return `rgba(220, 38, 38, ${opacity})` // Red - Very hot
  if (temp >= 26) return `rgba(239, 68, 68, ${opacity})` // Light red - Hot
  if (temp >= 24) return `rgba(251, 146, 60, ${opacity})` // Orange - Warm
  if (temp >= 22) return `rgba(251, 191, 36, ${opacity})` // Yellow - Mild warm
  if (temp >= 20) return `rgba(163, 230, 53, ${opacity})` // Light green - Normal
  if (temp >= 18) return `rgba(34, 197, 94, ${opacity})` // Green - Cool
  if (temp >= 15) return `rgba(14, 165, 233, ${opacity})` // Blue - Cold
  if (temp >= 10) return `rgba(59, 130, 246, ${opacity})` // Darker blue - Very cold
  return `rgba(29, 78, 216, ${opacity})` // Navy - Extreme cold
}

// Professional animated marker icons with temperature indicators
const createAdvancedBuoyIcon = (status: string, temp?: number, isSelected?: boolean, animationLevel?: number) => {
  const baseSize = isSelected ? 36 : 28
  const pulseSize = baseSize + (animationLevel || 0) * 4
  
  let color = getTemperatureColor(temp || 15, 1)
  let statusIcon = ''
  let ringColor = 'rgba(255, 255, 255, 0.8)'
  
  if (status === 'active') {
    if (temp && temp > 26) {
      statusIcon = '🚨' // Emergency
      ringColor = 'rgba(239, 68, 68, 0.6)'
    } else if (temp && temp > 23) {
      statusIcon = '🌡️' // Warning
      ringColor = 'rgba(251, 191, 36, 0.6)'
    } else {
      statusIcon = '✅' // Normal
      ringColor = 'rgba(34, 197, 94, 0.6)'
    }
  } else if (status === 'warning') {
    statusIcon = '⚠️'
    color = '#f59e0b'
    ringColor = 'rgba(251, 191, 36, 0.6)'
  } else {
    statusIcon = '📡'
    color = '#6b7280'
    ringColor = 'rgba(107, 114, 128, 0.6)'
  }

  return L.divIcon({
    html: `
      <div class="advanced-buoy-marker" style="position: relative;">
        <!-- Animated pulse ring for hot temperatures -->
        ${temp && temp > 25 ? `
          <div style="
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: ${pulseSize + 20}px;
            height: ${pulseSize + 20}px;
            border-radius: 50%;
            background: ${ringColor};
            animation: emergencyPulse 2s ease-in-out infinite;
            z-index: 1;
          "></div>
        ` : ''}
        
        <!-- Temperature gradient ring -->
        <div style="
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: ${pulseSize + 8}px;
          height: ${pulseSize + 8}px;
          border-radius: 50%;
          background: linear-gradient(45deg, ${color}, ${getTemperatureColor((temp || 15) + 2)});
          z-index: 2;
        "></div>
        
        <!-- Main marker body -->
        <div style="
          position: relative;
          width: ${baseSize}px;
          height: ${baseSize}px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${baseSize * 0.4}px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 3;
          ${isSelected ? 'transform: scale(1.1);' : ''}
        ">${statusIcon}</div>
        
        <!-- Temperature value label -->
        ${temp ? `
          <div style="
            position: absolute;
            top: ${baseSize + 8}px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 4;
          ">${temp.toFixed(1)}°C</div>
        ` : ''}
      </div>
    `,
    className: 'custom-advanced-buoy-icon',
    iconSize: [baseSize + 20, baseSize + 40],
    iconAnchor: [(baseSize + 20) / 2, (baseSize + 40) / 2]
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
  isFullscreen?: boolean
  isDarkMode?: boolean
  showHeatmap?: boolean
  searchQuery?: string
}

// Advanced heatmap visualization component
function TemperatureHeatmap({ buoys, show }: { buoys: BuoyData[], show: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (!show || !buoys.length) return
    
    // Create temperature gradient circles for heatmap effect
    const heatmapLayers: L.Circle[] = []
    
    buoys.forEach((buoy) => {
      if (buoy.last_temp && buoy.status === 'active') {
        const circle = L.circle([buoy.lat, buoy.lon], {
          radius: 200000, // 200km radius
          fillColor: getTemperatureColor(buoy.last_temp, 0.3),
          fillOpacity: 0.4,
          color: getTemperatureColor(buoy.last_temp, 0.6),
          weight: 2,
          opacity: 0.3
        })
        
        circle.addTo(map)
        heatmapLayers.push(circle)
      }
    })
    
    return () => {
      heatmapLayers.forEach(layer => {
        map.removeLayer(layer)
      })
    }
  }, [map, buoys, show])
  
  return null
}

// Marine heatwave overlay component
function MarineHeatwaveOverlay({ buoys }: { buoys: BuoyData[] }) {
  const map = useMap()
  
  useEffect(() => {
    const hotspots = buoys.filter(buoy => 
      buoy.last_temp && buoy.last_temp > 26 && buoy.status === 'active'
    )
    
    if (hotspots.length < 2) return
    
    // Create heatwave zones by connecting nearby hotspots
    const heatwavePolygons: L.Polygon[] = []
    
    // Simple convex hull for demonstration - in production would use proper algorithm
    if (hotspots.length >= 3) {
      const coords = hotspots.map(b => [b.lat, b.lon] as [number, number])
      const polygon = L.polygon(coords, {
        color: '#dc2626',
        fillColor: '#fca5a5',
        fillOpacity: 0.2,
        weight: 2,
        opacity: 0.6,
        dashArray: '10, 10'
      })
      
      polygon.addTo(map)
      heatwavePolygons.push(polygon)
    }
    
    return () => {
      heatwavePolygons.forEach(layer => {
        map.removeLayer(layer)
      })
    }
  }, [map, buoys])
  
  return null
}

// Professional map controls component
function MapControls({ 
  onFullscreen, 
  onToggleHeatmap, 
  showHeatmap, 
  onToggleDarkMode, 
  isDarkMode 
}: {
  onFullscreen: () => void
  onToggleHeatmap: () => void
  showHeatmap: boolean
  onToggleDarkMode: () => void
  isDarkMode: boolean
}) {
  return (
    <div className="map-controls">
      <button 
        className={`control-btn ${showHeatmap ? 'active' : ''}`}
        onClick={onToggleHeatmap}
        title="Toggle Temperature Heatmap"
      >
        🌡️
      </button>
      <button 
        className="control-btn"
        onClick={onFullscreen}
        title="Fullscreen Mode"
      >
        ⛶
      </button>
      <button 
        className={`control-btn ${isDarkMode ? 'active' : ''}`}
        onClick={onToggleDarkMode}
        title="Toggle Dark Mode"
      >
        {isDarkMode ? '☀️' : '🌙'}
      </button>
    </div>
  )
}

// Professional legend component
function ProfessionalLegend({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div className={`professional-legend ${isDarkMode ? 'dark' : 'light'}`}>
      <h4>Ocean Temperature Monitor</h4>
      
      <div className="legend-section">
        <h5>Temperature Scale</h5>
        <div className="temperature-scale">
          {[
            { temp: 30, label: 'Extreme', color: getTemperatureColor(30) },
            { temp: 26, label: 'Critical', color: getTemperatureColor(26) },
            { temp: 22, label: 'Elevated', color: getTemperatureColor(22) },
            { temp: 18, label: 'Normal', color: getTemperatureColor(18) },
            { temp: 10, label: 'Cold', color: getTemperatureColor(10) }
          ].map((item) => (
            <div key={item.temp} className="scale-item">
              <div 
                className="color-indicator"
                style={{ backgroundColor: item.color }}
              ></div>
              <span>{item.label} ({item.temp}°C+)</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="legend-section">
        <h5>Station Status</h5>
        <div className="status-indicators">
          <div className="status-item">
            <span className="status-icon active">✅</span>
            <span>Active & Normal</span>
          </div>
          <div className="status-item">
            <span className="status-icon warning">🌡️</span>
            <span>Elevated Temperature</span>
          </div>
          <div className="status-item">
            <span className="status-icon critical">🚨</span>
            <span>Critical Temperature</span>
          </div>
          <div className="status-item">
            <span className="status-icon inactive">📡</span>
            <span>Offline</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OceanMap({ 
  buoys, 
  onBuoySelect, 
  selectedBuoy,
  isFullscreen = false,
  isDarkMode = false,
  showHeatmap = true,
  searchQuery = ''
}: OceanMapProps) {
  const mapRef = useRef<L.Map>(null)
  const [animationLevel, setAnimationLevel] = useState(0)
  const [internalDarkMode, setInternalDarkMode] = useState(isDarkMode)
  const [internalShowHeatmap, setInternalShowHeatmap] = useState(showHeatmap)
  
  // Animation for pulsing markers on hot temperatures
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationLevel(prev => (prev + 1) % 4)
    }, 800)
    return () => clearInterval(interval)
  }, [])
  
  // Filter buoys based on search query
  const filteredBuoys = buoys.filter(buoy => 
    !searchQuery || 
    buoy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buoy.station_id.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const handleFullscreen = useCallback(() => {
    const element = document.querySelector('.map-container')
    if (element) {
      if (!document.fullscreenElement) {
        element.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
    }
  }, [])
  
  const emergencyBuoys = filteredBuoys.filter(b => b.last_temp && b.last_temp > 26)
  const warningBuoys = filteredBuoys.filter(b => b.last_temp && b.last_temp > 23 && b.last_temp <= 26)

  return (
    <div className={`professional-ocean-map ${isFullscreen ? 'fullscreen' : ''} ${internalDarkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Global styles for animations and professional styling */}
      <style jsx global>{`
        @keyframes emergencyPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.3; }
        }
        
        .professional-ocean-map {
          height: 100%;
          width: 100%;
          position: relative;
          background: linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 100%);
          transition: all 0.3s ease;
        }
        
        .professional-ocean-map.dark-mode {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }
        
        .professional-ocean-map.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }
        
        .leaflet-container {
          border-radius: ${isFullscreen ? '0' : '16px'};
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .map-controls {
          position: absolute;
          top: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 1000;
        }
        
        .control-btn {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(10px);
        }
        
        .control-btn:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }
        
        .control-btn.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }
        
        .dark-mode .control-btn {
          background: rgba(30, 41, 59, 0.95);
          color: white;
        }
        
        .dark-mode .control-btn:hover {
          background: rgba(30, 41, 59, 1);
        }
        
        .professional-legend {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 20px;
          min-width: 280px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          transition: all 0.3s ease;
        }
        
        .professional-legend.dark {
          background: rgba(30, 41, 59, 0.95);
          color: white;
        }
        
        .professional-legend h4 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }
        
        .professional-legend.dark h4 {
          color: #f8fafc;
        }
        
        .legend-section {
          margin-bottom: 16px;
        }
        
        .legend-section:last-child {
          margin-bottom: 0;
        }
        
        .legend-section h5 {
          margin: 0 0 8px 0;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          opacity: 0.8;
        }
        
        .temperature-scale {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .scale-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }
        
        .color-indicator {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .status-indicators {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .status-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
        }
        
        .status-icon {
          width: 16px;
          text-align: center;
          font-size: 12px;
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .dark-mode .leaflet-popup-content-wrapper {
          background: rgba(30, 41, 59, 0.95);
          color: white;
        }
        
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        
        .dark-mode .leaflet-popup-tip {
          background: rgba(30, 41, 59, 0.95);
        }
        
        .custom-advanced-buoy-icon {
          cursor: pointer;
        }
        
        .emergency-overlay {
          position: absolute;
          top: 20px;
          left: 20px;
          background: linear-gradient(135deg, #dc2626, #b91c1c);
          color: white;
          padding: 16px 20px;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3);
          z-index: 1000;
          animation: emergencyAlert 3s ease-in-out infinite;
          max-width: 320px;
        }
        
        @keyframes emergencyAlert {
          0%, 100% { box-shadow: 0 10px 30px rgba(220, 38, 38, 0.3); }
          50% { box-shadow: 0 10px 30px rgba(220, 38, 38, 0.6); }
        }
        
        .emergency-overlay h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: bold;
        }
        
        .emergency-overlay p {
          margin: 0;
          font-size: 12px;
          line-height: 1.4;
          opacity: 0.9;
        }
        
        @media (max-width: 768px) {
          .professional-legend {
            bottom: 10px;
            right: 10px;
            left: 10px;
            min-width: auto;
            padding: 16px;
          }
          
          .map-controls {
            top: 10px;
            right: 10px;
            flex-direction: row;
          }
          
          .control-btn {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }
          
          .emergency-overlay {
            top: 60px;
            left: 10px;
            right: 10px;
            max-width: none;
          }
        }
      `}</style>
      
      <MapContainer
        center={[20, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={12}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        className="professional-map-container"
      >
        {/* Dark satellite tiles for professional look */}
        <TileLayer
          url={internalDarkMode 
            ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            : "https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png"
          }
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>'
          opacity={0.8}
        />
        
        {/* Temperature heatmap overlay */}
        <TemperatureHeatmap buoys={filteredBuoys} show={internalShowHeatmap} />
        
        {/* Marine heatwave overlay */}
        <MarineHeatwaveOverlay buoys={filteredBuoys} />
        
        {/* Professional animated markers */}
        {filteredBuoys.map((buoy) => (
          <Marker
            key={buoy.station_id}
            position={[buoy.lat, buoy.lon]}
            icon={createAdvancedBuoyIcon(
              buoy.status, 
              buoy.last_temp, 
              selectedBuoy?.station_id === buoy.station_id,
              animationLevel
            )}
            eventHandlers={{
              click: () => onBuoySelect(buoy),
            }}
          >
            <Popup className="professional-popup">
              <div style={{ minWidth: '250px', padding: '8px 0' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '12px',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '18px' }}>
                    {buoy.status === 'active' && buoy.last_temp && buoy.last_temp > 26 ? '🚨' :
                     buoy.status === 'active' && buoy.last_temp && buoy.last_temp > 23 ? '🌡️' :
                     buoy.status === 'active' ? '✅' : '📡'}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                    {buoy.name}
                  </h3>
                </div>
                
                <div style={{ display: 'grid', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Station ID:</span>
                    <span style={{ fontFamily: 'monospace' }}>{buoy.station_id}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Coordinates:</span>
                    <span style={{ fontFamily: 'monospace' }}>
                      {buoy.lat.toFixed(3)}°, {buoy.lon.toFixed(3)}°
                    </span>
                  </div>
                  
                  {buoy.last_temp && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '500' }}>Sea Temperature:</span>
                      <span style={{ 
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: getTemperatureColor(buoy.last_temp)
                      }}>
                        {buoy.last_temp.toFixed(1)}°C
                      </span>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: '500' }}>Status:</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      background: 
                        buoy.status === 'active' ? '#10b981' :
                        buoy.status === 'warning' ? '#f59e0b' : '#6b7280',
                      color: 'white'
                    }}>
                      {buoy.status}
                    </span>
                  </div>
                </div>
                
                {/* Climate impact assessment */}
                {buoy.status === 'active' && buoy.last_temp && (
                  <div style={{ 
                    marginTop: '12px',
                    padding: '10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    lineHeight: 1.4,
                    background: buoy.last_temp > 26 ? 
                      'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(239, 68, 68, 0.1))' :
                      buoy.last_temp > 23 ?
                      'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))' :
                      'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      Climate Impact Assessment:
                    </div>
                    {buoy.last_temp > 28 && (
                      <div style={{ color: '#dc2626' }}>
                        🔴 <strong>EXTREME HEAT:</strong> Severe coral bleaching risk, marine ecosystem collapse potential
                      </div>
                    )}
                    {buoy.last_temp > 26 && buoy.last_temp <= 28 && (
                      <div style={{ color: '#ea580c' }}>
                        🟠 <strong>CRITICAL:</strong> High coral bleaching risk, marine heatwave conditions
                      </div>
                    )}
                    {buoy.last_temp > 23 && buoy.last_temp <= 26 && (
                      <div style={{ color: '#f59e0b' }}>
                        🟡 <strong>ELEVATED:</strong> Monitor for marine heatwave development
                      </div>
                    )}
                    {buoy.last_temp <= 23 && (
                      <div style={{ color: '#10b981' }}>
                        🟢 <strong>NORMAL:</strong> Temperature within acceptable range
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Professional map controls */}
      <MapControls
        onFullscreen={handleFullscreen}
        onToggleHeatmap={() => setInternalShowHeatmap(!internalShowHeatmap)}
        showHeatmap={internalShowHeatmap}
        onToggleDarkMode={() => setInternalDarkMode(!internalDarkMode)}
        isDarkMode={internalDarkMode}
      />
      
      {/* Professional legend */}
      <ProfessionalLegend isDarkMode={internalDarkMode} />
      
      {/* Emergency climate alert overlay */}
      {emergencyBuoys.length > 0 && (
        <div className="emergency-overlay">
          <h4>🚨 MARINE HEATWAVE ALERT</h4>
          <p>
            {emergencyBuoys.length} station{emergencyBuoys.length > 1 ? 's' : ''} reporting critical temperatures above 26°C. 
            Immediate coral bleaching and marine ecosystem stress detected.
          </p>
        </div>
      )}
    </div>
  )
}