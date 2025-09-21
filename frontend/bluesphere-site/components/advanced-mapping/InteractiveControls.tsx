/**
 * Interactive Controls for Ocean Mapping
 *
 * Comprehensive control suite including measurement tools, navigation,
 * time controls, coordinate display, and sharing functionality.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { format } from 'date-fns'

export interface MeasurementResult {
  type: 'distance' | 'area' | 'depth-profile'
  value: number
  unit: string
  coordinates: L.LatLng[]
  id: string
}

export interface BookmarkData {
  id: string
  name: string
  description: string
  center: L.LatLng
  zoom: number
  layers: string[]
  timestamp: Date
}

export interface CoordinateFormat {
  type: 'decimal' | 'dms' | 'utm' | 'mgrs'
  precision: number
}

interface InteractiveControlsProps {
  onMeasurement: (result: MeasurementResult) => void
  onBookmark: (bookmark: BookmarkData) => void
  onShare: (shareData: any) => void
  onTimeChange: (time: Date) => void
  currentTime: Date
  timeRange: [Date, Date]
  isDarkMode: boolean
  measurements: MeasurementResult[]
  bookmarks: BookmarkData[]
  className?: string
}

// Measurement tool for calculating distances and areas
class MeasurementTool {
  private map: L.Map
  private drawingLayer: L.LayerGroup
  private currentPath: L.Polyline | L.Polygon | null = null
  private points: L.LatLng[] = []
  private markers: (L.Marker | L.CircleMarker)[] = []
  private mode: 'distance' | 'area' | null = null
  private onComplete: (result: MeasurementResult) => void

  constructor(map: L.Map, onComplete: (result: MeasurementResult) => void) {
    this.map = map
    this.drawingLayer = L.layerGroup().addTo(map)
    this.onComplete = onComplete
  }

  startDistanceMeasurement() {
    this.reset()
    this.mode = 'distance'
    this.map.getContainer().style.cursor = 'crosshair'
    this.map.on('click', this.onMapClick)
    this.map.on('dblclick', this.finishMeasurement)
  }

  startAreaMeasurement() {
    this.reset()
    this.mode = 'area'
    this.map.getContainer().style.cursor = 'crosshair'
    this.map.on('click', this.onMapClick)
    this.map.on('dblclick', this.finishMeasurement)
  }

  private onMapClick = (e: L.LeafletMouseEvent) => {
    this.points.push(e.latlng)

    // Add marker
    const marker = L.circleMarker(e.latlng, {
      radius: 4,
      fillColor: '#ff6b35',
      fillOpacity: 0.8,
      weight: 2,
      color: '#ffffff'
    }).addTo(this.drawingLayer)

    this.markers.push(marker)

    // Update path
    if (this.mode === 'distance') {
      if (this.currentPath) {
        this.drawingLayer.removeLayer(this.currentPath)
      }
      this.currentPath = L.polyline(this.points, {
        color: '#ff6b35',
        weight: 3,
        opacity: 0.8
      }).addTo(this.drawingLayer)
    } else if (this.mode === 'area' && this.points.length >= 3) {
      if (this.currentPath) {
        this.drawingLayer.removeLayer(this.currentPath)
      }
      this.currentPath = L.polygon(this.points, {
        color: '#ff6b35',
        weight: 3,
        opacity: 0.8,
        fillColor: '#ff6b35',
        fillOpacity: 0.2
      }).addTo(this.drawingLayer)
    }

    // Add distance/area labels
    this.updateLabels()
  }

  private updateLabels() {
    if (this.points.length < 2) return

    if (this.mode === 'distance') {
      let totalDistance = 0
      for (let i = 1; i < this.points.length; i++) {
        totalDistance += this.points[i - 1].distanceTo(this.points[i])
      }

      const label = this.formatDistance(totalDistance)
      const midPoint = this.points[Math.floor(this.points.length / 2)]

      L.marker(midPoint, {
        icon: L.divIcon({
          className: 'measurement-label',
          html: `<div class="label-content">${label}</div>`,
          iconSize: [80, 30],
          iconAnchor: [40, 15]
        })
      }).addTo(this.drawingLayer)
    } else if (this.mode === 'area' && this.points.length >= 3) {
      const area = this.calculatePolygonArea(this.points)
      const label = this.formatArea(area)
      const centroid = this.calculateCentroid(this.points)

      L.marker(centroid, {
        icon: L.divIcon({
          className: 'measurement-label',
          html: `<div class="label-content">${label}</div>`,
          iconSize: [100, 30],
          iconAnchor: [50, 15]
        })
      }).addTo(this.drawingLayer)
    }
  }

  private finishMeasurement = () => {
    if (this.points.length < 2) return

    let result: MeasurementResult

    if (this.mode === 'distance') {
      let totalDistance = 0
      for (let i = 1; i < this.points.length; i++) {
        totalDistance += this.points[i - 1].distanceTo(this.points[i])
      }

      result = {
        type: 'distance',
        value: totalDistance,
        unit: totalDistance > 1000 ? 'km' : 'm',
        coordinates: [...this.points],
        id: Date.now().toString()
      }
    } else {
      const area = this.calculatePolygonArea(this.points)
      result = {
        type: 'area',
        value: area,
        unit: area > 1000000 ? 'km²' : 'm²',
        coordinates: [...this.points],
        id: Date.now().toString()
      }
    }

    this.onComplete(result)
    this.stop()
  }

  private calculatePolygonArea(points: L.LatLng[]): number {
    if (points.length < 3) return 0

    // Use the Shoelace formula adapted for geographic coordinates
    let area = 0
    const n = points.length

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const xi = points[i].lng * Math.PI / 180
      const yi = points[i].lat * Math.PI / 180
      const xj = points[j].lng * Math.PI / 180
      const yj = points[j].lat * Math.PI / 180

      area += xi * yj - xj * yi
    }

    area = Math.abs(area) / 2
    // Convert from steradians to square meters (rough approximation)
    return area * 6371000 * 6371000
  }

  private calculateCentroid(points: L.LatLng[]): L.LatLng {
    let lat = 0, lng = 0
    points.forEach(point => {
      lat += point.lat
      lng += point.lng
    })
    return L.latLng(lat / points.length, lng / points.length)
  }

  private formatDistance(distance: number): string {
    if (distance >= 1000) {
      return `${(distance / 1000).toFixed(2)} km`
    }
    return `${distance.toFixed(0)} m`
  }

  private formatArea(area: number): string {
    if (area >= 1000000) {
      return `${(area / 1000000).toFixed(2)} km²`
    }
    return `${area.toFixed(0)} m²`
  }

  stop() {
    this.map.getContainer().style.cursor = ''
    this.map.off('click', this.onMapClick)
    this.map.off('dblclick', this.finishMeasurement)
    this.mode = null
  }

  reset() {
    this.drawingLayer.clearLayers()
    this.points = []
    this.markers = []
    this.currentPath = null
  }

  dispose() {
    this.stop()
    this.reset()
    this.map.removeLayer(this.drawingLayer)
  }
}

// Coordinate utilities
class CoordinateUtils {
  static formatCoordinate(lat: number, lng: number, format: CoordinateFormat): string {
    switch (format.type) {
      case 'decimal':
        return `${lat.toFixed(format.precision)}°, ${lng.toFixed(format.precision)}°`

      case 'dms':
        return `${this.toDMS(lat, 'lat')}, ${this.toDMS(lng, 'lng')}`

      case 'utm':
        return this.toUTM(lat, lng)

      case 'mgrs':
        return this.toMGRS(lat, lng)

      default:
        return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`
    }
  }

  private static toDMS(degree: number, type: 'lat' | 'lng'): string {
    const dir = degree >= 0
      ? (type === 'lat' ? 'N' : 'E')
      : (type === 'lat' ? 'S' : 'W')

    const abs = Math.abs(degree)
    const d = Math.floor(abs)
    const m = Math.floor((abs - d) * 60)
    const s = ((abs - d) * 60 - m) * 60

    return `${d}°${m}'${s.toFixed(2)}"${dir}`
  }

  private static toUTM(lat: number, lng: number): string {
    // Simplified UTM conversion (would need full implementation for production)
    const zone = Math.floor((lng + 180) / 6) + 1
    return `Zone ${zone} (UTM conversion requires full implementation)`
  }

  private static toMGRS(lat: number, lng: number): string {
    // Simplified MGRS conversion (would need full implementation for production)
    return `MGRS conversion requires full implementation`
  }
}

export default function InteractiveControls({
  onMeasurement,
  onBookmark,
  onShare,
  onTimeChange,
  currentTime,
  timeRange,
  isDarkMode,
  measurements,
  bookmarks,
  className = ''
}: InteractiveControlsProps) {
  const map = useMap()
  const measurementToolRef = useRef<MeasurementTool | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'navigate' | 'measure' | 'time' | 'bookmarks'>('navigate')
  const [mouseCoords, setMouseCoords] = useState<L.LatLng | null>(null)
  const [coordinateFormat, setCoordinateFormat] = useState<CoordinateFormat>({
    type: 'decimal',
    precision: 4
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showMeasurements, setShowMeasurements] = useState(true)
  const [bookmarkName, setBookmarkName] = useState('')
  const [bookmarkDescription, setBookmarkDescription] = useState('')

  // Initialize measurement tool
  useEffect(() => {
    if (map && !measurementToolRef.current) {
      measurementToolRef.current = new MeasurementTool(map, onMeasurement)
    }

    return () => {
      measurementToolRef.current?.dispose()
    }
  }, [map, onMeasurement])

  // Track mouse coordinates
  useEffect(() => {
    if (!map) return

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      setMouseCoords(e.latlng)
    }

    map.on('mousemove', handleMouseMove)

    return () => {
      map.off('mousemove', handleMouseMove)
    }
  }, [map])

  // Time animation
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      const newTime = new Date(currentTime.getTime() + (3600000 * playbackSpeed)) // Add hours
      if (newTime <= timeRange[1]) {
        onTimeChange(newTime)
      } else {
        setIsPlaying(false)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, currentTime, timeRange, playbackSpeed, onTimeChange])

  // Handle navigation controls
  const handleZoomIn = useCallback(() => {
    map.zoomIn()
  }, [map])

  const handleZoomOut = useCallback(() => {
    map.zoomOut()
  }, [map])

  const handleResetView = useCallback(() => {
    map.setView([0, 0], 2)
  }, [map])

  const handleFullscreen = useCallback(() => {
    const element = map.getContainer()
    if (!document.fullscreenElement) {
      element.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }, [map])

  // Handle measurement tools
  const startDistanceMeasurement = useCallback(() => {
    measurementToolRef.current?.startDistanceMeasurement()
  }, [])

  const startAreaMeasurement = useCallback(() => {
    measurementToolRef.current?.startAreaMeasurement()
  }, [])

  const clearMeasurements = useCallback(() => {
    measurementToolRef.current?.reset()
  }, [])

  // Handle bookmarks
  const createBookmark = useCallback(() => {
    if (!bookmarkName.trim()) return

    const bookmark: BookmarkData = {
      id: Date.now().toString(),
      name: bookmarkName,
      description: bookmarkDescription,
      center: map.getCenter(),
      zoom: map.getZoom(),
      layers: [], // Would be populated with active layer IDs
      timestamp: new Date()
    }

    onBookmark(bookmark)
    setBookmarkName('')
    setBookmarkDescription('')
  }, [bookmarkName, bookmarkDescription, map, onBookmark])

  const goToBookmark = useCallback((bookmark: BookmarkData) => {
    map.setView(bookmark.center, bookmark.zoom)
  }, [map])

  // Handle sharing
  const shareCurrentView = useCallback(() => {
    const shareData = {
      center: map.getCenter(),
      zoom: map.getZoom(),
      time: currentTime,
      layers: [], // Would include active layers
      url: window.location.href
    }

    onShare(shareData)
  }, [map, currentTime, onShare])

  return (
    <div className={`interactive-controls ${isDarkMode ? 'dark' : 'light'} ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      {/* Toggle Button */}
      <button
        className="controls-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse controls' : 'Expand controls'}
      >
        {isExpanded ? '◀' : '▶'}
      </button>

      {/* Main Controls */}
      {isExpanded && (
        <div className="controls-panel">
          {/* Tab Navigation */}
          <div className="controls-tabs">
            <button
              className={`tab ${activeTab === 'navigate' ? 'active' : ''}`}
              onClick={() => setActiveTab('navigate')}
            >
              🧭 Navigate
            </button>
            <button
              className={`tab ${activeTab === 'measure' ? 'active' : ''}`}
              onClick={() => setActiveTab('measure')}
            >
              📏 Measure
            </button>
            <button
              className={`tab ${activeTab === 'time' ? 'active' : ''}`}
              onClick={() => setActiveTab('time')}
            >
              ⏰ Time
            </button>
            <button
              className={`tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookmarks')}
            >
              📌 Bookmarks
            </button>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* Navigation Tab */}
            {activeTab === 'navigate' && (
              <div className="navigate-panel">
                <div className="control-group">
                  <h4>Map Navigation</h4>
                  <div className="button-grid">
                    <button className="control-btn" onClick={handleZoomIn} title="Zoom In">
                      ➕
                    </button>
                    <button className="control-btn" onClick={handleZoomOut} title="Zoom Out">
                      ➖
                    </button>
                    <button className="control-btn" onClick={handleResetView} title="Reset View">
                      🌍
                    </button>
                    <button className="control-btn" onClick={handleFullscreen} title="Fullscreen">
                      ⛶
                    </button>
                  </div>
                </div>

                <div className="control-group">
                  <h4>Coordinates</h4>
                  <select
                    value={coordinateFormat.type}
                    onChange={(e) => setCoordinateFormat(prev => ({ ...prev, type: e.target.value as any }))}
                    className="format-select"
                  >
                    <option value="decimal">Decimal Degrees</option>
                    <option value="dms">Degrees/Minutes/Seconds</option>
                    <option value="utm">UTM</option>
                    <option value="mgrs">MGRS</option>
                  </select>

                  {mouseCoords && (
                    <div className="coordinates-display">
                      {CoordinateUtils.formatCoordinate(
                        mouseCoords.lat,
                        mouseCoords.lng,
                        coordinateFormat
                      )}
                    </div>
                  )}
                </div>

                <div className="control-group">
                  <h4>Quick Actions</h4>
                  <button className="action-btn" onClick={shareCurrentView}>
                    🔗 Share Current View
                  </button>
                </div>
              </div>
            )}

            {/* Measurement Tab */}
            {activeTab === 'measure' && (
              <div className="measure-panel">
                <div className="control-group">
                  <h4>Measurement Tools</h4>
                  <div className="button-grid">
                    <button className="control-btn" onClick={startDistanceMeasurement} title="Measure Distance">
                      📏 Distance
                    </button>
                    <button className="control-btn" onClick={startAreaMeasurement} title="Measure Area">
                      📐 Area
                    </button>
                    <button className="control-btn" onClick={clearMeasurements} title="Clear All">
                      🗑️ Clear
                    </button>
                  </div>
                </div>

                <div className="control-group">
                  <h4>Measurements ({measurements.length})</h4>
                  <div className="measurements-list">
                    {measurements.map(measurement => (
                      <div key={measurement.id} className="measurement-item">
                        <div className="measurement-type">
                          {measurement.type === 'distance' ? '📏' : '📐'} {measurement.type}
                        </div>
                        <div className="measurement-value">
                          {measurement.value.toFixed(2)} {measurement.unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Time Control Tab */}
            {activeTab === 'time' && (
              <div className="time-panel">
                <div className="control-group">
                  <h4>Time Navigation</h4>
                  <div className="time-display">
                    {format(currentTime, 'yyyy-MM-dd HH:mm')} UTC
                  </div>

                  <input
                    type="range"
                    min={timeRange[0].getTime()}
                    max={timeRange[1].getTime()}
                    value={currentTime.getTime()}
                    onChange={(e) => onTimeChange(new Date(parseInt(e.target.value)))}
                    className="time-slider"
                  />

                  <div className="time-controls">
                    <button
                      className={`play-btn ${isPlaying ? 'playing' : ''}`}
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? '⏸️' : '▶️'}
                    </button>

                    <select
                      value={playbackSpeed}
                      onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                      className="speed-select"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={1}>1x</option>
                      <option value={2}>2x</option>
                      <option value={4}>4x</option>
                      <option value={8}>8x</option>
                    </select>
                  </div>
                </div>

                <div className="control-group">
                  <h4>Quick Times</h4>
                  <div className="quick-times">
                    <button
                      className="time-btn"
                      onClick={() => onTimeChange(new Date())}
                    >
                      Now
                    </button>
                    <button
                      className="time-btn"
                      onClick={() => onTimeChange(new Date(Date.now() - 24 * 60 * 60 * 1000))}
                    >
                      24h ago
                    </button>
                    <button
                      className="time-btn"
                      onClick={() => onTimeChange(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))}
                    >
                      1 week ago
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bookmarks Tab */}
            {activeTab === 'bookmarks' && (
              <div className="bookmarks-panel">
                <div className="control-group">
                  <h4>Create Bookmark</h4>
                  <input
                    type="text"
                    placeholder="Bookmark name"
                    value={bookmarkName}
                    onChange={(e) => setBookmarkName(e.target.value)}
                    className="bookmark-input"
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={bookmarkDescription}
                    onChange={(e) => setBookmarkDescription(e.target.value)}
                    className="bookmark-textarea"
                  />
                  <button
                    className="create-bookmark-btn"
                    onClick={createBookmark}
                    disabled={!bookmarkName.trim()}
                  >
                    💾 Save Location
                  </button>
                </div>

                <div className="control-group">
                  <h4>Saved Bookmarks ({bookmarks.length})</h4>
                  <div className="bookmarks-list">
                    {bookmarks.map(bookmark => (
                      <div key={bookmark.id} className="bookmark-item">
                        <div className="bookmark-info">
                          <div className="bookmark-name">{bookmark.name}</div>
                          <div className="bookmark-coords">
                            {bookmark.center.lat.toFixed(3)}°, {bookmark.center.lng.toFixed(3)}°
                          </div>
                          {bookmark.description && (
                            <div className="bookmark-desc">{bookmark.description}</div>
                          )}
                        </div>
                        <button
                          className="goto-btn"
                          onClick={() => goToBookmark(bookmark)}
                          title="Go to location"
                        >
                          📍
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .interactive-controls {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          background: ${isDarkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 80vh;
          overflow: hidden;
        }

        .interactive-controls.collapsed {
          width: 60px;
        }

        .interactive-controls.expanded {
          width: 320px;
        }

        .controls-toggle {
          position: absolute;
          top: 20px;
          left: 20px;
          background: none;
          border: none;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s;
          font-size: 16px;
          z-index: 1001;
        }

        .controls-toggle:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        .controls-panel {
          padding: 60px 20px 20px;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .controls-tabs {
          display: flex;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          border-radius: 12px;
          padding: 4px;
          margin-bottom: 20px;
          overflow-x: auto;
        }

        .tab {
          flex: 1;
          padding: 8px 6px;
          border: none;
          background: none;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          font-size: 11px;
          font-weight: 500;
          white-space: nowrap;
          min-width: 0;
        }

        .tab.active {
          background: ${isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
          color: ${isDarkMode ? '#60a5fa' : '#3b82f6'};
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
        }

        .control-group {
          margin-bottom: 24px;
        }

        .control-group h4 {
          margin: 0 0 12px 0;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 14px;
          font-weight: 600;
        }

        .button-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .control-btn,
        .action-btn,
        .time-btn,
        .create-bookmark-btn {
          padding: 10px 12px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 8px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
          font-weight: 500;
        }

        .control-btn:hover,
        .action-btn:hover,
        .time-btn:hover,
        .create-bookmark-btn:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'};
          transform: translateY(-1px);
        }

        .action-btn {
          width: 100%;
        }

        .format-select,
        .speed-select {
          width: 100%;
          padding: 8px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 6px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 12px;
          margin-bottom: 8px;
        }

        .coordinates-display {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          padding: 8px;
          border-radius: 6px;
          font-family: 'SF Mono', monospace;
          font-size: 11px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          text-align: center;
        }

        .measurements-list,
        .bookmarks-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .measurement-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .measurement-type {
          font-size: 11px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
        }

        .measurement-value {
          font-size: 12px;
          font-weight: 600;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-family: 'SF Mono', monospace;
        }

        .time-display {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
          padding: 12px;
          border-radius: 8px;
          text-align: center;
          font-family: 'SF Mono', monospace;
          font-size: 14px;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          margin-bottom: 12px;
        }

        .time-slider {
          width: 100%;
          margin-bottom: 12px;
        }

        .time-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .play-btn {
          background: ${isDarkMode ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.1)'};
          border: 1px solid ${isDarkMode ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)'};
          color: ${isDarkMode ? '#4ade80' : '#22c55e'};
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .play-btn.playing {
          background: ${isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)'};
          border-color: ${isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'};
          color: ${isDarkMode ? '#f87171' : '#ef4444'};
        }

        .quick-times {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .time-btn {
          flex: 1;
          min-width: 0;
        }

        .bookmark-input,
        .bookmark-textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 6px;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'white'};
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 12px;
          margin-bottom: 8px;
          resize: vertical;
        }

        .bookmark-textarea {
          height: 60px;
        }

        .create-bookmark-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bookmark-item {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 12px 0;
          border-bottom: 1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .bookmark-info {
          flex: 1;
          min-width: 0;
        }

        .bookmark-name {
          font-weight: 600;
          color: ${isDarkMode ? '#f1f5f9' : '#1e293b'};
          font-size: 13px;
          margin-bottom: 2px;
        }

        .bookmark-coords {
          font-family: 'SF Mono', monospace;
          font-size: 11px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          margin-bottom: 4px;
        }

        .bookmark-desc {
          font-size: 11px;
          color: ${isDarkMode ? '#94a3b8' : '#64748b'};
          line-height: 1.3;
        }

        .goto-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
          font-size: 14px;
        }

        .goto-btn:hover {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
        }

        /* Scrollbar styling */
        .tab-content::-webkit-scrollbar,
        .measurements-list::-webkit-scrollbar,
        .bookmarks-list::-webkit-scrollbar {
          width: 4px;
        }

        .tab-content::-webkit-scrollbar-track,
        .measurements-list::-webkit-scrollbar-track,
        .bookmarks-list::-webkit-scrollbar-track {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
        }

        .tab-content::-webkit-scrollbar-thumb,
        .measurements-list::-webkit-scrollbar-thumb,
        .bookmarks-list::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          border-radius: 2px;
        }

        /* Global measurement label styles */
        :global(.measurement-label) {
          background: none !important;
          border: none !important;
        }

        :global(.measurement-label .label-content) {
          background: rgba(255, 107, 53, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          white-space: nowrap;
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .interactive-controls {
            right: 10px;
          }

          .interactive-controls.expanded {
            width: calc(100vw - 20px);
            max-width: 300px;
          }

          .controls-tabs {
            overflow-x: auto;
          }

          .tab {
            font-size: 10px;
            padding: 6px 4px;
          }
        }
      `}</style>
    </div>
  )
}