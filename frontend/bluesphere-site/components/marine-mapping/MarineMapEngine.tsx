/*
 * BlueSphere Marine Mapping Engine
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Comprehensive Google Maps-style layered mapping interface for marine monitoring
 * Supports shark tracking, marine protected areas, temperature data, and more
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, LayersControl, ScaleControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import dynamic from 'next/dynamic'

// Import components
import SharkTrackingLayer from './SharkTrackingLayer'
import MarineProtectedAreasLayer from './MarineProtectedAreasLayer'

// Types
export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MarineMapLayer {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  opacity: number
  category: 'tracking' | 'environmental' | 'conservation' | 'infrastructure'
  dataSource: string
  refreshInterval?: number
}

export interface MarineMapState {
  center: [number, number]
  zoom: number
  bounds?: MapBounds
  selectedFeature: any | null
  activePopup: any | null
  isLoading: boolean
  darkMode: boolean
  fullscreen: boolean
  performanceMode: boolean
}

export interface MarineMapEngineProps {
  initialCenter?: [number, number]
  initialZoom?: number
  className?: string
  onLayerChange?: (layers: MarineMapLayer[]) => void
  onFeatureSelect?: (feature: any) => void
  onBoundsChange?: (bounds: MapBounds) => void
  enablePerformanceMode?: boolean
  maxZoom?: number
  minZoom?: number
}

// Default layers configuration
const DEFAULT_LAYERS: MarineMapLayer[] = [
  {
    id: 'shark-tracking',
    name: 'Shark Tracking',
    description: 'Real-time tagged shark locations and movement patterns',
    icon: '🦈',
    enabled: true,
    opacity: 1.0,
    category: 'tracking',
    dataSource: 'OCEARCH + Global Shark Networks',
    refreshInterval: 300000 // 5 minutes
  },
  {
    id: 'marine-protected-areas',
    name: 'Marine Protected Areas',
    description: 'Designated conservation and no-take zones',
    icon: '🛡️',
    enabled: true,
    opacity: 0.7,
    category: 'conservation',
    dataSource: 'Marine Protected Areas Database'
  },
  {
    id: 'ocean-temperature',
    name: 'Sea Surface Temperature',
    description: 'Real-time ocean temperature data and anomalies',
    icon: '🌡️',
    enabled: false,
    opacity: 0.6,
    category: 'environmental',
    dataSource: 'NOAA SST Analysis',
    refreshInterval: 3600000 // 1 hour
  },
  {
    id: 'conservation-zones',
    name: 'Conservation Zones',
    description: 'Critical habitats and breeding areas',
    icon: '🐠',
    enabled: false,
    opacity: 0.8,
    category: 'conservation',
    dataSource: 'IUCN Red List Habitats'
  },
  {
    id: 'research-stations',
    name: 'Research Stations',
    description: 'Marine research facilities and monitoring stations',
    icon: '🔬',
    enabled: false,
    opacity: 1.0,
    category: 'infrastructure',
    dataSource: 'Global Ocean Observing System'
  },
  {
    id: 'shipping-routes',
    name: 'Shipping Routes',
    description: 'Major commercial shipping lanes and traffic',
    icon: '🚢',
    enabled: false,
    opacity: 0.5,
    category: 'infrastructure',
    dataSource: 'Automatic Identification System (AIS)'
  }
]

// Fix Leaflet default markers for Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  })
}

// Map event handler component
function MapEventHandler({
  onBoundsChange,
  onMapReady
}: {
  onBoundsChange?: (bounds: MapBounds) => void
  onMapReady?: (map: L.Map) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (onMapReady) {
      onMapReady(map)
    }

    const handleMoveEnd = () => {
      if (onBoundsChange) {
        const bounds = map.getBounds()
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        })
      }
    }

    map.on('moveend', handleMoveEnd)
    handleMoveEnd() // Initial bounds

    return () => {
      map.off('moveend', handleMoveEnd)
    }
  }, [map, onBoundsChange, onMapReady])

  return null
}

const MarineMapEngine: React.FC<MarineMapEngineProps> = ({
  initialCenter = [0, 0],
  initialZoom = 3,
  className = '',
  onLayerChange,
  onFeatureSelect,
  onBoundsChange,
  enablePerformanceMode = false,
  maxZoom = 18,
  minZoom = 2
}) => {
  // State management
  const [mapState, setMapState] = useState<MarineMapState>({
    center: initialCenter,
    zoom: initialZoom,
    selectedFeature: null,
    activePopup: null,
    isLoading: false,
    darkMode: false,
    fullscreen: false,
    performanceMode: enablePerformanceMode
  })

  const [layers, setLayers] = useState<MarineMapLayer[]>(DEFAULT_LAYERS)
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Memoized active layers for performance
  const activeLayers = useMemo(() =>
    layers.filter(layer => layer.enabled),
    [layers]
  )

  // Layer management
  const updateLayer = useCallback((layerId: string, updates: Partial<MarineMapLayer>) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    ))
  }, [])

  const toggleLayer = useCallback((layerId: string, enabled?: boolean) => {
    updateLayer(layerId, {
      enabled: enabled !== undefined ? enabled : !layers.find(l => l.id === layerId)?.enabled
    })
  }, [layers, updateLayer])

  // Map controls
  const toggleDarkMode = useCallback(() => {
    setMapState(prev => ({ ...prev, darkMode: !prev.darkMode }))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen()
      setMapState(prev => ({ ...prev, fullscreen: true }))
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
      setMapState(prev => ({ ...prev, fullscreen: false }))
    }
  }, [])

  const togglePerformanceMode = useCallback(() => {
    setMapState(prev => ({ ...prev, performanceMode: !prev.performanceMode }))
  }, [])

  // Feature selection
  const handleFeatureSelect = useCallback((feature: any) => {
    setMapState(prev => ({
      ...prev,
      selectedFeature: feature,
      activePopup: feature
    }))
    onFeatureSelect?.(feature)
  }, [onFeatureSelect])

  const clearSelection = useCallback(() => {
    setMapState(prev => ({
      ...prev,
      selectedFeature: null,
      activePopup: null
    }))
  }, [])

  // Quick layer presets
  const applyLayerPreset = useCallback((preset: string) => {
    switch (preset) {
      case 'tracking':
        setLayers(prev => prev.map(layer => ({
          ...layer,
          enabled: ['shark-tracking', 'research-stations'].includes(layer.id)
        })))
        break
      case 'conservation':
        setLayers(prev => prev.map(layer => ({
          ...layer,
          enabled: ['marine-protected-areas', 'conservation-zones', 'shark-tracking'].includes(layer.id)
        })))
        break
      case 'environmental':
        setLayers(prev => prev.map(layer => ({
          ...layer,
          enabled: ['ocean-temperature', 'shark-tracking', 'research-stations'].includes(layer.id)
        })))
        break
      case 'maritime':
        setLayers(prev => prev.map(layer => ({
          ...layer,
          enabled: ['shipping-routes', 'research-stations'].includes(layer.id)
        })))
        break
      case 'all':
        setLayers(prev => prev.map(layer => ({ ...layer, enabled: true })))
        break
      case 'clear':
        setLayers(prev => prev.map(layer => ({ ...layer, enabled: false })))
        break
    }
  }, [])

  // Notify parent of layer changes
  useEffect(() => {
    onLayerChange?.(layers)
  }, [layers, onLayerChange])

  // Performance optimization - reduce update frequency
  const debouncedBoundsChange = useCallback(
    debounce((bounds: MapBounds) => onBoundsChange?.(bounds), 200),
    [onBoundsChange]
  )

  return (
    <div
      ref={containerRef}
      className={`marine-map-engine ${mapState.fullscreen ? 'fullscreen' : ''} ${mapState.darkMode ? 'dark' : ''} ${className}`}
    >
      {/* Map Container */}
      <MapContainer
        center={mapState.center}
        zoom={mapState.zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* Base Tile Layers */}
        <LayersControl position="topright">
          {/* Ocean-focused tile layers */}
          <LayersControl.BaseLayer checked={!mapState.darkMode} name="Ocean Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              opacity={0.8}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer checked={mapState.darkMode} name="Dark Ocean">
            <TileLayer
              url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
              opacity={0.9}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Nautical Chart">
            <TileLayer
              url="https://tileservice.charts.noaa.gov/tiles/50000_1/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.charts.noaa.gov/">NOAA</a>'
              maxZoom={16}
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Bathymetry">
            <TileLayer
              url="https://services.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* Marine Data Layers */}
        {activeLayers.map(layer => {
          const LayerComponent = getLayerComponent(layer.id)
          return LayerComponent ? (
            <LayerComponent
              key={layer.id}
              layer={layer}
              onFeatureSelect={handleFeatureSelect}
              performanceMode={mapState.performanceMode}
              bounds={mapState.bounds}
            />
          ) : null
        })}

        {/* Map Scale */}
        <ScaleControl position="bottomleft" />

        {/* Event Handlers */}
        <MapEventHandler
          onBoundsChange={debouncedBoundsChange}
          onMapReady={setMapInstance}
        />
      </MapContainer>

      {/* Layer Controls Panel */}
      {/* <MarineLayerControls
        layers={layers}
        onLayerToggle={toggleLayer}
        onLayerUpdate={updateLayer}
        onPresetApply={applyLayerPreset}
        darkMode={mapState.darkMode}
        performanceMode={mapState.performanceMode}
      /> */}

      {/* Map Controls */}
      {/* <MarineMapControls
        darkMode={mapState.darkMode}
        fullscreen={mapState.fullscreen}
        performanceMode={mapState.performanceMode}
        onToggleDarkMode={toggleDarkMode}
        onToggleFullscreen={toggleFullscreen}
        onTogglePerformanceMode={togglePerformanceMode}
        onClearSelection={clearSelection}
        hasSelection={!!mapState.selectedFeature}
      />

      {/* Feature Popup */}
      {mapState.activePopup && (
        <MarinePopupEngine
          feature={mapState.activePopup}
          onClose={clearSelection}
          darkMode={mapState.darkMode}
        />
      )}

      {/* Loading Overlay */}
      {mapState.isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading marine data...</p>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .marine-map-engine {
          position: relative;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .marine-map-engine.dark {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }

        .marine-map-engine.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          border-radius: 0;
        }

        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          color: white;
        }

        .loading-spinner {
          width: 60px;
          height: 60px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Leaflet customizations */
        :global(.leaflet-container) {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        :global(.leaflet-control-layers) {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        :global(.marine-map-engine.dark .leaflet-control-layers) {
          background: rgba(30, 41, 59, 0.95);
          color: white;
        }

        :global(.leaflet-control-scale) {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-radius: 4px;
          border: none;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        :global(.marine-map-engine.dark .leaflet-control-scale) {
          background: rgba(30, 41, 59, 0.9);
          color: white;
        }

        @media (max-width: 768px) {
          .marine-map-engine {
            border-radius: 8px;
          }
        }
      `}</style>
    </div>
  )
}

// Helper function to get layer component
function getLayerComponent(layerId: string): React.ComponentType<any> | null {
  const layerComponents: Record<string, React.ComponentType<any>> = {
    'shark-tracking': SharkTrackingLayer,
    'marine-protected-areas': MarineProtectedAreasLayer,
    'ocean-temperature': OceanTemperatureLayer,
    'conservation-zones': ConservationZonesLayer,
    'research-stations': ResearchStationsLayer,
    'shipping-routes': ShippingRoutesLayer
  }

  return layerComponents[layerId] || null
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export default MarineMapEngine