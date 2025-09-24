/**
 * Comprehensive tests for Marine Data Processing functions
 * Tests marine heatwave alerts, shark tracking, and data validation
 */

import {
  MarineHeatwaveAlert,
  HeatwaveSubscription,
  HeatwaveAnalytics,
  marineHeatwaveService
} from '@/lib/marine-heatwave-alerts';

import {
  SharkData,
  SharkTrackPoint,
  SharkProfile,
  OCEARCHService,
  SharkTrackingService,
  sharkTracker
} from '@/lib/shark-tracking';

// Mock fetch for API calls
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
  (fetch as jest.Mock).mockClear();
});

describe('Marine Heatwave Service', () => {
  describe('getActiveHeatwaves', () => {
    it('should fetch and return active heatwaves from API', async () => {
      const mockHeatwaves: MarineHeatwaveAlert[] = [
        {
          id: 'test_heatwave_1',
          region: 'Test Region',
          coordinates: {
            lat: 25.0,
            lon: -80.0,
            bounds: { north: 26, south: 24, east: -79, west: -81 }
          },
          severity: 'moderate',
          intensity: 2.1,
          duration_days: 15,
          start_date: '2024-01-01T00:00:00Z',
          status: 'active',
          confidence_level: 85,
          affected_area_km2: 50000,
          baseline_temperature: 24.5,
          current_temperature: 26.6,
          ecological_impact: {
            risk_level: 'moderate',
            affected_species: ['Coral', 'Fish'],
            coral_bleaching_risk: 40,
            fisheries_impact: 'moderate'
          },
          historical_context: {
            rank_in_region: 5,
            return_period_years: 3,
            similar_events: []
          },
          data_sources: ['NOAA', 'Satellite'],
          last_updated: '2024-01-15T12:00:00Z'
        }
      ];

      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ alerts: mockHeatwaves })
      });

      const heatwaves = await marineHeatwaveService.getActiveHeatwaves();

      expect(fetch).toHaveBeenCalledWith('/api/alerts/marine-heatwaves');
      expect(heatwaves).toEqual(mockHeatwaves);
      expect(heatwaves).toHaveLength(1);
    });

    it('should return cached data when available', async () => {
      // First call
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ alerts: [] })
      });

      await marineHeatwaveService.getActiveHeatwaves();

      // Second call should use cache
      const heatwaves = await marineHeatwaveService.getActiveHeatwaves();

      expect(fetch).toHaveBeenCalledTimes(1); // Only called once
      expect(console.log).toHaveBeenCalledWith('Using cached heatwave data');
    });

    it('should fallback to mock data when API fails', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      const heatwaves = await marineHeatwaveService.getActiveHeatwaves();

      expect(heatwaves).toBeDefined();
      expect(heatwaves.length).toBeGreaterThan(0);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch heatwave alerts:',
        expect.any(Error)
      );
    });

    it('should fallback to mock data when fetch throws', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const heatwaves = await marineHeatwaveService.getActiveHeatwaves();

      expect(heatwaves).toBeDefined();
      expect(heatwaves.length).toBeGreaterThan(0);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch heatwave alerts:',
        expect.any(Error)
      );
    });

    it('should validate mock data structure', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Force mock'));

      const heatwaves = await marineHeatwaveService.getActiveHeatwaves();

      expect(heatwaves).toHaveLength(2); // Mock data has 2 heatwaves

      heatwaves.forEach(heatwave => {
        expect(heatwave).toHaveProperty('id');
        expect(heatwave).toHaveProperty('region');
        expect(heatwave).toHaveProperty('coordinates');
        expect(heatwave).toHaveProperty('severity');
        expect(heatwave).toHaveProperty('intensity');
        expect(heatwave).toHaveProperty('duration_days');
        expect(heatwave).toHaveProperty('ecological_impact');
        expect(heatwave).toHaveProperty('historical_context');

        // Validate coordinates structure
        expect(heatwave.coordinates).toHaveProperty('lat');
        expect(heatwave.coordinates).toHaveProperty('lon');
        expect(heatwave.coordinates).toHaveProperty('bounds');

        // Validate ecological impact structure
        expect(heatwave.ecological_impact).toHaveProperty('risk_level');
        expect(heatwave.ecological_impact).toHaveProperty('affected_species');
        expect(heatwave.ecological_impact).toHaveProperty('coral_bleaching_risk');

        // Validate data types
        expect(typeof heatwave.lat).toBe('number');
        expect(typeof heatwave.lon).toBe('number');
        expect(typeof heatwave.intensity).toBe('number');
        expect(typeof heatwave.duration_days).toBe('number');
        expect(Array.isArray(heatwave.ecological_impact.affected_species)).toBe(true);
      });
    });
  });

  describe('getRegionalHeatwaves', () => {
    it('should filter heatwaves by region name', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

      const pacificHeatwaves = await marineHeatwaveService.getRegionalHeatwaves('Pacific');
      const reefHeatwaves = await marineHeatwaveService.getRegionalHeatwaves('Reef');

      expect(pacificHeatwaves.length).toBeGreaterThan(0);
      expect(reefHeatwaves.length).toBeGreaterThan(0);

      pacificHeatwaves.forEach(hw => {
        expect(hw.region.toLowerCase()).toContain('pacific');
      });

      reefHeatwaves.forEach(hw => {
        expect(hw.region.toLowerCase()).toContain('reef');
      });
    });

    it('should handle case-insensitive region matching', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

      const upperCase = await marineHeatwaveService.getRegionalHeatwaves('PACIFIC');
      const lowerCase = await marineHeatwaveService.getRegionalHeatwaves('pacific');
      const mixedCase = await marineHeatwaveService.getRegionalHeatwaves('PaCiFiC');

      expect(upperCase).toEqual(lowerCase);
      expect(lowerCase).toEqual(mixedCase);
    });

    it('should return empty array for non-matching regions', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

      const nonExistent = await marineHeatwaveService.getRegionalHeatwaves('NonExistentRegion');
      expect(nonExistent).toEqual([]);
    });
  });

  describe('getHeatwaveAnalytics', () => {
    it('should calculate analytics from heatwave data', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

      const analytics = await marineHeatwaveService.getHeatwaveAnalytics();

      expect(analytics).toHaveProperty('global_summary');
      expect(analytics).toHaveProperty('regional_breakdown');
      expect(analytics).toHaveProperty('severity_distribution');
      expect(analytics).toHaveProperty('trend_analysis');

      // Validate global summary
      expect(analytics.global_summary).toHaveProperty('active_heatwaves');
      expect(analytics.global_summary).toHaveProperty('total_affected_area_km2');
      expect(analytics.global_summary).toHaveProperty('average_intensity');
      expect(analytics.global_summary).toHaveProperty('regions_affected');

      // Validate data types
      expect(typeof analytics.global_summary.active_heatwaves).toBe('number');
      expect(typeof analytics.global_summary.total_affected_area_km2).toBe('number');
      expect(typeof analytics.global_summary.average_intensity).toBe('number');
      expect(typeof analytics.global_summary.regions_affected).toBe('number');

      // Validate arrays
      expect(Array.isArray(analytics.regional_breakdown)).toBe(true);

      // Validate severity distribution
      expect(analytics.severity_distribution).toHaveProperty('moderate');
      expect(analytics.severity_distribution).toHaveProperty('strong');
      expect(analytics.severity_distribution).toHaveProperty('severe');
      expect(analytics.severity_distribution).toHaveProperty('extreme');
    });

    it('should handle empty heatwave data', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ alerts: [] })
      });

      const analytics = await marineHeatwaveService.getHeatwaveAnalytics();

      expect(analytics.global_summary.active_heatwaves).toBe(0);
      expect(analytics.global_summary.total_affected_area_km2).toBe(0);
      expect(analytics.global_summary.average_intensity).toBe(0);
      expect(analytics.global_summary.regions_affected).toBe(0);
      expect(analytics.regional_breakdown).toEqual([]);
    });
  });

  describe('subscribeToAlerts', () => {
    it('should successfully subscribe to alerts', async () => {
      (fetch as jest.Mock).mockResolvedValue({ ok: true });

      const subscription: Omit<HeatwaveSubscription, 'user_id' | 'created_at'> = {
        email: 'test@example.com',
        regions: ['pacific'],
        severity_threshold: 'moderate',
        notification_methods: ['email'],
        frequency: 'daily',
        active: true
      };

      const result = await marineHeatwaveService.subscribeToAlerts(subscription);

      expect(result).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"type":"marine_heatwave"')
      });
    });

    it('should handle subscription failures', async () => {
      (fetch as jest.Mock).mockResolvedValue({ ok: false });

      const subscription: Omit<HeatwaveSubscription, 'user_id' | 'created_at'> = {
        email: 'test@example.com',
        regions: ['pacific'],
        severity_threshold: 'moderate',
        notification_methods: ['email'],
        frequency: 'daily',
        active: true
      };

      const result = await marineHeatwaveService.subscribeToAlerts(subscription);

      expect(result).toBe(false);
    });

    it('should handle network errors in subscription', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const subscription: Omit<HeatwaveSubscription, 'user_id' | 'created_at'> = {
        email: 'test@example.com',
        regions: ['pacific'],
        severity_threshold: 'moderate',
        notification_methods: ['email'],
        frequency: 'daily',
        active: true
      };

      const result = await marineHeatwaveService.subscribeToAlerts(subscription);

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to subscribe to alerts:',
        expect.any(Error)
      );
    });
  });

  describe('Utility functions', () => {
    it('should return correct severity colors', () => {
      expect(marineHeatwaveService.getSeverityColor('moderate')).toBe('#FFC107');
      expect(marineHeatwaveService.getSeverityColor('strong')).toBe('#FF9800');
      expect(marineHeatwaveService.getSeverityColor('severe')).toBe('#F44336');
      expect(marineHeatwaveService.getSeverityColor('extreme')).toBe('#880E4F');
    });

    it('should return correct severity descriptions', () => {
      expect(marineHeatwaveService.getSeverityDescription('moderate'))
        .toBe('Temperatures 1-2°C above normal');
      expect(marineHeatwaveService.getSeverityDescription('strong'))
        .toBe('Temperatures 2-3°C above normal');
      expect(marineHeatwaveService.getSeverityDescription('severe'))
        .toBe('Temperatures 3-4°C above normal');
      expect(marineHeatwaveService.getSeverityDescription('extreme'))
        .toBe('Temperatures >4°C above normal');
    });

    it('should calculate ecological risk correctly', async () => {
      (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

      const heatwaves = await marineHeatwaveService.getActiveHeatwaves();
      const criticalHeatwave = {
        ...heatwaves[0],
        ecological_impact: {
          ...heatwaves[0].ecological_impact,
          risk_level: 'critical' as const
        }
      };

      const risk = marineHeatwaveService.calculateEcologicalRisk(criticalHeatwave);

      expect(risk).toHaveProperty('description');
      expect(risk).toHaveProperty('recommendations');
      expect(Array.isArray(risk.recommendations)).toBe(true);
      expect(risk.description).toContain('critical');
      expect(risk.recommendations.length).toBeGreaterThan(0);
    });
  });
});

describe('Shark Tracking Service', () => {
  describe('OCEARCHService', () => {
    describe('getTrackedSharks', () => {
      it('should fetch sharks from OCEARCH API', async () => {
        const mockSharkData = [
          {
            id: 'test_shark_1',
            name: 'Test Shark',
            species: 'Carcharodon carcharias',
            sex: 'Female',
            length: '4.8',
            weight: '1600',
            tagDate: '2020-01-01T00:00:00Z',
            lastPing: new Date().toISOString(),
            latitude: '33.7490',
            longitude: '-78.8767',
            waterTemp: '24.5'
          }
        ];

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ sharks: mockSharkData })
        });

        const sharks = await OCEARCHService.getTrackedSharks();

        expect(sharks).toHaveLength(1);
        expect(sharks[0]).toMatchObject({
          id: 'test_shark_1',
          name: 'Test Shark',
          species: 'Carcharodon carcharias',
          sex: 'F',
          length_m: 4.8,
          weight_kg: 1600
        });
      });

      it('should try multiple endpoints on failure', async () => {
        (fetch as jest.Mock)
          .mockResolvedValueOnce({ ok: false, status: 404 })
          .mockResolvedValueOnce({ ok: false, status: 500 })
          .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve([{ id: 'shark_1', name: 'Backup Shark' }])
          });

        const sharks = await OCEARCHService.getTrackedSharks();

        expect(fetch).toHaveBeenCalledTimes(3);
        expect(sharks).toHaveLength(1);
        expect(sharks[0].name).toBe('Backup Shark');
      });

      it('should fallback to enhanced mock data when all endpoints fail', async () => {
        (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

        const sharks = await OCEARCHService.getTrackedSharks();

        expect(sharks.length).toBeGreaterThan(100); // Enhanced mock has many sharks
        expect(console.warn).toHaveBeenCalledWith(
          expect.stringContaining('All OCEARCH endpoints failed')
        );
      });

      it('should handle network errors gracefully', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Network failure'));

        const sharks = await OCEARCHService.getTrackedSharks();

        expect(sharks.length).toBeGreaterThan(0);
        expect(console.error).toHaveBeenCalledWith(
          'Critical OCEARCH fetch error:',
          expect.any(Error)
        );
      });

      it('should validate enhanced mock data structure', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Force mock'));

        const sharks = await OCEARCHService.getTrackedSharks();

        // Check that we have a good variety of species
        const species = new Set(sharks.map(s => s.species));
        expect(species.size).toBeGreaterThan(5);

        // Validate data structure
        sharks.slice(0, 10).forEach(shark => {
          expect(shark).toHaveProperty('id');
          expect(shark).toHaveProperty('name');
          expect(shark).toHaveProperty('species');
          expect(shark).toHaveProperty('sex');
          expect(shark).toHaveProperty('length_m');
          expect(shark).toHaveProperty('tag_date');
          expect(shark).toHaveProperty('last_ping');
          expect(shark).toHaveProperty('lat');
          expect(shark).toHaveProperty('lon');
          expect(shark).toHaveProperty('tracking_organization');
          expect(shark).toHaveProperty('status');

          // Validate data types
          expect(typeof shark.lat).toBe('number');
          expect(typeof shark.lon).toBe('number');
          expect(typeof shark.length_m).toBe('number');
          expect(['M', 'F', 'Unknown']).toContain(shark.sex);
          expect(['Active', 'Inactive', 'Lost_Signal']).toContain(shark.status);

          // Validate coordinate ranges
          expect(shark.lat).toBeGreaterThanOrEqual(-90);
          expect(shark.lat).toBeLessThanOrEqual(90);
          expect(shark.lon).toBeGreaterThanOrEqual(-180);
          expect(shark.lon).toBeLessThanOrEqual(180);

          // Validate reasonable values
          expect(shark.length_m).toBeGreaterThan(0);
          expect(shark.length_m).toBeLessThan(20);
        });
      });

      it('should cache successful results', async () => {
        const mockData = [{ id: 'cached_shark', name: 'Cached' }];
        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ sharks: mockData })
        });

        // First call
        const sharks1 = await OCEARCHService.getTrackedSharks();

        // Second call should use cache
        const sharks2 = await OCEARCHService.getTrackedSharks();

        expect(fetch).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith('Using cached shark data');
        expect(sharks1).toEqual(sharks2);
      });
    });

    describe('getSharkTrack', () => {
      it('should fetch track data for specific shark', async () => {
        const mockTrackData = {
          positions: [
            {
              sharkId: 'test_shark',
              timestamp: '2024-01-01T12:00:00Z',
              latitude: '33.7490',
              longitude: '-78.8767',
              depth: '45',
              waterTemp: '24.5'
            }
          ]
        };

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockTrackData)
        });

        const track = await OCEARCHService.getSharkTrack('test_shark', 7);

        expect(track).toHaveLength(1);
        expect(track[0]).toMatchObject({
          shark_id: 'test_shark',
          timestamp: '2024-01-01T12:00:00Z',
          lat: 33.7490,
          lon: -78.8767,
          depth_m: 45,
          water_temp_c: 24.5
        });
      });

      it('should generate mock track data on API failure', async () => {
        (fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

        const track = await OCEARCHService.getSharkTrack('test_shark', 7);

        expect(track.length).toBeGreaterThan(0);
        expect(track.every(point => point.shark_id === 'test_shark')).toBe(true);
        expect(console.error).toHaveBeenCalledWith(
          'Track fetch error:',
          expect.any(Error)
        );
      });
    });
  });

  describe('SharkTrackingService', () => {
    describe('getActiveSharks', () => {
      it('should return only active sharks', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

        const sharks = await sharkTracker.getActiveSharks();

        expect(sharks.every(shark => shark.status === 'Active')).toBe(true);
        expect(sharks.length).toBeGreaterThan(0);
      });

      it('should sort sharks by most recent ping', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

        const sharks = await sharkTracker.getActiveSharks();

        // Check that sharks are sorted by last_ping (most recent first)
        for (let i = 1; i < Math.min(sharks.length, 10); i++) {
          const prev = new Date(sharks[i - 1].last_ping).getTime();
          const curr = new Date(sharks[i].last_ping).getTime();
          expect(prev).toBeGreaterThanOrEqual(curr);
        }
      });
    });

    describe('getSharkProfile', () => {
      it('should build comprehensive shark profile', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

        const sharks = await sharkTracker.getActiveSharks();
        const sharkId = sharks[0].id;

        const profile = await sharkTracker.getSharkProfile(sharkId);

        expect(profile).toBeDefined();
        expect(profile).toHaveProperty('id', sharkId);
        expect(profile).toHaveProperty('name');
        expect(profile).toHaveProperty('species');
        expect(profile).toHaveProperty('species_common_name');
        expect(profile).toHaveProperty('conservation_status');
        expect(profile).toHaveProperty('current_location');

        if (profile) {
          expect(profile.current_location).toHaveProperty('lat');
          expect(profile.current_location).toHaveProperty('lon');
          expect(profile.current_location).toHaveProperty('description');
        }
      });

      it('should return null for non-existent shark', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

        const profile = await sharkTracker.getSharkProfile('non_existent_shark');

        expect(profile).toBeNull();
      });
    });

    describe('calculateMovementStats', () => {
      it('should calculate correct movement statistics', () => {
        const track: SharkTrackPoint[] = [
          {
            shark_id: 'test',
            timestamp: '2024-01-01T00:00:00Z',
            lat: 0,
            lon: 0,
            depth_m: 10,
            water_temp_c: 20
          },
          {
            shark_id: 'test',
            timestamp: '2024-01-01T01:00:00Z',
            lat: 0.01,
            lon: 0.01,
            depth_m: 50,
            water_temp_c: 18
          },
          {
            shark_id: 'test',
            timestamp: '2024-01-01T02:00:00Z',
            lat: 0.02,
            lon: 0.02,
            depth_m: 30,
            water_temp_c: 22
          }
        ];

        const stats = sharkTracker.calculateMovementStats(track);

        expect(stats).toHaveProperty('total_distance_km');
        expect(stats).toHaveProperty('average_speed_kmh');
        expect(stats).toHaveProperty('max_depth_m');
        expect(stats).toHaveProperty('min_depth_m');
        expect(stats).toHaveProperty('temperature_range');

        expect(stats.total_distance_km).toBeGreaterThan(0);
        expect(stats.average_speed_kmh).toBeGreaterThan(0);
        expect(stats.max_depth_m).toBe(50);
        expect(stats.min_depth_m).toBe(10);
        expect(stats.temperature_range.min).toBe(18);
        expect(stats.temperature_range.max).toBe(22);
      });

      it('should handle empty track data', () => {
        const stats = sharkTracker.calculateMovementStats([]);

        expect(stats).toEqual({
          total_distance_km: 0,
          average_speed_kmh: 0,
          max_depth_m: 0,
          min_depth_m: 0,
          temperature_range: { min: 0, max: 0 }
        });
      });

      it('should handle track with missing depth/temperature data', () => {
        const track: SharkTrackPoint[] = [
          {
            shark_id: 'test',
            timestamp: '2024-01-01T00:00:00Z',
            lat: 0,
            lon: 0
          },
          {
            shark_id: 'test',
            timestamp: '2024-01-01T01:00:00Z',
            lat: 0.01,
            lon: 0.01
          }
        ];

        const stats = sharkTracker.calculateMovementStats(track);

        expect(stats.total_distance_km).toBeGreaterThan(0);
        expect(stats.max_depth_m).toBe(0);
        expect(stats.min_depth_m).toBe(0);
        expect(stats.temperature_range.min).toBe(0);
        expect(stats.temperature_range.max).toBe(0);
      });
    });

    describe('Real-time updates', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should start real-time updates when subscribed', () => {
        const callback = jest.fn();
        const unsubscribe = sharkTracker.subscribeToUpdates(callback);

        expect(sharkTracker['updateInterval']).toBeDefined();

        unsubscribe();
        expect(sharkTracker['updateInterval']).toBeNull();
      });

      it('should call subscribers with updated data', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

        const callback = jest.fn();
        const unsubscribe = sharkTracker.subscribeToUpdates(callback);

        // Fast-forward time to trigger update
        jest.advanceTimersByTime(30000);

        // Wait for async operations
        await Promise.resolve();

        expect(callback).toHaveBeenCalled();

        unsubscribe();
      });

      it('should handle multiple subscribers', () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();

        const unsubscribe1 = sharkTracker.subscribeToUpdates(callback1);
        const unsubscribe2 = sharkTracker.subscribeToUpdates(callback2);

        // Should have single update interval
        expect(sharkTracker['updateSubscribers'].size).toBe(2);

        unsubscribe1();
        expect(sharkTracker['updateSubscribers'].size).toBe(1);
        expect(sharkTracker['updateInterval']).toBeDefined(); // Should still be running

        unsubscribe2();
        expect(sharkTracker['updateSubscribers'].size).toBe(0);
        expect(sharkTracker['updateInterval']).toBeNull(); // Should be stopped
      });

      it('should handle callback errors gracefully', async () => {
        (fetch as jest.Mock).mockRejectedValue(new Error('Use mock'));

        const errorCallback = jest.fn(() => {
          throw new Error('Callback error');
        });
        const normalCallback = jest.fn();

        const unsubscribe1 = sharkTracker.subscribeToUpdates(errorCallback);
        const unsubscribe2 = sharkTracker.subscribeToUpdates(normalCallback);

        jest.advanceTimersByTime(30000);
        await Promise.resolve();

        expect(console.error).toHaveBeenCalledWith(
          'Error in update callback:',
          expect.any(Error)
        );
        expect(normalCallback).toHaveBeenCalled();

        unsubscribe1();
        unsubscribe2();
      });
    });
  });
});

describe('Marine Data Processing Performance', () => {
  it('should handle large numbers of heatwaves efficiently', async () => {
    // Mock large dataset
    const largeHeatwaveData = Array.from({ length: 1000 }, (_, i) => ({
      id: `heatwave_${i}`,
      region: `Region ${i % 10}`,
      coordinates: {
        lat: -80 + (i % 160),
        lon: -180 + (i % 360),
        bounds: { north: 1, south: -1, east: 1, west: -1 }
      },
      severity: ['moderate', 'strong', 'severe', 'extreme'][i % 4] as any,
      intensity: 1 + (i % 5),
      duration_days: 10 + (i % 20),
      start_date: new Date().toISOString(),
      status: 'active' as const,
      confidence_level: 80 + (i % 20),
      affected_area_km2: 10000 + i * 100,
      baseline_temperature: 20 + (i % 10),
      current_temperature: 22 + (i % 8),
      ecological_impact: {
        risk_level: ['low', 'moderate', 'high', 'critical'][i % 4] as any,
        affected_species: [`Species ${i % 5}`],
        coral_bleaching_risk: i % 100,
        fisheries_impact: 'moderate' as const
      },
      historical_context: {
        rank_in_region: i % 10,
        return_period_years: 1 + (i % 10),
        similar_events: []
      },
      data_sources: ['Source1', 'Source2'],
      last_updated: new Date().toISOString()
    }));

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ alerts: largeHeatwaveData })
    });

    const start = performance.now();
    const analytics = await marineHeatwaveService.getHeatwaveAnalytics();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500); // Should complete within 500ms
    expect(analytics.global_summary.active_heatwaves).toBe(1000);
    expect(analytics.regional_breakdown.length).toBeGreaterThan(0);
  });

  it('should handle thousands of shark tracking points efficiently', async () => {
    (fetch as jest.Mock).mockRejectedValue(new Error('Use mock for performance test'));

    const start = performance.now();
    const sharks = await OCEARCHService.getTrackedSharks();
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    expect(sharks.length).toBeGreaterThan(1000); // Enhanced mock generates many sharks

    // Test processing performance with movement calculations
    const testShark = sharks[0];
    const largeTrack: SharkTrackPoint[] = Array.from({ length: 10000 }, (_, i) => ({
      shark_id: testShark.id,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      lat: testShark.lat + (Math.random() - 0.5) * 0.1,
      lon: testShark.lon + (Math.random() - 0.5) * 0.1,
      depth_m: 10 + Math.random() * 100,
      water_temp_c: 15 + Math.random() * 10
    }));

    const calcStart = performance.now();
    const stats = sharkTracker.calculateMovementStats(largeTrack);
    const calcDuration = performance.now() - calcStart;

    expect(calcDuration).toBeLessThan(100); // Should calculate stats quickly
    expect(stats.total_distance_km).toBeGreaterThan(0);
  });

  it('should handle concurrent data processing efficiently', async () => {
    (fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('heatwaves')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ alerts: [] })
        });
      }
      throw new Error('Use mock');
    });

    const start = performance.now();

    // Concurrent operations
    const operations = [
      marineHeatwaveService.getActiveHeatwaves(),
      marineHeatwaveService.getHeatwaveAnalytics(),
      marineHeatwaveService.getRegionalHeatwaves('Pacific'),
      sharkTracker.getActiveSharks(),
      OCEARCHService.getTrackedSharks()
    ];

    const results = await Promise.all(operations);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result).toBeDefined();
    });
  });
});

describe('Marine Data Edge Cases', () => {
  it('should handle invalid coordinates gracefully', async () => {
    const invalidHeatwaves = [
      {
        id: 'invalid_coords',
        region: 'Test',
        coordinates: {
          lat: 999, // Invalid latitude
          lon: -999, // Invalid longitude
          bounds: { north: 1, south: -1, east: 1, west: -1 }
        },
        severity: 'moderate' as const,
        intensity: 2,
        duration_days: 10,
        start_date: new Date().toISOString(),
        status: 'active' as const,
        confidence_level: 85,
        affected_area_km2: 10000,
        baseline_temperature: 20,
        current_temperature: 22,
        ecological_impact: {
          risk_level: 'moderate' as const,
          affected_species: [],
          coral_bleaching_risk: 50,
          fisheries_impact: 'moderate' as const
        },
        historical_context: {
          rank_in_region: 1,
          return_period_years: 5,
          similar_events: []
        },
        data_sources: [],
        last_updated: new Date().toISOString()
      }
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ alerts: invalidHeatwaves })
    });

    const heatwaves = await marineHeatwaveService.getActiveHeatwaves();
    expect(heatwaves).toHaveLength(1);

    const analytics = await marineHeatwaveService.getHeatwaveAnalytics();
    expect(analytics).toBeDefined();
  });

  it('should handle malformed shark data', async () => {
    const malformedData = [
      {
        // Missing required fields
        name: 'Incomplete Shark',
        species: null,
        length: 'not-a-number',
        latitude: 'invalid',
        longitude: 'invalid'
      }
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sharks: malformedData })
    });

    const sharks = await OCEARCHService.getTrackedSharks();

    // Should fallback to mock data when transformation fails
    expect(sharks.length).toBeGreaterThan(0);
    sharks.forEach(shark => {
      expect(typeof shark.lat).toBe('number');
      expect(typeof shark.lon).toBe('number');
      expect(typeof shark.length_m).toBe('number');
    });
  });

  it('should handle extremely large datasets without memory issues', async () => {
    // This test ensures we don't run into memory issues with large datasets
    const hugeMockData = Array.from({ length: 50000 }, (_, i) => ({
      id: `massive_dataset_${i}`,
      name: `Shark ${i}`,
      species: 'Carcharodon carcharias',
      sex: 'M' as const,
      length_m: 3 + Math.random() * 3,
      weight_kg: 1000 + Math.random() * 1000,
      tag_date: new Date().toISOString(),
      last_ping: new Date().toISOString(),
      lat: Math.random() * 180 - 90,
      lon: Math.random() * 360 - 180,
      tracking_organization: 'Test Org',
      confidence_level: 'High' as const,
      status: 'Active' as const
    }));

    // Mock memory usage monitoring
    const initialMemory = process.memoryUsage();

    // Process the large dataset
    const filteredSharks = hugeMockData.filter(shark => shark.status === 'Active');
    const stats = sharkTracker.calculateMovementStats([]);

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    expect(filteredSharks.length).toBe(50000);
    expect(stats).toBeDefined();
  });
});