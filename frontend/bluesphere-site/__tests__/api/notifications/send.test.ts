import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/notifications/send'

describe('/api/notifications/send', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.log and console.error to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockNotification = {
    subscriptionId: 'sub_001',
    alertId: 'alert_001',
    email: 'test@example.com',
    alertData: {
      type: 'marine_heatwave' as const,
      severity: 'critical' as const,
      title: 'Test Marine Heatwave Alert',
      description: 'Test description',
      location: {
        name: 'Test Location',
        lat: -16.3,
        lon: 145.8,
        stationId: 'test_station'
      },
      data: {
        temperature: 29.5,
        threshold: 26.0,
        duration: '3 days',
        trend: 'increasing' as const
      },
      impact: {
        ecosystemRisk: 'High risk of coral bleaching',
        affectedSpecies: ['Hard Corals', 'Reef Fish'],
        recommendations: ['Monitor closely', 'Reduce stressors']
      }
    },
    timestamp: new Date().toISOString()
  }

  describe('CORS headers', () => {
    it('should set CORS headers for all requests', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [mockNotification]
        }
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
    it('should send notifications successfully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          notifications: [mockNotification],
          priority: 'urgent'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('summary')
      expect(response).toHaveProperty('results')
      expect(response).toHaveProperty('timestamp')

      // Verify summary structure
      expect(response.summary).toEqual({
        total: 1,
        sent: expect.any(Number),
        failed: expect.any(Number),
        priority: 'urgent'
      })

      // Verify results structure
      expect(response.results).toHaveLength(1)
      const result = response.results[0]
      expect(result).toHaveProperty('notificationId')
      expect(result).toHaveProperty('email', 'test@example.com')
      expect(result).toHaveProperty('success')
      expect(typeof result.success).toBe('boolean')

      if (!result.success) {
        expect(result).toHaveProperty('error')
      }
    })

    it('should send multiple notifications', async () => {
      const notifications = [
        mockNotification,
        {
          ...mockNotification,
          email: 'test2@example.com',
          subscriptionId: 'sub_002'
        },
        {
          ...mockNotification,
          email: 'test3@example.com',
          subscriptionId: 'sub_003'
        }
      ]

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications,
          priority: 'high'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.summary.total).toBe(3)
      expect(response.results).toHaveLength(3)
      expect(response.summary.priority).toBe('high')

      // Each result should have unique notification ID
      const notificationIds = response.results.map((r: any) => r.notificationId)
      const uniqueIds = new Set(notificationIds)
      expect(uniqueIds.size).toBe(3)
    })

    it('should use default priority when not specified', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [mockNotification]
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.summary.priority).toBe('normal')
    })

    it('should handle notification validation errors', async () => {
      const invalidNotification = {
        subscriptionId: 'sub_001',
        alertId: 'alert_001',
        // Missing email and alertData
        timestamp: new Date().toISOString()
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [invalidNotification]
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.success).toBe(true)
      expect(response.summary.failed).toBe(1)
      expect(response.summary.sent).toBe(0)

      const result = response.results[0]
      expect(result.success).toBe(false)
      expect(result.error).toContain('Email and alertData are required')
    })

    it('should generate unique notification IDs', async () => {
      const notifications = Array.from({ length: 5 }, (_, i) => ({
        ...mockNotification,
        email: `test${i}@example.com`,
        subscriptionId: `sub_00${i}`
      }))

      const { req, res } = createMocks({
        method: 'POST',
        body: { notifications }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const notificationIds = response.results.map((r: any) => r.notificationId)
      const uniqueIds = new Set(notificationIds)

      expect(uniqueIds.size).toBe(5)
      notificationIds.forEach((id: string) => {
        expect(id).toMatch(/^notif_\d+_[a-z0-9]{9}$/)
      })
    })

    it('should have valid timestamp format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [mockNotification]
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)

      const timestamp = new Date(response.timestamp)
      const now = new Date()
      expect(timestamp.getTime()).toBeGreaterThan(now.getTime() - 60000) // Within last minute
    })
  })

  describe('Rate limiting', () => {
    it('should enforce rate limits', async () => {
      // Send 11 notifications to the same email (exceeds limit of 10)
      const notifications = Array.from({ length: 11 }, (_, i) => ({
        ...mockNotification,
        alertId: `alert_${i}`,
        subscriptionId: `sub_${i}`
      }))

      const { req, res } = createMocks({
        method: 'POST',
        body: { notifications }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(429)
      const response = JSON.parse(res._getData())

      expect(response.error).toContain('Rate limit exceeded')
      expect(response.error).toContain(mockNotification.email)
      expect(response).toHaveProperty('retryAfter')
      expect(typeof response.retryAfter).toBe('number')
    })

    it('should track rate limits per email', async () => {
      // Send 5 notifications to two different emails (within limits)
      const notifications1 = Array.from({ length: 5 }, (_, i) => ({
        ...mockNotification,
        email: 'user1@example.com',
        alertId: `alert_1_${i}`
      }))

      const notifications2 = Array.from({ length: 5 }, (_, i) => ({
        ...mockNotification,
        email: 'user2@example.com',
        alertId: `alert_2_${i}`
      }))

      // First request
      const { req: req1, res: res1 } = createMocks({
        method: 'POST',
        body: { notifications: notifications1 }
      })

      await handler(req1, res1)
      expect(res1._getStatusCode()).toBe(200)

      // Second request
      const { req: req2, res: res2 } = createMocks({
        method: 'POST',
        body: { notifications: notifications2 }
      })

      await handler(req2, res2)
      expect(res2._getStatusCode()).toBe(200)
    })

    it('should reset rate limits after one hour', async () => {
      // Mock Date.now to simulate time passage
      const originalDateNow = Date.now
      let mockTime = Date.now()
      Date.now = jest.fn(() => mockTime)

      try {
        // First, use up the rate limit
        const notifications = Array.from({ length: 10 }, (_, i) => ({
          ...mockNotification,
          alertId: `alert_${i}`
        }))

        const { req: req1, res: res1 } = createMocks({
          method: 'POST',
          body: { notifications }
        })

        await handler(req1, res1)
        expect(res1._getStatusCode()).toBe(200)

        // Try to send one more (should fail)
        const { req: req2, res: res2 } = createMocks({
          method: 'POST',
          body: { notifications: [mockNotification] }
        })

        await handler(req2, res2)
        expect(res2._getStatusCode()).toBe(429)

        // Advance time by more than one hour
        mockTime += 61 * 60 * 1000

        // Should work again
        const { req: req3, res: res3 } = createMocks({
          method: 'POST',
          body: { notifications: [mockNotification] }
        })

        await handler(req3, res3)
        expect(res3._getStatusCode()).toBe(200)
      } finally {
        Date.now = originalDateNow
      }
    })
  })

  describe('Input validation', () => {
    it('should require notifications array', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBe('Notifications array is required')
    })

    it('should reject non-array notifications', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: 'not an array'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBe('Notifications array is required')
    })

    it('should reject empty notifications array', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: []
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toBe('At least one notification is required')
    })

    it('should validate notification structure', async () => {
      const incompleteNotification = {
        subscriptionId: 'sub_001',
        alertId: 'alert_001',
        email: 'test@example.com'
        // Missing alertData
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [incompleteNotification]
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.summary.failed).toBe(1)
      expect(response.results[0].success).toBe(false)
      expect(response.results[0].error).toContain('Email and alertData are required')
    })

    it('should handle null and undefined values', async () => {
      const nullNotification = {
        subscriptionId: null,
        alertId: undefined,
        email: 'test@example.com',
        alertData: null
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [nullNotification]
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.summary.failed).toBe(1)
      expect(response.results[0].success).toBe(false)
    })

    it('should validate email format gracefully', async () => {
      const invalidEmailNotification = {
        ...mockNotification,
        email: 'not-a-valid-email'
      }

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [invalidEmailNotification]
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // The API doesn't validate email format, but simulates sending
      // Some might succeed, some might fail randomly
      expect(response.summary.total).toBe(1)
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
        body: { notifications: [mockNotification] },
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
    it('should handle server errors gracefully', async () => {
      // Mock Date.now to throw an error
      const originalDateNow = Date.now
      Date.now = jest.fn(() => {
        throw new Error('Date.now failed')
      })

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [mockNotification]
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error', 'Failed to process notifications')
      expect(response).toHaveProperty('details', 'Date.now failed')

      // Restore Date.now
      Date.now = originalDateNow
    })

    it('should handle partial failures gracefully', async () => {
      // Mock Math.random to ensure some failures
      const originalRandom = Math.random
      let callCount = 0
      Math.random = jest.fn(() => {
        callCount++
        // First call succeeds (0.5 < 0.95), second fails (0.96 > 0.95)
        return callCount === 1 ? 0.5 : 0.96
      })

      const notifications = [
        mockNotification,
        {
          ...mockNotification,
          email: 'test2@example.com',
          subscriptionId: 'sub_002'
        }
      ]

      const { req, res } = createMocks({
        method: 'POST',
        body: { notifications }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.summary.total).toBe(2)
      expect(response.summary.sent).toBe(1)
      expect(response.summary.failed).toBe(1)

      // Restore Math.random
      Math.random = originalRandom
    })

    it('should handle unexpected errors in notification processing', async () => {
      // Mock setTimeout to throw an error
      const originalSetTimeout = global.setTimeout
      global.setTimeout = jest.fn(() => {
        throw new Error('setTimeout failed')
      }) as any

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [mockNotification]
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.summary.failed).toBe(1)
      expect(response.results[0].success).toBe(false)
      expect(response.results[0].error).toContain('setTimeout failed')

      // Restore setTimeout
      global.setTimeout = originalSetTimeout
    })
  })

  describe('Performance', () => {
    it('should process notifications concurrently', async () => {
      const notifications = Array.from({ length: 5 }, (_, i) => ({
        ...mockNotification,
        email: `test${i}@example.com`,
        subscriptionId: `sub_00${i}`
      }))

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'POST',
        body: { notifications }
      })

      await handler(req, res)

      const duration = Date.now() - start

      // Should complete faster than serial processing
      // (5 notifications * 1000ms average delay = 5000ms serial)
      expect(duration).toBeLessThan(3000)
      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle large batches efficiently', async () => {
      const notifications = Array.from({ length: 50 }, (_, i) => ({
        ...mockNotification,
        email: `test${i}@example.com`,
        subscriptionId: `sub_${i.toString().padStart(3, '0')}`
      }))

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'POST',
        body: { notifications }
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
      expect(res._getStatusCode()).toBe(200)

      const response = JSON.parse(res._getData())
      expect(response.summary.total).toBe(50)
      expect(response.results).toHaveLength(50)
    })
  })

  describe('Priority handling', () => {
    it('should accept all valid priority levels', async () => {
      const priorities = ['urgent', 'high', 'normal', 'low']

      for (const priority of priorities) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            notifications: [mockNotification],
            priority
          }
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)
        const response = JSON.parse(res._getData())
        expect(response.summary.priority).toBe(priority)
      }
    })

    it('should handle invalid priority gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [mockNotification],
          priority: 'invalid_priority'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.summary.priority).toBe('invalid_priority') // Accepts any value
    })
  })

  describe('Response format validation', () => {
    it('should return valid JSON', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [mockNotification]
        }
      })

      await handler(req, res)

      const responseData = res._getData()
      expect(() => JSON.parse(responseData)).not.toThrow()
    })

    it('should have consistent success response structure', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          notifications: [mockNotification]
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('success')
      expect(response).toHaveProperty('summary')
      expect(response).toHaveProperty('results')
      expect(response).toHaveProperty('timestamp')

      expect(typeof response.success).toBe('boolean')
      expect(typeof response.summary).toBe('object')
      expect(Array.isArray(response.results)).toBe(true)
      expect(typeof response.timestamp).toBe('string')
    })

    it('should have consistent error response structure', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error')
      expect(typeof response.error).toBe('string')
    })
  })

  describe('Email simulation', () => {
    it('should simulate realistic email sending', async () => {
      // Test multiple times to see both success and failure cases
      const results = []

      for (let i = 0; i < 20; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            notifications: [{ ...mockNotification, email: `test${i}@example.com` }]
          }
        })

        await handler(req, res)
        const response = JSON.parse(res._getData())
        results.push(response.results[0].success)
      }

      // Should have mix of successes and failures (95% success rate)
      const successCount = results.filter(r => r).length
      const successRate = successCount / results.length

      expect(successRate).toBeGreaterThan(0.8) // At least 80% success
      expect(successRate).toBeLessThan(1.0)    // Some failures expected
    })

    it('should provide realistic failure reasons', async () => {
      // Force some failures by running many attempts
      const failures = []

      for (let i = 0; i < 100; i++) {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            notifications: [{ ...mockNotification, email: `test${i}@example.com` }]
          }
        })

        await handler(req, res)
        const response = JSON.parse(res._getData())
        const result = response.results[0]

        if (!result.success) {
          failures.push(result.error)
        }
      }

      expect(failures.length).toBeGreaterThan(0) // Should have some failures

      const validFailureReasons = [
        'Invalid email address',
        'Mailbox full',
        'Temporary server error',
        'Recipient blocked notifications',
        'Email bounced'
      ]

      failures.forEach(reason => {
        expect(validFailureReasons).toContain(reason)
      })
    })
  })
})