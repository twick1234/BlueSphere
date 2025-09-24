/**
 * Comprehensive Test Utilities and Helpers for BlueSphere
 * Provides mock data, test utilities, and performance testing helpers
 */

import { MarineHeatwaveAlert } from '@/lib/marine-heatwave-alerts';
import { SharkData, SharkTrackPoint } from '@/lib/shark-tracking';
import { BuoyObservation, Station, JobRun } from '@/lib/data-ingestion';
import { EnhancedError } from '@/lib/error-handling';
import { NextApiRequest, NextApiResponse } from 'next';

// Memory and performance monitoring utilities
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: {
    initial: NodeJS.MemoryUsage;
    final: NodeJS.MemoryUsage;
    delta: NodeJS.MemoryUsage;
  };
  operationsPerSecond?: number;
}

export class TestPerformanceMonitor {
  private startTime: number = 0;
  private initialMemory: NodeJS.MemoryUsage;

  constructor() {
    this.initialMemory = process.memoryUsage();
  }

  start(): void {
    this.startTime = performance.now();
    this.initialMemory = process.memoryUsage();
  }

  end(operationCount?: number): PerformanceMetrics {
    const executionTime = performance.now() - this.startTime;
    const finalMemory = process.memoryUsage();

    const delta: NodeJS.MemoryUsage = {
      rss: finalMemory.rss - this.initialMemory.rss,
      heapUsed: finalMemory.heapUsed - this.initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - this.initialMemory.heapTotal,
      external: finalMemory.external - this.initialMemory.external,
      arrayBuffers: finalMemory.arrayBuffers - this.initialMemory.arrayBuffers
    };

    return {
      executionTime,
      memoryUsage: {
        initial: this.initialMemory,
        final: finalMemory,
        delta
      },
      operationsPerSecond: operationCount ? (operationCount / (executionTime / 1000)) : undefined
    };
  }

  static async measureAsync<T>(
    operation: () => Promise<T>,
    operationCount?: number
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const monitor = new TestPerformanceMonitor();
    monitor.start();

    const result = await operation();
    const metrics = monitor.end(operationCount);

    return { result, metrics };
  }

  static measure<T>(
    operation: () => T,
    operationCount?: number
  ): { result: T; metrics: PerformanceMetrics } {
    const monitor = new TestPerformanceMonitor();
    monitor.start();

    const result = operation();
    const metrics = monitor.end(operationCount);

    return { result, metrics };
  }
}

// Mock data generators
export class MockDataGenerator {
  static generateMarineHeatwave(overrides: Partial<MarineHeatwaveAlert> = {}): MarineHeatwaveAlert {
    const id = overrides.id || `test_heatwave_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      region: 'Test Pacific Region',
      coordinates: {
        lat: -10 + Math.random() * 20,
        lon: 140 + Math.random() * 20,
        bounds: {
          north: -5,
          south: -15,
          east: 155,
          west: 145
        }
      },
      severity: 'moderate',
      intensity: 1.5 + Math.random() * 2,
      duration_days: 10 + Math.floor(Math.random() * 20),
      start_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      confidence_level: 70 + Math.floor(Math.random() * 30),
      affected_area_km2: 10000 + Math.floor(Math.random() * 90000),
      baseline_temperature: 24 + Math.random() * 4,
      current_temperature: 26 + Math.random() * 4,
      ecological_impact: {
        risk_level: 'moderate',
        affected_species: ['Coral polyps', 'Tropical fish', 'Sea turtles'],
        coral_bleaching_risk: Math.floor(Math.random() * 100),
        fisheries_impact: 'moderate'
      },
      historical_context: {
        rank_in_region: Math.floor(Math.random() * 20) + 1,
        return_period_years: Math.floor(Math.random() * 15) + 2,
        similar_events: []
      },
      data_sources: ['NOAA SST', 'Satellite Observations'],
      last_updated: new Date().toISOString(),
      ...overrides
    };
  }

  static generateMultipleHeatwaves(count: number, baseOverrides: Partial<MarineHeatwaveAlert> = {}): MarineHeatwaveAlert[] {
    return Array.from({ length: count }, (_, i) =>
      this.generateMarineHeatwave({
        ...baseOverrides,
        id: `batch_heatwave_${i}_${Date.now()}`
      })
    );
  }

  static generateSharkData(overrides: Partial<SharkData> = {}): SharkData {
    const species = [
      'Carcharodon carcharias',
      'Galeocerdo cuvier',
      'Sphyrna lewini',
      'Rhincodon typus',
      'Prionace glauca'
    ];

    const organizations = [
      'OCEARCH',
      'Stanford Tagging Consortium',
      'NOAA Fisheries',
      'Marine Conservation International'
    ];

    const id = overrides.id || `test_shark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      name: `Test Shark ${Math.floor(Math.random() * 1000)}`,
      species: species[Math.floor(Math.random() * species.length)],
      sex: Math.random() > 0.5 ? 'M' : 'F',
      length_m: 2 + Math.random() * 4,
      weight_kg: 100 + Math.floor(Math.random() * 1500),
      tag_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_ping: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lat: -80 + Math.random() * 160,
      lon: -180 + Math.random() * 360,
      depth_m: Math.floor(Math.random() * 500),
      water_temp_c: 5 + Math.random() * 25,
      location_description: 'Test Ocean Region',
      tracking_organization: organizations[Math.floor(Math.random() * organizations.length)],
      confidence_level: Math.random() > 0.2 ? 'High' : Math.random() > 0.5 ? 'Medium' : 'Low',
      status: Math.random() > 0.1 ? 'Active' : Math.random() > 0.5 ? 'Inactive' : 'Lost_Signal',
      ...overrides
    };
  }

  static generateSharkTrack(sharkId: string, pointCount: number, startDate?: Date): SharkTrackPoint[] {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let lat = -10 + Math.random() * 20;
    let lon = 140 + Math.random() * 20;

    return Array.from({ length: pointCount }, (_, i) => {
      // Simulate realistic movement
      lat += (Math.random() - 0.5) * 0.1;
      lon += (Math.random() - 0.5) * 0.1;

      // Keep coordinates in bounds
      lat = Math.max(-85, Math.min(85, lat));
      lon = ((lon + 180) % 360) - 180;

      const timestamp = new Date(start.getTime() + i * 3600000); // Hourly points

      return {
        shark_id: sharkId,
        timestamp: timestamp.toISOString(),
        lat: Math.round(lat * 10000) / 10000,
        lon: Math.round(lon * 10000) / 10000,
        depth_m: Math.floor(Math.random() * 200),
        water_temp_c: Math.round((15 + Math.random() * 15) * 10) / 10,
        distance_traveled_km: Math.round((1 + Math.random() * 5) * 100) / 100,
        speed_kmh: Math.round((0.5 + Math.random() * 3) * 100) / 100,
        direction_degrees: Math.floor(Math.random() * 360),
        location_quality: Math.random() > 0.8 ? 'Argos_A' : 'GPS'
      };
    });
  }

  static generateBuoyObservation(overrides: Partial<BuoyObservation> = {}): BuoyObservation {
    return {
      station_id: 'TEST_STATION_001',
      time: new Date().toISOString(),
      sst_c: 15 + Math.random() * 15,
      qc_flag: Math.random() > 0.1 ? 1 : 2,
      lat: -80 + Math.random() * 160,
      lon: -180 + Math.random() * 360,
      source: 'TEST_NDBC',
      ...overrides
    };
  }

  static generateStation(overrides: Partial<Station> = {}): Station {
    return {
      station_id: `TEST_${Math.floor(Math.random() * 90000) + 10000}`,
      name: `Test Station ${Math.floor(Math.random() * 1000)}`,
      lat: -80 + Math.random() * 160,
      lon: -180 + Math.random() * 360,
      provider: 'NDBC',
      ...overrides
    };
  }

  static generateJobRun(overrides: Partial<JobRun> = {}): JobRun {
    const started = new Date(Date.now() - Math.random() * 3600000);
    const ended = new Date(started.getTime() + Math.random() * 1800000);

    return {
      source: 'TEST_SOURCE',
      started: started.toISOString(),
      ended: ended.toISOString(),
      status: Math.random() > 0.1 ? 'ok' : 'failed',
      rows_ingested: Math.floor(Math.random() * 10000),
      ...overrides
    };
  }
}

// API mock utilities
export class ApiMockHelper {
  static createMockRequest(overrides: Partial<NextApiRequest> = {}): NextApiRequest {
    return {
      method: 'GET',
      url: '/api/test',
      headers: {},
      query: {},
      body: {},
      cookies: {},
      socket: { remoteAddress: '127.0.0.1' },
      ...overrides
    } as NextApiRequest;
  }

  static createMockResponse(): jest.Mocked<NextApiResponse> {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis()
    };
    return res as any;
  }

  static mockFetchSuccess(data: any): void {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    });
  }

  static mockFetchError(status: number = 500, message: string = 'Server Error'): void {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status,
      statusText: message,
      json: () => Promise.resolve({ error: message }),
      text: () => Promise.resolve(message)
    });
  }

  static mockFetchNetworkError(message: string = 'Network Error'): void {
    (global.fetch as jest.Mock).mockRejectedValue(new Error(message));
  }
}

// Test data validation utilities
export class TestDataValidator {
  static validateMarineHeatwave(heatwave: any): boolean {
    const requiredFields = [
      'id', 'region', 'coordinates', 'severity', 'intensity',
      'duration_days', 'start_date', 'status', 'confidence_level',
      'affected_area_km2', 'baseline_temperature', 'current_temperature',
      'ecological_impact', 'historical_context', 'data_sources', 'last_updated'
    ];

    return requiredFields.every(field => heatwave.hasOwnProperty(field)) &&
           typeof heatwave.coordinates === 'object' &&
           typeof heatwave.ecological_impact === 'object' &&
           Array.isArray(heatwave.data_sources);
  }

  static validateSharkData(shark: any): boolean {
    const requiredFields = [
      'id', 'name', 'species', 'sex', 'length_m', 'tag_date',
      'last_ping', 'lat', 'lon', 'tracking_organization', 'status'
    ];

    return requiredFields.every(field => shark.hasOwnProperty(field)) &&
           typeof shark.lat === 'number' &&
           typeof shark.lon === 'number' &&
           typeof shark.length_m === 'number' &&
           shark.lat >= -90 && shark.lat <= 90 &&
           shark.lon >= -180 && shark.lon <= 180;
  }

  static validateCoordinates(lat: number, lon: number): boolean {
    return lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
  }

  static validateTimestamp(timestamp: string): boolean {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) && date.toISOString() === timestamp;
  }
}

// Error testing utilities
export class ErrorTestHelper {
  static createTestError(
    message: string,
    code: string = 'TEST_ERROR',
    category: string = 'test'
  ): EnhancedError {
    const error = new Error(message) as EnhancedError;

    Object.defineProperties(error, {
      code: { value: code, enumerable: true },
      category: { value: category, enumerable: true },
      severity: { value: 'medium', enumerable: true },
      context: { value: { test: true }, enumerable: true },
      timestamp: { value: new Date(), enumerable: true },
      user_friendly_message: { value: 'Test error occurred', enumerable: true },
      recovery_suggestions: { value: ['Try again', 'Contact support'], enumerable: true },
      should_report: { value: true, enumerable: true }
    });

    return error;
  }

  static createNetworkError(): Error {
    return new Error('Network request failed');
  }

  static createValidationError(field: string): Error {
    return new Error(`Validation failed for field: ${field}`);
  }
}

// Cache testing utilities
export class CacheTestHelper {
  static simulateCacheLoad<T>(cache: any, operations: number, dataGenerator: () => T): void {
    for (let i = 0; i < operations; i++) {
      const key = `test_key_${i}`;
      const data = dataGenerator();
      cache.set(key, data);
    }
  }

  static validateCachePerformance(
    cache: any,
    expectedMaxSize: number,
    expectedHitRate?: number
  ): boolean {
    const stats = cache.getStats();

    if (stats.size > expectedMaxSize) {
      return false;
    }

    if (expectedHitRate !== undefined && stats.hitRate < expectedHitRate) {
      return false;
    }

    return true;
  }

  static async stressCacheOperations(
    cache: any,
    operations: number,
    keyRange: number = 1000
  ): Promise<PerformanceMetrics> {
    const monitor = new TestPerformanceMonitor();
    monitor.start();

    // Mix of set and get operations
    for (let i = 0; i < operations; i++) {
      const key = `stress_test_${i % keyRange}`;

      if (i % 3 === 0) {
        cache.set(key, { data: `value_${i}`, timestamp: Date.now() });
      } else {
        await cache.get(key);
      }
    }

    return monitor.end(operations);
  }
}

// Database testing utilities
export class DatabaseTestHelper {
  static createTestDatabase(): any {
    return {
      stations: [] as Station[],
      observations: [] as BuoyObservation[],
      jobRuns: [] as JobRun[],

      async insertStation(station: Station): Promise<void> {
        this.stations.push(station);
      },

      async insertObservation(obs: BuoyObservation): Promise<void> {
        this.observations.push(obs);
      },

      async insertJobRun(job: JobRun): Promise<number> {
        const id = this.jobRuns.length + 1;
        this.jobRuns.push({ ...job, id });
        return id;
      },

      async getStations(): Promise<Station[]> {
        return this.stations;
      },

      async getObservations(filters?: any): Promise<BuoyObservation[]> {
        let filtered = this.observations;

        if (filters?.station_id) {
          filtered = filtered.filter(obs => obs.station_id === filters.station_id);
        }
        if (filters?.limit) {
          filtered = filtered.slice(0, filters.limit);
        }

        return filtered;
      },

      clear(): void {
        this.stations = [];
        this.observations = [];
        this.jobRuns = [];
      }
    };
  }

  static populateTestDatabase(db: any, stationCount: number, observationCount: number): void {
    // Add test stations
    for (let i = 0; i < stationCount; i++) {
      db.insertStation(MockDataGenerator.generateStation({
        station_id: `TEST_${i.toString().padStart(3, '0')}`
      }));
    }

    // Add test observations
    for (let i = 0; i < observationCount; i++) {
      db.insertObservation(MockDataGenerator.generateBuoyObservation({
        station_id: `TEST_${(i % stationCount).toString().padStart(3, '0')}`
      }));
    }
  }
}

// Integration testing utilities
export class IntegrationTestHelper {
  static async runWorkflowTest<T>(
    workflow: () => Promise<T>,
    validation: (result: T) => boolean,
    timeoutMs: number = 10000
  ): Promise<{ result: T; metrics: PerformanceMetrics; valid: boolean }> {
    const monitor = new TestPerformanceMonitor();
    monitor.start();

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Workflow timeout')), timeoutMs);
    });

    try {
      const result = await Promise.race([workflow(), timeoutPromise]);
      const metrics = monitor.end();
      const valid = validation(result);

      return { result, metrics, valid };
    } catch (error) {
      const metrics = monitor.end();
      throw new Error(`Workflow failed: ${error}`);
    }
  }

  static async testErrorRecovery<T>(
    operation: () => Promise<T>,
    expectedError: string,
    recovery: () => Promise<T>
  ): Promise<{ recovered: boolean; result?: T }> {
    try {
      await operation();
      return { recovered: false };
    } catch (error) {
      if ((error as Error).message.includes(expectedError)) {
        try {
          const result = await recovery();
          return { recovered: true, result };
        } catch (recoveryError) {
          return { recovered: false };
        }
      }
      throw error;
    }
  }

  static async testConcurrency<T>(
    operation: () => Promise<T>,
    concurrentCalls: number,
    expectedSuccessRate: number = 0.9
  ): Promise<{ successRate: number; results: T[]; metrics: PerformanceMetrics }> {
    const monitor = new TestPerformanceMonitor();
    monitor.start();

    const promises = Array.from({ length: concurrentCalls }, () =>
      operation().catch(error => ({ error }))
    );

    const results = await Promise.all(promises);
    const successful = results.filter(result => !('error' in result)) as T[];
    const successRate = successful.length / concurrentCalls;

    const metrics = monitor.end(concurrentCalls);

    return { successRate, results: successful, metrics };
  }
}

// Memory leak detection utilities
export class MemoryLeakDetector {
  private baseline: NodeJS.MemoryUsage;
  private measurements: NodeJS.MemoryUsage[] = [];

  constructor() {
    this.baseline = process.memoryUsage();
  }

  takeMeasurement(): void {
    this.measurements.push(process.memoryUsage());
  }

  detectLeak(thresholdMB: number = 50): {
    hasLeak: boolean;
    growth: number;
    measurements: number;
  } {
    if (this.measurements.length < 2) {
      return { hasLeak: false, growth: 0, measurements: this.measurements.length };
    }

    const latest = this.measurements[this.measurements.length - 1];
    const growthBytes = latest.heapUsed - this.baseline.heapUsed;
    const growthMB = growthBytes / (1024 * 1024);

    return {
      hasLeak: growthMB > thresholdMB,
      growth: growthMB,
      measurements: this.measurements.length
    };
  }

  reset(): void {
    this.baseline = process.memoryUsage();
    this.measurements = [];
  }
}

// Test suite utilities
export class TestSuiteUtils {
  static setupTestEnvironment(): void {
    // Setup global mocks
    global.fetch = jest.fn();

    // Mock console methods
    const consoleMethods = ['log', 'error', 'warn', 'info', 'debug'];
    consoleMethods.forEach(method => {
      (console as any)[method] = jest.fn();
    });

    // Setup performance APIs if not available
    if (typeof performance === 'undefined') {
      (global as any).performance = {
        now: () => Date.now(),
        mark: jest.fn(),
        measure: jest.fn()
      };
    }
  }

  static cleanupTestEnvironment(): void {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  }

  static async waitFor(
    condition: () => boolean,
    timeoutMs: number = 5000,
    intervalMs: number = 100
  ): Promise<void> {
    const start = Date.now();

    while (!condition()) {
      if (Date.now() - start > timeoutMs) {
        throw new Error('Condition not met within timeout');
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  static createProgressReporter(totalTests: number): (testName: string) => void {
    let completed = 0;

    return (testName: string) => {
      completed++;
      const percentage = Math.round((completed / totalTests) * 100);
      console.log(`[${percentage}%] Completed: ${testName}`);
    };
  }
}

// Export everything for easy importing
export default {
  MockDataGenerator,
  ApiMockHelper,
  TestDataValidator,
  ErrorTestHelper,
  CacheTestHelper,
  DatabaseTestHelper,
  IntegrationTestHelper,
  MemoryLeakDetector,
  TestSuiteUtils,
  TestPerformanceMonitor
};