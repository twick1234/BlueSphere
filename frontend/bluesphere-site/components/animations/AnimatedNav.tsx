/**
 * BlueSphere Animated Navigation Component
 *
 * Enhanced navigation with smooth animations and marine-themed interactions
 * Provides intuitive UX for exploring ocean data and platform features
 */

import React, { useState, useRef, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { navVariants, buttonInteraction, easing, timing } from '../../lib/animations'

interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  description?: string
}

interface AnimatedNavProps {
  items: NavItem[]
  className?: string
}

export function AnimatedNav({ items, className = '' }: AnimatedNavProps) {
  const router = useRouter()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(0)
  const navRef = useRef<HTMLElement>(null)

  // Find active nav item based on current route
  useEffect(() => {
    const currentIndex = items.findIndex(item => router.pathname === item.href)
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex)
    }
  }, [router.pathname, items])

  // Animated background indicator
  const indicatorWidth = 100 / items.length
  const indicatorOffset = activeIndex * indicatorWidth

  return (
    <motion.nav
      ref={navRef}
      className={`relative bg-blue-900/90 backdrop-blur-md rounded-full p-2 ${className}`}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: timing.normal, ease: easing.ocean }}
    >
      {/* Background indicator */}
      <motion.div
        className="absolute top-2 bottom-2 bg-blue-600/50 rounded-full"
        style={{
          width: `${indicatorWidth}%`,
          left: `${indicatorOffset}%`,
        }}
        animate={{
          left: `${indicatorOffset}%`,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      />

      {/* Navigation items */}
      <div className="relative flex">
        {items.map((item, index) => (
          <motion.div
            key={item.href}
            className="flex-1"
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
          >
            <Link href={item.href} className="block">
              <motion.div
                className={`
                  relative px-6 py-3 rounded-full text-center cursor-pointer
                  transition-colors duration-200
                  ${router.pathname === item.href
                    ? 'text-white font-medium'
                    : 'text-blue-200 hover:text-white'
                  }
                `}
                variants={navVariants.buttonHover}
                whileHover="scale"
                whileTap={{ scale: 0.95 }}
              >
                {/* Icon */}
                {item.icon && (
                  <motion.div
                    className="w-6 h-6 mx-auto mb-1"
                    animate={{
                      scale: hoveredIndex === index ? 1.1 : 1,
                      rotate: hoveredIndex === index ? 5 : 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 10,
                    }}
                  >
                    {item.icon}
                  </motion.div>
                )}

                {/* Label */}
                <motion.span className="text-sm">
                  {item.label}
                </motion.span>

                {/* Hover tooltip */}
                {item.description && hoveredIndex === index && (
                  <motion.div
                    className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2
                               bg-gray-900 text-white px-3 py-2 rounded-lg text-xs
                               shadow-lg z-50 whitespace-nowrap"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.description}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2
                                  w-2 h-2 bg-gray-900 rotate-45" />
                  </motion.div>
                )}
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.nav>
  )
}

// Floating Action Button with marine animation
export function FloatingActionButton({
  onClick,
  icon,
  label,
  className = ''
}: {
  onClick: () => void
  icon: React.ReactNode
  label?: string
  className?: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.button
      className={`
        fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700
        text-white rounded-full p-4 shadow-xl z-50
        flex items-center gap-3 group
        ${className}
      `}
      onClick={onClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{
        scale: 1.05,
        y: -5,
        boxShadow: "0 20px 25px -5px rgba(59, 130, 246, 0.4), 0 10px 10px -5px rgba(59, 130, 246, 0.2)",
      }}
      whileTap={{ scale: 0.95 }}
      animate={{
        y: [0, -5, 0],
      }}
      transition={{
        y: {
          duration: timing.marine,
          repeat: Infinity,
          ease: easing.ocean,
        },
      }}
    >
      {/* Icon */}
      <motion.div
        className="w-6 h-6"
        animate={{
          rotate: isHovered ? 180 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 10,
        }}
      >
        {icon}
      </motion.div>

      {/* Label (expands on hover) */}
      {label && (
        <motion.span
          className="overflow-hidden whitespace-nowrap"
          initial={{ width: 0, opacity: 0 }}
          animate={{
            width: isHovered ? "auto" : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          {label}
        </motion.span>
      )}
    </motion.button>
  )
}

// Breadcrumb navigation with animations
export function AnimatedBreadcrumb({
  items
}: {
  items: { label: string; href?: string }[]
}) {
  return (
    <motion.nav
      className="flex items-center space-x-2 text-sm text-gray-600"
      variants={navVariants.menuSlide}
      initial="hidden"
      animate="visible"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <motion.span
              className="text-gray-400"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              /
            </motion.span>
          )}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: index * 0.1,
              duration: timing.normal,
              ease: easing.ocean
            }}
          >
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-blue-600 transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium">
                {item.label}
              </span>
            )}
          </motion.div>
        </React.Fragment>
      ))}
    </motion.nav>
  )
}