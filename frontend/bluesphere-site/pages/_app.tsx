import type { AppProps } from 'next/app'
import { useEffect, useState } from 'react'
import '../styles/globals.css'
import '../styles/premium-theme.css'
import { PageTransition, LoadingScreen } from '../components/animations/PageTransition'
import { motion, AnimatePresence } from 'framer-motion'

// Performance monitoring - only in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  import('../lib/performance/monitoring').then(({ MarinePerformanceMonitor }) => {
    MarinePerformanceMonitor.initialize()
  })
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Preload critical resources for marine platform
    const preloadResources = [
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
      'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    ]

    preloadResources.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = href.endsWith('.css') ? 'style' : 'script'
      link.href = href
      document.head.appendChild(link)
    })

    // Performance hint for map components
    if (window.location.pathname.includes('map') || window.location.pathname.includes('shark')) {
      const mapHint = document.createElement('link')
      mapHint.rel = 'dns-prefetch'
      mapHint.href = '//tile.openstreetmap.org'
      document.head.appendChild(mapHint)
    }

    // Enhanced router events for loading states
    const handleRouteChangeStart = () => setIsLoading(true)
    const handleRouteChangeComplete = () => setIsLoading(false)

    if (typeof window !== 'undefined') {
      const router = require('next/router').default
      router.events.on('routeChangeStart', handleRouteChangeStart)
      router.events.on('routeChangeComplete', handleRouteChangeComplete)
      router.events.on('routeChangeError', handleRouteChangeComplete)

      return () => {
        router.events.off('routeChangeStart', handleRouteChangeStart)
        router.events.off('routeChangeComplete', handleRouteChangeComplete)
        router.events.off('routeChangeError', handleRouteChangeComplete)
      }
    }
  }, [])

  return (
    <div className="relative">
      {/* Loading screen overlay */}
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen />}
      </AnimatePresence>

      {/* Main app with page transitions */}
      <PageTransition>
        <motion.div
          className="min-h-screen"
          initial={false}
          animate={{ opacity: isLoading ? 0.5 : 1 }}
          transition={{ duration: 0.3 }}
        >
          <Component {...pageProps} />
        </motion.div>
      </PageTransition>
    </div>
  )
}
