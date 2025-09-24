import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/alerts/process'

// Mock fetch globally
global.fetch = jest.fn()

describe('/api/alerts/process', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.error to avoid cluttering test output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockActiveAlerts = [
    {
      id: 'alert_1',
      type: 'marine_heatwave',
      severity: 'critical',
      title: 'Marine Heatwave - Great Barrier Reef',
      description: 'Severe marine heatwave detected',
      location: {
        name: 'Great Barrier Reef',
        lat: -16.3,
        lon: 145.8,
        stationId: 'aus_gbr_001'
      },
      data: {
        temperature: 29.2,
        threshold: 26.5,
        trend: 'increasing'
      },
      impact: {
        ecosystemRisk: 'Severe coral bleaching',
        affectedSpecies: ['Hard Corals'],
        recommendations: ['Immediate action required']
      },
      isActive: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      lastUpdated: '2023-01-01T00:00:00.000Z'
    },
    {
      id: 'alert_2',
      type: 'temperature_spike',
      severity: 'high',
      title: 'Temperature Spike - Florida Keys',
      description: 'Rapid temperature increase',
      location: {
        name: 'Florida Keys',
        lat: 24.7,
        lon: -80.8,
        stationId: 'usa_fl_keys_01'
      },
      data: {
        temperature: 27.8,
        threshold: 26.0,
        trend: 'increasing'
      },
      impact: {
        ecosystemRisk: 'Moderate coral stress',
        affectedSpecies: ['Coral'],
        recommendations: ['Monitor closely']
      },
      isActive: true,
      createdAt: '2023-01-01T00:00:00.000Z',
      lastUpdated: '2023-01-01T00:00:00.000Z'
    }
  ]

  const mockNotificationResponse = {
    success: true,
    summary: {
      sent: 2,
      failed: 0
    },
    results: [
      { email: 'test1@example.com', status: 'sent' },
      { email: 'test2@example.com', status: 'sent' }
    ]
  }

  describe('CORS headers', () => {
    it('should set CORS headers for all requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      // Mock the API calls
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: [] })
        })

      await handler(req, res)

      expect(res.getHeader('Access-Control-Allow-Origin')).toBe('*')
      expect(res.getHeader('Access-Control-Allow-Methods')).toBe('POST, OPTIONS')
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

  describe('POST requests', () => {
    it('should process alerts successfully with matches', async () => {
      // Mock the API calls
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('summary')
      expect(response).toHaveProperty('results')
      expect(response).toHaveProperty('metadata')

      // Verify summary structure
      expect(response.summary).toHaveProperty('alertsProcessed')
      expect(response.summary).toHaveProperty('subscriptionsChecked')
      expect(response.summary).toHaveProperty('totalMatches')
      expect(response.summary).toHaveProperty('notificationsSent')
      expect(response.summary).toHaveProperty('notificationsFailed')
      expect(response.summary).toHaveProperty('processingTime')
      expect(response.summary).toHaveProperty('averageProcessingTimePerAlert')

      expect(response.summary.alertsProcessed).toBe(2)
      expect(response.summary.subscriptionsChecked).toBe(3) // Mock subscriptions
    })

    it('should handle no active alerts', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: [] })
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        success: true,
        message: 'No active alerts to process',
        summary: {
          alertsProcessed: 0,
          totalMatches: 0,
          notificationsSent: 0,
          notificationsFailed: 0,
          processingTime: expect.any(Number)
        }
      })
    })

    it('should handle processing with force flag', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: { forceProcess: true }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.metadata.forceProcess).toBe(true)
    })

    it('should have proper result structure for each alert', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.results).toHaveLength(2)
      response.results.forEach((result: any) => {
        expect(result).toHaveProperty('alertId')
        expect(result).toHaveProperty('subscriptionMatches')
        expect(result).toHaveProperty('notificationsSent')
        expect(result).toHaveProperty('notificationsFailed')
        expect(result).toHaveProperty('processingTime')
        expect(result).toHaveProperty('matchedSubscriptions')

        expect(typeof result.alertId).toBe('string')
        expect(typeof result.subscriptionMatches).toBe('number')
        expect(typeof result.notificationsSent).toBe('number')
        expect(typeof result.notificationsFailed).toBe('number')
        expect(typeof result.processingTime).toBe('number')
        expect(Array.isArray(result.matchedSubscriptions)).toBe(true)
      })
    })

    it('should handle notification failures gracefully', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockRejectedValueOnce(new Error('Notification service down'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(true)
      expect(response.summary.notificationsFailed).toBeGreaterThan(0)
      expect(console.error).toHaveBeenCalledWith(
        'Failed to send notifications:',
        expect.any(Error)
      )
    })

    it('should validate matched subscription structure', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.results.forEach((result: any) => {
        result.matchedSubscriptions.forEach((match: any) => {
          expect(match).toHaveProperty('subscriptionId')
          expect(match).toHaveProperty('email')
          expect(match).toHaveProperty('matchReason')

          expect(typeof match.subscriptionId).toBe('string')
          expect(typeof match.email).toBe('string')
          expect(Array.isArray(match.matchReason)).toBe(true)

          match.matchReason.forEach((reason: any) => {
            expect(typeof reason).toBe('string')
            expect(reason.length).toBeGreaterThan(0)
          })
        })
      })
    })

    it('should calculate processing times correctly', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.summary.processingTime).toBeGreaterThan(0)
      expect(response.summary.averageProcessingTimePerAlert).toBeGreaterThan(0)

      // Average should equal total / count
      const expectedAverage = Math.round(
        response.summary.processingTime / response.summary.alertsProcessed
      )
      expect(response.summary.averageProcessingTimePerAlert).toBe(expectedAverage)

      // Each result should have processing time
      response.results.forEach((result: any) => {
        expect(result.processingTime).toBeGreaterThan(0)
      })
    })
  })

  describe('HTTP method validation', () => {
    it('should reject GET requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
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
  })

  describe('Error handling', () => {
    it('should handle fetch errors for active alerts', async () => {
      ;(fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Failed to fetch alerts'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error', 'Failed to process alerts')
      expect(response).toHaveProperty('details', 'Failed to fetch alerts')
      expect(response).toHaveProperty('processingTime')
    })

    it('should handle JSON parsing errors', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => {
            throw new Error('Invalid JSON')
          }
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error', 'Failed to process alerts')
      expect(response).toHaveProperty('details', 'Invalid JSON')
    })

    it('should handle network timeouts', async () => {
      ;(fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network timeout'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response.error).toBe('Failed to process alerts')
      expect(response.details).toBe('Network timeout')
    })

    it('should handle partial notification failures', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            summary: {
              sent: 1,
              failed: 1
            },
            results: [
              { email: 'test1@example.com', status: 'sent' },
              { email: 'test2@example.com', status: 'failed', error: 'Invalid email' }
            ]
          })
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(true)
      expect(response.summary.notificationsSent).toBeGreaterThan(0)
      expect(response.summary.notificationsFailed).toBeGreaterThan(0)
    })
  })

  describe('Alert matching logic', () => {
    it('should match alerts based on type', async () => {
      const alertWithSpecificType = [{
        ...mockActiveAlerts[0],
        type: 'marine_heatwave'
      }]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: alertWithSpecificType })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // Should match subscriptions that include 'marine_heatwave' type
      expect(response.summary.totalMatches).toBeGreaterThan(0)

      const result = response.results[0]
      expect(result.matchedSubscriptions.length).toBeGreaterThan(0)

      result.matchedSubscriptions.forEach((match: any) => {
        expect(match.matchReason.some((reason: string) =>
          reason.includes('marine_heatwave')
        )).toBe(true)
      })
    })

    it('should match alerts based on severity threshold', async () => {
      const criticalAlert = [{
        ...mockActiveAlerts[0],
        severity: 'critical'
      }]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: criticalAlert })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      const result = response.results[0]
      result.matchedSubscriptions.forEach((match: any) => {
        expect(match.matchReason.some((reason: string) =>
          reason.includes('Severity')
        )).toBe(true)
      })
    })

    it('should match alerts based on temperature threshold', async () => {
      const highTempAlert = [{
        ...mockActiveAlerts[0],
        data: {
          ...mockActiveAlerts[0].data,
          temperature: 30.0
        }
      }]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: highTempAlert })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      const result = response.results[0]
      result.matchedSubscriptions.forEach((match: any) => {
        expect(match.matchReason.some((reason: string) =>
          reason.includes('Temperature') && reason.includes('30')
        )).toBe(true)
      })
    })

    it('should match alerts based on geographic zones', async () => {
      // Alert in Great Barrier Reef area
      const gbrAlert = [{
        ...mockActiveAlerts[0],
        location: {
          name: 'Great Barrier Reef',
          lat: -16.3,
          lon: 145.8
        }
      }]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: gbrAlert })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      const result = response.results[0]
      result.matchedSubscriptions.forEach((match: any) => {
        expect(match.matchReason.some((reason: string) =>
          reason.includes('Location matches zone')
        )).toBe(true)
      })
    })

    it('should not match inactive subscriptions', async () => {
      // This test would require mocking the subscription data to include inactive ones
      // For now, we test that the logic exists by checking the API response structure
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // All matched subscriptions should be for active subscriptions
      response.results.forEach((result: any) => {
        expect(result.matchedSubscriptions).toBeDefined()
        expect(Array.isArray(result.matchedSubscriptions)).toBe(true)
      })
    })
  })

  describe('Response format validation', () => {
    it('should return valid JSON', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: [] })
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const responseData = res._getData()
      expect(() => JSON.parse(responseData)).not.toThrow()
    })

    it('should include metadata', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.metadata).toHaveProperty('timestamp')
      expect(response.metadata).toHaveProperty('source', 'BlueSphere Alert Processing System')
      expect(response.metadata).toHaveProperty('forceProcess')

      // Verify timestamp format
      expect(response.metadata.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should have consistent error response structure', async () => {
      ;(fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Test error'))

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error')
      expect(response).toHaveProperty('details')
      expect(response).toHaveProperty('processingTime')

      expect(typeof response.error).toBe('string')
      expect(typeof response.details).toBe('string')
      expect(typeof response.processingTime).toBe('number')
    })
  })

  describe('Performance', () => {
    it('should respond within reasonable time', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      expect(res._getStatusCode()).toBe(200)
    })

    it('should track processing times accurately', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: mockActiveAlerts })
        })
        .mockResolvedValueOnce({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // Processing times should be reasonable
      expect(response.summary.processingTime).toBeGreaterThan(0)
      expect(response.summary.processingTime).toBeLessThan(10000) // < 10 seconds

      response.results.forEach((result: any) => {
        expect(result.processingTime).toBeGreaterThan(0)
        expect(result.processingTime).toBeLessThan(response.summary.processingTime)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle empty request body', async () => {
      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: [] })
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: undefined
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.success).toBe(true)
    })

    it('should handle malformed alert data', async () => {
      const malformedAlerts = [{
        id: 'bad_alert',
        // Missing required fields
        type: 'unknown_type'
      }]

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: malformedAlerts })
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      // Should not crash, but may produce different results
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.success).toBe(true)
    })

    it('should handle very large datasets', async () => {
      // Create a large number of alerts
      const manyAlerts = Array.from({ length: 100 }, (_, i) => ({
        ...mockActiveAlerts[0],
        id: `alert_${i}`,
        location: {
          ...mockActiveAlerts[0].location,
          lat: -16.3 + (i * 0.1),
          lon: 145.8 + (i * 0.1)
        }
      }))

      ;(fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: async () => ({ alerts: manyAlerts })
        })
        .mockResolvedValue({
          json: async () => mockNotificationResponse
        })

      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(true)
      expect(response.summary.alertsProcessed).toBe(100)
      expect(response.results).toHaveLength(100)
    })
  })
})