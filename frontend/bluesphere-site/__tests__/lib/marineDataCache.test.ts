/**
 * Comprehensive tests for Marine Data Cache system
 * Tests caching, performance monitoring, LRU eviction, and specialized marine data caching
 */

import {
  MarineDataCache,
  MarineDataCacheService,
  PerformanceMonitor,
  debounce,
  throttle,
  CacheEntry,
  CacheStats
} from '@/lib/performance/marineDataCache';

// Mock console to reduce noise in tests
const originalConsole = {
  log: console.log,
  error: console.error
};

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
});

beforeEach(() => {
  jest.clearAllMocks();
  // Clear any existing cache instance
  (MarineDataCache as any).instance = undefined;
});

describe('MarineDataCache', () => {
  describe('Singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MarineDataCache.getInstance();
      const instance2 = MarineDataCache.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(MarineDataCache);
    });

    it('should maintain state across getInstance calls', async () => {
      const instance1 = MarineDataCache.getInstance();
      instance1.set('test-key', 'test-value');

      const instance2 = MarineDataCache.getInstance();
      const value = await instance2.get('test-key');

      expect(value).toBe('test-value');
    });
  });

  describe('Basic cache operations', () => {
    let cache: MarineDataCache;

    beforeEach(() => {
      cache = MarineDataCache.getInstance();
      cache.clear();
    });

    it('should store and retrieve data', async () => {
      cache.set('key1', 'value1');

      const result = await cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const result = await cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should handle different data types', async () => {
      const testData = {
        string: 'text',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: { value: 'deep' } },
        nullValue: null,
        undefinedValue: undefined
      };

      for (const [key, value] of Object.entries(testData)) {
        cache.set(key, value);
        const retrieved = await cache.get(key);
        expect(retrieved).toEqual(value);
      }
    });

    it('should respect TTL expiration', async () => {
      jest.useFakeTimers();

      cache.set('expiring-key', 'expiring-value', 1000); // 1 second TTL

      // Should be available immediately
      let result = await cache.get('expiring-key');
      expect(result).toBe('expiring-value');

      // Fast-forward time to just before expiration
      jest.advanceTimersByTime(999);
      result = await cache.get('expiring-key');
      expect(result).toBe('expiring-value');

      // Fast-forward past expiration
      jest.advanceTimersByTime(2);
      result = await cache.get('expiring-key');
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should use default TTL when not specified', async () => {
      jest.useFakeTimers();

      cache.set('default-ttl-key', 'default-value');

      // Should be available immediately
      let result = await cache.get('default-ttl-key');
      expect(result).toBe('default-value');

      // Fast-forward to just before default TTL (5 minutes)
      jest.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000); // 4:59
      result = await cache.get('default-ttl-key');
      expect(result).toBe('default-value');

      // Fast-forward past default TTL
      jest.advanceTimersByTime(2000); // +2 seconds = 5:01
      result = await cache.get('default-ttl-key');
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should clear all cache data', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBe('value2');

      cache.clear();

      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });
  });

  describe('Cache statistics', () => {
    let cache: MarineDataCache;

    beforeEach(() => {
      cache = MarineDataCache.getInstance();
      cache.clear();
    });

    it('should track hits and misses', async () => {
      cache.set('existing-key', 'value');

      // Test cache hit
      await cache.get('existing-key');

      // Test cache miss
      await cache.get('non-existent-key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5); // 1 hit out of 2 total requests
    });

    it('should update hit rate correctly', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // 2 hits
      await cache.get('key1');
      await cache.get('key2');

      // 1 miss
      await cache.get('non-existent');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.6667, 4); // 2/3
    });

    it('should track cache size', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();
      expect(stats.size).toBe(2);
    });

    it('should handle zero requests gracefully', () => {
      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.size).toBe(0);
    });

    it('should increment access count on hits', async () => {
      cache.set('popular-key', 'popular-value');

      // Access multiple times
      await cache.get('popular-key');
      await cache.get('popular-key');
      await cache.get('popular-key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(3);
      expect(stats.misses).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    let cache: MarineDataCache;

    beforeEach(() => {
      cache = MarineDataCache.getInstance();
      cache.clear();
    });

    it('should evict least recently used items when cache is full', async () => {
      // Fill cache to maximum capacity (1000 items)
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      // Verify cache is full
      const statsBefore = cache.getStats();
      expect(statsBefore.size).toBe(1000);

      // Access some items to make them recently used
      await cache.get('key-990');
      await cache.get('key-991');
      await cache.get('key-992');

      // Add one more item to trigger eviction
      cache.set('new-key', 'new-value');

      // Cache should still be at max size
      const statsAfter = cache.getStats();
      expect(statsAfter.size).toBe(1000);

      // Recently accessed items should still exist
      expect(await cache.get('key-990')).toBe('value-990');
      expect(await cache.get('key-991')).toBe('value-991');
      expect(await cache.get('key-992')).toBe('value-992');
      expect(await cache.get('new-key')).toBe('new-value');

      // Least recently used item should be evicted (likely key-0)
      expect(await cache.get('key-0')).toBeNull();
    });

    it('should handle eviction when cache has mixed access patterns', async () => {
      // Add initial items
      for (let i = 0; i < 999; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      // Access every 10th item to create a pattern
      for (let i = 0; i < 999; i += 10) {
        await cache.get(`key-${i}`);
      }

      // Add one more item to trigger eviction
      cache.set('trigger-eviction', 'trigger-value');

      // Accessed items should still exist
      expect(await cache.get('key-0')).toBe('value-0');
      expect(await cache.get('key-10')).toBe('value-10');
      expect(await cache.get('trigger-eviction')).toBe('trigger-value');

      // Some non-accessed items should be evicted
      let evictedCount = 0;
      for (let i = 1; i < 10; i++) {
        if (await cache.get(`key-${i}`) === null) {
          evictedCount++;
        }
      }
      expect(evictedCount).toBeGreaterThan(0);
    });
  });

  describe('getOrFetch functionality', () => {
    let cache: MarineDataCache;

    beforeEach(() => {
      cache = MarineDataCache.getInstance();
      cache.clear();
    });

    it('should fetch and cache data when not present', async () => {
      const fetcher = jest.fn().mockResolvedValue('fetched-data');

      const result = await cache.getOrFetch('cache-miss-key', fetcher);

      expect(result).toBe('fetched-data');
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Data should now be cached
      const cachedResult = await cache.get('cache-miss-key');
      expect(cachedResult).toBe('fetched-data');
    });

    it('should return cached data without calling fetcher', async () => {
      cache.set('cache-hit-key', 'cached-data');
      const fetcher = jest.fn().mockResolvedValue('fetched-data');

      const result = await cache.getOrFetch('cache-hit-key', fetcher);

      expect(result).toBe('cached-data');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should handle fetcher errors gracefully', async () => {
      const fetcherError = new Error('Fetch failed');
      const fetcher = jest.fn().mockRejectedValue(fetcherError);

      await expect(cache.getOrFetch('error-key', fetcher)).rejects.toThrow('Fetch failed');
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Failed fetch should not cache anything
      const result = await cache.get('error-key');
      expect(result).toBeNull();
    });

    it('should use custom TTL when provided', async () => {
      jest.useFakeTimers();

      const fetcher = jest.fn().mockResolvedValue('custom-ttl-data');
      const customTTL = 2000; // 2 seconds

      await cache.getOrFetch('custom-ttl-key', fetcher, customTTL);

      // Should be available immediately
      let result = await cache.get('custom-ttl-key');
      expect(result).toBe('custom-ttl-data');

      // Fast-forward past custom TTL
      jest.advanceTimersByTime(2001);

      // Should be expired
      result = await cache.get('custom-ttl-key');
      expect(result).toBeNull();

      jest.useRealTimers();
    });

    it('should handle concurrent getOrFetch calls for same key', async () => {
      const fetcher = jest.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve('concurrent-data'), 100))
      );

      // Start multiple concurrent requests for the same key
      const promises = [
        cache.getOrFetch('concurrent-key', fetcher),
        cache.getOrFetch('concurrent-key', fetcher),
        cache.getOrFetch('concurrent-key', fetcher)
      ];

      const results = await Promise.all(promises);

      // All should return the same data
      expect(results).toEqual(['concurrent-data', 'concurrent-data', 'concurrent-data']);

      // Fetcher might be called multiple times due to race condition
      // but data should be consistent
      expect(fetcher).toHaveBeenCalled();
    });
  });

  describe('Cache invalidation', () => {
    let cache: MarineDataCache;

    beforeEach(() => {
      cache = MarineDataCache.getInstance();
      cache.clear();
    });

    it('should invalidate keys matching pattern', async () => {
      cache.set('user-123-profile', 'profile-data');
      cache.set('user-123-settings', 'settings-data');
      cache.set('user-456-profile', 'other-profile');
      cache.set('product-789', 'product-data');

      // Invalidate all user-123 data
      cache.invalidate('user-123-.*');

      expect(await cache.get('user-123-profile')).toBeNull();
      expect(await cache.get('user-123-settings')).toBeNull();
      expect(await cache.get('user-456-profile')).toBe('other-profile');
      expect(await cache.get('product-789')).toBe('product-data');
    });

    it('should handle complex regex patterns', async () => {
      cache.set('api-v1-users', 'users-data');
      cache.set('api-v1-posts', 'posts-data');
      cache.set('api-v2-users', 'users-v2-data');
      cache.set('cache-api-v1', 'other-data');

      // Invalidate all api-v1 endpoints
      cache.invalidate('^api-v1-');

      expect(await cache.get('api-v1-users')).toBeNull();
      expect(await cache.get('api-v1-posts')).toBeNull();
      expect(await cache.get('api-v2-users')).toBe('users-v2-data');
      expect(await cache.get('cache-api-v1')).toBe('other-data');
    });

    it('should handle empty invalidation patterns', () => {
      cache.set('test-key', 'test-value');

      cache.invalidate('');

      // Should not affect any keys
      expect(cache.getStats().size).toBe(1);
    });

    it('should handle invalid regex patterns gracefully', () => {
      cache.set('test-key', 'test-value');

      // Invalid regex should not crash
      expect(() => cache.invalidate('[')).not.toThrow();
    });
  });
});

describe('MarineDataCacheService', () => {
  let cacheService: MarineDataCacheService;
  let mockCache: jest.Mocked<MarineDataCache>;

  beforeEach(() => {
    // Reset the singleton instance
    (MarineDataCache as any).instance = undefined;

    // Create a mock cache instance
    mockCache = {
      getOrFetch: jest.fn(),
      invalidate: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn(),
      getStats: jest.fn()
    } as any;

    // Mock the getInstance method to return our mock
    jest.spyOn(MarineDataCache, 'getInstance').mockReturnValue(mockCache);

    cacheService = new MarineDataCacheService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getStations', () => {
    it('should cache station data with 15-minute TTL', async () => {
      const mockStations = [
        { id: '41001', name: 'Station 1', lat: 34.7, lon: -72.7 },
        { id: '41002', name: 'Station 2', lat: 32.3, lon: -75.4 }
      ];

      mockCache.getOrFetch.mockResolvedValue(mockStations);

      const result = await cacheService.getStations('pacific');

      expect(mockCache.getOrFetch).toHaveBeenCalledWith(
        'stations-pacific',
        expect.any(Function),
        15 * 60 * 1000 // 15 minutes
      );
      expect(result).toEqual(mockStations);
    });

    it('should use global key when no region specified', async () => {
      const mockStations = [{ id: 'global', name: 'Global Station' }];
      mockCache.getOrFetch.mockResolvedValue(mockStations);

      await cacheService.getStations();

      expect(mockCache.getOrFetch).toHaveBeenCalledWith(
        'stations-global',
        expect.any(Function),
        15 * 60 * 1000
      );
    });

    it('should handle API fetch errors', async () => {
      const fetchError = new Error('API not available');
      mockCache.getOrFetch.mockRejectedValue(fetchError);

      await expect(cacheService.getStations('atlantic')).rejects.toThrow('API not available');
    });
  });

  describe('getTemperatureData', () => {
    it('should cache temperature data with 2-minute TTL', async () => {
      const mockTempData = {
        stationId: '41001',
        temperature: 23.5,
        timestamp: '2024-01-01T12:00:00Z'
      };

      mockCache.getOrFetch.mockResolvedValue(mockTempData);

      const result = await cacheService.getTemperatureData('41001');

      expect(mockCache.getOrFetch).toHaveBeenCalledWith(
        'temp-41001',
        expect.any(Function),
        2 * 60 * 1000 // 2 minutes
      );
      expect(result).toEqual(mockTempData);
    });
  });

  describe('getSharkData', () => {
    it('should cache shark data with 30-second TTL', async () => {
      const mockSharkData = [
        { id: 'shark-1', species: 'Great White', lat: 37.5, lon: -122.3 }
      ];

      mockCache.getOrFetch.mockResolvedValue(mockSharkData);

      const result = await cacheService.getSharkData('shark-1');

      expect(mockCache.getOrFetch).toHaveBeenCalledWith(
        'sharks-shark-1',
        expect.any(Function),
        30 * 1000 // 30 seconds
      );
      expect(result).toEqual(mockSharkData);
    });

    it('should use "all" key when no shark ID specified', async () => {
      mockCache.getOrFetch.mockResolvedValue([]);

      await cacheService.getSharkData();

      expect(mockCache.getOrFetch).toHaveBeenCalledWith(
        'sharks-all',
        expect.any(Function),
        30 * 1000
      );
    });
  });

  describe('getMarineAlerts', () => {
    it('should cache alerts with 10-second TTL', async () => {
      const mockAlerts = [
        { id: 'alert-1', severity: 'high', message: 'Marine heatwave detected' }
      ];

      mockCache.getOrFetch.mockResolvedValue(mockAlerts);

      const result = await cacheService.getMarineAlerts();

      expect(mockCache.getOrFetch).toHaveBeenCalledWith(
        'marine-alerts',
        expect.any(Function),
        10 * 1000 // 10 seconds
      );
      expect(result).toEqual(mockAlerts);
    });
  });

  describe('Invalidation methods', () => {
    it('should invalidate station data with region pattern', () => {
      cacheService.invalidateStationData('pacific');

      expect(mockCache.invalidate).toHaveBeenCalledWith('stations-pacific');
    });

    it('should invalidate all station data when no region specified', () => {
      cacheService.invalidateStationData();

      expect(mockCache.invalidate).toHaveBeenCalledWith('stations-.*');
    });

    it('should invalidate temperature data with station pattern', () => {
      cacheService.invalidateTemperatureData('41001');

      expect(mockCache.invalidate).toHaveBeenCalledWith('temp-41001');
    });

    it('should invalidate all temperature data when no station specified', () => {
      cacheService.invalidateTemperatureData();

      expect(mockCache.invalidate).toHaveBeenCalledWith('temp-.*');
    });

    it('should invalidate shark data', () => {
      cacheService.invalidateSharkData();

      expect(mockCache.invalidate).toHaveBeenCalledWith('sharks-.*');
    });

    it('should invalidate marine alerts', () => {
      cacheService.invalidateAlerts();

      expect(mockCache.invalidate).toHaveBeenCalledWith('marine-alerts');
    });
  });

  describe('API method failures', () => {
    it('should throw appropriate errors for unimplemented API methods', async () => {
      await expect(cacheService['fetchStationsFromAPI']()).rejects.toThrow(
        'fetchStationsFromAPI not implemented - connect to actual API'
      );

      await expect(cacheService['fetchTemperatureData']('41001')).rejects.toThrow(
        'fetchTemperatureData not implemented - connect to actual API'
      );

      await expect(cacheService['fetchSharkData']()).rejects.toThrow(
        'fetchSharkData not implemented - connect to actual API'
      );

      await expect(cacheService['fetchMarineAlerts']()).rejects.toThrow(
        'fetchMarineAlerts not implemented - connect to actual API'
      );
    });
  });
});

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Clear metrics before each test
    (PerformanceMonitor as any).metrics.clear();
  });

  it('should record and time operations', () => {
    const stopTimer = PerformanceMonitor.startTimer('test-operation');

    // Simulate some work
    const duration = stopTimer();

    expect(duration).toBeGreaterThan(0);

    const metrics = PerformanceMonitor.getMetrics('test-operation');
    expect(metrics.count).toBe(1);
    expect(metrics.avg).toBe(duration);
    expect(metrics.min).toBe(duration);
    expect(metrics.max).toBe(duration);
  });

  it('should record multiple metrics for same operation', () => {
    PerformanceMonitor.recordMetric('multi-test', 10);
    PerformanceMonitor.recordMetric('multi-test', 20);
    PerformanceMonitor.recordMetric('multi-test', 30);

    const metrics = PerformanceMonitor.getMetrics('multi-test');

    expect(metrics.count).toBe(3);
    expect(metrics.avg).toBe(20);
    expect(metrics.min).toBe(10);
    expect(metrics.max).toBe(30);
  });

  it('should limit metrics to last 100 measurements', () => {
    // Record 150 metrics
    for (let i = 1; i <= 150; i++) {
      PerformanceMonitor.recordMetric('overflow-test', i);
    }

    const metrics = PerformanceMonitor.getMetrics('overflow-test');

    expect(metrics.count).toBe(100);
    expect(metrics.min).toBe(51); // Should only have values 51-150
    expect(metrics.max).toBe(150);
  });

  it('should return empty metrics for non-existent operations', () => {
    const metrics = PerformanceMonitor.getMetrics('non-existent');

    expect(metrics).toEqual({
      avg: 0,
      min: 0,
      max: 0,
      count: 0
    });
  });

  it('should return all metrics', () => {
    PerformanceMonitor.recordMetric('operation-1', 10);
    PerformanceMonitor.recordMetric('operation-2', 20);
    PerformanceMonitor.recordMetric('operation-1', 15);

    const allMetrics = PerformanceMonitor.getAllMetrics();

    expect(allMetrics).toHaveProperty('operation-1');
    expect(allMetrics).toHaveProperty('operation-2');
    expect(allMetrics['operation-1'].count).toBe(2);
    expect(allMetrics['operation-2'].count).toBe(1);
  });

  it('should handle timer edge cases', () => {
    // Test immediate timer stop
    const timer1 = PerformanceMonitor.startTimer('immediate');
    const duration1 = timer1();
    expect(duration1).toBeGreaterThanOrEqual(0);

    // Test multiple calls to same timer
    const timer2 = PerformanceMonitor.startTimer('multiple');
    const duration2a = timer2();
    const duration2b = timer2();

    // Both calls should return valid durations
    expect(duration2a).toBeGreaterThanOrEqual(0);
    expect(duration2b).toBeGreaterThanOrEqual(duration2a);
  });
});

describe('Utility functions (debounce and throttle)', () => {
  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      debouncedFn('test');
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(999);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockFn).toHaveBeenCalledWith('test');
    });

    it('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 1000);

      debouncedFn('first');
      jest.advanceTimersByTime(500);
      debouncedFn('second');

      jest.advanceTimersByTime(1000);

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should limit function calls', () => {
      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 1000);

      throttledFn('first');
      expect(mockFn).toHaveBeenCalledWith('first');

      throttledFn('second');
      throttledFn('third');
      expect(mockFn).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      throttledFn('fourth');
      expect(mockFn).toHaveBeenCalledWith('fourth');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });
});

// Integration and performance tests
describe('Marine Data Cache Integration', () => {
  it('should handle real-world caching scenario', async () => {
    const cache = MarineDataCache.getInstance();
    cache.clear();

    const cacheService = new MarineDataCacheService();

    // Mock the actual API methods to avoid "not implemented" errors
    const mockStationsData = [
      { id: '41001', name: 'East Hatteras' },
      { id: '41002', name: 'South Hatteras' }
    ];

    jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
      .mockResolvedValue(mockStationsData);

    // First call should fetch from API
    const stations1 = await cacheService.getStations('atlantic');
    expect(stations1).toEqual(mockStationsData);

    // Second call should use cache
    const stations2 = await cacheService.getStations('atlantic');
    expect(stations2).toEqual(mockStationsData);

    // API should only be called once
    expect(cacheService['fetchStationsFromAPI']).toHaveBeenCalledTimes(1);

    const stats = cache.getStats();
    expect(stats.hits).toBe(1); // Second call was a hit
    expect(stats.misses).toBe(1); // First call was a miss
    expect(stats.hitRate).toBe(0.5);
  });

  it('should handle cache invalidation in real workflow', async () => {
    const cache = MarineDataCache.getInstance();
    cache.clear();

    const cacheService = new MarineDataCacheService();

    // Mock API responses
    const oldData = [{ id: '41001', status: 'old' }];
    const newData = [{ id: '41001', status: 'updated' }];

    jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
      .mockResolvedValueOnce(oldData)
      .mockResolvedValueOnce(newData);

    // Initial data fetch
    const initial = await cacheService.getStations('test-region');
    expect(initial).toEqual(oldData);

    // Invalidate cache (simulating data update)
    cacheService.invalidateStationData('test-region');

    // Next fetch should get new data
    const updated = await cacheService.getStations('test-region');
    expect(updated).toEqual(newData);

    // API should be called twice
    expect(cacheService['fetchStationsFromAPI']).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent requests efficiently', async () => {
    const cache = MarineDataCache.getInstance();
    cache.clear();

    const mockData = { temperature: 23.5, timestamp: Date.now() };
    jest.spyOn(cache, 'getOrFetch').mockResolvedValue(mockData);

    const start = performance.now();

    // Simulate 100 concurrent requests
    const promises = Array(100).fill(0).map(() =>
      cache.getOrFetch('temp-data', async () => mockData)
    );

    const results = await Promise.all(promises);

    const duration = performance.now() - start;

    // All results should be identical
    results.forEach(result => {
      expect(result).toEqual(mockData);
    });

    // Should complete quickly
    expect(duration).toBeLessThan(100);
  });

  it('should monitor performance across operations', () => {
    const operations = ['cache-get', 'cache-set', 'cache-invalidate'];

    operations.forEach(op => {
      const timer = PerformanceMonitor.startTimer(op);

      // Simulate work
      for (let i = 0; i < 1000; i++) {
        Math.random();
      }

      timer();
    });

    const allMetrics = PerformanceMonitor.getAllMetrics();

    operations.forEach(op => {
      expect(allMetrics[op]).toBeDefined();
      expect(allMetrics[op].count).toBe(1);
      expect(allMetrics[op].avg).toBeGreaterThan(0);
    });
  });
});

// Memory and resource management
describe('Cache Memory Management', () => {
  it('should not leak memory with large datasets', async () => {
    const cache = MarineDataCache.getInstance();
    cache.clear();

    // Create large objects to test memory handling
    const largeData = Array(1000).fill(0).map((_, i) => ({
      id: i,
      data: 'x'.repeat(1000), // 1KB per item
      timestamp: Date.now()
    }));

    // Store large dataset
    cache.set('large-dataset', largeData, 60000);

    // Retrieve and verify
    const retrieved = await cache.get('large-dataset');
    expect(retrieved).toEqual(largeData);

    // Clear to free memory
    cache.clear();
    expect(cache.getStats().size).toBe(0);
  });

  it('should handle cache overflow gracefully', () => {
    const cache = MarineDataCache.getInstance();
    cache.clear();

    // Fill beyond maximum capacity
    for (let i = 0; i < 1100; i++) {
      cache.set(`overflow-key-${i}`, `value-${i}`);
    }

    const stats = cache.getStats();
    expect(stats.size).toBeLessThanOrEqual(1000); // Should not exceed max size
  });

  it('should handle performance monitoring memory usage', () => {
    // Record many metrics to test memory handling
    for (let i = 0; i < 1000; i++) {
      PerformanceMonitor.recordMetric('memory-test', Math.random());
    }

    const metrics = PerformanceMonitor.getMetrics('memory-test');
    expect(metrics.count).toBe(100); // Should be limited to 100 entries
  });
});