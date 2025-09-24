/**
 * Performance and Memory Tests for BlueSphere utilities
 * Tests memory usage, performance benchmarks, and stress testing
 */

import { performance } from 'perf_hooks';
import { MarineDataCache, PerformanceMonitor } from '@/lib/performance/marineDataCache';
import { SimpleCache, debounce, throttle } from '@/lib/performance';
import { DataIngestionService } from '@/lib/data-ingestion';
import { ErrorLogger, withErrorHandling } from '@/lib/error-handling';
import { sanitizeInput, validateQuery, ValidationSchemas } from '@/lib/api-validation';
import { NextApiRequest } from 'next';

// Mock fetch for data ingestion
global.fetch = jest.fn();

// Mock console to reduce noise
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

beforeEach(() => {
  jest.clearAllMocks();
  ErrorLogger.clearLogs();

  // Mock successful responses
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(generateMockNDBCData(24))
  });
});

// Helper function to generate mock NDBC data
function generateMockNDBCData(hours: number = 24): string {
  const now = new Date();
  let data = '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE\n';
  data += '#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft\n';

  for (let i = hours - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const year = time.getFullYear().toString().slice(-2);
    const month = String(time.getMonth() + 1).padStart(2, '0');
    const day = String(time.getDate()).padStart(2, '0');
    const hour = String(time.getHours()).padStart(2, '0');
    const minute = String(time.getMinutes()).padStart(2, '0');

    const temp = 20 + Math.sin(time.getHours() * Math.PI / 12) * 3 + (Math.random() - 0.5) * 2;
    const line = `${year} ${month} ${day} ${hour} ${minute} 180 12.0 14.5 2.1 8.0 6.5 180 1013.2 ${(temp + 2).toFixed(1)} ${temp.toFixed(1)} ${(temp - 1).toFixed(1)} 99.0 0.0 99.00`;
    data += line + '\n';
  }

  return data;
}

// Helper to create mock API requests
const createMockRequest = (query: any): NextApiRequest => ({
  method: 'GET',
  url: '/api/test',
  headers: {},
  query,
  body: {},
  cookies: {},
  socket: { remoteAddress: '127.0.0.1' }
} as NextApiRequest);

// Memory monitoring utilities
interface MemorySnapshot {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  timestamp: number;
}

function takeMemorySnapshot(): MemorySnapshot {
  const memUsage = process.memoryUsage();
  return {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    arrayBuffers: memUsage.arrayBuffers,
    timestamp: Date.now()
  };
}

function calculateMemoryDelta(before: MemorySnapshot, after: MemorySnapshot) {
  return {
    heapUsed: after.heapUsed - before.heapUsed,
    heapTotal: after.heapTotal - before.heapTotal,
    external: after.external - before.external,
    arrayBuffers: after.arrayBuffers - before.arrayBuffers,
    duration: after.timestamp - before.timestamp
  };
}

// Force garbage collection if available
function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

describe('Performance Benchmarks', () => {
  describe('Cache Performance', () => {
    it('should handle high-throughput cache operations efficiently', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      const iterations = 10000;
      const start = performance.now();

      // Mixed read/write operations
      for (let i = 0; i < iterations; i++) {
        const key = `perf-test-${i % 1000}`; // Reuse some keys
        const value = { data: `value-${i}`, timestamp: Date.now() };

        if (i % 3 === 0) {
          cache.set(key, value);
        } else {
          await cache.get(key);
        }
      }

      const duration = performance.now() - start;
      const opsPerSecond = iterations / (duration / 1000);

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(opsPerSecond).toBeGreaterThan(5000); // At least 5k ops/sec

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(1000); // LRU should limit size
      expect(stats.hitRate).toBeGreaterThan(0.1); // Should have some cache hits
    });

    it('should maintain performance with large cache entries', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      // Create large data objects (1MB each)
      const largeDataSize = 1024 * 1024; // 1MB
      const numEntries = 50;

      const start = performance.now();

      for (let i = 0; i < numEntries; i++) {
        const largeData = {
          id: i,
          data: 'x'.repeat(largeDataSize),
          metadata: {
            created: Date.now(),
            size: largeDataSize,
            version: '1.0'
          }
        };

        cache.set(`large-entry-${i}`, largeData);
      }

      // Test retrieval performance
      for (let i = 0; i < numEntries; i++) {
        const retrieved = await cache.get(`large-entry-${i}`);
        expect(retrieved).toBeDefined();
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(cache.getStats().size).toBeLessThanOrEqual(50);
    });

    it('should handle concurrent cache operations without performance degradation', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      const concurrency = 100;
      const operationsPerWorker = 100;

      const start = performance.now();

      // Create concurrent workers
      const workers = Array.from({ length: concurrency }, async (_, workerId) => {
        const operations = [];

        for (let i = 0; i < operationsPerWorker; i++) {
          const key = `worker-${workerId}-item-${i}`;
          const value = { workerId, itemId: i, data: Math.random() };

          operations.push(
            cache.set(key, value),
            cache.get(key)
          );
        }

        return Promise.all(operations);
      });

      await Promise.all(workers);

      const duration = performance.now() - start;
      const totalOperations = concurrency * operationsPerWorker * 2; // set + get
      const opsPerSecond = totalOperations / (duration / 1000);

      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(opsPerSecond).toBeGreaterThan(1000); // At least 1k ops/sec under concurrency
    });
  });

  describe('Data Processing Performance', () => {
    it('should handle large NDBC data parsing efficiently', async () => {
      // Generate large dataset (1 week of hourly data)
      const hoursOfData = 24 * 7; // 1 week
      const largeNDBCData = generateMockNDBCData(hoursOfData);

      expect(largeNDBCData.length).toBeGreaterThan(100000); // Should be substantial data

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(largeNDBCData)
      });

      const service = DataIngestionService.getInstance();

      const start = performance.now();
      const result = await service.ingestNDBCData();
      const duration = performance.now() - start;

      expect(result.status).toBe('ok');
      expect(result.rows_ingested).toBeGreaterThan(hoursOfData * 15); // Multiple stations
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds

      // Verify data quality
      const status = await service.getIngestionStatus();
      expect(status.total_observations).toBe(result.rows_ingested);
    });

    it('should maintain performance with complex validation operations', async () => {
      const iterations = 1000;
      const complexQueries = Array.from({ length: iterations }, (_, i) => ({
        coordinates: { lat: 34.7 + i * 0.001, lon: -72.7 + i * 0.001 },
        region: `region-${i % 10}`,
        species: `species-${i % 5}`,
        date_range: {
          start_date: new Date(Date.now() - i * 3600000).toISOString(),
          end_date: new Date(Date.now() - i * 3600000 + 86400000).toISOString()
        },
        data_quality: ['excellent', 'good', 'fair'][i % 3]
      }));

      const start = performance.now();

      for (const query of complexQueries) {
        const req = createMockRequest(query);
        const result = validateQuery(req, ValidationSchemas.marineQuery);
        expect(result.success).toBe(true);
      }

      const duration = performance.now() - start;
      const validationsPerSecond = iterations / (duration / 1000);

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(validationsPerSecond).toBeGreaterThan(250); // At least 250 validations/sec
    });

    it('should handle input sanitization performance', () => {
      const iterations = 10000;
      const complexInputs = Array.from({ length: iterations }, (_, i) => ({
        id: i,
        name: `<script>alert('xss-${i}')</script>`,
        data: {
          nested: {
            deep: {
              value: `<img src="x" onerror="alert(${i})">`,
              array: [
                `<iframe src="javascript:alert(${i})"></iframe>`,
                'normal-value',
                { nested: `<svg onload="alert(${i})">` }
              ]
            }
          }
        }
      }));

      const start = performance.now();

      for (const input of complexInputs) {
        const sanitized = sanitizeInput(input);
        expect(sanitized).toBeDefined();
      }

      const duration = performance.now() - start;
      const sanitizationsPerSecond = iterations / (duration / 1000);

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(sanitizationsPerSecond).toBeGreaterThan(5000); // At least 5k sanitizations/sec
    });
  });

  describe('Function Utility Performance', () => {
    it('should handle high-frequency debounce operations efficiently', (done) => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 10);

      const iterations = 10000;
      const start = performance.now();

      // Rapid-fire calls
      for (let i = 0; i < iterations; i++) {
        debouncedFn(`call-${i}`);
      }

      setTimeout(() => {
        const duration = performance.now() - start;

        expect(duration).toBeLessThan(100); // Should handle rapid calls quickly
        expect(mockFn).toHaveBeenCalledTimes(1); // Only last call should execute
        expect(mockFn).toHaveBeenCalledWith(`call-${iterations - 1}`);

        done();
      }, 50);
    });

    it('should handle high-frequency throttle operations efficiently', () => {
      jest.useFakeTimers();

      const mockFn = jest.fn();
      const throttledFn = throttle(mockFn, 100);

      const iterations = 10000;
      const start = performance.now();

      // Rapid-fire calls
      for (let i = 0; i < iterations; i++) {
        throttledFn(`call-${i}`);
      }

      const duration = performance.now() - start;

      expect(duration).toBeLessThan(50); // Should handle rapid calls quickly
      expect(mockFn).toHaveBeenCalledTimes(1); // Only first call should execute
      expect(mockFn).toHaveBeenCalledWith('call-0');

      jest.useRealTimers();
    });
  });
});

describe('Memory Management Tests', () => {
  describe('Cache Memory Usage', () => {
    it('should not leak memory with repeated cache operations', async () => {
      forceGC();
      const beforeSnapshot = takeMemorySnapshot();

      const cache = MarineDataCache.getInstance();
      cache.clear();

      // Perform many cache operations
      for (let cycle = 0; cycle < 10; cycle++) {
        // Fill cache
        for (let i = 0; i < 1000; i++) {
          const data = {
            id: i,
            data: 'x'.repeat(1000), // 1KB per entry
            cycle,
            timestamp: Date.now()
          };
          cache.set(`cycle-${cycle}-item-${i}`, data);
        }

        // Read from cache
        for (let i = 0; i < 1000; i++) {
          await cache.get(`cycle-${cycle}-item-${i}`);
        }

        // Clear cache periodically
        if (cycle % 3 === 0) {
          cache.clear();
          forceGC();
        }
      }

      forceGC();
      const afterSnapshot = takeMemorySnapshot();
      const delta = calculateMemoryDelta(beforeSnapshot, afterSnapshot);

      // Memory increase should be reasonable (less than 50MB)
      expect(delta.heapUsed).toBeLessThan(50 * 1024 * 1024);

      cache.clear();
    });

    it('should implement LRU eviction correctly under memory pressure', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      forceGC();
      const beforeSnapshot = takeMemorySnapshot();

      // Fill cache beyond capacity with large objects
      const entrySize = 100 * 1024; // 100KB per entry
      const numEntries = 2000; // Well beyond max size of 1000

      for (let i = 0; i < numEntries; i++) {
        const largeData = {
          id: i,
          payload: 'x'.repeat(entrySize),
          timestamp: Date.now()
        };

        cache.set(`large-entry-${i}`, largeData);

        // Access some older entries to keep them "recently used"
        if (i > 100 && i % 10 === 0) {
          await cache.get(`large-entry-${i - 100}`);
        }
      }

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(1000); // Should respect max size

      // Recently accessed items should still be available
      for (let i = numEntries - 100; i < numEntries; i++) {
        const result = await cache.get(`large-entry-${i}`);
        expect(result).toBeDefined();
      }

      // Older items should be evicted
      let evictedCount = 0;
      for (let i = 0; i < 100; i++) {
        const result = await cache.get(`large-entry-${i}`);
        if (result === null) evictedCount++;
      }
      expect(evictedCount).toBeGreaterThan(0);

      forceGC();
      const afterSnapshot = takeMemorySnapshot();
      const delta = calculateMemoryDelta(beforeSnapshot, afterSnapshot);

      // Memory should not grow excessively due to LRU eviction
      expect(delta.heapUsed).toBeLessThan(200 * 1024 * 1024); // Less than 200MB increase
    });

    it('should handle SimpleCache memory efficiently', () => {
      forceGC();
      const beforeSnapshot = takeMemorySnapshot();

      const cache = new SimpleCache<string>();
      const iterations = 10000;

      // Fill cache with data
      for (let i = 0; i < iterations; i++) {
        cache.set(`key-${i}`, `value-${'x'.repeat(1000)}-${i}`);
      }

      // Read all data
      for (let i = 0; i < iterations; i++) {
        const value = cache.get(`key-${i}`);
        expect(value).toBeDefined();
      }

      // Clear cache to free memory
      cache.clear();
      forceGC();

      const afterSnapshot = takeMemorySnapshot();
      const delta = calculateMemoryDelta(beforeSnapshot, afterSnapshot);

      // Memory should return to near baseline after clearing
      expect(delta.heapUsed).toBeLessThan(10 * 1024 * 1024); // Less than 10MB increase
    });
  });

  describe('Data Processing Memory Usage', () => {
    it('should handle large data ingestion without memory leaks', async () => {
      forceGC();
      const beforeSnapshot = takeMemorySnapshot();

      // Generate very large dataset
      const largeDataset = generateMockNDBCData(24 * 30); // 30 days of hourly data

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(largeDataset)
      });

      const service = DataIngestionService.getInstance();

      // Process multiple large datasets
      for (let i = 0; i < 5; i++) {
        const result = await service.ingestNDBCData();
        expect(result.status).toBe('ok');

        // Force garbage collection between runs
        if (i % 2 === 0) {
          forceGC();
        }
      }

      forceGC();
      const afterSnapshot = takeMemorySnapshot();
      const delta = calculateMemoryDelta(beforeSnapshot, afterSnapshot);

      // Memory increase should be reasonable for processed data
      expect(delta.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    it('should manage memory efficiently during error handling', async () => {
      forceGC();
      const beforeSnapshot = takeMemorySnapshot();

      ErrorLogger.clearLogs();

      // Generate many errors to test error logging memory usage
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        await withErrorHandling(async () => {
          throw new Error(`Test error ${i} with large context: ${'x'.repeat(1000)}`);
        }, {
          largeContext: 'y'.repeat(1000),
          iteration: i,
          timestamp: Date.now()
        });
      }

      const errorLogs = ErrorLogger.getRecentLogs(100);
      expect(errorLogs.length).toBeLessThanOrEqual(100); // Should limit log entries

      ErrorLogger.clearLogs();
      forceGC();

      const afterSnapshot = takeMemorySnapshot();
      const delta = calculateMemoryDelta(beforeSnapshot, afterSnapshot);

      // Memory should not grow excessively due to error log limits
      expect(delta.heapUsed).toBeLessThan(20 * 1024 * 1024); // Less than 20MB
    });
  });

  describe('Performance Monitoring Memory', () => {
    it('should limit memory usage in performance monitoring', () => {
      forceGC();
      const beforeSnapshot = takeMemorySnapshot();

      // Record many performance metrics
      for (let i = 0; i < 1000; i++) {
        const timer = PerformanceMonitor.startTimer(`operation-${i % 10}`);

        // Simulate work
        for (let j = 0; j < 1000; j++) {
          Math.random();
        }

        timer();
      }

      // Check metrics are limited properly
      const allMetrics = PerformanceMonitor.getAllMetrics();
      for (const [label, metrics] of Object.entries(allMetrics)) {
        expect(metrics.count).toBeLessThanOrEqual(100); // Should limit to 100 entries
      }

      forceGC();
      const afterSnapshot = takeMemorySnapshot();
      const delta = calculateMemoryDelta(beforeSnapshot, afterSnapshot);

      // Memory usage should be controlled
      expect(delta.heapUsed).toBeLessThan(10 * 1024 * 1024); // Less than 10MB
    });
  });
});

describe('Stress Tests', () => {
  describe('High Load Scenarios', () => {
    it('should handle system-wide stress test', async () => {
      const startTime = performance.now();
      forceGC();
      const beforeMemory = takeMemorySnapshot();

      // Initialize services
      const ingestionService = DataIngestionService.getInstance();
      const cache = MarineDataCache.getInstance();
      cache.clear();

      // Concurrent operations
      const operations = [
        // Data ingestion stress
        ...Array.from({ length: 5 }, () =>
          ingestionService.ingestNDBCData()
        ),

        // Cache stress
        ...Array.from({ length: 10 }, async (_, i) => {
          for (let j = 0; j < 100; j++) {
            cache.set(`stress-${i}-${j}`, { data: 'x'.repeat(1000) });
            await cache.get(`stress-${i}-${j}`);
          }
        }),

        // Validation stress
        ...Array.from({ length: 20 }, async (_, i) => {
          for (let j = 0; j < 50; j++) {
            const req = createMockRequest({
              page: j + 1,
              limit: 20,
              sort_order: j % 2 === 0 ? 'asc' : 'desc'
            });
            validateQuery(req, ValidationSchemas.pagination);
          }
        }),

        // Error handling stress
        ...Array.from({ length: 10 }, async (_, i) => {
          for (let j = 0; j < 20; j++) {
            await withErrorHandling(async () => {
              if (Math.random() < 0.5) {
                throw new Error(`Stress error ${i}-${j}`);
              }
              return `success-${i}-${j}`;
            });
          }
        })
      ];

      const results = await Promise.allSettled(operations);
      const duration = performance.now() - startTime;

      // Verify results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(results.length * 0.8); // At least 80% success

      // Performance expectations
      expect(duration).toBeLessThan(60000); // Should complete within 1 minute

      // Memory check
      forceGC();
      const afterMemory = takeMemorySnapshot();
      const memoryDelta = calculateMemoryDelta(beforeMemory, afterMemory);
      expect(memoryDelta.heapUsed).toBeLessThan(500 * 1024 * 1024); // Less than 500MB increase
    });

    it('should maintain performance under sustained load', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      const loadTestDuration = 5000; // 5 seconds
      const startTime = performance.now();
      let operationCount = 0;

      // Sustained load
      while (performance.now() - startTime < loadTestDuration) {
        const batchStart = performance.now();

        // Batch of operations
        const batch = Array.from({ length: 100 }, async (_, i) => {
          const key = `sustained-${operationCount}-${i}`;
          cache.set(key, { data: `value-${operationCount}-${i}`, timestamp: Date.now() });
          return await cache.get(key);
        });

        await Promise.all(batch);
        operationCount += 100;

        const batchDuration = performance.now() - batchStart;

        // Each batch should complete within reasonable time
        expect(batchDuration).toBeLessThan(100); // Less than 100ms per batch
      }

      const totalDuration = performance.now() - startTime;
      const opsPerSecond = operationCount / (totalDuration / 1000);

      expect(opsPerSecond).toBeGreaterThan(1000); // At least 1k ops/sec sustained
      expect(operationCount).toBeGreaterThan(5000); // Should have completed many operations
    });

    it('should recover from memory pressure', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      // Create memory pressure
      const largeArrays: any[] = [];

      try {
        // Allocate large amounts of memory
        for (let i = 0; i < 100; i++) {
          largeArrays.push(new Array(1024 * 1024).fill(`memory-pressure-${i}`));

          // Continue cache operations under pressure
          cache.set(`pressure-test-${i}`, {
            data: 'x'.repeat(10000),
            index: i,
            timestamp: Date.now()
          });

          if (i % 10 === 0) {
            forceGC();
          }
        }

        // Verify cache still works under pressure
        const testValue = await cache.get('pressure-test-50');
        expect(testValue).toBeDefined();

      } finally {
        // Release memory pressure
        largeArrays.length = 0;
        cache.clear();
        forceGC();
      }

      // System should recover
      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle pathological input patterns efficiently', () => {
      // Test deeply nested objects
      const createNestedObject = (depth: number): any => {
        if (depth === 0) return 'leaf-value';
        return { nested: createNestedObject(depth - 1) };
      };

      const deepObject = createNestedObject(100);
      const start = performance.now();

      const sanitized = sanitizeInput(deepObject);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Should handle deep nesting quickly
      expect(sanitized).toBeDefined();
    });

    it('should handle extremely large string inputs', () => {
      const iterations = 100;
      const largeStringSize = 1024 * 1024; // 1MB strings

      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        const largeString = 'x'.repeat(largeStringSize);
        const sanitized = sanitizeInput(largeString);

        // Should be truncated to 1000 characters
        expect((sanitized as string).length).toBe(1000);
      }

      const duration = performance.now() - start;
      const stringsPerSecond = iterations / (duration / 1000);

      expect(stringsPerSecond).toBeGreaterThan(10); // At least 10 large strings/sec
    });

    it('should handle rapid cache key collisions efficiently', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      const numKeys = 10;
      const operationsPerKey = 1000;

      const start = performance.now();

      // Rapid updates to same keys
      const operations = [];
      for (let i = 0; i < operationsPerKey; i++) {
        for (let keyIndex = 0; keyIndex < numKeys; keyIndex++) {
          const key = `collision-key-${keyIndex}`;
          operations.push(
            cache.set(key, { value: i, key: keyIndex, timestamp: Date.now() })
          );
        }
      }

      await Promise.all(operations);

      // Verify final state
      for (let keyIndex = 0; keyIndex < numKeys; keyIndex++) {
        const value = await cache.get(`collision-key-${keyIndex}`);
        expect(value).toBeDefined();
        expect((value as any).key).toBe(keyIndex);
      }

      const duration = performance.now() - start;
      const opsPerSecond = (numKeys * operationsPerKey) / (duration / 1000);

      expect(opsPerSecond).toBeGreaterThan(5000); // Should handle collisions efficiently
    });
  });
});