/**
 * BlueSphere Page Transition Component
 *
 * Smooth page transitions with marine-inspired animations
 * Provides consistent navigation experience across the platform
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import { pageVariants, pageTransition } from '../../lib/animations'

interface PageTransitionProps {
  children: React.ReactNode
  className?: string
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const router = useRouter()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={router.asPath}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className={`w-full ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Loading screen component
export function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 bg-blue-900 bg-opacity-90 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="text-center">
        {/* Ocean wave loading animation */}
        <div className="flex space-x-2 justify-center items-end mb-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-8 bg-blue-400 rounded-full"
              animate={{
                height: [32, 16, 32],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: [0.25, 0.46, 0.45, 0.94], // Ocean easing
              }}
            />
          ))}
        </div>

        {/* Animated text */}
        <motion.p
          className="text-blue-100 text-lg font-medium"
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        >
          Diving into ocean data...
        </motion.p>
      </div>
    </motion.div>
  )
}

// Route transition hook
export function useRouteChange(onStart?: () => void, onComplete?: () => void) {
  const router = useRouter()

  React.useEffect(() => {
    const handleRouteChangeStart = () => onStart?.()
    const handleRouteChangeComplete = () => onComplete?.()

    router.events.on('routeChangeStart', handleRouteChangeStart)
    router.events.on('routeChangeComplete', handleRouteChangeComplete)

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart)
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
    }
  }, [router, onStart, onComplete])
}