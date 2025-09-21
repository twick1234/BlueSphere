/*
 * BlueSphere Shark Tracking Layer
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Advanced shark tracking visualization with movement patterns and real-time data
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { SharkData, SharkTrackPoint, OCEARCHService } from '../../lib/shark-tracking'
import { MarineMapLayer, MapBounds } from './MarineMapEngine'

interface SharkTrackingLayerProps {
  layer: MarineMapLayer
  onFeatureSelect: (feature: any) => void
  performanceMode: boolean
  bounds?: MapBounds
}

interface SharkMovementData extends SharkData {
  track?: SharkTrackPoint[]
  movementVector?: {
    speed: number
    direction: number
    distance: number
  }
}

// Create advanced shark icons based on species and status
const createSharkIcon = (shark: SharkData, isSelected: boolean = false) => {
  const baseSize = isSelected ? 36 : 28
  const species = shark.species.toLowerCase()

  // Species-specific icons and colors
  let icon = '🦈'
  let color = '#3b82f6'

  if (species.includes('carcharodon carcharias')) {
    icon = '🦈' // Great White
    color = '#dc2626'
  } else if (species.includes('galeocerdo cuvier')) {
    icon = '🐅' // Tiger Shark
    color = '#f59e0b'
  } else if (species.includes('rhincodon typus')) {
    icon = '🐋' // Whale Shark
    color = '#059669'
  } else if (species.includes('sphyrna')) {
    icon = '🔨' // Hammerhead
    color = '#7c3aed'
  } else if (species.includes('prionace glauca')) {
    icon = '💙' // Blue Shark
    color = '#2563eb'
  } else if (species.includes('isurus oxyrinchus')) {
    icon = '⚡' // Mako
    color = '#ea580c'
  }

  // Status-based styling
  let statusRing = ''
  if (shark.status === 'Active') {
    statusRing = `
      <div style="
        position: absolute;
        top: -4px; left: -4px;
        width: ${baseSize + 8}px;
        height: ${baseSize + 8}px;
        border-radius: 50%;
        background: linear-gradient(45deg, ${color}, ${color}80);
        animation: activePulse 2s ease-in-out infinite;
        z-index: 1;
      "></div>
    `
  } else if (shark.status === 'Inactive') {
    color = '#94a3b8'
  } else {
    color = '#ef4444'
  }

  // Recent ping indicator
  const lastPing = new Date(shark.last_ping)
  const hoursAgo = (Date.now() - lastPing.getTime()) / (1000 * 60 * 60)
  const isRecent = hoursAgo < 24

  return L.divIcon({
    html: `
      <div class="shark-marker-container" style="position: relative;">
        ${statusRing}

        <!-- Main marker -->
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
          font-size: ${baseSize * 0.6}px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 3;
          ${isSelected ? 'transform: scale(1.2);' : ''}
        ">${icon}</div>

        <!-- Species label -->
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
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          z-index: 4;
        ">${shark.name}</div>

        <!-- Recent ping indicator -->
        ${isRecent ? `
          <div style="
            position: absolute;
            top: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #10b981;
            border: 2px solid white;
            animation: recentPing 1.5s ease-in-out infinite;
            z-index: 5;
          "></div>
        ` : ''}
      </div>
    `,
    className: 'custom-shark-icon',
    iconSize: [baseSize + 20, baseSize + 40],
    iconAnchor: [(baseSize + 20) / 2, (baseSize + 40) / 2]
  })
}

// Movement vector arrow
const createMovementVector = (shark: SharkMovementData) => {
  if (!shark.movementVector) return null

  const { speed, direction } = shark.movementVector
  if (speed < 0.5) return null // Only show for significant movement

  const arrowSize = Math.min(20 + speed * 5, 40)
  const rotation = direction

  return L.divIcon({
    html: `
      <div style="
        width: ${arrowSize}px;
        height: ${arrowSize}px;
        transform: rotate(${rotation}deg);
        transition: all 0.5s ease;
      ">
        <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L22 12L12 22L2 12L12 2Z" fill="#3b82f6" stroke="white" stroke-width="2" opacity="0.8"/>
          <circle cx="12" cy="12" r="3" fill="white"/>
        </svg>
      </div>
    `,
    className: 'movement-vector',
    iconSize: [arrowSize, arrowSize],
    iconAnchor: [arrowSize / 2, arrowSize / 2]
  })
}

const SharkTrackingLayer: React.FC<SharkTrackingLayerProps> = ({
  layer,
  onFeatureSelect,
  performanceMode,
  bounds
}) => {
  const [sharks, setSharks] = useState<SharkMovementData[]>([])
  const [selectedSharkId, setSelectedSharkId] = useState<string | null>(null)
  const [showTracks, setShowTracks] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const map = useMap()

  // Load shark data
  useEffect(() => {
    const loadSharks = async () => {
      setIsLoading(true)
      try {
        const sharkData = await OCEARCHService.getTrackedSharks()

        // Enhanced data with movement calculations
        const enhancedSharks: SharkMovementData[] = await Promise.all(
          sharkData.map(async (shark) => {
            let enhanced: SharkMovementData = { ...shark }

            try {
              // Get movement track for active sharks
              if (shark.status === 'Active' && !performanceMode) {
                const track = await OCEARCHService.getSharkTrack(shark.id, 7)
                enhanced.track = track

                // Calculate movement vector
                if (track.length >= 2) {
                  const recent = track.slice(-2)
                  const movement = calculateMovementVector(recent[0], recent[1])
                  enhanced.movementVector = movement
                }
              }
            } catch (error) {
              console.warn(`Failed to load track for ${shark.name}:`, error)
            }

            return enhanced
          })
        )

        setSharks(enhancedSharks)
      } catch (error) {
        console.error('Failed to load shark data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSharks()

    // Refresh interval for real-time updates
    const interval = setInterval(loadSharks, layer.refreshInterval || 300000)
    return () => clearInterval(interval)
  }, [layer.refreshInterval, performanceMode])

  // Filter sharks based on bounds for performance
  const visibleSharks = useMemo(() => {
    if (!bounds || performanceMode) return sharks

    return sharks.filter(shark =>
      shark.lat >= bounds.south &&
      shark.lat <= bounds.north &&
      shark.lon >= bounds.west &&
      shark.lon <= bounds.east
    )
  }, [sharks, bounds, performanceMode])

  // Group sharks by species for better organization
  const sharksBySpecies = useMemo(() => {
    const grouped: Record<string, SharkMovementData[]> = {}

    visibleSharks.forEach(shark => {
      const species = shark.species
      if (!grouped[species]) {
        grouped[species] = []
      }
      grouped[species].push(shark)
    })

    return grouped
  }, [visibleSharks])

  // Handle shark selection
  const handleSharkClick = useCallback((shark: SharkMovementData) => {
    setSelectedSharkId(shark.id === selectedSharkId ? null : shark.id)
    onFeatureSelect({
      type: 'shark',
      data: shark,
      coordinates: [shark.lat, shark.lon]
    })
  }, [selectedSharkId, onFeatureSelect])

  // Calculate movement vector between two points
  const calculateMovementVector = (point1: SharkTrackPoint, point2: SharkTrackPoint) => {
    const timeDiff = new Date(point2.timestamp).getTime() - new Date(point1.timestamp).getTime()
    const hoursElapsed = timeDiff / (1000 * 60 * 60)

    if (hoursElapsed <= 0) return { speed: 0, direction: 0, distance: 0 }

    // Calculate distance using Haversine formula
    const R = 6371
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLon = (point2.lon - point1.lon) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    // Calculate speed and direction
    const speed = distance / hoursElapsed
    const direction = Math.atan2(
      Math.sin((point2.lon - point1.lon) * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180),
      Math.cos(point1.lat * Math.PI / 180) * Math.sin(point2.lat * Math.PI / 180) -
      Math.sin(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
      Math.cos((point2.lon - point1.lon) * Math.PI / 180)
    ) * 180 / Math.PI

    return {
      speed: Math.round(speed * 100) / 100,
      direction: (direction + 360) % 360,
      distance: Math.round(distance * 100) / 100
    }
  }

  // Get track color based on shark status and species
  const getTrackColor = (shark: SharkMovementData) => {
    if (shark.status !== 'Active') return '#94a3b8'

    const species = shark.species.toLowerCase()
    if (species.includes('carcharodon carcharias')) return '#dc2626'
    if (species.includes('galeocerdo cuvier')) return '#f59e0b'
    if (species.includes('rhincodon typus')) return '#059669'
    if (species.includes('sphyrna')) return '#7c3aed'
    return '#3b82f6'
  }

  if (!layer.enabled) return null

  return (
    <>
      {/* Global animations */}
      <style jsx global>{`
        @keyframes activePulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 0.3; }
        }

        @keyframes recentPing {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.6; }
        }

        .shark-marker-container:hover {
          z-index: 1000 !important;
        }

        .custom-shark-icon {
          z-index: 100;
        }

        .movement-vector {
          pointer-events: none;
          z-index: 50;
        }
      `}</style>

      {/* Render sharks by species */}
      {Object.entries(sharksBySpecies).map(([species, speciesSharks]) => (
        <React.Fragment key={species}>
          {speciesSharks.map(shark => (
            <React.Fragment key={shark.id}>
              {/* Main shark marker */}
              <Marker
                position={[shark.lat, shark.lon]}
                icon={createSharkIcon(shark, selectedSharkId === shark.id)}
                eventHandlers={{
                  click: () => handleSharkClick(shark)
                }}
                opacity={layer.opacity}
              >
                <Popup>
                  <div className="shark-popup">
                    <div className="popup-header">
                      <h3>{shark.name}</h3>
                      <span className={`status-badge ${shark.status.toLowerCase()}`}>
                        {shark.status}
                      </span>
                    </div>

                    <div className="shark-details">
                      <div className="detail-row">
                        <span className="label">Species:</span>
                        <span className="value">{shark.species}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Length:</span>
                        <span className="value">{shark.length_m}m</span>
                      </div>
                      {shark.weight_kg && (
                        <div className="detail-row">
                          <span className="label">Weight:</span>
                          <span className="value">{shark.weight_kg}kg</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="label">Last Ping:</span>
                        <span className="value">
                          {new Date(shark.last_ping).toLocaleString()}
                        </span>
                      </div>
                      {shark.water_temp_c && (
                        <div className="detail-row">
                          <span className="label">Water Temp:</span>
                          <span className="value">{shark.water_temp_c}°C</span>
                        </div>
                      )}
                      {shark.depth_m && (
                        <div className="detail-row">
                          <span className="label">Depth:</span>
                          <span className="value">{shark.depth_m}m</span>
                        </div>
                      )}
                      {shark.movementVector && (
                        <div className="detail-row">
                          <span className="label">Speed:</span>
                          <span className="value">{shark.movementVector.speed} km/h</span>
                        </div>
                      )}
                    </div>

                    <div className="popup-footer">
                      <small>Tracked by {shark.tracking_organization}</small>
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* Movement vector indicator */}
              {shark.movementVector && shark.movementVector.speed > 0.5 && (
                <Marker
                  position={[shark.lat, shark.lon]}
                  icon={createMovementVector(shark)!}
                  opacity={layer.opacity * 0.8}
                />
              )}

              {/* Movement track */}
              {showTracks && shark.track && shark.track.length > 1 && (
                <>
                  <Polyline
                    positions={shark.track.map(point => [point.lat, point.lon])}
                    color={getTrackColor(shark)}
                    weight={selectedSharkId === shark.id ? 4 : 2}
                    opacity={selectedSharkId === shark.id ? 0.8 : 0.5}
                    dashArray={shark.status === 'Active' ? undefined : '5, 5'}
                  />

                  {/* Track points for selected shark */}
                  {selectedSharkId === shark.id && shark.track.map((point, index) => (
                    <Circle
                      key={`${shark.id}-track-${index}`}
                      center={[point.lat, point.lon]}
                      radius={500}
                      color={getTrackColor(shark)}
                      fillColor={getTrackColor(shark)}
                      fillOpacity={0.3}
                      weight={1}
                    />
                  ))}
                </>
              )}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}

      {/* Layer controls */}
      <div className="shark-layer-controls">
        <button
          className={`control-button ${showTracks ? 'active' : ''}`}
          onClick={() => setShowTracks(!showTracks)}
          title="Toggle movement tracks"
        >
          📈
        </button>
      </div>

      <style jsx>{`
        .shark-popup {
          min-width: 280px;
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

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .status-badge.active {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.inactive {
          background: #fef3c7;
          color: #92400e;
        }

        .status-badge.lost_signal {
          background: #fee2e2;
          color: #991b1b;
        }

        .shark-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
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

        .popup-footer {
          margin-top: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid #e5e7eb;
          text-align: center;
        }

        .popup-footer small {
          color: #6b7280;
          font-size: 0.75rem;
        }

        .shark-layer-controls {
          position: absolute;
          top: 80px;
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
      `}</style>
    </>
  )
}

export default SharkTrackingLayer