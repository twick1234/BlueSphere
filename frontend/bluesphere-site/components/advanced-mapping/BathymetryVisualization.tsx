/**
 * 3D Bathymetry Visualization Component
 *
 * Advanced ocean floor depth visualization with WebGL acceleration,
 * contour lines, elevation profiles, and interactive 3D rendering.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import * as d3 from 'd3'

export interface BathymetryData {
  bounds: L.LatLngBounds
  resolution: number
  depthMatrix: Float32Array // Depth values in meters (negative for below sea level)
  width: number
  height: number
  noDataValue: number
}

export interface BathymetryConfig {
  visible: boolean
  opacity: number
  elevationScale: number
  contourInterval: number
  contourVisible: boolean
  shadingEnabled: boolean
  colorScheme: 'bathymetric' | 'topographic' | 'hypsometric' | 'scientific'
  mode3D: boolean
  verticalExaggeration: number
  illuminationAngle: number
  hillshadeOpacity: number
}

interface BathymetryVisualizationProps {
  data: BathymetryData | null
  config: BathymetryConfig
  onConfigChange: (updates: Partial<BathymetryConfig>) => void
  onDepthQuery: (lat: number, lng: number) => void
  className?: string
}

// Color schemes for bathymetry visualization
const COLOR_SCHEMES = {
  bathymetric: {
    name: 'Bathymetric Blue',
    colors: [
      { depth: -11000, color: '#000033' }, // Hadal zone (deepest trenches)
      { depth: -6000, color: '#000066' },  // Abyssal zone
      { depth: -4000, color: '#0000aa' },  // Abyssal zone
      { depth: -2000, color: '#0033cc' },  // Bathyal zone
      { depth: -1000, color: '#0066ff' },  // Bathyal zone
      { depth: -500, color: '#3399ff' },   // Upper bathyal
      { depth: -200, color: '#66ccff' },   // Continental shelf
      { depth: -50, color: '#99ddff' },    // Shallow water
      { depth: 0, color: '#cceeff' },      // Sea level
      { depth: 100, color: '#654321' },    // Land (brown)
      { depth: 1000, color: '#8b7355' },   // Hills
      { depth: 3000, color: '#a0824a' },   // Mountains
      { depth: 5000, color: '#ffffff' }    // Snow-capped peaks
    ]
  },
  topographic: {
    name: 'Topographic Relief',
    colors: [
      { depth: -11000, color: '#081d58' },
      { depth: -8000, color: '#253494' },
      { depth: -6000, color: '#225ea8' },
      { depth: -4000, color: '#1d91c0' },
      { depth: -2000, color: '#41b6c4' },
      { depth: -500, color: '#7fcdbb' },
      { depth: -50, color: '#c7e9b4' },
      { depth: 0, color: '#edf8d9' },
      { depth: 200, color: '#fef0d9' },
      { depth: 500, color: '#fdcc8a' },
      { depth: 1000, color: '#fc8d59' },
      { depth: 2000, color: '#e34a33' },
      { depth: 4000, color: '#b30000' },
      { depth: 8000, color: '#7f0000' }
    ]
  },
  hypsometric: {
    name: 'Hypsometric Tints',
    colors: [
      { depth: -11000, color: '#0c2c84' },
      { depth: -8000, color: '#225ea8' },
      { depth: -6000, color: '#1d91c0' },
      { depth: -4000, color: '#41b6c4' },
      { depth: -2000, color: '#7fcdbb' },
      { depth: -1000, color: '#c7e9b4' },
      { depth: -200, color: '#edf8d9' },
      { depth: 0, color: '#f7fcb9' },
      { depth: 200, color: '#d9f0a3' },
      { depth: 500, color: '#addd8e' },
      { depth: 1000, color: '#78c679' },
      { depth: 2000, color: '#41ab5d' },
      { depth: 4000, color: '#238443' },
      { depth: 6000, color: '#005a32' }
    ]
  },
  scientific: {
    name: 'Scientific Visualization',
    colors: [
      { depth: -11000, color: '#440154' },
      { depth: -8000, color: '#414487' },
      { depth: -6000, color: '#2a788e' },
      { depth: -4000, color: '#22a884' },
      { depth: -2000, color: '#7ad151' },
      { depth: -500, color: '#fde725' },
      { depth: 0, color: '#ffffff' },
      { depth: 500, color: '#fde725' },
      { depth: 1500, color: '#7ad151' },
      { depth: 3000, color: '#22a884' },
      { depth: 5000, color: '#2a788e' },
      { depth: 7000, color: '#414487' },
      { depth: 9000, color: '#440154' }
    ]
  }
}

// WebGL bathymetry renderer for performance
class BathymetryRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram | null = null
  private depthTexture: WebGLTexture | null = null
  private colorTexture: WebGLTexture | null = null
  private vertexBuffer: WebGLBuffer | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    if (!gl) {
      throw new Error('WebGL not supported')
    }
    this.gl = gl as WebGLRenderingContext
    this.initializeShaders()
  }

  private initializeShaders() {
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      uniform mat3 u_transform;

      void main() {
        vec3 pos = u_transform * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      uniform sampler2D u_depthTexture;
      uniform sampler2D u_colorTexture;
      uniform float u_opacity;
      uniform float u_elevationScale;
      uniform vec2 u_depthRange;
      uniform bool u_shadingEnabled;
      uniform float u_illuminationAngle;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;

      vec3 calculateNormal(vec2 coord, float scale) {
        float texelSize = 1.0 / max(u_resolution.x, u_resolution.y);

        float depthL = texture2D(u_depthTexture, coord - vec2(texelSize, 0.0)).r;
        float depthR = texture2D(u_depthTexture, coord + vec2(texelSize, 0.0)).r;
        float depthU = texture2D(u_depthTexture, coord - vec2(0.0, texelSize)).r;
        float depthD = texture2D(u_depthTexture, coord + vec2(0.0, texelSize)).r;

        vec3 normal = normalize(vec3(
          (depthL - depthR) * scale,
          (depthU - depthD) * scale,
          2.0 * texelSize
        ));

        return normal;
      }

      void main() {
        float depth = texture2D(u_depthTexture, v_texCoord).r;

        // Normalize depth to color texture coordinate
        float normalizedDepth = (depth - u_depthRange.x) / (u_depthRange.y - u_depthRange.x);
        normalizedDepth = clamp(normalizedDepth, 0.0, 1.0);

        // Get base color
        vec4 color = texture2D(u_colorTexture, vec2(normalizedDepth, 0.5));

        // Apply hillshading if enabled
        if (u_shadingEnabled) {
          vec3 normal = calculateNormal(v_texCoord, u_elevationScale);
          vec3 lightDir = normalize(vec3(
            cos(u_illuminationAngle),
            sin(u_illuminationAngle),
            0.5
          ));

          float hillshade = max(0.2, dot(normal, lightDir));
          color.rgb *= hillshade;
        }

        gl_FragColor = vec4(color.rgb, color.a * u_opacity);
      }
    `

    this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource)
    this.createVertexBuffer()
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

  private createVertexBuffer() {
    const vertices = new Float32Array([
      -1, -1, 0, 0,  // Bottom-left
       1, -1, 1, 0,  // Bottom-right
      -1,  1, 0, 1,  // Top-left
       1,  1, 1, 1   // Top-right
    ])

    this.vertexBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)
  }

  updateDepthTexture(data: BathymetryData) {
    if (!this.depthTexture) {
      this.depthTexture = this.gl.createTexture()
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.LUMINANCE,
      data.width,
      data.height,
      0,
      this.gl.LUMINANCE,
      this.gl.FLOAT,
      data.depthMatrix
    )

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
  }

  updateColorTexture(colorScheme: keyof typeof COLOR_SCHEMES) {
    const scheme = COLOR_SCHEMES[colorScheme]
    const resolution = 256
    const colorData = new Uint8Array(resolution * 4)

    if (!scheme.colors || scheme.colors.length === 0) {
      return // Early return if no colors available
    }

    const minDepth = Math.min(...scheme.colors.map(c => c.depth))
    const maxDepth = Math.max(...scheme.colors.map(c => c.depth))

    for (let i = 0; i < resolution; i++) {
      const depth = minDepth + (maxDepth - minDepth) * (i / (resolution - 1))

      // Find surrounding color stops
      let lowerStop = scheme.colors[0]
      let upperStop = scheme.colors[scheme.colors.length - 1]

      if (!lowerStop || !upperStop) {
        continue // Skip this iteration if no stops available
      }

      for (let j = 0; j < scheme.colors.length - 1; j++) {
        const currentColor = scheme.colors[j];
        const nextColor = scheme.colors[j + 1];
        if (currentColor && nextColor && depth >= currentColor.depth && depth <= nextColor.depth) {
          lowerStop = currentColor
          upperStop = nextColor
          break
        }
      }

      // Interpolate color
      const t = (depth - lowerStop.depth) / (upperStop.depth - lowerStop.depth)
      const lowerColor = d3.color(lowerStop.color)!.rgb()
      const upperColor = d3.color(upperStop.color)!.rgb()

      const r = Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * t)
      const g = Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * t)
      const b = Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * t)

      colorData[i * 4] = r
      colorData[i * 4 + 1] = g
      colorData[i * 4 + 2] = b
      colorData[i * 4 + 3] = 255
    }

    if (!this.colorTexture) {
      this.colorTexture = this.gl.createTexture()
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTexture)
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      resolution,
      1,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      colorData
    )

    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)
  }

  render(data: BathymetryData, config: BathymetryConfig, transform: number[]) {
    if (!this.program || !data) return

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)

    this.gl.useProgram(this.program)

    // Bind vertex buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer)

    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position')
    const texCoordLocation = this.gl.getAttribLocation(this.program, 'a_texCoord')

    this.gl.enableVertexAttribArray(positionLocation)
    this.gl.enableVertexAttribArray(texCoordLocation)

    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0)
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8)

    // Set uniforms
    const transformLocation = this.gl.getUniformLocation(this.program, 'u_transform')
    this.gl.uniformMatrix3fv(transformLocation, false, transform)

    const opacityLocation = this.gl.getUniformLocation(this.program, 'u_opacity')
    this.gl.uniform1f(opacityLocation, config.opacity)

    const elevationScaleLocation = this.gl.getUniformLocation(this.program, 'u_elevationScale')
    this.gl.uniform1f(elevationScaleLocation, config.elevationScale)

    const depthRangeLocation = this.gl.getUniformLocation(this.program, 'u_depthRange')
    const minDepth = Math.min(...Array.from(data.depthMatrix))
    const maxDepth = Math.max(...Array.from(data.depthMatrix))
    this.gl.uniform2f(depthRangeLocation, minDepth, maxDepth)

    const shadingLocation = this.gl.getUniformLocation(this.program, 'u_shadingEnabled')
    this.gl.uniform1i(shadingLocation, config.shadingEnabled ? 1 : 0)

    const illuminationLocation = this.gl.getUniformLocation(this.program, 'u_illuminationAngle')
    this.gl.uniform1f(illuminationLocation, config.illuminationAngle * Math.PI / 180)

    const resolutionLocation = this.gl.getUniformLocation(this.program, 'u_resolution')
    this.gl.uniform2f(resolutionLocation, data.width, data.height)

    // Bind textures
    this.gl.activeTexture(this.gl.TEXTURE0)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.depthTexture)
    this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'u_depthTexture'), 0)

    this.gl.activeTexture(this.gl.TEXTURE1)
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.colorTexture)
    this.gl.uniform1i(this.gl.getUniformLocation(this.program, 'u_colorTexture'), 1)

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
  }

  dispose() {
    if (this.depthTexture) this.gl.deleteTexture(this.depthTexture)
    if (this.colorTexture) this.gl.deleteTexture(this.colorTexture)
    if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer)
    if (this.program) this.gl.deleteProgram(this.program)
  }
}

// Contour line generator using D3
class ContourGenerator {
  static generateContours(data: BathymetryData, interval: number): GeoJSON.FeatureCollection {
    const { depthMatrix, width, height, bounds } = data

    // Create grid data for D3 contours
    const gridData = []
    for (let j = 0; j < height; j++) {
      for (let i = 0; i < width; i++) {
        gridData.push(depthMatrix[j * width + i])
      }
    }

    // Generate contour lines
    const contours = d3.contours()
      .size([width, height])
      .thresholds(d3.range(-10000, 5000, interval))

    const contourFeatures = contours(gridData).map((contour, index) => {
      // Transform coordinates from grid space to geographic coordinates
      const coordinates = contour.coordinates.map(ring =>
        ring.map(polygon =>
          polygon.map(([x, y]) => {
            const lng = bounds.getWest() + (x / width) * (bounds.getEast() - bounds.getWest())
            const lat = bounds.getNorth() - (y / height) * (bounds.getNorth() - bounds.getSouth())
            return [lng, lat]
          })
        )
      )

      return {
        type: 'Feature' as const,
        properties: {
          depth: contour.value,
          level: index
        },
        geometry: {
          type: 'MultiPolygon' as const,
          coordinates
        }
      }
    })

    return {
      type: 'FeatureCollection',
      features: contourFeatures
    }
  }
}

export default function BathymetryVisualization({
  data,
  config,
  onConfigChange,
  onDepthQuery,
  className = ''
}: BathymetryVisualizationProps) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<BathymetryRenderer | null>(null)
  const contourLayerRef = useRef<L.GeoJSON | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize WebGL renderer
  useEffect(() => {
    if (canvasRef.current && !rendererRef.current) {
      try {
        rendererRef.current = new BathymetryRenderer(canvasRef.current)
        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize bathymetry renderer:', error)
      }
    }

    return () => {
      rendererRef.current?.dispose()
    }
  }, [])

  // Update color texture when color scheme changes
  useEffect(() => {
    if (rendererRef.current && isInitialized) {
      rendererRef.current.updateColorTexture(config.colorScheme)
    }
  }, [config.colorScheme, isInitialized])

  // Update depth texture when data changes
  useEffect(() => {
    if (rendererRef.current && data && isInitialized) {
      rendererRef.current.updateDepthTexture(data)
    }
  }, [data, isInitialized])

  // Generate and display contour lines
  useEffect(() => {
    if (!map || !data || !config.contourVisible) {
      if (contourLayerRef.current) {
        map.removeLayer(contourLayerRef.current)
        contourLayerRef.current = null
      }
      return
    }

    const contours = ContourGenerator.generateContours(data, config.contourInterval)

    const contourLayer = L.geoJSON(contours, {
      style: (feature) => ({
        color: feature?.properties.depth < 0 ? '#0066cc' : '#8b4513',
        weight: Math.abs(feature?.properties.depth) % (config.contourInterval * 5) === 0 ? 2 : 1,
        opacity: 0.7,
        fill: false
      }),
      onEachFeature: (feature, layer) => {
        layer.bindTooltip(
          `Depth: ${feature.properties.depth}m`,
          { permanent: false, direction: 'top' }
        )
      }
    })

    if (contourLayerRef.current) {
      map.removeLayer(contourLayerRef.current)
    }

    contourLayerRef.current = contourLayer
    contourLayer.addTo(map)

    return () => {
      if (contourLayerRef.current) {
        map.removeLayer(contourLayerRef.current)
      }
    }
  }, [map, data, config.contourVisible, config.contourInterval])

  // Handle map events and rendering
  const updateRender = useCallback(() => {
    if (!rendererRef.current || !data || !canvasRef.current || !config.visible) return

    const canvas = canvasRef.current
    const mapSize = map.getSize()
    const bounds = map.getBounds()

    // Update canvas size
    canvas.width = mapSize.x
    canvas.height = mapSize.y
    canvas.style.width = `${mapSize.x}px`
    canvas.style.height = `${mapSize.y}px`

    // Calculate transformation matrix
    const nw = map.latLngToContainerPoint(bounds.getNorthWest())
    const se = map.latLngToContainerPoint(bounds.getSouthEast())
    const dataBounds = data.bounds
    const dataNW = map.latLngToContainerPoint(dataBounds.getNorthWest())
    const dataSE = map.latLngToContainerPoint(dataBounds.getSouthEast())

    const scaleX = (dataSE.x - dataNW.x) / mapSize.x
    const scaleY = (dataSE.y - dataNW.y) / mapSize.y
    const translateX = (dataNW.x - nw.x) / mapSize.x * 2
    const translateY = (dataNW.y - nw.y) / mapSize.y * 2

    const transform = [
      scaleX, 0, translateX,
      0, scaleY, translateY,
      0, 0, 1
    ]

    rendererRef.current.render(data, config, transform)
  }, [map, data, config])

  // Set up map event listeners
  useEffect(() => {
    if (!map || !isInitialized) return

    const handleMapUpdate = () => updateRender()

    map.on('zoom move zoomend moveend', handleMapUpdate)
    updateRender() // Initial render

    return () => {
      map.off('zoom move zoomend moveend', handleMapUpdate)
    }
  }, [map, updateRender, isInitialized])

  // Handle depth queries on click
  useEffect(() => {
    if (!map || !data) return

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng

      // Check if click is within data bounds
      if (data.bounds.contains(e.latlng)) {
        // Calculate grid coordinates
        const bounds = data.bounds
        const x = Math.floor(((lng - bounds.getWest()) / (bounds.getEast() - bounds.getWest())) * data.width)
        const y = Math.floor(((bounds.getNorth() - lat) / (bounds.getNorth() - bounds.getSouth())) * data.height)

        if (x >= 0 && x < data.width && y >= 0 && y < data.height) {
          const depth = data.depthMatrix[y * data.width + x]
          onDepthQuery(lat, lng)

          // Show depth popup
          L.popup()
            .setLatLng(e.latlng)
            .setContent(`
              <div class="bathymetry-popup">
                <h4>Ocean Depth</h4>
                <p><strong>Depth:</strong> ${Math.abs(depth).toFixed(1)}m ${depth < 0 ? 'below sea level' : 'above sea level'}</p>
                <p><strong>Coordinates:</strong> ${lat.toFixed(4)}°, ${lng.toFixed(4)}°</p>
              </div>
            `)
            .openOn(map)
        }
      }
    }

    map.on('click', handleMapClick)

    return () => {
      map.off('click', handleMapClick)
    }
  }, [map, data, onDepthQuery])

  if (!config.visible) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`bathymetry-canvas ${className}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: config.mode3D ? 1000 : 100,
          opacity: config.opacity
        }}
      />

      <style jsx>{`
        .bathymetry-canvas {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          image-rendering: pixelated;
        }

        :global(.bathymetry-popup) {
          text-align: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        :global(.bathymetry-popup h4) {
          margin: 0 0 12px 0;
          color: #1e293b;
          font-size: 14px;
          font-weight: 600;
        }

        :global(.bathymetry-popup p) {
          margin: 8px 0;
          font-size: 12px;
          color: #475569;
        }

        :global(.bathymetry-popup strong) {
          color: #1e293b;
        }
      `}</style>
    </>
  )
}