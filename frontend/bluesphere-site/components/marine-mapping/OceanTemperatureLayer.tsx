/*
 * BlueSphere Ocean Temperature Layer
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Real-time sea surface temperature visualization with anomaly detection
 */

import React, { useState, useEffect, useMemo } from 'react'
import { TileLayer, Circle, Marker, Popup, Rectangle } from 'react-leaflet'
import L from 'leaflet'
import { MarineMapLayer, MapBounds } from './MarineMapEngine'

interface TemperatureDataPoint {
  id: string
  lat: number
  lon: number
  temperature_c: number
  anomaly_c: number
  depth_m: number
  timestamp: string
  data_source: 'satellite' | 'buoy' | 'argo_float' | 'ship'
  quality: 'excellent' | 'good' | 'acceptable' | 'poor'
}

interface MarineHeatwave {
  id: string
  name: string
  severity: 'moderate' | 'strong' | 'severe' | 'extreme'
  area_km2: number
  max_temperature: number
  duration_days: number
  boundaries: [number, number][]
  center: [number, number]
  impact_assessment: string
}

interface OceanTemperatureLayerProps {
  layer: MarineMapLayer
  onFeatureSelect: (feature: any) => void
  performanceMode: boolean
  bounds?: MapBounds
}

// Temperature color scale (based on NASA ocean color standards)
const getTemperatureColor = (temp: number, opacity: number = 1): string => {
  if (temp >= 32) return `rgba(139, 0, 0, ${opacity})` // Dark red - Extreme heat
  if (temp >= 30) return `rgba(220, 38, 38, ${opacity})` // Red - Very hot
  if (temp >= 28) return `rgba(239, 68, 68, ${opacity})` // Light red - Hot
  if (temp >= 26) return `rgba(251, 146, 60, ${opacity})` // Orange - Warm
  if (temp >= 24) return `rgba(251, 191, 36, ${opacity})` // Yellow - Mild warm
  if (temp >= 22) return `rgba(163, 230, 53, ${opacity})` // Light green - Normal warm
  if (temp >= 20) return `rgba(34, 197, 94, ${opacity})` // Green - Normal
  if (temp >= 18) return `rgba(14, 165, 233, ${opacity})` // Light blue - Cool
  if (temp >= 15) return `rgba(59, 130, 246, ${opacity})` // Blue - Cold
  if (temp >= 10) return `rgba(29, 78, 216, ${opacity})` // Dark blue - Very cold
  return `rgba(67, 56, 202, ${opacity})` // Indigo - Extreme cold
}

// Anomaly color scale
const getAnomalyColor = (anomaly: number, opacity: number = 1): string => {
  if (anomaly >= 4) return `rgba(139, 0, 0, ${opacity})` // Extreme warm anomaly
  if (anomaly >= 2) return `rgba(220, 38, 38, ${opacity})` // Strong warm anomaly
  if (anomaly >= 1) return `rgba(251, 146, 60, ${opacity})` // Moderate warm anomaly
  if (anomaly >= 0.5) return `rgba(251, 191, 36, ${opacity})` // Weak warm anomaly
  if (anomaly >= -0.5) return `rgba(156, 163, 175, ${opacity})` // Normal
  if (anomaly >= -1) return `rgba(147, 197, 253, ${opacity})` // Weak cool anomaly
  if (anomaly >= -2) return `rgba(59, 130, 246, ${opacity})` // Moderate cool anomaly
  if (anomaly >= -4) return `rgba(29, 78, 216, ${opacity})` // Strong cool anomaly
  return `rgba(67, 56, 202, ${opacity})` // Extreme cool anomaly
}

// Create temperature station icon
const createTemperatureIcon = (dataPoint: TemperatureDataPoint, showAnomalies: boolean = false) => {
  const size = 24
  const color = showAnomalies ? getAnomalyColor(dataPoint.anomaly_c) : getTemperatureColor(dataPoint.temperature_c)
  const value = showAnomalies ? dataPoint.anomaly_c : dataPoint.temperature_c
  const unit = showAnomalies ? '°C' : '°C'

  // Data source icon
  let sourceIcon = '📊'
  switch (dataPoint.data_source) {
    case 'satellite':
      sourceIcon = '🛰️'
      break
    case 'buoy':
      sourceIcon = '⚓'
      break
    case 'argo_float':
      sourceIcon = '🎈'
      break
    case 'ship':
      sourceIcon = '🚢'
      break
  }

  return L.divIcon({
    html: `
      <div class="temperature-marker" style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: bold;
        color: white;
        text-shadow: 0 0 2px rgba(0,0,0,0.8);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        position: relative;
      ">
        ${sourceIcon}

        <!-- Temperature value -->
        <div style="
          position: absolute;
          top: ${size + 4}px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 1px 4px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: bold;
          white-space: nowrap;
        ">${value.toFixed(1)}${unit}</div>

        <!-- Quality indicator -->
        <div style="
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${dataPoint.quality === 'excellent' ? '#10b981' :
                      dataPoint.quality === 'good' ? '#f59e0b' :
                      dataPoint.quality === 'acceptable' ? '#f97316' : '#ef4444'};
          border: 1px solid white;
        "></div>
      </div>
    `,
    className: 'custom-temperature-icon',
    iconSize: [size + 4, size + 20],
    iconAnchor: [(size + 4) / 2, (size + 20) / 2]
  })
}

const OceanTemperatureLayer: React.FC<OceanTemperatureLayerProps> = ({
  layer,
  onFeatureSelect,
  performanceMode,
  bounds
}) => {
  const [temperatureData, setTemperatureData] = useState<TemperatureDataPoint[]>([])
  const [marineHeatwaves, setMarineHeatwaves] = useState<MarineHeatwave[]>([])
  const [showAnomalies, setShowAnomalies] = useState(false)
  const [showHeatwaves, setShowHeatwaves] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // Load temperature data
  useEffect(() => {
    const loadTemperatureData = async () => {
      setIsLoading(true)
      try {
        // In a real application, this would fetch from NOAA SST API or similar
        const data = generateTemperatureData()
        setTemperatureData(data.temperatures)
        setMarineHeatwaves(data.heatwaves)
      } catch (error) {
        console.error('Failed to load temperature data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemperatureData()

    // Refresh interval for real-time updates
    const interval = setInterval(loadTemperatureData, layer.refreshInterval || 3600000)
    return () => clearInterval(interval)
  }, [layer.refreshInterval])

  // Filter data based on bounds for performance
  const visibleData = useMemo(() => {
    if (!bounds || performanceMode) {
      return {
        temperatures: temperatureData.slice(0, 200), // Limit in performance mode
        heatwaves: marineHeatwaves.slice(0, 10)
      }
    }

    const visibleTemperatures = temperatureData.filter(point =>
      point.lat >= bounds.south &&
      point.lat <= bounds.north &&
      point.lon >= bounds.west &&
      point.lon <= bounds.east
    )

    const visibleHeatwaves = marineHeatwaves.filter(heatwave => {
      const [centerLat, centerLon] = heatwave.center
      return centerLat >= bounds.south &&
             centerLat <= bounds.north &&
             centerLon >= bounds.west &&
             centerLon <= bounds.east
    })

    return {
      temperatures: visibleTemperatures,
      heatwaves: visibleHeatwaves
    }
  }, [temperatureData, marineHeatwaves, bounds, performanceMode])

  const handleTemperaturePointClick = (dataPoint: TemperatureDataPoint) => {
    onFeatureSelect({
      type: 'temperature_data',
      data: dataPoint,
      coordinates: [dataPoint.lat, dataPoint.lon]
    })
  }

  const handleHeatwaveClick = (heatwave: MarineHeatwave) => {
    onFeatureSelect({
      type: 'marine_heatwave',
      data: heatwave,
      coordinates: heatwave.center
    })
  }

  if (!layer.enabled) return null

  return (
    <>
      {/* SST Satellite Overlay */}
      <TileLayer
        url="https://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=MODIS_Aqua_Sea_Surface_Temp_Day&STYLE=default&TILEMATRIXSET=EPSG4326_250m&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image%2Fpng"
        attribution='NASA Worldview &copy; <a href="https://worldview.earthdata.nasa.gov/">NASA EOSDIS</a>'
        opacity={layer.opacity * 0.6}
        maxZoom={8}
      />

      {/* Temperature data points */}
      {visibleData.temperatures.map(dataPoint => (
        <Marker
          key={dataPoint.id}
          position={[dataPoint.lat, dataPoint.lon]}
          icon={createTemperatureIcon(dataPoint, showAnomalies)}
          eventHandlers={{
            click: () => handleTemperaturePointClick(dataPoint)
          }}
          opacity={layer.opacity}
        >
          <Popup>
            <div className="temperature-popup">
              <div className="popup-header">
                <h3>Sea Surface Temperature</h3>
                <span className={`quality-badge ${dataPoint.quality}`}>
                  {dataPoint.quality}
                </span>
              </div>

              <div className="temperature-details">
                <div className="main-temp">
                  <span className="temp-value" style={{ color: getTemperatureColor(dataPoint.temperature_c) }}>
                    {dataPoint.temperature_c.toFixed(1)}°C
                  </span>
                  <span className="temp-label">Current Temperature</span>
                </div>

                {Math.abs(dataPoint.anomaly_c) > 0.5 && (
                  <div className="anomaly-info">
                    <span className="anomaly-value" style={{ color: getAnomalyColor(dataPoint.anomaly_c) }}>
                      {dataPoint.anomaly_c > 0 ? '+' : ''}{dataPoint.anomaly_c.toFixed(1)}°C
                    </span>
                    <span className="anomaly-label">Temperature Anomaly</span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="label">Coordinates:</span>
                  <span className="value">{dataPoint.lat.toFixed(3)}°, {dataPoint.lon.toFixed(3)}°</span>
                </div>
                <div className="detail-row">
                  <span className="label">Depth:</span>
                  <span className="value">{dataPoint.depth_m}m</span>
                </div>
                <div className="detail-row">
                  <span className="label">Data Source:</span>
                  <span className="value">{dataPoint.data_source}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Timestamp:</span>
                  <span className="value">{new Date(dataPoint.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {Math.abs(dataPoint.anomaly_c) > 2 && (
                <div className="alert-section">
                  <div className={`temperature-alert ${dataPoint.anomaly_c > 0 ? 'warm' : 'cool'}`}>
                    <strong>
                      {dataPoint.anomaly_c > 0 ? '🔥 Heat Alert' : '🧊 Cool Alert'}
                    </strong>
                    <p>
                      {dataPoint.anomaly_c > 0
                        ? 'Significantly warmer than historical average. Monitor for marine heatwave development.'
                        : 'Significantly cooler than historical average. May indicate unusual oceanographic conditions.'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Marine heatwaves */}
      {showHeatwaves && visibleData.heatwaves.map(heatwave => (
        <React.Fragment key={heatwave.id}>
          {/* Heatwave boundary */}
          <Rectangle
            bounds={[
              [heatwave.boundaries[0][0], heatwave.boundaries[0][1]],
              [heatwave.boundaries[2][0], heatwave.boundaries[2][1]]
            ]}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#fca5a5',
              fillOpacity: 0.2,
              weight: 2,
              opacity: 0.8,
              dashArray: '10, 5'
            }}
            eventHandlers={{
              click: () => handleHeatwaveClick(heatwave)
            }}
          >
            <Popup>
              <div className="heatwave-popup">
                <div className="popup-header">
                  <h3>{heatwave.name}</h3>
                  <span className={`severity-badge ${heatwave.severity}`}>
                    {heatwave.severity}
                  </span>
                </div>

                <div className="heatwave-details">
                  <div className="detail-row">
                    <span className="label">Max Temperature:</span>
                    <span className="value temp">{heatwave.max_temperature.toFixed(1)}°C</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Duration:</span>
                    <span className="value">{heatwave.duration_days} days</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Area:</span>
                    <span className="value">{heatwave.area_km2.toLocaleString()} km²</span>
                  </div>
                </div>

                <div className="impact-assessment">
                  <h4>Impact Assessment</h4>
                  <p>{heatwave.impact_assessment}</p>
                </div>
              </div>
            </Popup>
          </Rectangle>

          {/* Heatwave center marker */}
          <Circle
            center={heatwave.center}
            radius={5000}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#dc2626',
              fillOpacity: 0.6,
              weight: 3
            }}
          />
        </React.Fragment>
      ))}

      {/* Layer controls */}
      <div className="temperature-layer-controls">
        <button
          className={`control-button ${showAnomalies ? 'active' : ''}`}
          onClick={() => setShowAnomalies(!showAnomalies)}
          title="Toggle temperature anomalies"
        >
          📊
        </button>
        <button
          className={`control-button ${showHeatwaves ? 'active' : ''}`}
          onClick={() => setShowHeatwaves(!showHeatwaves)}
          title="Toggle marine heatwaves"
        >
          🔥
        </button>
      </div>

      {/* Temperature legend */}
      <div className="temperature-legend">
        <h4>{showAnomalies ? 'Temperature Anomalies' : 'Sea Surface Temperature'}</h4>
        <div className="legend-scale">
          {(showAnomalies ?
            [{ value: 4, label: '+4°C' }, { value: 2, label: '+2°C' }, { value: 0, label: '0°C' }, { value: -2, label: '-2°C' }, { value: -4, label: '-4°C' }] :
            [{ value: 32, label: '32°C' }, { value: 28, label: '28°C' }, { value: 24, label: '24°C' }, { value: 20, label: '20°C' }, { value: 15, label: '15°C' }, { value: 10, label: '10°C' }]
          ).map((item) => (
            <div key={item.value} className="legend-item">
              <div
                className="color-indicator"
                style={{
                  backgroundColor: showAnomalies ? getAnomalyColor(item.value) : getTemperatureColor(item.value)
                }}
              ></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .temperature-popup {
          min-width: 300px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .popup-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .quality-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .quality-badge.excellent {
          background: #dcfce7;
          color: #166534;
        }

        .quality-badge.good {
          background: #fef3c7;
          color: #92400e;
        }

        .quality-badge.acceptable {
          background: #fed7aa;
          color: #c2410c;
        }

        .quality-badge.poor {
          background: #fee2e2;
          color: #991b1b;
        }

        .main-temp {
          text-align: center;
          margin-bottom: 1rem;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 8px;
        }

        .temp-value {
          display: block;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
        }

        .temp-label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .anomaly-info {
          text-align: center;
          margin-bottom: 1rem;
          padding: 0.75rem;
          background: #fef2f2;
          border-radius: 8px;
          border: 1px solid #fecaca;
        }

        .anomaly-value {
          display: block;
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .anomaly-label {
          display: block;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .temperature-details .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .detail-row .label {
          font-size: 0.875rem;
          color: #6b7280;
          font-weight: 500;
        }

        .detail-row .value {
          font-size: 0.875rem;
          color: #1f2937;
          font-weight: 600;
        }

        .alert-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
        }

        .temperature-alert {
          padding: 0.75rem;
          border-radius: 8px;
          border: 1px solid;
        }

        .temperature-alert.warm {
          background: #fef2f2;
          border-color: #fecaca;
          color: #991b1b;
        }

        .temperature-alert.cool {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1e40af;
        }

        .temperature-alert strong {
          display: block;
          margin-bottom: 0.5rem;
        }

        .temperature-alert p {
          margin: 0;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .severity-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
        }

        .severity-badge.moderate {
          background: #fef3c7;
          color: #92400e;
        }

        .severity-badge.strong {
          background: #fed7aa;
          color: #c2410c;
        }

        .severity-badge.severe {
          background: #fee2e2;
          color: #991b1b;
        }

        .severity-badge.extreme {
          background: #fecaca;
          color: #7f1d1d;
        }

        .heatwave-details {
          margin-bottom: 1rem;
        }

        .impact-assessment h4 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .impact-assessment p {
          margin: 0;
          font-size: 0.8rem;
          color: #4b5563;
          line-height: 1.4;
        }

        .temperature-layer-controls {
          position: absolute;
          top: 120px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 1000;
        }

        .control-button {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .control-button:hover {
          background: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .control-button.active {
          background: #3b82f6;
          color: white;
        }

        .temperature-legend {
          position: absolute;
          bottom: 80px;
          left: 20px;
          background: rgba(255, 255, 255, 0.95);
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
          z-index: 1000;
          min-width: 200px;
        }

        .temperature-legend h4 {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .legend-scale {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #374151;
        }

        .color-indicator {
          width: 16px;
          height: 16px;
          border-radius: 3px;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        :global(.custom-temperature-icon) {
          z-index: 300;
        }

        :global(.custom-temperature-icon:hover) {
          z-index: 1000;
        }
      `}</style>
    </>
  )
}

// Generate comprehensive temperature data
function generateTemperatureData(): {
  temperatures: TemperatureDataPoint[]
  heatwaves: MarineHeatwave[]
} {
  const temperatures: TemperatureDataPoint[] = []
  const heatwaves: MarineHeatwave[] = []

  // Generate global temperature grid
  const currentTime = new Date()

  // High-resolution data for key ocean regions
  const regions = [
    { name: 'North Pacific', latRange: [20, 60], lonRange: [-180, -120], baseTemp: 15, points: 150 },
    { name: 'North Atlantic', latRange: [30, 70], lonRange: [-80, 10], baseTemp: 12, points: 120 },
    { name: 'Tropical Pacific', latRange: [-20, 20], lonRange: [-180, -80], baseTemp: 28, points: 200 },
    { name: 'Tropical Atlantic', latRange: [-20, 20], lonRange: [-60, 20], baseTemp: 27, points: 100 },
    { name: 'Indian Ocean', latRange: [-40, 30], lonRange: [20, 120], baseTemp: 26, points: 180 },
    { name: 'Southern Ocean', latRange: [-70, -40], lonRange: [-180, 180], baseTemp: 2, points: 80 },
    { name: 'Mediterranean', latRange: [30, 46], lonRange: [-6, 36], baseTemp: 20, points: 60 },
    { name: 'Arctic Ocean', latRange: [66, 90], lonRange: [-180, 180], baseTemp: -1, points: 40 }
  ]

  let id = 1

  regions.forEach(region => {
    for (let i = 0; i < region.points; i++) {
      const lat = region.latRange[0] + Math.random() * (region.latRange[1] - region.latRange[0])
      const lon = region.lonRange[0] + Math.random() * (region.lonRange[1] - region.lonRange[0])

      // Seasonal variation
      const seasonalFactor = Math.sin((currentTime.getMonth() - 3) * Math.PI / 6)
      const latitudinalVariation = Math.cos(lat * Math.PI / 180) * 15

      const temperature = region.baseTemp +
                         latitudinalVariation +
                         (lat > 0 ? seasonalFactor : -seasonalFactor) * 5 +
                         (Math.random() - 0.5) * 8

      // Calculate anomaly (simulate climate change and natural variability)
      const climateTrend = 0.8 // Global warming trend
      const naturalVariability = (Math.random() - 0.5) * 6
      const anomaly = climateTrend + naturalVariability

      // Data source distribution
      const sources: TemperatureDataPoint['data_source'][] = ['satellite', 'buoy', 'argo_float', 'ship']
      const source = sources[Math.floor(Math.random() * sources.length)]

      // Quality based on source and conditions
      let quality: TemperatureDataPoint['quality'] = 'good'
      if (source === 'satellite' && Math.abs(lat) < 60) quality = 'excellent'
      if (source === 'ship' && Math.random() > 0.7) quality = 'acceptable'
      if (Math.abs(lat) > 75) quality = 'poor' // Polar regions challenging

      temperatures.push({
        id: `temp_${id++}`,
        lat: Math.round(lat * 1000) / 1000,
        lon: Math.round(lon * 1000) / 1000,
        temperature_c: Math.round(temperature * 10) / 10,
        anomaly_c: Math.round(anomaly * 10) / 10,
        depth_m: source === 'satellite' ? 0 : Math.floor(Math.random() * 200),
        timestamp: new Date(currentTime.getTime() - Math.random() * 6 * 60 * 60 * 1000).toISOString(),
        data_source: source,
        quality
      })
    }
  })

  // Generate marine heatwaves
  const heatwaveRegions = [
    {
      name: 'Northeast Pacific Blob',
      severity: 'strong' as const,
      center: [45.0, -140.0] as [number, number],
      area: 500000,
      maxTemp: 22.5,
      duration: 45,
      impact: 'Significant marine ecosystem disruption with salmon migration impacts and harmful algal blooms.'
    },
    {
      name: 'Mediterranean Heat Dome',
      severity: 'severe' as const,
      center: [39.0, 16.0] as [number, number],
      area: 120000,
      maxTemp: 31.2,
      duration: 28,
      impact: 'Coral mortality and seagrass die-offs observed. Tourism and fisheries affected.'
    },
    {
      name: 'Coral Triangle Warming',
      severity: 'extreme' as const,
      center: [-5.0, 125.0] as [number, number],
      area: 350000,
      maxTemp: 33.8,
      duration: 62,
      impact: 'Mass coral bleaching event underway. Critical threat to marine biodiversity hotspot.'
    },
    {
      name: 'Tasman Sea Anomaly',
      severity: 'moderate' as const,
      center: [-35.0, 155.0] as [number, number],
      area: 180000,
      maxTemp: 24.1,
      duration: 18,
      impact: 'Elevated temperatures affecting temperate reef systems and fisheries.'
    }
  ]

  heatwaves.push(...heatwaveRegions.map((hw, index) => ({
    id: `heatwave_${index + 1}`,
    name: hw.name,
    severity: hw.severity,
    area_km2: hw.area,
    max_temperature: hw.maxTemp,
    duration_days: hw.duration,
    boundaries: [
      [hw.center[0] + 3, hw.center[1] - 5],
      [hw.center[0] + 3, hw.center[1] + 5],
      [hw.center[0] - 3, hw.center[1] + 5],
      [hw.center[0] - 3, hw.center[1] - 5]
    ],
    center: hw.center,
    impact_assessment: hw.impact
  })))

  return { temperatures, heatwaves }
}

export default OceanTemperatureLayer