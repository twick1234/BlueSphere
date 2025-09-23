import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import '../styles/globals.css'
import '../styles/premium-theme.css'

// Performance monitoring - only in production
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  import('../lib/performance/monitoring').then(({ MarinePerformanceMonitor }) => {
    MarinePerformanceMonitor.initialize()
  })
}

export default function MyApp({ Component, pageProps }: AppProps) {
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
  }, [])

  return <Component {...pageProps} />
}
