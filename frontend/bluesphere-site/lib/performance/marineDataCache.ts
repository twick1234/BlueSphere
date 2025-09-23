/**
 * Marine Data Performance Cache
 * High-performance caching layer for marine monitoring data
 */

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
  accessCount: number
}

export interface CacheStats {
  hits: number
  misses: number
  size: number
  hitRate: number
}

export class MarineDataCache {
  private static instance: MarineDataCache
  private cache = new Map<string, CacheEntry<any>>()
  private readonly defaultTTL = 5 * 60 * 1000 // 5 minutes
  private stats: CacheStats = { hits: 0, misses: 0, size: 0, hitRate: 0 }
  private readonly maxSize = 1000

  public static getInstance(): MarineDataCache {
    if (!MarineDataCache.instance) {
      MarineDataCache.instance = new MarineDataCache()
    }
    return MarineDataCache.instance
  }

  public async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.stats.misses++
      this.updateHitRate()
      return null
    }

    entry.accessCount++
    this.stats.hits++
    this.updateHitRate()
    return entry.data
  }

  public set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed()
    }

    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      accessCount: 1
    })

    this.stats.size = this.cache.size
  }

  public async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const data = await fetcher()
    this.set(key, data, ttl)
    return data
  }

  public invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    const regex = new RegExp(pattern)

    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }

    this.stats.size = this.cache.size
  }

  public clear(): void {
    this.cache.clear()
    this.stats = { hits: 0, misses: 0, size: 0, hitRate: 0 }
  }

  public getStats(): CacheStats {
    return { ...this.stats }
  }

  private evictLeastRecentlyUsed(): void {
    let oldestKey = ''
    let oldestAccess = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestAccess) {
        oldestAccess = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }
}

// Specialized cache methods for marine data types
export class MarineDataCacheService {
  private cache = MarineDataCache.getInstance()

  // Station data caching (longer TTL since station locations don't change often)
  public async getStations(region?: string): Promise<any[]> {
    const key = `stations-${region || 'global'}`
    return this.cache.getOrFetch(
      key,
      () => this.fetchStationsFromAPI(region),
      15 * 60 * 1000 // 15 minutes
    )
  }

  // Temperature data caching (shorter TTL for real-time data)
  public async getTemperatureData(stationId: string): Promise<any> {
    const key = `temp-${stationId}`
    return this.cache.getOrFetch(
      key,
      () => this.fetchTemperatureData(stationId),
      2 * 60 * 1000 // 2 minutes
    )
  }

  // Shark tracking data (very short TTL for real-time tracking)
  public async getSharkData(sharkId?: string): Promise<any[]> {
    const key = `sharks-${sharkId || 'all'}`
    return this.cache.getOrFetch(
      key,
      () => this.fetchSharkData(sharkId),
      30 * 1000 // 30 seconds
    )
  }

  // Marine alerts (immediate refresh needed)
  public async getMarineAlerts(): Promise<any[]> {
    const key = 'marine-alerts'
    return this.cache.getOrFetch(
      key,
      () => this.fetchMarineAlerts(),
      10 * 1000 // 10 seconds
    )
  }

  // Invalidation methods for real-time updates
  public invalidateStationData(region?: string): void {
    const pattern = region ? `stations-${region}` : 'stations-.*'
    this.cache.invalidate(pattern)
  }

  public invalidateTemperatureData(stationId?: string): void {
    const pattern = stationId ? `temp-${stationId}` : 'temp-.*'
    this.cache.invalidate(pattern)
  }

  public invalidateSharkData(): void {
    this.cache.invalidate('sharks-.*')
  }

  public invalidateAlerts(): void {
    this.cache.invalidate('marine-alerts')
  }

  // Placeholder methods for actual API calls
  private async fetchStationsFromAPI(region?: string): Promise<any[]> {
    // Implementation would call actual API
    throw new Error('fetchStationsFromAPI not implemented - connect to actual API')
  }

  private async fetchTemperatureData(stationId: string): Promise<any> {
    // Implementation would call actual API
    throw new Error('fetchTemperatureData not implemented - connect to actual API')
  }

  private async fetchSharkData(sharkId?: string): Promise<any[]> {
    // Implementation would call actual API
    throw new Error('fetchSharkData not implemented - connect to actual API')
  }

  private async fetchMarineAlerts(): Promise<any[]> {
    // Implementation would call actual API
    throw new Error('fetchMarineAlerts not implemented - connect to actual API')
  }
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map()

  public static startTimer(label: string): () => number {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, duration)
      return duration
    }
  }

  public static recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }

    const values = this.metrics.get(label)!
    values.push(value)

    // Keep only last 100 measurements
    if (values.length > 100) {
      values.shift()
    }
  }

  public static getMetrics(label: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(label) || []

    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 }
    }

    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    const min = Math.min(...values)
    const max = Math.max(...values)

    return { avg, min, max, count: values.length }
  }

  public static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [label] of this.metrics) {
      result[label] = this.getMetrics(label)
    }

    return result
  }
}

// Debounced function utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(null, args), delay)
  }
}

// Throttled function utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func.apply(null, args)
    }
  }
}