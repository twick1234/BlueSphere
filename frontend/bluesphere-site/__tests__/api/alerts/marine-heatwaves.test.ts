import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/alerts/marine-heatwaves'

describe('/api/alerts/marine-heatwaves', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('GET requests', () => {
    it('should return marine heatwave alerts with proper structure', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Verify top-level structure
      expect(response).toHaveProperty('active_alerts')
      expect(response).toHaveProperty('marine_heatwaves')
      expect(response).toHaveProperty('alert_threshold')
      expect(response).toHaveProperty('last_checked')
      expect(response).toHaveProperty('emergency_status')
      expect(response).toHaveProperty('climate_impact')

      // Verify data types
      expect(typeof response.active_alerts).toBe('number')
      expect(Array.isArray(response.marine_heatwaves)).toBe(true)
      expect(typeof response.alert_threshold).toBe('string')
      expect(typeof response.last_checked).toBe('string')
      expect(typeof response.emergency_status).toBe('string')

      // Verify alert threshold format
      expect(response.alert_threshold).toBe('4°C above regional average')

      // Verify emergency status values
      const validStatuses = ['CRITICAL', 'HIGH', 'MODERATE']
      expect(validStatuses).toContain(response.emergency_status)

      // Verify climate impact structure
      expect(response.climate_impact).toHaveProperty('coral_reefs_at_risk')
      expect(response.climate_impact).toHaveProperty('ecosystem_threat_level', 'UNPRECEDENTED')
      expect(response.climate_impact).toHaveProperty('urgent_message')
    })

    it('should return variable number of alerts (3-7)', async () => {
      const alertCounts: number[] = []

      // Make multiple requests to check randomization
      for (let i = 0; i < 20; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        const response = JSON.parse(res._getData())
        alertCounts.push(response.active_alerts)
      }

      // All counts should be within expected range
      alertCounts.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(3)
        expect(count).toBeLessThanOrEqual(7)
        expect(response.marine_heatwaves).toHaveLength(count)
      })

      // Should have some variation
      const uniqueCounts = new Set(alertCounts)
      expect(uniqueCounts.size).toBeGreaterThan(1)
    })

    it('should have properly structured heatwave alert objects', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.marine_heatwaves.length).toBeGreaterThan(0)

      response.marine_heatwaves.forEach((alert: any) => {
        // Verify required properties
        expect(alert).toHaveProperty('station_id')
        expect(alert).toHaveProperty('name')
        expect(alert).toHaveProperty('lat')
        expect(alert).toHaveProperty('lon')
        expect(alert).toHaveProperty('current_temp')
        expect(alert).toHaveProperty('expected_temp')
        expect(alert).toHaveProperty('anomaly')
        expect(alert).toHaveProperty('severity')
        expect(alert).toHaveProperty('alert_time')
        expect(alert).toHaveProperty('risk_level')

        // Verify data types
        expect(typeof alert.station_id).toBe('string')
        expect(typeof alert.name).toBe('string')
        expect(typeof alert.lat).toBe('number')
        expect(typeof alert.lon).toBe('number')
        expect(typeof alert.current_temp).toBe('number')
        expect(typeof alert.expected_temp).toBe('number')
        expect(typeof alert.anomaly).toBe('number')
        expect(typeof alert.severity).toBe('string')
        expect(typeof alert.alert_time).toBe('string')
        expect(typeof alert.risk_level).toBe('string')

        // Verify station_id format
        expect(alert.station_id).toMatch(/^HW\d{4}$/)

        // Verify coordinate ranges
        expect(alert.lat).toBeGreaterThanOrEqual(-90)
        expect(alert.lat).toBeLessThanOrEqual(90)
        expect(alert.lon).toBeGreaterThanOrEqual(-180)
        expect(alert.lon).toBeLessThanOrEqual(180)

        // Verify severity values
        expect(['Moderate', 'High', 'Extreme']).toContain(alert.severity)

        // Verify anomaly range (4-8°C as per code)
        expect(alert.anomaly).toBeGreaterThanOrEqual(4)
        expect(alert.anomaly).toBeLessThanOrEqual(8)

        // Verify temperature precision (rounded to 1 decimal)
        expect(alert.current_temp).toBe(Math.round(alert.current_temp * 10) / 10)
        expect(alert.expected_temp).toBe(Math.round(alert.expected_temp * 10) / 10)
        expect(alert.anomaly).toBe(Math.round(alert.anomaly * 10) / 10)

        // Verify ISO timestamp format
        expect(alert.alert_time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    })

    it('should have logical temperature relationships', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.marine_heatwaves.forEach((alert: any) => {
        // Current temp should be expected + anomaly (approximately)
        const calculatedCurrent = alert.expected_temp + alert.anomaly
        expect(Math.abs(alert.current_temp - calculatedCurrent)).toBeLessThan(0.1)

        // Current temp should be higher than expected
        expect(alert.current_temp).toBeGreaterThan(alert.expected_temp)
      })
    })

    it('should properly correlate severity with anomaly and risk level', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.marine_heatwaves.forEach((alert: any) => {
        if (alert.severity === 'Extreme') {
          expect(alert.anomaly).toBeGreaterThan(6)
          expect(alert.risk_level).toContain('CRITICAL')
        } else if (alert.severity === 'High') {
          expect(alert.anomaly).toBeGreaterThan(5)
          expect(alert.anomaly).toBeLessThanOrEqual(6)
          expect(alert.risk_level).toContain('HIGH')
        } else if (alert.severity === 'Moderate') {
          expect(alert.anomaly).toBeLessThanOrEqual(5)
          expect(alert.risk_level).toContain('MODERATE')
        }
      })
    })

    it('should sort alerts by severity (anomaly descending)', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // Verify alerts are sorted by anomaly (descending)
      for (let i = 1; i < response.marine_heatwaves.length; i++) {
        expect(response.marine_heatwaves[i - 1].anomaly)
          .toBeGreaterThanOrEqual(response.marine_heatwaves[i].anomaly)
      }
    })

    it('should have valid location data', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      const knownLocations = [
        'Great Barrier Reef Monitor',
        'Caribbean Coral Triangle',
        'Florida Keys Deep',
        'Mediterranean Thermal',
        'Red Sea Central',
        'Southeast Pacific',
        'Bay of Bengal',
        'Arabian Sea',
        'Coral Sea',
        'Gulf of Mexico Central'
      ]

      response.marine_heatwaves.forEach((alert: any) => {
        expect(knownLocations).toContain(alert.name)
      })
    })

    it('should have recent alert timestamps', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      const now = new Date()
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

      response.marine_heatwaves.forEach((alert: any) => {
        const alertTime = new Date(alert.alert_time)
        expect(alertTime.getTime()).toBeGreaterThan(fiveMinutesAgo.getTime())
        expect(alertTime.getTime()).toBeLessThanOrEqual(now.getTime())
      })

      // last_checked should also be recent
      const lastChecked = new Date(response.last_checked)
      expect(lastChecked.getTime()).toBeGreaterThan(fiveMinutesAgo.getTime())
      expect(lastChecked.getTime()).toBeLessThanOrEqual(now.getTime())
    })

    it('should calculate coral reefs at risk correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // Count alerts with temp > 26°C
      const highTempAlerts = response.marine_heatwaves.filter(
        (alert: any) => alert.current_temp > 26
      ).length

      expect(response.climate_impact.coral_reefs_at_risk).toBe(highTempAlerts)
    })

    it('should determine emergency status based on severity distribution', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      const hasExtreme = response.marine_heatwaves.some((alert: any) => alert.severity === 'Extreme')
      const hasHigh = response.marine_heatwaves.some((alert: any) => alert.severity === 'High')

      if (hasExtreme) {
        expect(response.emergency_status).toBe('CRITICAL')
      } else if (hasHigh) {
        expect(response.emergency_status).toBe('HIGH')
      } else {
        expect(response.emergency_status).toBe('MODERATE')
      }
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
        body: { update: 'data' },
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
      // Mock Math.random to throw an error
      const originalRandom = Math.random
      Math.random = jest.fn(() => {
        throw new Error('Random generation failed')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({ error: 'Internal server error' })

      expect(console.error).toHaveBeenCalledWith(
        'Error generating marine heatwave alerts:',
        expect.any(Error)
      )

      // Restore Math.random
      Math.random = originalRandom
    })

    it('should handle Date construction errors', async () => {
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
      expect(response).toEqual({ error: 'Internal server error' })

      // Restore Date
      global.Date = originalDate
    })
  })

  describe('Query parameters', () => {
    it('should ignore query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          severity: 'high',
          limit: '5',
          region: 'pacific'
        },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should return all alerts regardless of query params
      expect(response.marine_heatwaves.length).toBeGreaterThanOrEqual(3)
      expect(response.marine_heatwaves.length).toBeLessThanOrEqual(7)
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

    it('should have consistent response structure across multiple requests', async () => {
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
        expect(response).toHaveProperty('active_alerts')
        expect(response).toHaveProperty('marine_heatwaves')
        expect(response).toHaveProperty('alert_threshold')
        expect(response).toHaveProperty('last_checked')
        expect(response).toHaveProperty('emergency_status')
        expect(response).toHaveProperty('climate_impact')

        expect(response.alert_threshold).toBe('4°C above regional average')
        expect(response.climate_impact.ecosystem_threat_level).toBe('UNPRECEDENTED')
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
  })

  describe('Data variability', () => {
    it('should generate different alert sets on multiple calls', async () => {
      const stationSets: string[][] = []

      for (let i = 0; i < 10; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        const response = JSON.parse(res._getData())
        const stationIds = response.marine_heatwaves.map((alert: any) => alert.station_id).sort()
        stationSets.push(stationIds)
      }

      // Should have some variation in which stations are active
      const uniqueSets = new Set(stationSets.map(set => JSON.stringify(set)))
      expect(uniqueSets.size).toBeGreaterThan(1)
    })

    it('should generate realistic temperature values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.marine_heatwaves.forEach((alert: any) => {
        // Temperature values should be realistic for ocean water
        expect(alert.current_temp).toBeGreaterThan(15) // Minimum reasonable ocean temp
        expect(alert.current_temp).toBeLessThan(40) // Maximum reasonable ocean temp
        expect(alert.expected_temp).toBeGreaterThan(10)
        expect(alert.expected_temp).toBeLessThan(35)
      })
    })
  })
})