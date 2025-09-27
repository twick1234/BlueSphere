/**
 * BlueSphere 3D Ocean Visualization
 *
 * Immersive 3D ocean floor and water surface visualization
 * Interactive bathymetry with realistic water effects
 */

import React, { useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { OrbitControls, Plane, Sphere, Text, Environment } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { timing, easing } from '../../lib/animations'

// Water surface component with wave animation
function WaterSurface() {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const waterShader = useMemo(() => {
    return {
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;

        void main() {
          vUv = uv;
          vPosition = position;

          // Wave displacement
          vec3 pos = position;
          pos.z += sin(pos.x * 0.1 + time) * 0.5;
          pos.z += cos(pos.y * 0.1 + time * 0.8) * 0.3;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;

        void main() {
          // Animated water color
          float wave = sin(vPosition.x * 0.1 + time) * 0.5 + 0.5;
          vec3 color = mix(color1, color2, wave);

          // Add some transparency and foam
          float alpha = 0.8 + sin(vPosition.x * 0.2 + time * 2.0) * 0.1;

          gl_FragColor = vec4(color, alpha);
        }
      `,
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0x006994) },
        color2: { value: new THREE.Color(0x0099cc) }
      }
    }
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        {...waterShader}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

// Ocean floor terrain
function OceanFloor({ bathymetryData }: { bathymetryData?: number[][] }) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Generate simple bathymetry if none provided
  const heights = useMemo(() => {
    if (bathymetryData) return bathymetryData

    const size = 64
    const data = []
    for (let i = 0; i < size; i++) {
      const row = []
      for (let j = 0; j < size; j++) {
        // Create some underwater valleys and ridges
        const height = -5 - Math.sin(i * 0.1) * 3 - Math.cos(j * 0.1) * 2
        row.push(height)
      }
      data.push(row)
    }
    return data
  }, [bathymetryData])

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={[0, -10, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[100, 100, heights.length - 1, heights[0].length - 1]} />
      <meshLambertMaterial color="#8B4513" />
    </mesh>
  )
}

// Animated marine life
function MarineLife({ position, type = 'fish' }: { position: [number, number, number], type?: 'fish' | 'shark' | 'whale' }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Swimming motion
      meshRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime + position[1]) * 2
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 0.8) * 0.5
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    }
  })

  const color = type === 'shark' ? '#666' : type === 'whale' ? '#333' : '#4A90E2'
  const scale = type === 'whale' ? [3, 1.5, 1] : type === 'shark' ? [2, 1, 1] : [1, 0.5, 0.3]

  return (
    <group ref={meshRef} position={position}>
      <Sphere args={scale} position={[0, 0, 0]}>
        <meshPhongMaterial color={color} />
      </Sphere>
      {/* Tail */}
      <Sphere args={[0.3, 0.2, 0.1]} position={[-1, 0, 0]}>
        <meshPhongMaterial color={color} />
      </Sphere>
    </group>
  )
}

// Underwater particles (bubbles, plankton)
function UnderwaterParticles() {
  const particlesRef = useRef<THREE.Points>(null)

  const particles = useMemo(() => {
    const positions = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = Math.random() * -20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
    }
    return positions
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05

      // Animate particles rising
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.02
        if (positions[i + 1] > 5) {
          positions[i + 1] = -20
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={particles}
          count={particles.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#87CEEB" transparent opacity={0.6} />
    </points>
  )
}

// Main 3D Scene
function Ocean3DScene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} color="#FFE4B5" />
      <pointLight position={[0, 5, 0]} intensity={0.5} color="#87CEEB" />

      {/* Water surface */}
      <WaterSurface />

      {/* Ocean floor */}
      <OceanFloor />

      {/* Marine life */}
      <MarineLife position={[10, -5, 5]} type="fish" />
      <MarineLife position={[-15, -8, -10]} type="shark" />
      <MarineLife position={[20, -12, 15]} type="whale" />
      <MarineLife position={[-5, -3, 8]} type="fish" />
      <MarineLife position={[8, -6, -12]} type="fish" />

      {/* Underwater particles */}
      <UnderwaterParticles />

      {/* Environment */}
      <Environment preset="sunset" />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2}
        minDistance={10}
        maxDistance={100}
      />
    </>
  )
}

// Main component
export function Ocean3D({
  className = '',
  showControls = true
}: {
  className?: string
  showControls?: boolean
}) {
  const [isLoaded, setIsLoaded] = React.useState(false)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoaded(true), 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <motion.div
      className={`relative w-full h-96 bg-gradient-to-b from-sky-200 to-blue-900 rounded-xl overflow-hidden ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: timing.slow,
        ease: easing.ocean
      }}
    >
      {!isLoaded ? (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-blue-900"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="text-white text-lg">Loading Ocean...</div>
        </motion.div>
      ) : (
        <Canvas
          camera={{ position: [0, 10, 20], fov: 60 }}
          gl={{ antialias: true, alpha: false }}
        >
          <Ocean3DScene />
        </Canvas>
      )}

      {/* Control panel */}
      {showControls && isLoaded && (
        <motion.div
          className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-4 rounded-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-sm space-y-1">
            <div className="font-medium">Ocean Depth View</div>
            <div className="text-gray-300">Drag to rotate • Scroll to zoom</div>
            <div className="text-gray-400 text-xs">
              Marine life: 🐟 Fish • 🦈 Sharks • 🐋 Whales
            </div>
          </div>
        </motion.div>
      )}

      {/* Depth indicator */}
      <motion.div
        className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <div className="text-xs">
          <div className="text-blue-300">Surface: 0m</div>
          <div className="text-green-300">Mid-water: -50m</div>
          <div className="text-red-300">Seafloor: -200m</div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Simplified version for mobile or low performance
export function Ocean3DSimple() {
  return (
    <motion.div
      className="relative w-full h-96 bg-gradient-to-b from-sky-200 to-blue-900 rounded-xl overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />

          <WaterSurface />

          <OrbitControls enableZoom={false} />
        </Canvas>
      </div>
    </motion.div>
  )
}