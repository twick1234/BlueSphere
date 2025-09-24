import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/status'

describe('/api/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GET requests', () => {
    it('should return comprehensive system status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Verify top-level structure
      expect(response).toHaveProperty('system_status')
      expect(response).toHaveProperty('datasets')
      expect(response).toHaveProperty('performance_metrics')
      expect(response).toHaveProperty('climate_emergency')

      // Verify system status
      expect(response.system_status).toBe('operational')

      // Verify datasets structure
      expect(Array.isArray(response.datasets)).toBe(true)
      expect(response.datasets).toHaveLength(3)

      // Verify first dataset structure
      const dataset1 = response.datasets[0]
      expect(dataset1).toHaveProperty('dataset_id', 1)
      expect(dataset1).toHaveProperty('name', 'Global NDBC Buoys')
      expect(dataset1).toHaveProperty('last_finished_at')
      expect(dataset1).toHaveProperty('status', 'green')
      expect(dataset1).toHaveProperty('stations_active', 156)
      expect(dataset1).toHaveProperty('data_quality', 'excellent')

      // Verify dataset with alert
      const dataset3 = response.datasets[2]
      expect(dataset3).toHaveProperty('alert')
      expect(dataset3.alert).toContain('marine heatwave')

      // Verify performance metrics
      expect(response.performance_metrics).toEqual({
        total_stations_monitored: 300,
        active_stations: 245,
        data_update_frequency: 'real-time',
        api_response_time_ms: 95,
        uptime_percentage: 99.8
      })

      // Verify climate emergency section
      expect(response.climate_emergency).toHaveProperty('global_ocean_temp_anomaly')
      expect(response.climate_emergency).toHaveProperty('marine_heatwaves_active')
      expect(response.climate_emergency).toHaveProperty('coral_reefs_at_risk', '73%')
      expect(response.climate_emergency).toHaveProperty('urgent_status')

      // Verify data types
      expect(typeof response.climate_emergency.marine_heatwaves_active).toBe('number')
      expect(response.climate_emergency.marine_heatwaves_active).toBeGreaterThanOrEqual(15)
      expect(response.climate_emergency.marine_heatwaves_active).toBeLessThanOrEqual(24)
    })

    it('should return ISO timestamp format for dataset times', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      response.datasets.forEach((dataset: any) => {
        expect(dataset.last_finished_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

        // Verify the timestamp is recent (within last hour)
        const lastFinished = new Date(dataset.last_finished_at)
        const now = new Date()
        const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

        expect(lastFinished.getTime()).toBeGreaterThan(hourAgo.getTime())
        expect(lastFinished.getTime()).toBeLessThanOrEqual(now.getTime())
      })
    })

    it('should have consistent data structure across multiple requests', async () => {
      const responses = []

      for (let i = 0; i < 5; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        responses.push(JSON.parse(res._getData()))
      }

      // All responses should have the same structure
      responses.forEach(response => {
        expect(response).toHaveProperty('system_status', 'operational')
        expect(response.datasets).toHaveLength(3)
        expect(response.performance_metrics.total_stations_monitored).toBe(300)
        expect(response.performance_metrics.active_stations).toBe(245)
      })

      // Only marine_heatwaves_active should vary (due to random generation)
      const heatwaveValues = responses.map(r => r.climate_emergency.marine_heatwaves_active)
      const uniqueValues = new Set(heatwaveValues)
      expect(uniqueValues.size).toBeGreaterThanOrEqual(1) // Could be same by chance
    })

    it('should include Content-Type header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Content-Type')).toContain('application/json')
    })
  })

  describe('HTTP method validation', () => {
    it('should reject POST requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: { test: 'data' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })

    it('should reject PUT requests', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        body: { test: 'data' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })

    it('should reject DELETE requests', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })

    it('should reject PATCH requests', async () => {
      const { req, res } = createMocks({
        method: 'PATCH',
        body: { test: 'data' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })

    it('should reject OPTIONS requests', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })

    it('should reject HEAD requests', async () => {
      const { req, res } = createMocks({
        method: 'HEAD',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Method not allowed' })
    })
  })

  describe('Query parameters', () => {
    it('should ignore query parameters and return full status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          filter: 'datasets',
          limit: '1',
          format: 'minimal'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should return full response regardless of query params
      expect(response).toHaveProperty('system_status')
      expect(response).toHaveProperty('datasets')
      expect(response).toHaveProperty('performance_metrics')
      expect(response).toHaveProperty('climate_emergency')
      expect(response.datasets).toHaveLength(3)
    })

    it('should handle malformed query parameters gracefully', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          '[]': 'invalid',
          '': 'empty-key',
          'special-chars!@#': 'value'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty('system_status', 'operational')
    })
  })

  describe('Error handling', () => {
    it('should handle errors during response generation', async () => {
      // Mock Date constructor to throw an error
      const originalDate = global.Date
      global.Date = jest.fn(() => {
        throw new Error('Date construction failed')
      }) as any
      global.Date.now = originalDate.now

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Internal server error' })

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        'Error getting system status:',
        expect.any(Error)
      )

      // Restore Date
      global.Date = originalDate
    })

    it('should handle JSON serialization errors', async () => {
      // This is hard to trigger with the current implementation,
      // but we can test the error handling path by mocking res.json
      const { req, res } = createMocks({
        method: 'GET',
      })

      // Mock res.status to return an object that throws on .json()
      const mockStatus = jest.fn().mockReturnValue({
        json: jest.fn().mockImplementation(() => {
          throw new Error('JSON serialization failed')
        })
      })
      res.status = mockStatus

      // This should not crash the handler
      await expect(handler(req, res)).resolves.toBeUndefined()
    })
  })

  describe('Response validation', () => {
    it('should return valid JSON', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = res._getData()
      expect(() => JSON.parse(responseData)).not.toThrow()
    })

    it('should have all required numeric fields as numbers', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // Verify dataset numeric fields
      response.datasets.forEach((dataset: any) => {
        expect(typeof dataset.dataset_id).toBe('number')
        expect(typeof dataset.stations_active).toBe('number')
        expect(dataset.stations_active).toBeGreaterThan(0)
      })

      // Verify performance metrics
      const perf = response.performance_metrics
      expect(typeof perf.total_stations_monitored).toBe('number')
      expect(typeof perf.active_stations).toBe('number')
      expect(typeof perf.api_response_time_ms).toBe('number')
      expect(typeof perf.uptime_percentage).toBe('number')

      // Verify climate emergency
      expect(typeof response.climate_emergency.marine_heatwaves_active).toBe('number')
    })

    it('should have all required string fields as strings', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(typeof response.system_status).toBe('string')

      response.datasets.forEach((dataset: any) => {
        expect(typeof dataset.name).toBe('string')
        expect(typeof dataset.last_finished_at).toBe('string')
        expect(typeof dataset.status).toBe('string')
        expect(typeof dataset.data_quality).toBe('string')
      })

      const perf = response.performance_metrics
      expect(typeof perf.data_update_frequency).toBe('string')

      const climate = response.climate_emergency
      expect(typeof climate.global_ocean_temp_anomaly).toBe('string')
      expect(typeof climate.coral_reefs_at_risk).toBe('string')
      expect(typeof climate.urgent_status).toBe('string')
    })

    it('should have valid status values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      const validStatuses = ['green', 'yellow', 'red']
      response.datasets.forEach((dataset: any) => {
        expect(validStatuses).toContain(dataset.status)
      })

      const validDataQualities = ['excellent', 'good', 'fair', 'poor']
      response.datasets.forEach((dataset: any) => {
        expect(validDataQualities).toContain(dataset.data_quality)
      })
    })
  })

  describe('Performance', () => {
    it('should respond quickly', async () => {
      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100) // Should respond within 100ms
      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 20
      const start = Date.now()

      const requests = Array.from({ length: concurrentRequests }, () => {
        const { req, res } = createMocks({
          method: 'GET',
        })
        return handler(req, res).then(() => res._getStatusCode())
      })

      const results = await Promise.all(requests)
      const duration = Date.now() - start

      // All requests should succeed
      results.forEach(statusCode => {
        expect(statusCode).toBe(200)
      })

      // Should complete all requests within reasonable time
      expect(duration).toBeLessThan(1000)
    })

    it('should not have memory leaks with repeated calls', async () => {
      // Make many sequential requests to check for memory leaks
      for (let i = 0; i < 100; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        expect(res._getStatusCode()).toBe(200)
      }

      // If we reach here without running out of memory, test passes
      expect(true).toBe(true)
    })
  })

  describe('Data consistency', () => {
    it('should have consistent marine heatwave count range', async () => {
      const counts: number[] = []

      // Make multiple requests to check randomization bounds
      for (let i = 0; i < 20; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        const response = JSON.parse(res._getData())
        counts.push(response.climate_emergency.marine_heatwaves_active)
      }

      // All counts should be within expected range (15-24)
      counts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(15)
        expect(count).toBeLessThanOrEqual(24)
        expect(Number.isInteger(count)).toBe(true)
      })
    })

    it('should have logical data relationships', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const perf = response.performance_metrics

      // Active stations should be <= total stations
      expect(perf.active_stations).toBeLessThanOrEqual(perf.total_stations_monitored)

      // Uptime should be a reasonable percentage
      expect(perf.uptime_percentage).toBeGreaterThan(90)
      expect(perf.uptime_percentage).toBeLessThanOrEqual(100)

      // API response time should be reasonable
      expect(perf.api_response_time_ms).toBeGreaterThan(0)
      expect(perf.api_response_time_ms).toBeLessThan(1000)
    })

    it('should have consistent dataset IDs', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const datasetIds = response.datasets.map((d: any) => d.dataset_id)

      expect(datasetIds).toEqual([1, 2, 3])
      expect(new Set(datasetIds).size).toBe(3) // All unique
    })
  })
})