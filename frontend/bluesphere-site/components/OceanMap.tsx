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
  provider?: string
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
          z-index: 2000 !important;
        }
        
        .dark-mode .leaflet-popup-content-wrapper {
          background: rgba(30, 41, 59, 0.95);
          color: white;
        }
        
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
          z-index: 2000 !important;
        }
        
        .dark-mode .leaflet-popup-tip {
          background: rgba(30, 41, 59, 0.95);
          z-index: 2000 !important;
        }
        
        /* Enhanced Popup Styling */
        .ocean-station-popup {
          min-width: 280px;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .popup-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(147, 197, 253, 0.05));
        }
        
        .dark-mode .popup-header {
          border-bottom-color: rgba(255, 255, 255, 0.1);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 197, 253, 0.1));
        }
        
        .station-icon {
          font-size: 24px;
          min-width: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .station-info {
          flex: 1;
        }
        
        .station-name {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          line-height: 1.2;
        }
        
        .dark-mode .station-name {
          color: #f8fafc;
        }
        
        .station-id {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #6b7280;
          font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
        }
        
        .dark-mode .station-id {
          color: #9ca3af;
        }
        
        .status-badge {
          display: flex;
        }
        
        .status-indicator {
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid transparent;
        }
        
        .status-active {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
        }
        
        .status-warning {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white;
          box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);
        }
        
        .status-inactive {
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
          box-shadow: 0 2px 4px rgba(107, 114, 128, 0.3);
        }
        
        .popup-data {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .data-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .dark-mode .data-row {
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }
        
        .data-row:last-child {
          border-bottom: none;
        }
        
        .data-label {
          font-size: 13px;
          font-weight: 500;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .dark-mode .data-label {
          color: #9ca3af;
        }
        
        .data-value {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .dark-mode .data-value {
          color: #f3f4f6;
        }
        
        .data-value.coordinate {
          font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
          font-size: 12px;
        }
        
        .data-value.temperature {
          font-size: 16px;
          font-weight: 700;
          font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
        }
        
        .temp-extreme {
          color: #dc2626;
          text-shadow: 0 1px 2px rgba(220, 38, 38, 0.3);
        }
        
        .temp-critical {
          color: #ea580c;
          text-shadow: 0 1px 2px rgba(234, 88, 12, 0.3);
        }
        
        .temp-elevated {
          color: #f59e0b;
          text-shadow: 0 1px 2px rgba(245, 158, 11, 0.3);
        }
        
        .temp-normal {
          color: #10b981;
          text-shadow: 0 1px 2px rgba(16, 185, 129, 0.3);
        }
        
        .climate-assessment {
          margin: 16px;
          margin-top: 0;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .dark-mode .climate-assessment {
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .assessment-extreme {
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(239, 68, 68, 0.1));
        }
        
        .assessment-critical {
          background: linear-gradient(135deg, rgba(234, 88, 12, 0.1), rgba(251, 146, 60, 0.1));
        }
        
        .assessment-elevated {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1));
        }
        
        .assessment-normal {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(34, 197, 94, 0.1));
        }
        
        .assessment-header {
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 700;
          color: #374151;
          background: rgba(255, 255, 255, 0.5);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .dark-mode .assessment-header {
          color: #e5e7eb;
          background: rgba(0, 0, 0, 0.2);
          border-bottom-color: rgba(255, 255, 255, 0.1);
        }
        
        .assessment-content {
          padding: 12px 16px;
        }
        
        .impact-level {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        
        .impact-icon {
          font-size: 16px;
          min-width: 20px;
          margin-top: 2px;
        }
        
        .impact-text {
          flex: 1;
        }
        
        .impact-text strong {
          display: block;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing: 0.5px;
        }
        
        .impact-text p {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
          color: #6b7280;
        }
        
        .dark-mode .impact-text p {
          color: #9ca3af;
        }
        
        .impact-level.extreme .impact-text strong {
          color: #dc2626;
        }
        
        .impact-level.critical .impact-text strong {
          color: #ea580c;
        }
        
        .impact-level.elevated .impact-text strong {
          color: #f59e0b;
        }
        
        .impact-level.normal .impact-text strong {
          color: #10b981;
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
              <div className="ocean-station-popup">
                <div className="popup-header">
                  <div className="station-icon">
                    {buoy.status === 'active' && buoy.last_temp && buoy.last_temp > 26 ? '🚨' :
                     buoy.status === 'active' && buoy.last_temp && buoy.last_temp > 23 ? '🌡️' :
                     buoy.status === 'active' ? '🌊' : '📡'}
                  </div>
                  <div className="station-info">
                    <h3 className="station-name">{buoy.name}</h3>
                    <p className="station-id">Station: {buoy.station_id}</p>
                  </div>
                  <div className="status-badge">
                    <span className={`status-indicator status-${buoy.status}`}>
                      {buoy.status}
                    </span>
                  </div>
                </div>
                
                <div className="popup-data">
                  <div className="data-row">
                    <span className="data-label">📍 Coordinates</span>
                    <span className="data-value coordinate">
                      {buoy.lat.toFixed(3)}°, {buoy.lon.toFixed(3)}°
                    </span>
                  </div>
                  
                  {buoy.last_temp && (
                    <div className="data-row temperature-row">
                      <span className="data-label">🌡️ Sea Temperature</span>
                      <span className={`data-value temperature temp-${
                        buoy.last_temp > 28 ? 'extreme' :
                        buoy.last_temp > 26 ? 'critical' :
                        buoy.last_temp > 23 ? 'elevated' : 'normal'
                      }`}>
                        {buoy.last_temp.toFixed(1)}°C
                      </span>
                    </div>
                  )}
                  
                  <div className="data-row">
                    <span className="data-label">📡 Provider</span>
                    <span className="data-value">{buoy.provider || 'Ocean Monitoring Network'}</span>
                  </div>
                </div>
                
                {/* Climate impact assessment */}
                {buoy.status === 'active' && buoy.last_temp && (
                  <div className={`climate-assessment assessment-${
                    buoy.last_temp > 28 ? 'extreme' :
                    buoy.last_temp > 26 ? 'critical' :
                    buoy.last_temp > 23 ? 'elevated' : 'normal'
                  }`}>
                    <div className="assessment-header">
                      🌊 Climate Impact Analysis
                    </div>
                    <div className="assessment-content">
                      {buoy.last_temp > 28 && (
                        <div className="impact-level extreme">
                          <span className="impact-icon">🔴</span>
                          <div className="impact-text">
                            <strong>EXTREME HEAT</strong>
                            <p>Severe coral bleaching risk, marine ecosystem collapse potential</p>
                          </div>
                        </div>
                      )}
                      {buoy.last_temp > 26 && buoy.last_temp <= 28 && (
                        <div className="impact-level critical">
                          <span className="impact-icon">🟠</span>
                          <div className="impact-text">
                            <strong>CRITICAL</strong>
                            <p>High coral bleaching risk, marine heatwave conditions</p>
                          </div>
                        </div>
                      )}
                      {buoy.last_temp > 23 && buoy.last_temp <= 26 && (
                        <div className="impact-level elevated">
                          <span className="impact-icon">🟡</span>
                          <div className="impact-text">
                            <strong>ELEVATED</strong>
                            <p>Monitor for marine heatwave development</p>
                          </div>
                        </div>
                      )}
                      {buoy.last_temp <= 23 && (
                        <div className="impact-level normal">
                          <span className="impact-icon">🟢</span>
                          <div className="impact-text">
                            <strong>NORMAL</strong>
                            <p>Temperature within acceptable range</p>
                          </div>
                        </div>
                      )}
                    </div>
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