import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/alerts/active'

describe('/api/alerts/active', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('CORS headers', () => {
    it('should set CORS headers for all requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res.getHeader('Access-Control-Allow-Origin')).toBe('*')
      expect(res.getHeader('Access-Control-Allow-Methods')).toBe('GET, POST, OPTIONS')
      expect(res.getHeader('Access-Control-Allow-Headers')).toBe('Content-Type')
    })

    it('should handle OPTIONS preflight requests', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Access-Control-Allow-Origin')).toBe('*')
    })
  })

  describe('GET requests', () => {
    it('should return active alerts with proper structure', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Verify top-level structure
      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('alerts')
      expect(response).toHaveProperty('summary')
      expect(response).toHaveProperty('metadata')

      // Verify alerts array
      expect(Array.isArray(response.alerts)).toBe(true)
      expect(response.alerts.length).toBe(4) // Based on the base alerts in the code

      // Verify summary structure
      expect(response.summary).toHaveProperty('total')
      expect(response.summary).toHaveProperty('critical')
      expect(response.summary).toHaveProperty('high')
      expect(response.summary).toHaveProperty('medium')
      expect(response.summary).toHaveProperty('low')
      expect(response.summary).toHaveProperty('lastUpdated')

      // Verify metadata structure
      expect(response.metadata).toHaveProperty('timestamp')
      expect(response.metadata).toHaveProperty('source', 'BlueSphere Alert Monitoring System')
      expect(response.metadata).toHaveProperty('updateFrequency', '5 minutes')
    })

    it('should have properly structured alert objects', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.alerts.forEach((alert: any) => {
        // Verify required properties
        expect(alert).toHaveProperty('id')
        expect(alert).toHaveProperty('type')
        expect(alert).toHaveProperty('severity')
        expect(alert).toHaveProperty('title')
        expect(alert).toHaveProperty('description')
        expect(alert).toHaveProperty('location')
        expect(alert).toHaveProperty('data')
        expect(alert).toHaveProperty('impact')
        expect(alert).toHaveProperty('isActive')
        expect(alert).toHaveProperty('createdAt')
        expect(alert).toHaveProperty('lastUpdated')

        // Verify data types
        expect(typeof alert.id).toBe('string')
        expect(typeof alert.type).toBe('string')
        expect(typeof alert.severity).toBe('string')
        expect(typeof alert.title).toBe('string')
        expect(typeof alert.isActive).toBe('boolean')
        expect(typeof alert.createdAt).toBe('string')
        expect(typeof alert.lastUpdated).toBe('string')

        // Verify ID format
        expect(alert.id).toMatch(/^alert_\d+_\d+$/)

        // Verify isActive is true
        expect(alert.isActive).toBe(true)

        // Verify valid alert types
        const validTypes = ['marine_heatwave', 'temperature_spike', 'anomaly_detected', 'coral_bleaching_risk']
        expect(validTypes).toContain(alert.type)

        // Verify valid severity levels
        const validSeverities = ['low', 'medium', 'high', 'critical']
        expect(validSeverities).toContain(alert.severity)

        // Verify ISO timestamp formats
        expect(alert.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        expect(alert.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    })

    it('should have properly structured location objects', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.alerts.forEach((alert: any) => {
        const location = alert.location

        expect(location).toHaveProperty('name')
        expect(location).toHaveProperty('lat')
        expect(location).toHaveProperty('lon')

        expect(typeof location.name).toBe('string')
        expect(typeof location.lat).toBe('number')
        expect(typeof location.lon).toBe('number')

        // Verify coordinate ranges
        expect(location.lat).toBeGreaterThanOrEqual(-90)
        expect(location.lat).toBeLessThanOrEqual(90)
        expect(location.lon).toBeGreaterThanOrEqual(-180)
        expect(location.lon).toBeLessThanOrEqual(180)

        // Some alerts should have station IDs
        if (location.stationId) {
          expect(typeof location.stationId).toBe('string')
          expect(location.stationId.length).toBeGreaterThan(0)
        }
      })
    })

    it('should have properly structured data objects', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.alerts.forEach((alert: any) => {
        const data = alert.data

        expect(data).toHaveProperty('temperature')
        expect(data).toHaveProperty('threshold')
        expect(data).toHaveProperty('trend')

        expect(typeof data.temperature).toBe('number')
        expect(typeof data.threshold).toBe('number')
        expect(typeof data.trend).toBe('string')

        // Verify valid trend values
        const validTrends = ['increasing', 'decreasing', 'stable']
        expect(validTrends).toContain(data.trend)

        // Temperature should be above threshold for alerts
        expect(data.temperature).toBeGreaterThan(data.threshold)

        // Duration might be present
        if (data.duration) {
          expect(typeof data.duration).toBe('string')
          expect(data.duration).toMatch(/\d+ days?/)
        }
      })
    })

    it('should have properly structured impact objects', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.alerts.forEach((alert: any) => {
        const impact = alert.impact

        expect(impact).toHaveProperty('ecosystemRisk')
        expect(impact).toHaveProperty('affectedSpecies')
        expect(impact).toHaveProperty('recommendations')

        expect(typeof impact.ecosystemRisk).toBe('string')
        expect(Array.isArray(impact.affectedSpecies)).toBe(true)
        expect(Array.isArray(impact.recommendations)).toBe(true)

        expect(impact.ecosystemRisk.length).toBeGreaterThan(0)
        expect(impact.affectedSpecies.length).toBeGreaterThan(0)
        expect(impact.recommendations.length).toBeGreaterThan(0)

        // Verify species are strings
        impact.affectedSpecies.forEach((species: any) => {
          expect(typeof species).toBe('string')
          expect(species.length).toBeGreaterThan(0)
        })

        // Verify recommendations are strings
        impact.recommendations.forEach((recommendation: any) => {
          expect(typeof recommendation).toBe('string')
          expect(recommendation.length).toBeGreaterThan(0)
        })
      })
    })

    it('should sort alerts by severity and creation time', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const alerts = response.alerts

      // Verify severity order (critical > high > medium > low)
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }

      for (let i = 1; i < alerts.length; i++) {
        const prevSeverity = severityOrder[alerts[i - 1].severity as keyof typeof severityOrder]
        const currSeverity = severityOrder[alerts[i].severity as keyof typeof severityOrder]

        // Previous alert should have equal or higher priority (lower number)
        expect(prevSeverity).toBeLessThanOrEqual(currSeverity)

        // If same severity, should be sorted by creation time (newer first)
        if (prevSeverity === currSeverity) {
          const prevTime = new Date(alerts[i - 1].createdAt).getTime()
          const currTime = new Date(alerts[i].createdAt).getTime()
          expect(prevTime).toBeGreaterThanOrEqual(currTime)
        }
      }
    })

    it('should calculate summary correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const { alerts, summary } = response

      expect(summary.total).toBe(alerts.length)

      const actualCounts = {
        critical: alerts.filter((a: any) => a.severity === 'critical').length,
        high: alerts.filter((a: any) => a.severity === 'high').length,
        medium: alerts.filter((a: any) => a.severity === 'medium').length,
        low: alerts.filter((a: any) => a.severity === 'low').length
      }

      expect(summary.critical).toBe(actualCounts.critical)
      expect(summary.high).toBe(actualCounts.high)
      expect(summary.medium).toBe(actualCounts.medium)
      expect(summary.low).toBe(actualCounts.low)

      // Verify sum equals total
      expect(summary.critical + summary.high + summary.medium + summary.low).toBe(summary.total)
    })

    it('should have recent timestamps', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      // lastUpdated should be very recent
      const lastUpdated = new Date(response.summary.lastUpdated)
      expect(lastUpdated.getTime()).toBeGreaterThan(now.getTime() - 60000) // Within last minute

      const metadataTimestamp = new Date(response.metadata.timestamp)
      expect(metadataTimestamp.getTime()).toBeGreaterThan(now.getTime() - 60000) // Within last minute

      // Alert timestamps should be within the last week
      response.alerts.forEach((alert: any) => {
        const createdAt = new Date(alert.createdAt)
        const lastUpdated = new Date(alert.lastUpdated)

        expect(createdAt.getTime()).toBeGreaterThan(oneWeekAgo.getTime())
        expect(createdAt.getTime()).toBeLessThanOrEqual(now.getTime())

        expect(lastUpdated.getTime()).toBeGreaterThan(now.getTime() - 60000) // Recent
        expect(lastUpdated.getTime()).toBeLessThanOrEqual(now.getTime())
      })
    })
  })

  describe('Query parameter filtering', () => {
    it('should filter by severity', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          severity: 'critical'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      response.alerts.forEach((alert: any) => {
        expect(alert.severity).toBe('critical')
      })
    })

    it('should filter by type', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          type: 'marine_heatwave'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      response.alerts.forEach((alert: any) => {
        expect(alert.type).toBe('marine_heatwave')
      })
    })

    it('should limit results', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '2'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.alerts.length).toBeLessThanOrEqual(2)
    })

    it('should combine filters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          severity: 'high',
          limit: '1'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.alerts.length).toBeLessThanOrEqual(1)
      response.alerts.forEach((alert: any) => {
        expect(alert.severity).toBe('high')
      })
    })

    it('should handle invalid severity filter', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          severity: 'invalid_severity'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should return empty array for invalid severity
      expect(response.alerts).toEqual([])
      expect(response.summary.total).toBe(0)
    })

    it('should handle invalid type filter', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          type: 'invalid_type'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should return empty array for invalid type
      expect(response.alerts).toEqual([])
      expect(response.summary.total).toBe(0)
    })

    it('should handle invalid limit values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: 'invalid'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should return all alerts when limit is invalid
      expect(response.alerts.length).toBe(4)
    })

    it('should handle zero limit', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '0'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should return all alerts for zero or negative limit
      expect(response.alerts.length).toBe(4)
    })

    it('should handle negative limit', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '-5'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should return all alerts for negative limit
      expect(response.alerts.length).toBe(4)
    })

    it('should handle array query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          severity: ['high', 'critical']
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should use first value in array
      response.alerts.forEach((alert: any) => {
        expect(alert.severity).toBe('high')
      })
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
  })

  describe('Error handling', () => {
    it('should handle errors during alert generation', async () => {
      // Mock Date.now to throw an error
      const originalDateNow = Date.now
      Date.now = jest.fn(() => {
        throw new Error('Date.now failed')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty('error', 'Failed to fetch active alerts')
      expect(response).toHaveProperty('details', 'Date.now failed')

      // Restore Date.now
      Date.now = originalDateNow
    })

    it('should handle Date constructor errors', async () => {
      // Mock Date constructor to throw an error
      const originalDate = global.Date
      global.Date = jest.fn(() => {
        throw new Error('Date construction failed')
      }) as any
      global.Date.now = originalDate.now
      global.Date.prototype = originalDate.prototype

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty('error', 'Failed to fetch active alerts')

      // Restore Date
      global.Date = originalDate
    })
  })

  describe('Response format validation', () => {
    it('should return valid JSON', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = res._getData()
      expect(() => JSON.parse(responseData)).not.toThrow()
    })

    it('should include Content-Type header', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Content-Type')).toContain('application/json')
    })

    it('should have consistent response structure', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('alerts')
      expect(response).toHaveProperty('summary')
      expect(response).toHaveProperty('metadata')

      expect(Array.isArray(response.alerts)).toBe(true)
      expect(typeof response.summary).toBe('object')
      expect(typeof response.metadata).toBe('object')
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

    it('should handle concurrent requests', async () => {
      const concurrentRequests = 10
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

    it('should handle filtering without performance degradation', async () => {
      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          severity: 'high',
          type: 'temperature_spike',
          limit: '1'
        }
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100)
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Data consistency', () => {
    it('should return consistent data structure across multiple requests', async () => {
      const responses = []

      for (let i = 0; i < 5; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        responses.push(JSON.parse(res._getData()))
      }

      // All responses should have the same structure and static data
      responses.forEach((response, index) => {
        expect(response.alerts.length).toBe(4)
        expect(response.metadata.source).toBe('BlueSphere Alert Monitoring System')
        expect(response.metadata.updateFrequency).toBe('5 minutes')

        // Alert content should be consistent (since it's static data)
        if (index > 0) {
          expect(response.alerts.length).toBe(responses[0].alerts.length)
          // IDs will differ due to timestamp, but types should be the same
          const types = response.alerts.map((a: any) => a.type).sort()
          const firstTypes = responses[0].alerts.map((a: any) => a.type).sort()
          expect(types).toEqual(firstTypes)
        }
      })
    })

    it('should have unique alert IDs in each response', async () => {
      const responses = []

      for (let i = 0; i < 3; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        responses.push(JSON.parse(res._getData()))
      }

      // Each response should have unique IDs due to timestamp
      const allIds = responses.flatMap(r => r.alerts.map((a: any) => a.id))
      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(allIds.length)
    })
  })
})