/**
 * Comprehensive API Testing Suite for BlueSphere Marine Monitoring Platform
 * Tests all API endpoints with real data flows and edge cases
 */

import { test, expect } from '@playwright/test';
import { APITestHelper } from '../utils/api-test-helper.js';
import { DataValidation } from '../utils/data-validation.js';

test.describe('BlueSphere API Comprehensive Testing', () => {
  let apiHelper;
  let dataValidator;

  test.beforeAll(async () => {
    apiHelper = new APITestHelper();
    dataValidator = new DataValidation();
  });

  test.describe('Marine Observations API (/api/obs)', () => {
    test('should return valid marine observation data with correct schema', async ({ request }) => {
      const response = await request.get('/api/obs');
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Validate response structure
      expect(data).toHaveProperty('observations');
      expect(data).toHaveProperty('metadata');
      expect(Array.isArray(data.observations)).toBe(true);

      // Validate data schema for each observation
      if (data.observations.length > 0) {
        const firstObs = data.observations[0];
        await dataValidator.validateMarineObservation(firstObs);

        // Test required fields
        expect(firstObs).toHaveProperty('station_id');
        expect(firstObs).toHaveProperty('timestamp');
        expect(firstObs).toHaveProperty('temperature');
        expect(firstObs).toHaveProperty('latitude');
        expect(firstObs).toHaveProperty('longitude');
      }

      // Test pagination metadata
      expect(data.metadata).toHaveProperty('total_count');
      expect(data.metadata).toHaveProperty('page');
      expect(data.metadata).toHaveProperty('page_size');
    });

    test('should handle pagination correctly', async ({ request }) => {
      const page1 = await request.get('/api/obs?page=1&limit=10');
      const page2 = await request.get('/api/obs?page=2&limit=10');

      expect(page1.status()).toBe(200);
      expect(page2.status()).toBe(200);

      const data1 = await page1.json();
      const data2 = await page2.json();

      // Ensure different data sets
      if (data1.observations.length > 0 && data2.observations.length > 0) {
        expect(data1.observations[0].id).not.toBe(data2.observations[0].id);
      }
    });

    test('should filter observations by date range', async ({ request }) => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request.get(`/api/obs?start_date=${startDate}&end_date=${endDate}`);
      expect(response.status()).toBe(200);

      const data = await response.json();

      // Validate all observations are within date range
      data.observations.forEach(obs => {
        const obsDate = new Date(obs.timestamp);
        expect(obsDate >= new Date(startDate)).toBe(true);
        expect(obsDate <= new Date(endDate)).toBe(true);
      });
    });

    test('should handle invalid parameters gracefully', async ({ request }) => {
      // Test invalid date format
      const invalidDateResponse = await request.get('/api/obs?start_date=invalid-date');
      expect([400, 422]).toContain(invalidDateResponse.status());

      // Test negative pagination
      const negativePageResponse = await request.get('/api/obs?page=-1');
      expect([400, 422]).toContain(negativePageResponse.status());

      // Test excessive limit
      const excessiveLimitResponse = await request.get('/api/obs?limit=10000');
      expect([400, 422]).toContain(excessiveLimitResponse.status());
    });
  });

  test.describe('Stations API (/api/stations)', () => {
    test('should return valid station data with geographic filtering', async ({ request }) => {
      const response = await request.get('/api/stations');
      expect(response.status()).toBe(200);

      const stations = await response.json();
      expect(Array.isArray(stations)).toBe(true);

      if (stations.length > 0) {
        const station = stations[0];
        await dataValidator.validateStation(station);

        // Test geographic bounds
        expect(station.latitude).toBeGreaterThanOrEqual(-90);
        expect(station.latitude).toBeLessThanOrEqual(90);
        expect(station.longitude).toBeGreaterThanOrEqual(-180);
        expect(station.longitude).toBeLessThanOrEqual(180);
      }
    });

    test('should filter stations by bounding box', async ({ request }) => {
      // Test Pacific Ocean bounding box
      const bbox = '-180,-60,180,60'; // Pacific Ocean approximate bounds
      const response = await request.get(`/api/stations?bbox=${bbox}`);

      expect(response.status()).toBe(200);
      const stations = await response.json();

      stations.forEach(station => {
        expect(station.latitude).toBeGreaterThanOrEqual(-60);
        expect(station.latitude).toBeLessThanOrEqual(60);
        expect(station.longitude).toBeGreaterThanOrEqual(-180);
        expect(station.longitude).toBeLessThanOrEqual(180);
      });
    });

    test('should return station details with active status', async ({ request }) => {
      const response = await request.get('/api/stations?status=active');
      expect(response.status()).toBe(200);

      const stations = await response.json();
      stations.forEach(station => {
        expect(station.status).toBe('active');
        expect(station).toHaveProperty('last_data_timestamp');
      });
    });
  });

  test.describe('Alerts API (/api/alerts/*)', () => {
    test('should retrieve active marine alerts', async ({ request }) => {
      const response = await request.get('/api/alerts/active');
      expect(response.status()).toBe(200);

      const alerts = await response.json();
      expect(Array.isArray(alerts)).toBe(true);

      alerts.forEach(alert => {
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('created_at');
        expect(alert).toHaveProperty('location');

        // Validate severity levels
        expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
      });
    });

    test('should handle marine heatwave alerts', async ({ request }) => {
      const response = await request.get('/api/alerts/marine-heatwaves');
      expect(response.status()).toBe(200);

      const heatwaves = await response.json();
      expect(Array.isArray(heatwaves)).toBe(true);

      heatwaves.forEach(hw => {
        expect(hw).toHaveProperty('intensity');
        expect(hw).toHaveProperty('duration_days');
        expect(hw).toHaveProperty('temperature_anomaly');
        expect(hw.temperature_anomaly).toBeGreaterThan(0);
      });
    });

    test('should process alert subscriptions', async ({ request }) => {
      const subscriptionData = {
        email: 'test@researcher.com',
        alert_types: ['marine_heatwave', 'temperature_anomaly'],
        location: { lat: 37.7749, lon: -122.4194 },
        radius_km: 100
      };

      const response = await request.post('/api/alerts/subscribe', {
        data: subscriptionData
      });

      expect([200, 201]).toContain(response.status());

      const result = await response.json();
      expect(result).toHaveProperty('subscription_id');
      expect(result).toHaveProperty('status');
    });
  });

  test.describe('Metrics API (/api/metrics)', () => {
    test('should return comprehensive platform metrics', async ({ request }) => {
      const response = await request.get('/api/metrics');
      expect(response.status()).toBe(200);

      const metrics = await response.json();

      // Test ocean health metrics
      expect(metrics).toHaveProperty('ocean_health');
      expect(metrics.ocean_health).toHaveProperty('temperature');
      expect(metrics.ocean_health).toHaveProperty('ph_levels');
      expect(metrics.ocean_health).toHaveProperty('oxygen_levels');

      // Test data ingestion metrics
      expect(metrics).toHaveProperty('data_ingestion');
      expect(metrics.data_ingestion).toHaveProperty('total_observations');
      expect(metrics.data_ingestion).toHaveProperty('active_stations');

      // Test alert metrics
      expect(metrics).toHaveProperty('alerts');
      expect(metrics.alerts).toHaveProperty('active_count');
      expect(metrics.alerts).toHaveProperty('severity_distribution');
    });

    test('should handle time-based metric queries', async ({ request }) => {
      const timeRange = '7d'; // Last 7 days
      const response = await request.get(`/api/metrics?timeRange=${timeRange}`);

      expect(response.status()).toBe(200);
      const metrics = await response.json();

      // Verify time series data structure
      if (metrics.time_series) {
        expect(Array.isArray(metrics.time_series)).toBe(true);
        metrics.time_series.forEach(dataPoint => {
          expect(dataPoint).toHaveProperty('timestamp');
          expect(dataPoint).toHaveProperty('values');
        });
      }
    });
  });

  test.describe('Prediction APIs (/api/predictions/*)', () => {
    test('should return ocean forecasting data', async ({ request }) => {
      const response = await request.get('/api/predictions/forecast');
      expect(response.status()).toBe(200);

      const forecast = await response.json();

      expect(forecast).toHaveProperty('model_version');
      expect(forecast).toHaveProperty('forecast_data');
      expect(forecast).toHaveProperty('confidence_intervals');

      // Test forecast time horizons
      expect(forecast.forecast_data).toHaveProperty('short_term'); // 1-7 days
      expect(forecast.forecast_data).toHaveProperty('medium_term'); // 1-4 weeks
      expect(forecast.forecast_data).toHaveProperty('long_term'); // 1-3 months
    });

    test('should validate prediction model information', async ({ request }) => {
      const response = await request.get('/api/predictions/models');
      expect(response.status()).toBe(200);

      const models = await response.json();
      expect(Array.isArray(models)).toBe(true);

      models.forEach(model => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('version');
        expect(model).toHaveProperty('accuracy_metrics');
        expect(model).toHaveProperty('last_updated');

        // Validate accuracy metrics
        expect(model.accuracy_metrics).toHaveProperty('rmse');
        expect(model.accuracy_metrics).toHaveProperty('correlation');
        expect(model.accuracy_metrics.correlation).toBeGreaterThanOrEqual(0);
        expect(model.accuracy_metrics.correlation).toBeLessThanOrEqual(1);
      });
    });
  });

  test.describe('Real-time Data Flow Testing', () => {
    test('should maintain data consistency across endpoints', async ({ request }) => {
      // Get station data
      const stationsResponse = await request.get('/api/stations?limit=5');
      const stations = await stationsResponse.json();

      if (stations.length > 0) {
        const stationId = stations[0].id;

        // Get observations for this station
        const obsResponse = await request.get(`/api/obs?station_id=${stationId}`);
        const observations = await obsResponse.json();

        // Verify data consistency
        expect(obsResponse.status()).toBe(200);
        observations.observations.forEach(obs => {
          expect(obs.station_id).toBe(stationId);
        });

        // Get metrics that should include this station
        const metricsResponse = await request.get('/api/metrics');
        const metrics = await metricsResponse.json();

        expect(metrics.data_ingestion.active_stations).toBeGreaterThan(0);
      }
    });

    test('should handle concurrent API requests without data corruption', async ({ request }) => {
      // Make multiple concurrent requests
      const requests = Array.from({ length: 10 }, (_, i) =>
        request.get(`/api/obs?page=${i + 1}&limit=5`)
      );

      const responses = await Promise.all(requests);

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });

      // Verify no duplicate data across pages
      const allData = [];
      for (const response of responses) {
        const data = await response.json();
        data.observations.forEach(obs => {
          expect(allData.find(existing => existing.id === obs.id)).toBeUndefined();
          allData.push(obs);
        });
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle API rate limiting gracefully', async ({ request }) => {
      // Make rapid requests to test rate limiting
      const rapidRequests = Array.from({ length: 50 }, () =>
        request.get('/api/obs?limit=1')
      );

      const responses = await Promise.all(rapidRequests);

      // Some requests should succeed, some might be rate limited
      const successCount = responses.filter(r => r.status() === 200).length;
      const rateLimitedCount = responses.filter(r => r.status() === 429).length;

      expect(successCount + rateLimitedCount).toBe(50);

      if (rateLimitedCount > 0) {
        // Verify rate limit headers are present
        const rateLimitedResponse = responses.find(r => r.status() === 429);
        const headers = rateLimitedResponse.headers();
        expect(headers).toHaveProperty('x-ratelimit-limit');
        expect(headers).toHaveProperty('x-ratelimit-remaining');
      }
    });

    test('should handle malformed request data', async ({ request }) => {
      // Test with malformed JSON
      const malformedResponse = await request.post('/api/alerts/subscribe', {
        data: 'invalid json'
      });
      expect(malformedResponse.status()).toBe(400);

      // Test with missing required fields
      const incompleteResponse = await request.post('/api/alerts/subscribe', {
        data: { email: 'test@example.com' } // missing required fields
      });
      expect([400, 422]).toContain(incompleteResponse.status());
    });

    test('should validate input sanitization', async ({ request }) => {
      // Test SQL injection attempt
      const sqlInjectionResponse = await request.get("/api/obs?station_id=1'; DROP TABLE observations; --");
      expect(sqlInjectionResponse.status()).toBe(400);

      // Test XSS attempt
      const xssResponse = await request.get('/api/stations?name=<script>alert("xss")</script>');
      expect(xssResponse.status()).toBe(400);
    });
  });

  test.describe('Authentication and Authorization', () => {
    test('should handle authenticated endpoints correctly', async ({ request }) => {
      // Test unauthenticated access to protected endpoint
      const protectedResponse = await request.post('/api/alerts/process', {
        data: { alert_id: 'test' }
      });
      expect([401, 403]).toContain(protectedResponse.status());
    });

    test('should validate API key authentication', async ({ request }) => {
      // Test with invalid API key
      const invalidKeyResponse = await request.get('/api/metrics', {
        headers: { 'Authorization': 'Bearer invalid-key' }
      });
      expect([401, 403]).toContain(invalidKeyResponse.status());
    });
  });
});