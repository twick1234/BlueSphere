/**
 * BlueSphere Micro-Interactions and Loading Components
 *
 * Subtle animations and feedback for enhanced user experience
 * Marine-themed micro-interactions with accessibility support
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { loadingVariants, timing, easing, dataVariants } from '../../lib/animations'

// Ocean wave loader
export function OceanWaveLoader({
  size = 'medium',
  message = 'Loading...'
}: {
  size?: 'small' | 'medium' | 'large'
  message?: string
}) {
  const sizeClasses = {
    small: 'w-4 h-8',
    medium: 'w-6 h-12',
    large: 'w-8 h-16'
  }

  const waveCount = size === 'small' ? 3 : size === 'medium' ? 5 : 7

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-end gap-1">
        {Array.from({ length: waveCount }).map((_, i) => (
          <motion.div
            key={i}
            className={`${sizeClasses[size]} bg-blue-500 rounded-full`}
            animate={{
              height: [
                sizeClasses[size].split(' ')[1],
                `${parseInt(sizeClasses[size].split(' ')[1].replace('h-', '')) * 1.5}`,
                sizeClasses[size].split(' ')[1]
              ],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: timing.marine,
              delay: i * 0.1,
              repeat: Infinity,
              ease: easing.ocean
            }}
          />
        ))}
      </div>
      <motion.p
        className="text-blue-600 text-sm font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  )
}

// Sonar pulse loader
export function SonarPulseLoader({ message = 'Scanning ocean...' }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24">
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>

        {/* Pulse rings */}
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 border-2 border-green-400 rounded-full"
            animate={{
              scale: [0, 2],
              opacity: [1, 0]
            }}
            transition={{
              duration: 2,
              delay: i * 0.6,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
        ))}

        {/* Scanning line */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-12 h-0.5 bg-green-400 rounded-full origin-left" />
        </motion.div>
      </div>

      <motion.p
        className="text-green-600 text-sm font-medium"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  )
}

// Compass spinning loader
export function CompassLoader({ message = 'Navigating...' }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full"
        animate={loadingVariants.compass}
      />
      <motion.p
        className="text-blue-600 text-sm font-medium"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </div>
  )
}

// Animated button with ripple effect
export function RippleButton({
  children,
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  className?: string
}) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
  }

  const sizes = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg'
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !onClick) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newRipple = { x, y, id: Date.now() }

    setRipples(prev => [...prev, newRipple])
    onClick()

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 600)
  }

  return (
    <motion.button
      className={`
        relative overflow-hidden rounded-lg font-medium
        transition-colors duration-200 focus:outline-none focus:ring-2
        focus:ring-blue-500 focus:ring-offset-2
        ${variants[variant]} ${sizes[size]} ${className}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onClick={handleClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}

      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.map(ripple => (
          <motion.div
            key={ripple.id}
            className="absolute bg-white bg-opacity-30 rounded-full pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)'
            }}
            initial={{ width: 0, height: 0 }}
            animate={{ width: 100, height: 100, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  )
}

// Floating tooltip with marine theme
export function FloatingTooltip({
  children,
  content,
  position = 'top',
  delay = 0.5
}: {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}) {
  const [isVisible, setIsVisible] = useState(false)

  const positions = {
    top: 'bottom-full mb-2 left-1/2 transform -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 transform -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 transform -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 transform -translate-y-1/2'
  }

  const arrows = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-gray-900'
  }

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setTimeout(() => setIsVisible(true), delay * 1000)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={`
              absolute z-50 bg-gray-900 text-white px-3 py-2 rounded-lg
              shadow-xl text-sm whitespace-nowrap
              ${positions[position]}
            `}
            initial={{ opacity: 0, scale: 0.8, y: position === 'top' ? 10 : position === 'bottom' ? -10 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2, ease: easing.ocean }}
          >
            {content}

            {/* Arrow */}
            <div
              className={`
                absolute w-0 h-0
                border-l-4 border-r-4 border-t-4 border-transparent
                ${arrows[position]}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Status indicator with pulse animation
export function StatusIndicator({
  status,
  label,
  size = 'medium'
}: {
  status: 'online' | 'offline' | 'warning' | 'error'
  label?: string
  size?: 'small' | 'medium' | 'large'
}) {
  const colors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  const sizes = {
    small: 'w-2 h-2',
    medium: 'w-3 h-3',
    large: 'w-4 h-4'
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <motion.div
          className={`${sizes[size]} ${colors[status]} rounded-full`}
          animate={status === 'online' ? dataVariants.alertPulse : {}}
        />
        {status === 'online' && (
          <motion.div
            className={`absolute inset-0 ${colors[status]} rounded-full opacity-50`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: easing.ocean
            }}
          />
        )}
      </div>
      {label && (
        <span className="text-sm text-gray-700 capitalize">
          {label || status}
        </span>
      )}
    </div>
  )
}

// Progress indicator with wave animation
export function WaveProgress({
  progress,
  label,
  showPercentage = true
}: {
  progress: number
  label?: string
  showPercentage?: boolean
}) {
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm text-gray-700">{label}</span>}
          {showPercentage && (
            <motion.span
              className="text-sm text-blue-600 font-medium"
              key={progress}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {Math.round(progress)}%
            </motion.span>
          )}
        </div>
      )}

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full relative"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: timing.normal, ease: easing.ocean }}
        >
          {/* Wave animation on progress bar */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              x: ['0%', '100%', '0%']
            }}
            transition={{
              duration: timing.marine * 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-white to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}