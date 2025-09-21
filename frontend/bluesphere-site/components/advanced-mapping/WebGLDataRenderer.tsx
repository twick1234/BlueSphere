/**
 * WebGL-Accelerated Data Visualization Renderer
 *
 * High-performance WebGL-based rendering system for large oceanographic datasets
 * including heatmaps, particle systems, vector fields, and real-time animations.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export interface WebGLDataLayer {
  id: string
  type: 'heatmap' | 'particles' | 'vectors' | 'contours' | 'mesh'
  data: Float32Array | Uint8Array
  bounds: L.LatLngBounds
  width: number
  height: number
  opacity: number
  visible: boolean
  colorMap: ColorMap
  animation?: AnimationConfig
  blendMode: BlendMode
}

export interface ColorMap {
  name: string
  colors: string[]
  stops: number[]
  interpolation: 'linear' | 'cubic' | 'nearest'
}

export interface AnimationConfig {
  enabled: boolean
  speed: number
  direction: 'forward' | 'backward' | 'pingpong'
  loop: boolean
  currentFrame: number
  totalFrames: number
}

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'add' | 'subtract'

interface WebGLDataRendererProps {
  layers: WebGLDataLayer[]
  canvasWidth: number
  canvasHeight: number
  onRenderComplete?: () => void
  onError?: (error: Error) => void
  className?: string
}

// Shader programs for different visualization types
const SHADER_PROGRAMS = {
  heatmap: {
    vertex: `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform mat3 u_transform;
      varying vec2 v_texCoord;

      void main() {
        vec3 pos = u_transform * vec3(a_position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `,
    fragment: `
      precision mediump float;
      uniform sampler2D u_dataTexture;
      uniform sampler2D u_colorTexture;
      uniform float u_opacity;
      uniform vec2 u_dataRange;
      uniform int u_interpolation;
      varying vec2 v_texCoord;

      vec4 sampleBilinear(sampler2D tex, vec2 coord) {
        vec2 texSize = vec2(textureSize(tex, 0));
        vec2 pixel = coord * texSize - 0.5;
        vec2 f = fract(pixel);
        pixel = floor(pixel) / texSize;

        vec2 step = 1.0 / texSize;
        vec4 c00 = texture2D(tex, pixel);
        vec4 c10 = texture2D(tex, pixel + vec2(step.x, 0.0));
        vec4 c01 = texture2D(tex, pixel + vec2(0.0, step.y));
        vec4 c11 = texture2D(tex, pixel + step);

        vec4 c0 = mix(c00, c10, f.x);
        vec4 c1 = mix(c01, c11, f.x);
        return mix(c0, c1, f.y);
      }

      void main() {
        vec4 dataValue;
        if (u_interpolation == 1) { // Bilinear
          dataValue = sampleBilinear(u_dataTexture, v_texCoord);
        } else { // Nearest
          dataValue = texture2D(u_dataTexture, v_texCoord);
        }

        float normalizedValue = (dataValue.r - u_dataRange.x) / (u_dataRange.y - u_dataRange.x);
        normalizedValue = clamp(normalizedValue, 0.0, 1.0);

        vec4 color = texture2D(u_colorTexture, vec2(normalizedValue, 0.5));
        gl_FragColor = vec4(color.rgb, color.a * u_opacity);
      }
    `
  },

  particles: {
    vertex: `
      attribute vec2 a_position;
      attribute vec2 a_velocity;
      attribute float a_age;
      attribute float a_maxAge;

      uniform mat3 u_transform;
      uniform float u_time;
      uniform float u_pointSize;

      varying float v_normalizedAge;
      varying vec2 v_velocity;

      void main() {
        v_normalizedAge = a_age / a_maxAge;
        v_velocity = a_velocity;

        vec2 pos = a_position + a_velocity * u_time;
        vec3 transformedPos = u_transform * vec3(pos, 1.0);
        gl_Position = vec4(transformedPos.xy, 0.0, 1.0);

        gl_PointSize = u_pointSize * (1.0 - v_normalizedAge * 0.5);
      }
    `,
    fragment: `
      precision mediump float;
      uniform float u_opacity;
      uniform vec3 u_baseColor;
      varying float v_normalizedAge;
      varying vec2 v_velocity;

      void main() {
        vec2 coord = gl_PointCoord * 2.0 - 1.0;
        float dist = length(coord);
        if (dist > 1.0) discard;

        float speed = length(v_velocity);
        vec3 color = u_baseColor + speed * vec3(0.5, 0.2, 0.0);
        float alpha = (1.0 - v_normalizedAge) * (1.0 - dist) * u_opacity;

        gl_FragColor = vec4(color, alpha);
      }
    `
  },

  vectors: {
    vertex: `
      attribute vec2 a_position;
      attribute vec2 a_vector;
      attribute float a_magnitude;

      uniform mat3 u_transform;
      uniform float u_vectorScale;
      uniform int u_renderMode; // 0: arrows, 1: lines

      varying float v_magnitude;

      void main() {
        v_magnitude = a_magnitude;

        vec2 pos = a_position;
        if (u_renderMode == 1) { // Line endpoint
          pos += a_vector * u_vectorScale;
        }

        vec3 transformedPos = u_transform * vec3(pos, 1.0);
        gl_Position = vec4(transformedPos.xy, 0.0, 1.0);
      }
    `,
    fragment: `
      precision mediump float;
      uniform float u_opacity;
      uniform vec3 u_baseColor;
      varying float v_magnitude;

      void main() {
        float intensity = clamp(v_magnitude / 2.0, 0.2, 1.0);
        vec3 color = u_baseColor * intensity;
        gl_FragColor = vec4(color, u_opacity);
      }
    `
  },

  contours: {
    vertex: `
      attribute vec2 a_position;
      attribute float a_value;

      uniform mat3 u_transform;
      uniform float u_contourLevel;
      uniform float u_lineWidth;

      varying float v_distance;

      void main() {
        v_distance = abs(a_value - u_contourLevel);

        vec3 transformedPos = u_transform * vec3(a_position, 1.0);
        gl_Position = vec4(transformedPos.xy, 0.0, 1.0);
      }
    `,
    fragment: `
      precision mediump float;
      uniform float u_opacity;
      uniform vec3 u_lineColor;
      uniform float u_lineWidth;
      varying float v_distance;

      void main() {
        float alpha = 1.0 - smoothstep(0.0, u_lineWidth, v_distance);
        gl_FragColor = vec4(u_lineColor, alpha * u_opacity);
      }
    `
  }
}

// Color map definitions
const COLOR_MAPS: Record<string, ColorMap> = {
  viridis: {
    name: 'Viridis',
    colors: ['#440154', '#31688e', '#35b779', '#fde725'],
    stops: [0, 0.33, 0.66, 1],
    interpolation: 'linear'
  },
  plasma: {
    name: 'Plasma',
    colors: ['#0d0887', '#7e03a8', '#cc4778', '#f89441', '#f0f921'],
    stops: [0, 0.25, 0.5, 0.75, 1],
    interpolation: 'linear'
  },
  temperature: {
    name: 'Temperature',
    colors: ['#0066cc', '#00ccff', '#66ff66', '#ffff00', '#ff6600', '#cc0000'],
    stops: [0, 0.2, 0.4, 0.6, 0.8, 1],
    interpolation: 'linear'
  },
  depth: {
    name: 'Ocean Depth',
    colors: ['#000033', '#000066', '#0033cc', '#66ccff', '#cceeff'],
    stops: [0, 0.25, 0.5, 0.75, 1],
    interpolation: 'linear'
  }
}

// WebGL context and resource manager
class WebGLResourceManager {
  private gl: WebGLRenderingContext
  private programs: Map<string, WebGLProgram> = new Map()
  private textures: Map<string, WebGLTexture> = new Map()
  private buffers: Map<string, WebGLBuffer> = new Map()
  private framebuffers: Map<string, WebGLFramebuffer> = new Map()

  constructor(gl: WebGLRenderingContext) {
    this.gl = gl
    this.initializePrograms()
  }

  private initializePrograms() {
    Object.entries(SHADER_PROGRAMS).forEach(([name, shaders]) => {
      try {
        const program = this.createShaderProgram(shaders.vertex, shaders.fragment)
        this.programs.set(name, program)
      } catch (error) {
        console.error(`Failed to create shader program ${name}:`, error)
      }
    })
  }

  private createShaderProgram(vertexSource: string, fragmentSource: string): WebGLProgram {
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexSource)
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSource)

    const program = this.gl.createProgram()!
    this.gl.attachShader(program, vertexShader)
    this.gl.attachShader(program, fragmentShader)
    this.gl.linkProgram(program)

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program)
      this.gl.deleteProgram(program)
      throw new Error(`Shader program linking failed: ${error}`)
    }

    this.gl.deleteShader(vertexShader)
    this.gl.deleteShader(fragmentShader)

    return program
  }

  private createShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader)
      this.gl.deleteShader(shader)
      throw new Error(`Shader compilation failed: ${error}`)
    }

    return shader
  }

  getProgram(name: string): WebGLProgram | null {
    return this.programs.get(name) || null
  }

  createTexture(id: string, data: ArrayBufferView, width: number, height: number, format = this.gl.LUMINANCE): WebGLTexture {
    let texture = this.textures.get(id)

    if (!texture) {
      texture = this.gl.createTexture()!
      this.textures.set(id, texture)
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, format, this.gl.FLOAT, data)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)

    return texture
  }

  createColorMapTexture(colorMap: ColorMap): WebGLTexture {
    const resolution = 256
    const colorData = new Uint8Array(resolution * 4)

    // Generate color gradient
    for (let i = 0; i < resolution; i++) {
      const t = i / (resolution - 1)
      const color = this.interpolateColor(colorMap, t)

      colorData[i * 4] = color.r
      colorData[i * 4 + 1] = color.g
      colorData[i * 4 + 2] = color.b
      colorData[i * 4 + 3] = color.a
    }

    const textureId = `colormap_${colorMap.name}`
    return this.createColorTexture(textureId, colorData, resolution, 1)
  }

  private createColorTexture(id: string, data: Uint8Array, width: number, height: number): WebGLTexture {
    let texture = this.textures.get(id)

    if (!texture) {
      texture = this.gl.createTexture()!
      this.textures.set(id, texture)
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, data)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE)
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE)

    return texture
  }

  private interpolateColor(colorMap: ColorMap, t: number): {r: number, g: number, b: number, a: number} {
    // Find the two color stops that bracket t
    let lowerIndex = 0
    let upperIndex = colorMap.stops.length - 1

    for (let i = 0; i < colorMap.stops.length - 1; i++) {
      if (t >= colorMap.stops[i] && t <= colorMap.stops[i + 1]) {
        lowerIndex = i
        upperIndex = i + 1
        break
      }
    }

    const lowerStop = colorMap.stops[lowerIndex]
    const upperStop = colorMap.stops[upperIndex]
    const localT = (t - lowerStop) / (upperStop - lowerStop)

    const lowerColor = this.hexToRgb(colorMap.colors[lowerIndex])
    const upperColor = this.hexToRgb(colorMap.colors[upperIndex])

    return {
      r: Math.round(lowerColor.r + (upperColor.r - lowerColor.r) * localT),
      g: Math.round(lowerColor.g + (upperColor.g - lowerColor.g) * localT),
      b: Math.round(lowerColor.b + (upperColor.b - lowerColor.b) * localT),
      a: 255
    }
  }

  private hexToRgb(hex: string): {r: number, g: number, b: number} {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : {r: 0, g: 0, b: 0}
  }

  createBuffer(id: string, data: ArrayBufferView, usage = this.gl.STATIC_DRAW): WebGLBuffer {
    let buffer = this.buffers.get(id)

    if (!buffer) {
      buffer = this.gl.createBuffer()!
      this.buffers.set(id, buffer)
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, usage)

    return buffer
  }

  dispose() {
    this.programs.forEach(program => this.gl.deleteProgram(program))
    this.textures.forEach(texture => this.gl.deleteTexture(texture))
    this.buffers.forEach(buffer => this.gl.deleteBuffer(buffer))
    this.framebuffers.forEach(fb => this.gl.deleteFramebuffer(fb))

    this.programs.clear()
    this.textures.clear()
    this.buffers.clear()
    this.framebuffers.clear()
  }
}

// Layer renderers for different data types
class HeatmapRenderer {
  static render(
    resourceManager: WebGLResourceManager,
    gl: WebGLRenderingContext,
    layer: WebGLDataLayer,
    transform: Float32Array
  ) {
    const program = resourceManager.getProgram('heatmap')
    if (!program) return

    gl.useProgram(program)

    // Create data texture
    const dataTexture = resourceManager.createTexture(
      `${layer.id}_data`,
      layer.data,
      layer.width,
      layer.height
    )

    // Create color map texture
    const colorTexture = resourceManager.createColorMapTexture(layer.colorMap)

    // Create quad vertices
    const vertices = new Float32Array([
      -1, -1, 0, 0,  // Bottom-left
       1, -1, 1, 0,  // Bottom-right
      -1,  1, 0, 1,  // Top-left
       1,  1, 1, 1   // Top-right
    ])

    const vertexBuffer = resourceManager.createBuffer(`${layer.id}_vertices`, vertices)

    // Set up attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)

    const positionLocation = gl.getAttribLocation(program, 'a_position')
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')

    gl.enableVertexAttribArray(positionLocation)
    gl.enableVertexAttribArray(texCoordLocation)

    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0)
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8)

    // Set uniforms
    const transformLocation = gl.getUniformLocation(program, 'u_transform')
    gl.uniformMatrix3fv(transformLocation, false, transform)

    const opacityLocation = gl.getUniformLocation(program, 'u_opacity')
    gl.uniform1f(opacityLocation, layer.opacity)

    const dataRangeLocation = gl.getUniformLocation(program, 'u_dataRange')
    const minValue = Math.min(...Array.from(layer.data as Float32Array))
    const maxValue = Math.max(...Array.from(layer.data as Float32Array))
    gl.uniform2f(dataRangeLocation, minValue, maxValue)

    const interpolationLocation = gl.getUniformLocation(program, 'u_interpolation')
    gl.uniform1i(interpolationLocation, layer.colorMap.interpolation === 'linear' ? 1 : 0)

    // Bind textures
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, dataTexture)
    gl.uniform1i(gl.getUniformLocation(program, 'u_dataTexture'), 0)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, colorTexture)
    gl.uniform1i(gl.getUniformLocation(program, 'u_colorTexture'), 1)

    // Apply blend mode
    HeatmapRenderer.setBlendMode(gl, layer.blendMode)

    // Draw
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  private static setBlendMode(gl: WebGLRenderingContext, mode: BlendMode) {
    gl.enable(gl.BLEND)

    switch (mode) {
      case 'normal':
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        break
      case 'multiply':
        gl.blendFunc(gl.DST_COLOR, gl.ZERO)
        break
      case 'screen':
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR)
        break
      case 'overlay':
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        break
      case 'add':
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
        break
      case 'subtract':
        gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR)
        break
    }
  }
}

// Performance monitoring
class PerformanceMonitor {
  private frameCount = 0
  private lastTime = 0
  private fps = 0
  private renderTime = 0

  startFrame() {
    this.lastTime = performance.now()
  }

  endFrame() {
    const currentTime = performance.now()
    this.renderTime = currentTime - this.lastTime
    this.frameCount++

    if (this.frameCount % 60 === 0) {
      this.fps = Math.round(1000 / this.renderTime)
    }
  }

  getMetrics() {
    return {
      fps: this.fps,
      renderTime: this.renderTime,
      frameCount: this.frameCount
    }
  }
}

export default function WebGLDataRenderer({
  layers,
  canvasWidth,
  canvasHeight,
  onRenderComplete,
  onError,
  className = ''
}: WebGLDataRendererProps) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const resourceManagerRef = useRef<WebGLResourceManager | null>(null)
  const performanceMonitorRef = useRef(new PerformanceMonitor())
  const animationFrameRef = useRef<number>(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Initialize WebGL context and resources
  useEffect(() => {
    if (!canvasRef.current) return

    try {
      const gl = canvasRef.current.getContext('webgl') || canvasRef.current.getContext('experimental-webgl')
      if (!gl || !(gl instanceof WebGLRenderingContext)) {
        throw new Error('WebGL not supported')
      }

      glRef.current = gl
      resourceManagerRef.current = new WebGLResourceManager(gl)

      // Enable required extensions
      gl.getExtension('OES_texture_float')
      gl.getExtension('EXT_blend_minmax')

      setIsInitialized(true)
    } catch (err) {
      const error = err as Error
      setError(error)
      onError?.(error)
    }

    return () => {
      resourceManagerRef.current?.dispose()
    }
  }, [onError])

  // Render loop
  const render = useCallback(() => {
    if (!glRef.current || !resourceManagerRef.current || !isInitialized) return

    const gl = glRef.current
    const resourceManager = resourceManagerRef.current
    const monitor = performanceMonitorRef.current

    monitor.startFrame()

    // Set viewport
    gl.viewport(0, 0, canvasWidth, canvasHeight)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // Calculate transformation matrix
    const bounds = map.getBounds()
    const nw = map.latLngToContainerPoint(bounds.getNorthWest())
    const se = map.latLngToContainerPoint(bounds.getSouthEast())

    const transform = new Float32Array([
      2 / canvasWidth, 0, -1,
      0, -2 / canvasHeight, 1,
      0, 0, 1
    ])

    // Render visible layers in order
    layers
      .filter(layer => layer.visible)
      .sort((a, b) => a.id.localeCompare(b.id)) // Simple ordering, could be improved
      .forEach(layer => {
        try {
          switch (layer.type) {
            case 'heatmap':
              HeatmapRenderer.render(resourceManager, gl, layer, transform)
              break
            // Additional renderers would be implemented here
          }
        } catch (err) {
          console.error(`Error rendering layer ${layer.id}:`, err)
        }
      })

    monitor.endFrame()
    onRenderComplete?.()
  }, [layers, canvasWidth, canvasHeight, map, isInitialized, onRenderComplete])

  // Start render loop
  useEffect(() => {
    if (!isInitialized) return

    const animate = () => {
      render()
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [render, isInitialized])

  // Update canvas size
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = canvasWidth
      canvasRef.current.height = canvasHeight
      canvasRef.current.style.width = `${canvasWidth}px`
      canvasRef.current.style.height = `${canvasHeight}px`
    }
  }, [canvasWidth, canvasHeight])

  if (error) {
    return (
      <div className="webgl-error">
        <p>WebGL Error: {error.message}</p>
        <p>Falling back to canvas rendering...</p>
      </div>
    )
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className={`webgl-data-renderer ${className}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 100
        }}
      />

      {process.env.NODE_ENV === 'development' && (
        <div className="performance-monitor">
          FPS: {performanceMonitorRef.current.getMetrics().fps} |
          Render: {performanceMonitorRef.current.getMetrics().renderTime.toFixed(1)}ms
        </div>
      )}

      <style jsx>{`
        .webgl-data-renderer {
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }

        .webgl-error {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(220, 38, 38, 0.9);
          color: white;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          z-index: 1000;
        }

        .performance-monitor {
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 11px;
          z-index: 1001;
        }
      `}</style>
    </>
  )
}