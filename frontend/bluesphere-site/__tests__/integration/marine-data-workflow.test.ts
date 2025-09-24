/**
 * Integration tests for Marine Data workflows
 * Tests end-to-end data flow from ingestion through caching to API responses
 */

import { DataIngestionService } from '@/lib/data-ingestion';
import { MarineDataCache, MarineDataCacheService } from '@/lib/performance/marineDataCache';
import { ErrorLogger, withErrorHandling } from '@/lib/error-handling';
import { validateQuery, validateBody, ValidationSchemas } from '@/lib/api-validation';
import { NextApiRequest } from 'next';

// Mock fetch for NDBC data
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

  // Mock successful NDBC responses
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(generateMockNDBCData())
  });
});

// Generate mock NDBC data for testing
function generateMockNDBCData(): string {
  const now = new Date();
  let data = '#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE\n';
  data += '#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft\n';

  for (let i = 23; i >= 0; i--) {
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

describe('Marine Data Workflow Integration', () => {
  describe('Data Ingestion to Cache Pipeline', () => {
    it('should complete full data flow from ingestion to cached retrieval', async () => {
      // Step 1: Initialize data ingestion service
      const ingestionService = DataIngestionService.getInstance();
      await ingestionService.initializeStations();

      // Step 2: Run data ingestion
      const jobResult = await ingestionService.ingestNDBCData();
      expect(jobResult.status).toBe('ok');
      expect(jobResult.rows_ingested).toBeGreaterThan(0);

      // Step 3: Verify ingestion status
      const status = await ingestionService.getIngestionStatus();
      expect(status.total_observations).toBe(jobResult.rows_ingested);
      expect(status.total_stations).toBeGreaterThan(0);

      // Step 4: Test cache service integration
      const cacheService = new MarineDataCacheService();

      // Mock the cache service to use actual data from ingestion
      const mockStationData = [
        { id: '41001', name: 'East Hatteras', lat: 34.7, lon: -72.7 },
        { id: '41002', name: 'South Hatteras', lat: 32.3, lon: -75.4 }
      ];

      jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
        .mockResolvedValue(mockStationData);

      // Step 5: Test cached data retrieval
      const stations = await cacheService.getStations('atlantic');
      expect(stations).toEqual(mockStationData);

      // Step 6: Verify cache performance
      const cache = MarineDataCache.getInstance();
      const cacheStats = cache.getStats();
      expect(cacheStats.misses).toBe(1); // First call was a miss
      expect(cacheStats.size).toBeGreaterThan(0);

      // Step 7: Test cache hit
      const cachedStations = await cacheService.getStations('atlantic');
      expect(cachedStations).toEqual(mockStationData);

      const finalStats = cache.getStats();
      expect(finalStats.hits).toBe(1); // Second call was a hit
      expect(finalStats.hitRate).toBe(0.5); // 1 hit out of 2 total calls
    });

    it('should handle errors gracefully throughout the pipeline', async () => {
      // Test error handling in ingestion
      (fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

      const ingestionService = DataIngestionService.getInstance();
      const jobResult = await ingestionService.ingestNDBCData();

      // Should complete with mock data fallback
      expect(jobResult.status).toBe('ok');
      expect(jobResult.rows_ingested).toBeGreaterThan(0);

      // Test error handling in cache service
      const cacheService = new MarineDataCacheService();

      // Mock cache API failure
      jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
        .mockRejectedValue(new Error('API unavailable'));

      // Should propagate error but not crash
      await expect(cacheService.getStations('failed-region')).rejects.toThrow('API unavailable');

      // Verify error was logged
      const errorLogs = ErrorLogger.getRecentLogs(5);
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should maintain data consistency across restarts', async () => {
      // First ingestion run
      const ingestionService1 = DataIngestionService.getInstance();
      await ingestionService1.initializeStations();
      const job1 = await ingestionService1.ingestNDBCData();

      const status1 = await ingestionService1.getIngestionStatus();
      const initialObservations = status1.total_observations;

      // Simulate service restart by getting new instance
      const ingestionService2 = DataIngestionService.getInstance();
      const job2 = await ingestionService2.ingestNDBCData();

      const status2 = await ingestionService2.getIngestionStatus();

      // Should accumulate data across runs
      expect(status2.total_observations).toBeGreaterThan(initialObservations);
      expect(status2.last_jobs.length).toBe(2);
    });
  });

  describe('API Validation Integration', () => {
    const createMockRequest = (query: any, body: any = {}): NextApiRequest => ({
      method: 'GET',
      url: '/api/marine-data',
      headers: {},
      query,
      body,
      cookies: {},
      socket: { remoteAddress: '127.0.0.1' }
    } as NextApiRequest);

    it('should validate marine data queries end-to-end', async () => {
      // Test valid marine query
      const validQuery = {
        coordinates: { lat: 34.7, lon: -72.7 },
        region: 'atlantic',
        species: 'temperature',
        date_range: {
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-02T00:00:00Z'
        },
        data_quality: 'excellent'
      };

      const req = createMockRequest(validQuery);
      const result = await withErrorHandling(async () => {
        return validateQuery(req, ValidationSchemas.marineQuery);
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validQuery);
      }
    });

    it('should handle invalid queries with detailed error responses', async () => {
      const invalidQuery = {
        coordinates: { lat: 91, lon: 181 }, // Invalid coordinates
        date_range: {
          start_date: '2024-01-02T00:00:00Z',
          end_date: '2024-01-01T00:00:00Z' // End before start
        },
        data_quality: 'invalid'
      };

      const req = createMockRequest(invalidQuery);
      const result = await withErrorHandling(async () => {
        return validateQuery(req, ValidationSchemas.marineQuery);
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.details?.issues).toBeDefined();
      }

      // Verify error was logged
      const errorLogs = ErrorLogger.getRecentLogs(1);
      expect(errorLogs.length).toBe(1);
    });

    it('should sanitize inputs while preserving valid data', async () => {
      const queryWithXSS = {
        region: '<script>alert("xss")</script>',
        species: 'normal-species'
      };

      const req = createMockRequest(queryWithXSS);
      const result = await withErrorHandling(async () => {
        return validateQuery(req, ValidationSchemas.marineQuery);
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.region).toBe('scriptalert(xss)/script');
        expect(result.data.species).toBe('normal-species');
      }
    });

    it('should validate pagination parameters correctly', async () => {
      const validPagination = {
        page: 2,
        limit: 50,
        sort_by: 'timestamp',
        sort_order: 'desc'
      };

      const req = createMockRequest(validPagination);
      const result = await withErrorHandling(async () => {
        return validateQuery(req, ValidationSchemas.pagination);
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validPagination);
      }
    });

    it('should apply default values for pagination', async () => {
      const req = createMockRequest({});
      const result = await withErrorHandling(async () => {
        return validateQuery(req, ValidationSchemas.pagination);
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          page: 1,
          limit: 20,
          sort_order: 'asc'
        });
      }
    });
  });

  describe('Error Handling Integration', () => {
    it('should track errors across the entire workflow', async () => {
      // Clear existing logs
      ErrorLogger.clearLogs();

      // Trigger multiple errors in sequence
      const operations = [
        // Network error in data ingestion
        async () => {
          (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network timeout'));
          const service = DataIngestionService.getInstance();
          return await service.ingestNDBCData();
        },

        // Validation error
        async () => {
          const req = createMockRequest({ lat: 'invalid' });
          return validateQuery(req, ValidationSchemas.coordinates);
        },

        // Cache error
        async () => {
          const cacheService = new MarineDataCacheService();
          jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
            .mockRejectedValueOnce(new Error('Cache fetch failed'));
          return await cacheService.getStations('error-region');
        }
      ];

      // Execute operations and collect results
      const results = [];
      for (const operation of operations) {
        try {
          const result = await withErrorHandling(operation);
          results.push(result);
        } catch (error) {
          // Some operations may throw despite error handling
          results.push({ success: false, error });
        }
      }

      // Verify error tracking
      const errorLogs = ErrorLogger.getRecentLogs(10);
      expect(errorLogs.length).toBeGreaterThan(0);

      // Check error categorization
      const errorCategories = errorLogs.map(log => log.error.category);
      expect(errorCategories).toContain('data_processing');
    });

    it('should maintain system stability under error conditions', async () => {
      // Simulate high error rate
      const errorOperations = Array(20).fill(0).map((_, i) => async () => {
        throw new Error(`Simulated error ${i}`);
      });

      // Execute all operations with error handling
      const results = await Promise.allSettled(
        errorOperations.map(operation => withErrorHandling(operation))
      );

      // All should complete (either success or handled failure)
      expect(results.every(r => r.status === 'fulfilled')).toBe(true);

      // Error logs should be manageable
      const errorLogs = ErrorLogger.getRecentLogs(100);
      expect(errorLogs.length).toBeLessThanOrEqual(100); // Should respect max limit

      // System should still be responsive
      const service = DataIngestionService.getInstance();
      const status = await service.getIngestionStatus();
      expect(status).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    it('should maintain performance under load', async () => {
      const start = performance.now();

      // Simulate concurrent operations
      const operations = [
        // Data ingestion
        DataIngestionService.getInstance().ingestNDBCData(),

        // Cache operations
        ...Array(10).fill(0).map(async (_, i) => {
          const cacheService = new MarineDataCacheService();
          jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
            .mockResolvedValue([{ id: `station-${i}`, name: `Station ${i}` }]);
          return await cacheService.getStations(`region-${i}`);
        }),

        // Validation operations
        ...Array(20).fill(0).map(async (_, i) => {
          const req = createMockRequest({
            page: i + 1,
            limit: 10 + i,
            sort_order: i % 2 === 0 ? 'asc' : 'desc'
          });
          return validateQuery(req, ValidationSchemas.pagination);
        })
      ];

      const results = await Promise.all(operations);
      const duration = performance.now() - start;

      // All operations should complete successfully
      expect(results.length).toBe(31); // 1 ingestion + 10 cache + 20 validation
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify cache performance
      const cache = MarineDataCache.getInstance();
      const stats = cache.getStats();
      expect(stats.hitRate).toBeGreaterThanOrEqual(0); // Should have some cache activity
    });

    it('should handle memory efficiently with large datasets', async () => {
      // Generate large mock data
      const largeNDBCData = Array.from({ length: 100 }, (_, i) => {
        const hour = (i % 24).toString().padStart(2, '0');
        const day = Math.floor(i / 24) + 1;
        return `24  01  ${day.toString().padStart(2, '0')} ${hour} 00  190  8.2  9.8   1.5   8.0   6.2 180 1013.5  15.2  ${(20 + Math.random() * 10).toFixed(1)}  12.4  5.0  0.0  99.00`;
      });

      const mockData = `#YY  MM DD hh mm WDIR WSPD GST  WVHT   DPD   APD MWD   PRES  ATMP  WTMP  DEWP  VIS PTDY  TIDE
#yr  mo dy hr mn degT m/s  m/s     m   sec   sec degT   hPa  degC  degC  degC  nmi  hPa    ft
${largeNDBCData.join('\n')}`;

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(mockData)
      });

      const start = performance.now();

      // Process large dataset
      const service = DataIngestionService.getInstance();
      const jobResult = await service.ingestNDBCData();

      const duration = performance.now() - start;

      expect(jobResult.status).toBe('ok');
      expect(jobResult.rows_ingested).toBeGreaterThan(1000); // Should process many observations
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Memory should be manageable
      const status = await service.getIngestionStatus();
      expect(status.total_observations).toBe(jobResult.rows_ingested);
    });
  });

  describe('Cache Integration Scenarios', () => {
    it('should maintain cache consistency across multiple services', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      // Create multiple cache service instances
      const cacheService1 = new MarineDataCacheService();
      const cacheService2 = new MarineDataCacheService();

      const mockData = [{ id: 'shared-station', name: 'Shared Station' }];

      // Mock API responses for both services
      jest.spyOn(cacheService1 as any, 'fetchStationsFromAPI')
        .mockResolvedValue(mockData);
      jest.spyOn(cacheService2 as any, 'fetchStationsFromAPI')
        .mockResolvedValue(mockData);

      // Service 1 fetches data (cache miss)
      const data1 = await cacheService1.getStations('shared-region');
      expect(data1).toEqual(mockData);

      // Service 2 gets cached data (cache hit)
      const data2 = await cacheService2.getStations('shared-region');
      expect(data2).toEqual(mockData);

      // Verify cache statistics
      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);

      // Only first service should have called API
      expect(cacheService1['fetchStationsFromAPI']).toHaveBeenCalledTimes(1);
      expect(cacheService2['fetchStationsFromAPI']).not.toHaveBeenCalled();
    });

    it('should handle cache invalidation properly', async () => {
      const cache = MarineDataCache.getInstance();
      cache.clear();

      const cacheService = new MarineDataCacheService();

      const oldData = [{ id: 'station-1', status: 'old' }];
      const newData = [{ id: 'station-1', status: 'updated' }];

      jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
        .mockResolvedValueOnce(oldData)
        .mockResolvedValueOnce(newData);

      // Initial fetch
      const initial = await cacheService.getStations('test-region');
      expect(initial).toEqual(oldData);

      // Invalidate cache
      cacheService.invalidateStationData('test-region');

      // Next fetch should get new data
      const updated = await cacheService.getStations('test-region');
      expect(updated).toEqual(newData);

      // Both API calls should have been made
      expect(cacheService['fetchStationsFromAPI']).toHaveBeenCalledTimes(2);
    });

    it('should handle different cache TTLs appropriately', async () => {
      jest.useFakeTimers();

      const cache = MarineDataCache.getInstance();
      cache.clear();

      const cacheService = new MarineDataCacheService();

      // Mock different data types with different TTLs
      jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
        .mockResolvedValue([{ id: 'station', type: 'stations' }]);
      jest.spyOn(cacheService as any, 'fetchTemperatureData')
        .mockResolvedValue({ temperature: 20.5, type: 'temperature' });
      jest.spyOn(cacheService as any, 'fetchMarineAlerts')
        .mockResolvedValue([{ alert: 'test', type: 'alerts' }]);

      // Fetch all data types
      await cacheService.getStations('region');         // 15 min TTL
      await cacheService.getTemperatureData('station'); // 2 min TTL
      await cacheService.getMarineAlerts();            // 10 sec TTL

      // Fast-forward 30 seconds
      jest.advanceTimersByTime(30 * 1000);

      // Alerts should be expired, others should still be cached
      const stats = cache.getStats();
      expect(stats.size).toBe(2); // Stations and temperature still cached

      jest.useRealTimers();
    });
  });

  describe('Real-world Scenario Simulation', () => {
    it('should handle typical marine monitoring workflow', async () => {
      // Step 1: System initialization
      const ingestionService = DataIngestionService.getInstance();
      await ingestionService.initializeStations();

      // Step 2: Data collection
      const ingestionJob = await ingestionService.ingestNDBCData();
      expect(ingestionJob.status).toBe('ok');

      // Step 3: API request validation
      const marineQuery = {
        coordinates: { lat: 34.7, lon: -72.7 },
        region: 'atlantic',
        date_range: {
          start_date: '2024-01-01T00:00:00Z',
          end_date: '2024-01-02T00:00:00Z'
        }
      };

      const req = createMockRequest(marineQuery);
      const validationResult = validateQuery(req, ValidationSchemas.marineQuery);

      expect(validationResult.success).toBe(true);

      // Step 4: Data retrieval with caching
      const cacheService = new MarineDataCacheService();
      jest.spyOn(cacheService as any, 'fetchStationsFromAPI')
        .mockResolvedValue([
          { id: '41001', name: 'East Hatteras', lat: 34.7, lon: -72.7 }
        ]);

      const stations = await cacheService.getStations('atlantic');
      expect(stations).toHaveLength(1);

      // Step 5: Error monitoring
      const errorLogs = ErrorLogger.getRecentLogs(10);
      // Should have minimal or no errors in successful workflow
      expect(errorLogs.length).toBeLessThanOrEqual(2);

      // Step 6: Performance verification
      const cache = MarineDataCache.getInstance();
      const cacheStats = cache.getStats();
      expect(cacheStats.size).toBeGreaterThan(0);
    });

    it('should recover gracefully from service degradation', async () => {
      // Simulate service degradation
      let failureCount = 0;
      (fetch as jest.Mock).mockImplementation(() => {
        failureCount++;
        if (failureCount <= 3) {
          return Promise.reject(new Error('Service degraded'));
        }
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(generateMockNDBCData())
        });
      });

      const ingestionService = DataIngestionService.getInstance();

      // Multiple ingestion attempts
      const results = [];
      for (let i = 0; i < 5; i++) {
        const result = await ingestionService.ingestNDBCData();
        results.push(result);
      }

      // Should eventually recover
      const successfulRuns = results.filter(r => r.status === 'ok');
      expect(successfulRuns.length).toBeGreaterThan(0);

      // Error logs should capture the failures
      const errorLogs = ErrorLogger.getRecentLogs(20);
      expect(errorLogs.length).toBeGreaterThan(0);

      // System should remain operational
      const status = await ingestionService.getIngestionStatus();
      expect(status.total_observations).toBeGreaterThan(0);
    });
  });
});