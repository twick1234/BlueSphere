/**
 * BlueSphere Performance Monitoring
 * Real-time performance tracking for marine data platform
 */

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  page?: string
  userAgent?: string
}

export interface WebVitalMetric extends PerformanceMetric {
  id: string
  delta: number
  entries: PerformanceEntry[]
}

export class MarinePerformanceMonitor {
  private static metrics: PerformanceMetric[] = []
  private static isInitialized = false

  public static initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return
    }

    this.isInitialized = true
    this.setupWebVitalsTracking()
    this.setupCustomMetrics()
    this.setupErrorTracking()
  }

  // Core Web Vitals tracking
  private static setupWebVitalsTracking(): void {
    // Import web-vitals dynamically to avoid SSR issues
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.onWebVital.bind(this))
      getFID(this.onWebVital.bind(this))
      getFCP(this.onWebVital.bind(this))
      getLCP(this.onWebVital.bind(this))
      getTTFB(this.onWebVital.bind(this))
    }).catch(console.error)
  }

  private static onWebVital(metric: WebVitalMetric): void {
    this.sendMetric(metric.name, metric.value, {
      id: metric.id,
      delta: metric.delta,
      page_location: window.location.href
    })
  }

  // Marine-specific performance metrics
  private static setupCustomMetrics(): void {
    // Track map loading performance
    this.trackMapLoadTime()

    // Track data ingestion performance
    this.trackDataIngestionRate()

    // Track WebSocket latency
    this.trackWebSocketLatency()

    // Track resource loading
    this.trackResourceTiming()
  }

  public static trackMapLoadTime(): void {
    performance.mark('map-load-start')

    // Listen for map ready event
    window.addEventListener('map-ready', () => {
      performance.mark('map-load-end')
      performance.measure('map-load-time', 'map-load-start', 'map-load-end')

      const measure = performance.getEntriesByName('map-load-time')[0]
      this.sendMetric('map_load_time', measure.duration)
    })

    // Fallback timeout
    setTimeout(() => {
      if (performance.getEntriesByName('map-load-end').length === 0) {
        performance.mark('map-load-timeout')
        performance.measure('map-load-timeout-time', 'map-load-start', 'map-load-timeout')
        const measure = performance.getEntriesByName('map-load-timeout-time')[0]
        this.sendMetric('map_load_timeout', measure.duration)
      }
    }, 10000) // 10 second timeout
  }

  public static trackDataIngestionRate(): () => void {
    const startTime = performance.now()
    let recordCount = 0

    return (count?: number) => {
      recordCount = count || recordCount + 1
      const duration = performance.now() - startTime
      const rate = recordCount / (duration / 1000) // records per second

      this.sendMetric('data_ingestion_rate', rate, {
        record_count: recordCount,
        duration_ms: duration
      })
    }
  }

  public static trackWebSocketLatency(): void {
    let connectionStart: number
    let lastPingTime: number

    // Track WebSocket connection time
    window.addEventListener('websocket-connecting', () => {
      connectionStart = performance.now()
    })

    window.addEventListener('websocket-connected', () => {
      if (connectionStart) {
        const connectionTime = performance.now() - connectionStart
        this.sendMetric('websocket_connection_time', connectionTime)
      }
    })

    // Track ping latency
    window.addEventListener('websocket-ping', () => {
      lastPingTime = performance.now()
    })

    window.addEventListener('websocket-pong', () => {
      if (lastPingTime) {
        const latency = performance.now() - lastPingTime
        this.sendMetric('websocket_latency', latency)
      }
    })
  }

  private static trackResourceTiming(): void {
    // Track large resources that might affect marine data loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        // Track slow loading resources
        if (entry.duration > 1000) { // > 1 second
          this.sendMetric('slow_resource_load', entry.duration, {
            resource_name: entry.name,
            resource_type: this.getResourceType(entry.name),
            transfer_size: entry.transferSize
          })
        }

        // Track failed resources
        if (entry.transferSize === 0 && entry.duration > 0) {
          this.sendMetric('failed_resource_load', 1, {
            resource_name: entry.name,
            resource_type: this.getResourceType(entry.name)
          })
        }
      }
    })

    observer.observe({ entryTypes: ['resource'] })
  }

  private static getResourceType(url: string): string {
    if (url.includes('leaflet') || url.includes('mapbox')) return 'map'
    if (url.includes('shark') || url.includes('marine')) return 'marine-data'
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'style'
    if (url.includes('.png') || url.includes('.jpg') || url.includes('.webp')) return 'image'
    return 'other'
  }

  // Error tracking
  private static setupErrorTracking(): void {
    window.addEventListener('error', (event) => {
      this.sendMetric('javascript_error', 1, {
        error_message: event.message,
        error_filename: event.filename,
        error_line: event.lineno,
        error_column: event.colno
      })
    })

    window.addEventListener('unhandledrejection', (event) => {
      this.sendMetric('promise_rejection', 1, {
        error_message: event.reason?.message || 'Unknown promise rejection',
        error_stack: event.reason?.stack
      })
    })
  }

  // Manual performance tracking
  public static startTimer(label: string): () => void {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.sendMetric(label, duration)
    }
  }

  public static trackUserInteraction(action: string, component?: string): void {
    this.sendMetric('user_interaction', 1, {
      action,
      component,
      page: window.location.pathname
    })
  }

  public static trackMarineDataLoad(dataType: string, recordCount: number, duration: number): void {
    this.sendMetric('marine_data_load', duration, {
      data_type: dataType,
      record_count: recordCount,
      records_per_second: recordCount / (duration / 1000)
    })
  }

  public static trackSearchPerformance(query: string, resultCount: number, duration: number): void {
    this.sendMetric('search_performance', duration, {
      query_length: query.length,
      result_count: resultCount,
      results_per_second: resultCount / (duration / 1000)
    })
  }

  // Send metrics to analytics
  private static sendMetric(name: string, value: number, extra?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      page: window.location.href,
      userAgent: navigator.userAgent,
      ...extra
    }

    this.metrics.push(metric)

    // Send to Google Analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_metric', {
        custom_map: { metric_name: name },
        metric_name: name,
        value: Math.round(value),
        ...extra
      })
    }

    // Send to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`, extra)
    }

    // Keep only recent metrics to prevent memory leaks
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500)
    }
  }

  // Get performance summary
  public static getPerformanceSummary(): Record<string, any> {
    const summary: Record<string, any> = {}

    // Group metrics by name
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = []
      }
      acc[metric.name].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    // Calculate statistics for each metric
    Object.entries(groupedMetrics).forEach(([name, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length
      const min = Math.min(...values)
      const max = Math.max(...values)
      const count = values.length

      summary[name] = {
        avg: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        count
      }
    })

    return summary
  }

  // Export metrics for analysis
  public static exportMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  // Clear metrics
  public static clearMetrics(): void {
    this.metrics = []
  }
}

// React hook for performance tracking
export function usePerformanceTracking() {
  const trackTimer = (label: string) => MarinePerformanceMonitor.startTimer(label)
  const trackInteraction = (action: string, component?: string) =>
    MarinePerformanceMonitor.trackUserInteraction(action, component)
  const trackDataLoad = (dataType: string, recordCount: number, duration: number) =>
    MarinePerformanceMonitor.trackMarineDataLoad(dataType, recordCount, duration)

  return {
    trackTimer,
    trackInteraction,
    trackDataLoad,
    getSummary: MarinePerformanceMonitor.getPerformanceSummary
  }
}

// Initialize on import if in browser
if (typeof window !== 'undefined') {
  // Initialize after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      MarinePerformanceMonitor.initialize()
    })
  } else {
    MarinePerformanceMonitor.initialize()
  }
}