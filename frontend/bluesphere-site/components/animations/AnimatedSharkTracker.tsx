/**
 * BlueSphere Animated Shark Tracking Component
 *
 * Enhanced shark tracking visualization with smooth animations
 * Real-time movement patterns and marine-inspired interactions
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, useAnimation, AnimatePresence } from 'framer-motion'
import { marineVariants, timing, easing, dataVariants } from '../../lib/animations'

interface SharkData {
  id: string
  name: string
  species: string
  location: {
    lat: number
    lng: number
  }
  depth: number
  speed: number
  direction: number
  temperature: number
  lastUpdate: Date
  batteryLevel: number
  isActive: boolean
}

interface AnimatedSharkTrackerProps {
  sharks: SharkData[]
  selectedSharkId?: string
  onSharkSelect?: (shark: SharkData) => void
  mapBounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

// Individual shark marker with swimming animation
function AnimatedSharkMarker({
  shark,
  isSelected,
  onClick,
  position
}: {
  shark: SharkData
  isSelected: boolean
  onClick: (shark: SharkData) => void
  position: { x: number; y: number }
}) {
  const controls = useAnimation()
  const [isHovered, setIsHovered] = useState(false)

  // Swimming animation sequence
  useEffect(() => {
    const swimAnimation = async () => {
      while (shark.isActive) {
        await controls.start({
          x: position.x + Math.sin(Date.now() * 0.001) * 10,
          y: position.y + Math.cos(Date.now() * 0.001) * 5,
          rotate: shark.direction + Math.sin(Date.now() * 0.002) * 15,
          transition: {
            duration: timing.marine,
            ease: easing.tide
          }
        })
      }
    }

    if (shark.isActive) {
      swimAnimation()
    }
  }, [controls, shark.isActive, shark.direction, position])

  // Activity indicator animation
  const activityVariant = shark.isActive ? dataVariants.alertPulse : {}

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)'
      }}
      animate={controls}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick(shark)}
      whileHover={{ scale: 1.2, z: 10 }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Shark icon with trail effect */}
      <motion.div className="relative">
        {/* Swimming trail */}
        <motion.div
          className="absolute inset-0 rounded-full bg-blue-400 opacity-30"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: timing.marine,
            repeat: Infinity,
            ease: easing.ocean
          }}
        />

        {/* Shark body */}
        <motion.div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            ${isSelected
              ? 'bg-red-500 text-white'
              : shark.isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-400 text-gray-200'
            }
            shadow-lg
          `}
          animate={activityVariant}
        >
          <motion.div
            className="text-lg"
            animate={{
              scale: isHovered ? 1.2 : 1,
              rotate: isHovered ? 10 : 0
            }}
          >
            🦈
          </motion.div>
        </motion.div>

        {/* Direction indicator */}
        <motion.div
          className="absolute -top-2 -right-2 w-3 h-3"
          animate={{
            rotate: shark.direction,
          }}
          transition={{ type: "spring", stiffness: 100 }}
        >
          <div className="w-full h-full bg-yellow-400 rounded-full opacity-70" />
        </motion.div>

        {/* Battery level indicator */}
        {shark.batteryLevel < 30 && (
          <motion.div
            className="absolute -bottom-2 -left-2 w-4 h-2 bg-red-500 rounded-full"
            animate={dataVariants.alertPulse}
          >
            <div className="w-full h-full bg-red-600 rounded-full opacity-80" />
          </motion.div>
        )}
      </motion.div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
                       bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl
                       text-xs whitespace-nowrap z-20"
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="font-medium">{shark.name}</div>
            <div className="text-gray-300">{shark.species}</div>
            <div className="text-gray-400">
              Depth: {shark.depth}m • Speed: {shark.speed}km/h
            </div>

            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2
                          w-0 h-0 border-l-4 border-r-4 border-t-4
                          border-transparent border-t-gray-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// Main shark tracker component
export function AnimatedSharkTracker({
  sharks,
  selectedSharkId,
  onSharkSelect,
  mapBounds
}: AnimatedSharkTrackerProps) {
  const [trackerState, setTrackerState] = useState<'scanning' | 'tracking' | 'idle'>('scanning')
  const [sonarPulses, setSonarPulses] = useState<Array<{ id: string; x: number; y: number }>>([])

  // Convert lat/lng to screen coordinates (simplified)
  const coordToPixel = (lat: number, lng: number, containerWidth: number, containerHeight: number) => {
    const x = ((lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * containerWidth
    const y = ((mapBounds.north - lat) / (mapBounds.north - mapBounds.south)) * containerHeight
    return { x, y }
  }

  // Sonar pulse effect
  useEffect(() => {
    if (trackerState === 'scanning') {
      const interval = setInterval(() => {
        const pulse = {
          id: Date.now().toString(),
          x: Math.random() * 800,
          y: Math.random() * 600
        }
        setSonarPulses(prev => [...prev, pulse])

        // Remove pulse after animation
        setTimeout(() => {
          setSonarPulses(prev => prev.filter(p => p.id !== pulse.id))
        }, 2000)
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [trackerState])

  return (
    <div className="relative w-full h-96 bg-gradient-to-b from-blue-200 to-blue-800 rounded-xl overflow-hidden">
      {/* Ocean background with animated waves */}
      <motion.div
        className="absolute inset-0 opacity-20"
        animate={marineVariants.waveMotion}
      >
        <svg className="w-full h-full" viewBox="0 0 800 400">
          {[0, 1, 2, 3].map(i => (
            <motion.path
              key={i}
              d={`M0,${200 + i * 50} Q200,${180 + i * 50} 400,${200 + i * 50} T800,${200 + i * 50}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity={0.3 - i * 0.1}
              animate={{
                d: [
                  `M0,${200 + i * 50} Q200,${180 + i * 50} 400,${200 + i * 50} T800,${200 + i * 50}`,
                  `M0,${200 + i * 50} Q200,${220 + i * 50} 400,${200 + i * 50} T800,${200 + i * 50}`,
                  `M0,${200 + i * 50} Q200,${180 + i * 50} 400,${200 + i * 50} T800,${200 + i * 50}`
                ]
              }}
              transition={{
                duration: timing.marine * (i + 1),
                repeat: Infinity,
                ease: easing.ocean
              }}
            />
          ))}
        </svg>
      </motion.div>

      {/* Sonar pulses */}
      <AnimatePresence>
        {sonarPulses.map(pulse => (
          <motion.div
            key={pulse.id}
            className="absolute rounded-full border-2 border-green-400"
            style={{
              left: pulse.x,
              top: pulse.y,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{
              width: 200,
              height: 200,
              opacity: 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      {/* Shark markers */}
      <AnimatePresence>
        {sharks.map(shark => {
          const position = coordToPixel(shark.location.lat, shark.location.lng, 800, 400)
          return (
            <AnimatedSharkMarker
              key={shark.id}
              shark={shark}
              isSelected={selectedSharkId === shark.id}
              onClick={onSharkSelect || (() => {})}
              position={position}
            />
          )
        })}
      </AnimatePresence>

      {/* Tracking controls */}
      <div className="absolute top-4 right-4 flex gap-2">
        <motion.button
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            ${trackerState === 'scanning'
              ? 'bg-green-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }
          `}
          onClick={() => setTrackerState('scanning')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {trackerState === 'scanning' && (
            <motion.span
              className="inline-block w-2 h-2 bg-white rounded-full mr-2"
              animate={dataVariants.alertPulse}
            />
          )}
          Scan Ocean
        </motion.button>

        <motion.button
          className={`
            px-4 py-2 rounded-lg text-sm font-medium
            ${trackerState === 'tracking'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
            }
          `}
          onClick={() => setTrackerState('tracking')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Track Sharks
        </motion.button>
      </div>

      {/* Status display */}
      <motion.div
        className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-sm">
          <div className="font-medium">
            {sharks.filter(s => s.isActive).length} Active Sharks
          </div>
          <div className="text-gray-300">
            Status: {trackerState.charAt(0).toUpperCase() + trackerState.slice(1)}
          </div>
        </div>
      </motion.div>
    </div>
  )
}