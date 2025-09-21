/**
 * BlueSphere Advanced Ocean Mapping Engine
 *
 * A sophisticated layered mapping interface inspired by Google Maps but optimized for ocean data.
 * Features multi-layer data visualization, 3D bathymetry, real-time data streaming,
 * and advanced performance optimization.
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import * as d3 from 'd3'

// Advanced layer management types
export interface LayerDefinition {
  id: string
  name: string
  description: string
  icon: string
  type: 'raster' | 'vector' | 'point' | 'heatmap' | 'bathymetry' | 'flow'
  dataSource: string
  updateFrequency: 'realtime' | 'hourly' | 'daily' | 'static'
  renderMode: 'canvas' | 'webgl' | 'svg' | 'tiles'
  opacity: number
  visible: boolean
  zIndex: number
  minZoom: number
  maxZoom: number
  blendMode: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light'
  customProps?: Record<string, any>
}

export interface LayerHierarchy {
  base: LayerDefinition[]
  ocean: LayerDefinition[]
  environmental: LayerDefinition[]
  biological: LayerDefinition[]
  human: LayerDefinition[]
  temporal: LayerDefinition[]
}

export interface MapState {
  center: [number, number]
  zoom: number
  bounds: L.LatLngBounds | null
  currentTime: Date
  timeRange: [Date, Date]
  animationSpeed: number
  isAnimating: boolean
  measurementMode: 'distance' | 'area' | 'depth' | null
  bookmark: string | null
}

export interface PerformanceConfig {
  levelOfDetail: boolean
  dataDecimation: boolean
  webglAcceleration: boolean
  cacheSize: number
  streamingBuffer: number
  renderThrottle: number
}

interface OceanMapEngineProps {
  layers: LayerHierarchy
  mapState: MapState
  performanceConfig: PerformanceConfig
  onLayerUpdate: (layerId: string, updates: Partial<LayerDefinition>) => void
  onMapStateChange: (updates: Partial<MapState>) => void
  onDataRequest: (layerId: string, bounds: L.LatLngBounds, zoom: number) => Promise<any>
  className?: string
}

// Default layer definitions optimized for ocean data
export const DEFAULT_OCEAN_LAYERS: LayerHierarchy = {
  base: [
    {
      id: 'ocean_base',
      name: 'Ocean Base Map',
      description: 'High-resolution bathymetric base map',
      icon: '🌊',
      type: 'raster',
      dataSource: 'GEBCO 2023 Bathymetric Grid',
      updateFrequency: 'static',
      renderMode: 'tiles',
      opacity: 1.0,
      visible: true,
      zIndex: 1,
      minZoom: 0,
      maxZoom: 18,
      blendMode: 'normal'
    },
    {
      id: 'satellite_overlay',
      name: 'Satellite Imagery',
      description: 'Recent satellite imagery overlay',
      icon: '🛰️',
      type: 'raster',
      dataSource: 'Sentinel-2 L2A',
      updateFrequency: 'daily',
      renderMode: 'tiles',
      opacity: 0.6,
      visible: false,
      zIndex: 2,
      minZoom: 0,
      maxZoom: 18,
      blendMode: 'overlay'
    }
  ],
  ocean: [
    {
      id: 'bathymetry_3d',
      name: '3D Bathymetry',
      description: 'Three-dimensional ocean floor visualization',
      icon: '🏔️',
      type: 'bathymetry',
      dataSource: 'GEBCO + NOAA Multi-beam',
      updateFrequency: 'static',
      renderMode: 'webgl',
      opacity: 0.8,
      visible: true,
      zIndex: 10,
      minZoom: 3,
      maxZoom: 18,
      blendMode: 'normal',
      customProps: {
        elevationScale: 50,
        shadingEnabled: true,
        contourLines: true
      }
    },
    {
      id: 'sea_surface_temp',
      name: 'Sea Surface Temperature',
      description: 'Real-time SST from global monitoring network',
      icon: '🌡️',
      type: 'heatmap',
      dataSource: 'GHRSST L4 Analysis',
      updateFrequency: 'hourly',
      renderMode: 'webgl',
      opacity: 0.7,
      visible: true,
      zIndex: 15,
      minZoom: 0,
      maxZoom: 12,
      blendMode: 'overlay',
      customProps: {
        colorScale: 'temperature',
        interpolation: 'bilinear',
        contourLines: false
      }
    },
    {
      id: 'ocean_currents',
      name: 'Ocean Current Vectors',
      description: 'Surface current velocity and direction',
      icon: '🌀',
      type: 'flow',
      dataSource: 'OSCAR Surface Currents',
      updateFrequency: 'hourly',
      renderMode: 'webgl',
      opacity: 0.8,
      visible: false,
      zIndex: 20,
      minZoom: 2,
      maxZoom: 10,
      blendMode: 'normal',
      customProps: {
        vectorDensity: 'medium',
        animationSpeed: 1.0,
        colorByVelocity: true,
        maxVelocity: 2.0
      }
    },
    {
      id: 'temp_anomalies',
      name: 'Temperature Anomalies',
      description: 'Deviation from climatological averages',
      icon: '📊',
      type: 'heatmap',
      dataSource: 'OISST Anomaly Analysis',
      updateFrequency: 'daily',
      renderMode: 'webgl',
      opacity: 0.6,
      visible: false,
      zIndex: 16,
      minZoom: 0,
      maxZoom: 12,
      blendMode: 'overlay',
      customProps: {
        colorScale: 'diverging',
        centralValue: 0,
        anomalyThreshold: 2.0
      }
    }
  ],
  environmental: [
    {
      id: 'marine_heatwaves',
      name: 'Marine Heatwave Events',
      description: 'Active and historical marine heatwave boundaries',
      icon: '🔥',
      type: 'vector',
      dataSource: 'Real-time MHW Detection Algorithm',
      updateFrequency: 'daily',
      renderMode: 'canvas',
      opacity: 0.7,
      visible: false,
      zIndex: 25,
      minZoom: 0,
      maxZoom: 18,
      blendMode: 'normal',
      customProps: {
        intensity: 'all',
        historical: false,
        animation: true
      }
    },
    {
      id: 'chlorophyll_a',
      name: 'Chlorophyll-a Concentration',
      description: 'Ocean productivity and phytoplankton biomass',
      icon: '🟢',
      type: 'heatmap',
      dataSource: 'MODIS-Aqua Level 3',
      updateFrequency: 'daily',
      renderMode: 'webgl',
      opacity: 0.6,
      visible: false,
      zIndex: 17,
      minZoom: 0,
      maxZoom: 12,
      blendMode: 'multiply',
      customProps: {
        logScale: true,
        bloomThreshold: 10.0
      }
    },
    {
      id: 'ocean_ph',
      name: 'Ocean pH Levels',
      description: 'Ocean acidification monitoring',
      icon: '⚗️',
      type: 'point',
      dataSource: 'Global Ocean Acidification Network',
      updateFrequency: 'hourly',
      renderMode: 'canvas',
      opacity: 0.9,
      visible: false,
      zIndex: 30,
      minZoom: 2,
      maxZoom: 18,
      blendMode: 'normal',
      customProps: {
        clustering: true,
        interpolation: false
      }
    }
  ],
  biological: [
    {
      id: 'marine_protected_areas',
      name: 'Marine Protected Areas',
      description: 'Conservation zones and sanctuary boundaries',
      icon: '🛡️',
      type: 'vector',
      dataSource: 'World Database on Protected Areas',
      updateFrequency: 'static',
      renderMode: 'canvas',
      opacity: 0.5,
      visible: false,
      zIndex: 12,
      minZoom: 0,
      maxZoom: 18,
      blendMode: 'normal',
      customProps: {
        fillPattern: 'diagonal-lines',
        borderStyle: 'dashed'
      }
    },
    {
      id: 'wildlife_tracking',
      name: 'Marine Wildlife Tracking',
      description: 'Real-time tagged animal locations',
      icon: '🐋',
      type: 'point',
      dataSource: 'Animal Telemetry Network',
      updateFrequency: 'realtime',
      renderMode: 'canvas',
      opacity: 0.9,
      visible: false,
      zIndex: 35,
      minZoom: 0,
      maxZoom: 18,
      blendMode: 'normal',
      customProps: {
        species: 'all',
        trails: true,
        clustering: false
      }
    },
    {
      id: 'coral_reef_health',
      name: 'Coral Reef Health Index',
      description: 'Bleaching alerts and reef condition monitoring',
      icon: '🪸',
      type: 'point',
      dataSource: 'Global Coral Reef Monitoring Network',
      updateFrequency: 'daily',
      renderMode: 'canvas',
      opacity: 0.8,
      visible: false,
      zIndex: 28,
      minZoom: 3,
      maxZoom: 18,
      blendMode: 'normal',
      customProps: {
        healthThreshold: 0.5,
        bleachingAlerts: true
      }
    }
  ],
  human: [
    {
      id: 'shipping_density',
      name: 'Maritime Traffic Density',
      description: 'Commercial shipping lane intensity',
      icon: '🚢',
      type: 'heatmap',
      dataSource: 'AIS Global Shipping Database',
      updateFrequency: 'hourly',
      renderMode: 'webgl',
      opacity: 0.6,
      visible: false,
      zIndex: 18,
      minZoom: 0,
      maxZoom: 12,
      blendMode: 'overlay',
      customProps: {
        vesselTypes: 'all',
        timeWindow: '24h'
      }
    },
    {
      id: 'pollution_sources',
      name: 'Pollution Point Sources',
      description: 'Industrial discharge and pollution monitoring',
      icon: '☣️',
      type: 'point',
      dataSource: 'Global Pollution Monitoring Consortium',
      updateFrequency: 'daily',
      renderMode: 'canvas',
      opacity: 0.9,
      visible: false,
      zIndex: 32,
      minZoom: 2,
      maxZoom: 18,
      blendMode: 'normal',
      customProps: {
        pollutantTypes: 'all',
        severity: 'medium'
      }
    },
    {
      id: 'oil_spill_risk',
      name: 'Oil Spill Risk Areas',
      description: 'Environmental vulnerability assessment',
      icon: '🛢️',
      type: 'vector',
      dataSource: 'Environmental Risk Assessment Model',
      updateFrequency: 'static',
      renderMode: 'canvas',
      opacity: 0.4,
      visible: false,
      zIndex: 14,
      minZoom: 0,
      maxZoom: 18,
      blendMode: 'multiply'
    }
  ],
  temporal: [
    {
      id: 'historical_comparison',
      name: 'Historical Data Comparison',
      description: 'Multi-year trend analysis overlay',
      icon: '📈',
      type: 'heatmap',
      dataSource: 'Long-term Ocean Observatory',
      updateFrequency: 'static',
      renderMode: 'webgl',
      opacity: 0.5,
      visible: false,
      zIndex: 19,
      minZoom: 0,
      maxZoom: 12,
      blendMode: 'multiply',
      customProps: {
        comparisonPeriod: '10y',
        metric: 'temperature'
      }
    },
    {
      id: 'seasonal_patterns',
      name: 'Seasonal Climatology',
      description: 'Long-term seasonal patterns and cycles',
      icon: '🔄',
      type: 'heatmap',
      dataSource: 'Climatological Atlas',
      updateFrequency: 'static',
      renderMode: 'webgl',
      opacity: 0.4,
      visible: false,
      zIndex: 8,
      minZoom: 0,
      maxZoom: 10,
      blendMode: 'soft-light'
    }
  ]
}

// WebGL-accelerated layer renderer
class WebGLLayerRenderer {
  private gl: WebGLRenderingContext
  private programs: Map<string, WebGLProgram> = new Map()
  private buffers: Map<string, WebGLBuffer> = new Map()
  private textures: Map<string, WebGLTexture> = new Map()

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      throw new Error('WebGL not supported')
    }
    this.gl = gl as WebGLRenderingContext
    this.initializeShaders()
  }

  private initializeShaders() {
    // Heatmap shader program
    const heatmapVertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;

      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `

    const heatmapFragmentShader = `
      precision mediump float;
      uniform sampler2D u_dataTexture;
      uniform sampler2D u_colorTexture;
      uniform float u_opacity;
      uniform vec2 u_dataRange;
      varying vec2 v_texCoord;

      void main() {
        float value = texture2D(u_dataTexture, v_texCoord).r;
        float normalized = (value - u_dataRange.x) / (u_dataRange.y - u_dataRange.x);
        vec4 color = texture2D(u_colorTexture, vec2(normalized, 0.5));
        gl_FragColor = vec4(color.rgb, color.a * u_opacity);
      }
    `

    // Flow field shader program
    const flowVertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_velocity;
      uniform float u_time;
      uniform float u_particleSpeed;
      varying vec2 v_velocity;

      void main() {
        vec2 pos = a_position + a_velocity * u_time * u_particleSpeed;
        gl_Position = vec4(pos, 0.0, 1.0);
        v_velocity = a_velocity;
      }
    `

    const flowFragmentShader = `
      precision mediump float;
      uniform float u_opacity;
      varying vec2 v_velocity;

      void main() {
        float speed = length(v_velocity);
        vec3 color = mix(vec3(0.0, 0.2, 0.8), vec3(0.8, 0.2, 0.0), speed / 2.0);
        gl_FragColor = vec4(color, u_opacity);
      }
    `

    this.programs.set('heatmap', this.createShaderProgram(heatmapVertexShader, heatmapFragmentShader))
    this.programs.set('flow', this.createShaderProgram(flowVertexShader, flowFragmentShader))
  }

  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource)

    const program = this.gl.createProgram()!
    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      throw new Error('Failed to link shader program')
    }

    return program
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error('Failed to compile shader: ' + this.gl.getShaderInfoLog(shader))
    }

    return shader
  }

  renderHeatmap(layer: LayerDefinition, data: Float32Array, bounds: L.LatLngBounds) {
    const program = this.programs.get('heatmap')!
    this.gl.useProgram(program)

    // Update data texture
    const dataTexture = this.updateDataTexture(layer.id, data)

    // Render heatmap
    this.gl.bindTexture(this.gl.TEXTURE_2D, dataTexture)
    this.gl.uniform1f(this.gl.getUniformLocation(program, 'u_opacity'), layer.opacity)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6)
  }

  renderFlow(layer: LayerDefinition, velocityData: Float32Array) {
    const program = this.programs.get('flow')!
    this.gl.useProgram(program)

    // Render flow field with particle animation
    this.gl.uniform1f(this.gl.getUniformLocation(program, 'u_time'), Date.now() / 1000)
    this.gl.uniform1f(this.gl.getUniformLocation(program, 'u_opacity'), layer.opacity)
    this.gl.drawArrays(this.gl.POINTS, 0, velocityData.length / 2)
  }

  private updateDataTexture(layerId: string, data: Float32Array): WebGLTexture {
    let texture = this.textures.get(layerId)

    if (!texture) {
      texture = this.gl.createTexture()!
      this.textures.set(layerId, texture)
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.LUMINANCE,
      Math.sqrt(data.length),
      Math.sqrt(data.length),
      0,
      this.gl.LUMINANCE,
      this.gl.FLOAT,
      data
    )

    return texture
  }

  dispose() {
    // Clean up WebGL resources
    this.programs.forEach(program => this.gl.deleteProgram(program))
    this.buffers.forEach(buffer => this.gl.deleteBuffer(buffer))
    this.textures.forEach(texture => this.gl.deleteTexture(texture))
  }
}

// Performance-optimized data cache
class LayerDataCache {
  private cache: Map<string, any> = new Map()
  private accessTimes: Map<string, number> = new Map()
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  get(key: string): any {
    this.accessTimes.set(key, Date.now())
    return this.cache.get(key)
  }

  set(key: string, data: any): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(key, data)
    this.accessTimes.set(key, Date.now())
  }

  has(key: string): boolean {
    return this.cache.has(key)
  }

  private evictLRU(): void {
    let oldestKey = ''
    let oldestTime = Infinity

    this.accessTimes.forEach((time, key) => {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.accessTimes.delete(oldestKey)
    }
  }

  clear(): void {
    this.cache.clear()
    this.accessTimes.clear()
  }
}

export default function OceanMapEngine({
  layers,
  mapState,
  performanceConfig,
  onLayerUpdate,
  onMapStateChange,
  onDataRequest,
  className = ''
}: OceanMapEngineProps) {
  const mapRef = useRef<L.Map>(null)
  const webglRenderer = useRef<WebGLLayerRenderer | null>(null)
  const dataCache = useRef(new LayerDataCache(performanceConfig.cacheSize))
  const [isInitialized, setIsInitialized] = useState(false)

  // All visible layers sorted by z-index
  const visibleLayers = useMemo(() => {
    const allLayers = [
      ...layers.base,
      ...layers.ocean,
      ...layers.environmental,
      ...layers.biological,
      ...layers.human,
      ...layers.temporal
    ]

    return allLayers
      .filter(layer => layer.visible)
      .sort((a, b) => a.zIndex - b.zIndex)
  }, [layers])

  // Initialize WebGL renderer
  useEffect(() => {
    if (performanceConfig.webglAcceleration && !webglRenderer.current) {
      try {
        const canvas = document.createElement('canvas')
        webglRenderer.current = new WebGLLayerRenderer(canvas)
      } catch (error) {
        console.warn('WebGL initialization failed, falling back to canvas rendering', error)
      }
    }
  }, [performanceConfig.webglAcceleration])

  // Layer data loading with caching
  const loadLayerData = useCallback(async (layer: LayerDefinition, bounds: L.LatLngBounds, zoom: number) => {
    const cacheKey = `${layer.id}_${bounds.toBBoxString()}_${zoom}`

    if (dataCache.current.has(cacheKey)) {
      return dataCache.current.get(cacheKey)
    }

    try {
      const data = await onDataRequest(layer.id, bounds, zoom)
      dataCache.current.set(cacheKey, data)
      return data
    } catch (error) {
      console.error(`Failed to load data for layer ${layer.id}:`, error)
      return null
    }
  }, [onDataRequest])

  // Performance-optimized render loop
  const renderLayers = useCallback(() => {
    if (!mapRef.current || !isInitialized) return

    const map = mapRef.current
    const bounds = map.getBounds()
    const zoom = map.getZoom()

    visibleLayers.forEach(async (layer) => {
      // Skip if layer is outside zoom range
      if (zoom < layer.minZoom || zoom > layer.maxZoom) return

      // Apply level-of-detail optimization
      if (performanceConfig.levelOfDetail) {
        const lodZoom = Math.max(layer.minZoom, Math.min(layer.maxZoom, Math.floor(zoom)))
        if (lodZoom !== zoom && zoom - lodZoom > 2) {
          // Use lower resolution data for distant zoom levels
          return
        }
      }

      const layerData = await loadLayerData(layer, bounds, zoom)
      if (!layerData) return

      // Render based on layer type and performance settings
      if (layer.renderMode === 'webgl' && webglRenderer.current) {
        if (layer.type === 'heatmap') {
          webglRenderer.current.renderHeatmap(layer, layerData, bounds)
        } else if (layer.type === 'flow') {
          webglRenderer.current.renderFlow(layer, layerData)
        }
      }
    })
  }, [visibleLayers, isInitialized, performanceConfig, loadLayerData])

  // Throttled render updates
  useEffect(() => {
    let renderTimeout: NodeJS.Timeout

    const throttledRender = () => {
      clearTimeout(renderTimeout)
      renderTimeout = setTimeout(renderLayers, performanceConfig.renderThrottle)
    }

    if (mapRef.current && isInitialized) {
      const map = mapRef.current
      map.on('moveend zoomend', throttledRender)

      return () => {
        map.off('moveend zoomend', throttledRender)
        clearTimeout(renderTimeout)
      }
    }
  }, [renderLayers, isInitialized, performanceConfig.renderThrottle])

  // Map initialization
  const handleMapReady = useCallback(() => {
    setIsInitialized(true)
    renderLayers()
  }, [renderLayers])

  // Cleanup
  useEffect(() => {
    return () => {
      webglRenderer.current?.dispose()
      dataCache.current.clear()
    }
  }, [])

  return (
    <div className={`ocean-map-engine ${className}`}>
      <MapContainer
        center={mapState.center}
        zoom={mapState.zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
        whenReady={handleMapReady}
        zoomControl={false}
        attributionControl={false}
        preferCanvas={!performanceConfig.webglAcceleration}
        renderer={performanceConfig.webglAcceleration ? L.canvas() : undefined}
      >
        {/* Base layer tiles */}
        {visibleLayers
          .filter(layer => layer.type === 'raster' && layer.renderMode === 'tiles')
          .map(layer => (
            <TileLayer
              key={layer.id}
              url={layer.dataSource}
              opacity={layer.opacity}
              zIndex={layer.zIndex}
            />
          ))
        }
      </MapContainer>

      <style jsx>{`
        .ocean-map-engine {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #0f172a;
        }

        .ocean-map-engine .leaflet-container {
          background: linear-gradient(180deg, #0c4a6e 0%, #1e3a8a 50%, #0f172a 100%);
        }

        .ocean-map-engine .leaflet-tile-pane {
          filter: contrast(1.1) brightness(0.9);
        }

        .ocean-map-engine .leaflet-overlay-pane {
          mix-blend-mode: normal;
        }
      `}</style>
    </div>
  )
}