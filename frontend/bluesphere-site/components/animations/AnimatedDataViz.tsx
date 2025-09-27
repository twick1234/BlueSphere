/**
 * BlueSphere Animated Data Visualization Components
 *
 * Enhanced data visualizations with smooth animations for marine data
 * Real-time updates with ocean-inspired motion and micro-interactions
 */

import React, { useEffect, useState, useRef } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'
import { dataVariants, marineVariants, timing, easing, containerVariants } from '../../lib/animations'

// Animated metric card
export function AnimatedMetricCard({
  title,
  value,
  unit,
  trend,
  icon,
  color = 'blue',
  isUpdating = false
}: {
  title: string
  value: number | string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red'
  isUpdating?: boolean
}) {
  const controls = useAnimation()
  const ref = useRef(null)
  const inView = useInView(ref)
  const [displayValue, setDisplayValue] = useState(0)

  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 border-blue-200',
    green: 'from-emerald-500 to-emerald-600 border-emerald-200',
    yellow: 'from-amber-500 to-amber-600 border-amber-200',
    red: 'from-red-500 to-red-600 border-red-200',
  }

  // Animate value counting
  useEffect(() => {
    if (inView && typeof value === 'number') {
      let start = 0
      const end = value
      const duration = timing.slow * 1000
      const increment = end / (duration / 16)

      const timer = setInterval(() => {
        start += increment
        if (start >= end) {
          setDisplayValue(end)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(start))
        }
      }, 16)

      return () => clearInterval(timer)
    }
  }, [inView, value])

  // Pulse animation when updating
  useEffect(() => {
    if (isUpdating) {
      controls.start(dataVariants.dataUpdate)
    }
  }, [isUpdating, controls])

  return (
    <motion.div
      ref={ref}
      className={`
        relative overflow-hidden rounded-xl p-6
        bg-gradient-to-br ${colorClasses[color]}
        border text-white shadow-lg
      `}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: timing.normal,
        ease: easing.ocean
      }}
      whileHover={{
        y: -5,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      animate={controls}
    >
      {/* Background wave pattern */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={marineVariants.waveMotion}
      >
        <svg className="w-full h-full" viewBox="0 0 400 100">
          <path
            d="M0,50 Q100,30 200,50 T400,50 V100 H0 Z"
            fill="currentColor"
          />
        </svg>
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium opacity-90">{title}</h3>
          {icon && (
            <motion.div
              className="w-6 h-6"
              animate={isUpdating ? { rotate: 360 } : {}}
              transition={{ duration: 1, ease: "linear" }}
            >
              {icon}
            </motion.div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <motion.span className="text-3xl font-bold">
              {typeof value === 'number' ? displayValue.toLocaleString() : value}
            </motion.span>
            {unit && <span className="text-lg ml-1 opacity-80">{unit}</span>}
          </div>

          {trend && (
            <motion.div
              className={`
                px-2 py-1 rounded-full text-xs font-medium
                ${trend === 'up' ? 'bg-green-400/20 text-green-100' :
                  trend === 'down' ? 'bg-red-400/20 text-red-100' :
                  'bg-gray-400/20 text-gray-100'}
              `}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
            </motion.div>
          )}
        </div>
      </div>

      {/* Update indicator */}
      {isUpdating && (
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"
          animate={dataVariants.alertPulse}
        />
      )}
    </motion.div>
  )
}

// Animated chart container
export function AnimatedChartContainer({
  title,
  children,
  isLoading = false,
  className = ''
}: {
  title: string
  children: React.ReactNode
  isLoading?: boolean
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      className={`bg-white rounded-xl shadow-lg border p-6 ${className}`}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        duration: timing.normal,
        ease: easing.ocean
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <motion.h3
          className="text-lg font-semibold text-gray-900"
          initial={{ x: -20, opacity: 0 }}
          animate={inView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          {title}
        </motion.h3>

        {isLoading && (
          <motion.div
            className="flex space-x-1"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-blue-400 rounded-full"
                variants={{
                  hidden: { opacity: 0.3 },
                  visible: {
                    opacity: [0.3, 1, 0.3],
                    transition: {
                      duration: 1,
                      repeat: Infinity,
                      delay: i * 0.2
                    }
                  }
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Chart content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.4, duration: timing.normal }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// Animated data list
export function AnimatedDataList({
  items,
  renderItem,
}: {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className="space-y-3"
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, x: -20 },
            visible: {
              opacity: 1,
              x: 0,
              transition: {
                duration: timing.normal,
                ease: easing.ocean
              }
            }
          }}
          whileHover={{
            x: 5,
            transition: { type: "spring", stiffness: 300 }
          }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Real-time data feed animation
export function RealTimeDataFeed({
  data,
  maxItems = 5
}: {
  data: Array<{ id: string; message: string; timestamp: Date; type?: 'info' | 'warning' | 'success' }>
  maxItems?: number
}) {
  const [visibleData, setVisibleData] = useState(data.slice(0, maxItems))

  useEffect(() => {
    setVisibleData(data.slice(0, maxItems))
  }, [data, maxItems])

  return (
    <div className="space-y-2 max-h-96 overflow-hidden">
      {visibleData.map((item, index) => (
        <motion.div
          key={item.id}
          className={`
            p-3 rounded-lg border-l-4 bg-gray-50
            ${item.type === 'warning' ? 'border-amber-400 bg-amber-50' :
              item.type === 'success' ? 'border-green-400 bg-green-50' :
              'border-blue-400 bg-blue-50'}
          `}
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -50, scale: 0.9 }}
          transition={{
            duration: timing.fast,
            delay: index * 0.1
          }}
          layout
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-800">{item.message}</p>
            <span className="text-xs text-gray-500">
              {item.timestamp.toLocaleTimeString()}
            </span>
          </div>

          {/* Data bubble animation */}
          <motion.div
            className="absolute -right-2 top-2 w-2 h-2 bg-blue-400 rounded-full"
            animate={marineVariants.dataBubble}
            style={{ animationDelay: `${index * 200}ms` }}
          />
        </motion.div>
      ))}
    </div>
  )
}