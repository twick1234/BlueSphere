/**
 * Ocean Current Flow Visualization
 *
 * Advanced vector field visualization for ocean currents with animated particles,
 * WebGL acceleration, and real-time flow dynamics.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

export interface CurrentData {
  bounds: L.LatLngBounds
  resolution: number
  uVelocity: Float32Array // East-west velocity component (m/s)
  vVelocity: Float32Array // North-south velocity component (m/s)
  magnitude: Float32Array // Current speed magnitude (m/s)
  width: number
  height: number
  timestamp: Date
}

export interface FlowConfig {
  visible: boolean
  opacity: number
  vectorDensity: 'low' | 'medium' | 'high' | 'ultra'
  particleCount: number
  particleSpeed: number
  particleLife: number
  colorByVelocity: boolean
  colorScheme: 'velocity' | 'direction' | 'temperature' | 'rainbow'
  animationSpeed: number
  showVectors: boolean
  showParticles: boolean
  vectorScale: number
  fadeEffect: boolean
  streamlines: boolean
}

interface OceanCurrentFlowProps {
  data: CurrentData | null
  config: FlowConfig
  onConfigChange: (updates: Partial<FlowConfig>) => void
  className?: string
}

// Particle system for animated flow visualization
class FlowParticle {
  x: number
  y: number
  age: number
  maxAge: number
  vx: number = 0
  vy: number = 0
  speed: number = 0
  opacity: number = 1

  constructor(x: number, y: number, maxAge: number) {
    this.x = x
    this.y = y
    this.age = 0
    this.maxAge = maxAge
  }

  update(velocityField: CurrentData, dt: number, speedMultiplier: number) {
    if (!velocityField) return false

    // Sample velocity at particle position
    const { uVelocity, vVelocity, magnitude, width, height, bounds } = velocityField

    // Convert particle position to grid coordinates
    const gridX = Math.floor(((this.x - bounds.getWest()) / (bounds.getEast() - bounds.getWest())) * width)
    const gridY = Math.floor(((bounds.getNorth() - this.y) / (bounds.getNorth() - bounds.getSouth())) * height)

    if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
      const index = gridY * width + gridX
      this.vx = uVelocity[index] || 0
      this.vy = -vVelocity[index] || 0 // Negative because screen Y is inverted
      this.speed = magnitude[index] || 0

      // Update position
      this.x += this.vx * dt * speedMultiplier
      this.y += this.vy * dt * speedMultiplier

      // Update age and opacity
      this.age += dt
      this.opacity = Math.max(0, 1 - (this.age / this.maxAge))

      return this.age < this.maxAge
    }

    return false // Kill particle if outside bounds
  }

  draw(ctx: CanvasRenderingContext2D, map: L.Map, config: FlowConfig) {
    if (this.opacity <= 0) return

    const point = map.latLngToContainerPoint([this.y, this.x])

    ctx.save()
    ctx.globalAlpha = this.opacity * config.opacity

    if (config.colorByVelocity) {
      const hue = Math.min(240, Math.max(0, 240 - (this.speed * 50)))
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
    } else {
      ctx.fillStyle = '#00ccff'
    }

    ctx.beginPath()
    ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2)
    ctx.fill()

    // Draw trail if enabled
    if (config.fadeEffect && this.speed > 0.1) {
      const trailLength = Math.min(20, this.speed * 10)
      const trailEnd = map.latLngToContainerPoint([
        this.y - this.vy * trailLength,
        this.x - this.vx * trailLength
      ])

      ctx.strokeStyle = config.colorByVelocity
        ? `hsla(${Math.min(240, Math.max(0, 240 - (this.speed * 50)))}, 70%, 60%, ${this.opacity * 0.5})`
        : `rgba(0, 204, 255, ${this.opacity * 0.5})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(point.x, point.y)
      ctx.lineTo(trailEnd.x, trailEnd.y)
      ctx.stroke()
    }

    ctx.restore()
  }
}

// WebGL-accelerated flow field renderer
class FlowFieldRenderer {
  private canvas: HTMLCanvasElement
  private gl: WebGLRenderingContext
  private program: WebGLProgram | null = null
  private particleBuffer: WebGLBuffer | null = null
  private velocityTexture: WebGLTexture | null = null

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
      attribute vec2 a_velocity;
      attribute float a_age;
      attribute float a_maxAge;

      uniform mat3 u_transform;
      uniform float u_time;
      uniform float u_particleSpeed;

      varying vec2 v_velocity;
      varying float v_normalizedAge;

      void main() {
        v_velocity = a_velocity;
        v_normalizedAge = a_age / a_maxAge;

        vec2 position = a_position + a_velocity * u_time * u_particleSpeed;
        vec3 pos = u_transform * vec3(position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);
        gl_PointSize = 3.0 * (1.0 - v_normalizedAge);
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_opacity;
      uniform bool u_colorByVelocity;
      varying vec2 v_velocity;
      varying float v_normalizedAge;

      void main() {
        float speed = length(v_velocity);
        float alpha = (1.0 - v_normalizedAge) * u_opacity;

        vec3 color;
        if (u_colorByVelocity) {
          float hue = 240.0 - min(240.0, speed * 50.0);
          // Simple HSL to RGB conversion for blue to red gradient
          color = mix(vec3(0.0, 0.2, 0.8), vec3(0.8, 0.2, 0.0), speed / 2.0);
        } else {
          color = vec3(0.0, 0.8, 1.0);
        }

        // Circular particle shape
        vec2 coord = gl_PointCoord * 2.0 - 1.0;
        float dist = length(coord);
        if (dist > 1.0) discard;

        gl_FragColor = vec4(color, alpha * (1.0 - dist));
      }
    `

    this.program = this.createShaderProgram(vertexShaderSource, fragmentShaderSource)
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

  updateParticles(particles: FlowParticle[]) {
    const particleData = new Float32Array(particles.length * 6) // x, y, vx, vy, age, maxAge

    particles.forEach((particle, i) => {
      const offset = i * 6
      particleData[offset] = particle.x
      particleData[offset + 1] = particle.y
      particleData[offset + 2] = particle.vx
      particleData[offset + 3] = particle.vy
      particleData[offset + 4] = particle.age
      particleData[offset + 5] = particle.maxAge
    })

    if (!this.particleBuffer) {
      this.particleBuffer = this.gl.createBuffer()
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, particleData, this.gl.DYNAMIC_DRAW)
  }

  render(particles: FlowParticle[], config: FlowConfig, transform: number[]) {
    if (!this.program || particles.length === 0) return

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    this.gl.enable(this.gl.BLEND)
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

    this.gl.useProgram(this.program)

    // Bind particle buffer
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.particleBuffer)

    // Set up vertex attributes
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position')
    const velocityLocation = this.gl.getAttribLocation(this.program, 'a_velocity')
    const ageLocation = this.gl.getAttribLocation(this.program, 'a_age')
    const maxAgeLocation = this.gl.getAttribLocation(this.program, 'a_maxAge')

    this.gl.enableVertexAttribArray(positionLocation)
    this.gl.enableVertexAttribArray(velocityLocation)
    this.gl.enableVertexAttribArray(ageLocation)
    this.gl.enableVertexAttribArray(maxAgeLocation)

    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 24, 0)
    this.gl.vertexAttribPointer(velocityLocation, 2, this.gl.FLOAT, false, 24, 8)
    this.gl.vertexAttribPointer(ageLocation, 1, this.gl.FLOAT, false, 24, 16)
    this.gl.vertexAttribPointer(maxAgeLocation, 1, this.gl.FLOAT, false, 24, 20)

    // Set uniforms
    const transformLocation = this.gl.getUniformLocation(this.program, 'u_transform')
    this.gl.uniformMatrix3fv(transformLocation, false, transform)

    const timeLocation = this.gl.getUniformLocation(this.program, 'u_time')
    this.gl.uniform1f(timeLocation, Date.now() / 1000)

    const speedLocation = this.gl.getUniformLocation(this.program, 'u_particleSpeed')
    this.gl.uniform1f(speedLocation, config.particleSpeed)

    const opacityLocation = this.gl.getUniformLocation(this.program, 'u_opacity')
    this.gl.uniform1f(opacityLocation, config.opacity)

    const colorByVelocityLocation = this.gl.getUniformLocation(this.program, 'u_colorByVelocity')
    this.gl.uniform1i(colorByVelocityLocation, config.colorByVelocity ? 1 : 0)

    // Draw particles
    this.gl.drawArrays(this.gl.POINTS, 0, particles.length)
  }

  dispose() {
    if (this.particleBuffer) this.gl.deleteBuffer(this.particleBuffer)
    if (this.velocityTexture) this.gl.deleteTexture(this.velocityTexture)
    if (this.program) this.gl.deleteProgram(this.program)
  }
}

// Vector field renderer for showing current directions
class VectorRenderer {
  static drawVectors(
    ctx: CanvasRenderingContext2D,
    map: L.Map,
    data: CurrentData,
    config: FlowConfig
  ) {
    if (!config.showVectors || !data) return

    const { uVelocity, vVelocity, magnitude, width, height, bounds } = data
    const densityMap = {
      low: 8,
      medium: 6,
      high: 4,
      ultra: 2
    }
    const step = densityMap[config.vectorDensity]

    ctx.save()
    ctx.globalAlpha = config.opacity
    ctx.lineWidth = 1
    ctx.lineCap = 'round'

    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const index = y * width + x
        const u = uVelocity[index]
        const v = vVelocity[index]
        const speed = magnitude[index]

        if (speed < 0.05) continue // Skip very slow currents

        // Convert grid to geographic coordinates
        const lng = bounds.getWest() + (x / width) * (bounds.getEast() - bounds.getWest())
        const lat = bounds.getNorth() - (y / height) * (bounds.getNorth() - bounds.getSouth())

        // Convert to screen coordinates
        const point = map.latLngToContainerPoint([lat, lng])

        // Calculate vector end point
        const vectorLength = Math.min(50, speed * config.vectorScale * 20)
        const angle = Math.atan2(-v, u) // Negative v because screen Y is inverted

        const endX = point.x + Math.cos(angle) * vectorLength
        const endY = point.y + Math.sin(angle) * vectorLength

        // Color by velocity if enabled
        if (config.colorByVelocity) {
          const hue = Math.min(240, Math.max(0, 240 - (speed * 50)))
          ctx.strokeStyle = `hsl(${hue}, 70%, 60%)`
        } else {
          ctx.strokeStyle = '#00ccff'
        }

        // Draw vector
        ctx.beginPath()
        ctx.moveTo(point.x, point.y)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // Draw arrowhead
        const arrowSize = Math.max(3, vectorLength * 0.2)
        const arrowAngle = Math.PI / 6

        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle - arrowAngle),
          endY - arrowSize * Math.sin(angle - arrowAngle)
        )
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowSize * Math.cos(angle + arrowAngle),
          endY - arrowSize * Math.sin(angle + arrowAngle)
        )
        ctx.stroke()
      }
    }

    ctx.restore()
  }
}

export default function OceanCurrentFlow({
  data,
  config,
  onConfigChange,
  className = ''
}: OceanCurrentFlowProps) {
  const map = useMap()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const webglCanvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<FlowParticle[]>([])
  const rendererRef = useRef<FlowFieldRenderer | null>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  // Initialize particles
  const initializeParticles = useCallback(() => {
    if (!data) return

    const { bounds } = data
    const particles: FlowParticle[] = []

    for (let i = 0; i < config.particleCount; i++) {
      const lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest())
      const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth())
      const maxAge = config.particleLife * (0.5 + Math.random() * 0.5) // Vary particle lifetimes

      particles.push(new FlowParticle(lng, lat, maxAge))
    }

    particlesRef.current = particles
  }, [data, config.particleCount, config.particleLife])

  // Initialize WebGL renderer
  useEffect(() => {
    if (webglCanvasRef.current && !rendererRef.current && config.showParticles) {
      try {
        rendererRef.current = new FlowFieldRenderer(webglCanvasRef.current)
      } catch (error) {
        console.error('WebGL initialization failed:', error)
      }
    }

    return () => {
      rendererRef.current?.dispose()
    }
  }, [config.showParticles])

  // Initialize particles when data or config changes
  useEffect(() => {
    initializeParticles()
  }, [initializeParticles])

  // Animation loop
  useEffect(() => {
    if (!config.visible || (!config.showParticles && !config.showVectors)) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = 0
      }
      return
    }

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current
      lastTimeRef.current = currentTime

      if (data && deltaTime > 0) {
        // Update particles
        if (config.showParticles) {
          const dt = (deltaTime / 1000) * config.animationSpeed
          const particles = particlesRef.current

          // Update existing particles
          for (let i = particles.length - 1; i >= 0; i--) {
            const alive = particles[i].update(data, dt, config.particleSpeed)
            if (!alive) {
              // Respawn particle at random location
              const { bounds } = data
              const lng = bounds.getWest() + Math.random() * (bounds.getEast() - bounds.getWest())
              const lat = bounds.getSouth() + Math.random() * (bounds.getNorth() - bounds.getSouth())
              particles[i] = new FlowParticle(lng, lat, config.particleLife)
            }
          }

          // Render particles
          if (rendererRef.current && webglCanvasRef.current) {
            // WebGL rendering
            const canvas = webglCanvasRef.current
            const mapSize = map.getSize()
            canvas.width = mapSize.x
            canvas.height = mapSize.y
            canvas.style.width = `${mapSize.x}px`
            canvas.style.height = `${mapSize.y}px`

            rendererRef.current.updateParticles(particles)

            // Calculate transform matrix for WebGL
            const bounds = map.getBounds()
            const nw = map.latLngToContainerPoint(bounds.getNorthWest())
            const se = map.latLngToContainerPoint(bounds.getSouthEast())

            const transform = [
              2 / mapSize.x, 0, -1,
              0, -2 / mapSize.y, 1,
              0, 0, 1
            ]

            rendererRef.current.render(particles, config, transform)
          } else if (canvasRef.current) {
            // Canvas 2D fallback
            const canvas = canvasRef.current
            const ctx = canvas.getContext('2d')!
            const mapSize = map.getSize()

            canvas.width = mapSize.x
            canvas.height = mapSize.y
            canvas.style.width = `${mapSize.x}px`
            canvas.style.height = `${mapSize.y}px`

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach(particle => {
              particle.draw(ctx, map, config)
            })
          }
        }

        // Render vectors
        if (config.showVectors && canvasRef.current) {
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')!
          const mapSize = map.getSize()

          if (!config.showParticles) {
            canvas.width = mapSize.x
            canvas.height = mapSize.y
            canvas.style.width = `${mapSize.x}px`
            canvas.style.height = `${mapSize.y}px`
            ctx.clearRect(0, 0, canvas.width, canvas.height)
          }

          VectorRenderer.drawVectors(ctx, map, data, config)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [map, data, config])

  if (!config.visible) return null

  return (
    <>
      {/* Canvas for 2D rendering (vectors and fallback particles) */}
      <canvas
        ref={canvasRef}
        className={`ocean-current-canvas ${className}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 200
        }}
      />

      {/* WebGL canvas for particles */}
      {config.showParticles && (
        <canvas
          ref={webglCanvasRef}
          className={`ocean-current-webgl ${className}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none',
            zIndex: 201
          }}
        />
      )}

      <style jsx>{`
        .ocean-current-canvas,
        .ocean-current-webgl {
          image-rendering: auto;
        }
      `}</style>
    </>
  )
}