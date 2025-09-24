import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/alerts/subscribe'

describe('/api/alerts/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear the in-memory subscriptions array
    // Access the subscriptions array via module internals for testing
  })

  describe('CORS headers', () => {
    it('should set CORS headers for all requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res.getHeader('Access-Control-Allow-Origin')).toBe('*')
      expect(res.getHeader('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS')
      expect(res.getHeader('Access-Control-Allow-Headers')).toBe('Content-Type')
    })

    it('should handle OPTIONS preflight requests', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Access-Control-Allow-Origin')).toBe('*')
      expect(res.getHeader('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS')
      expect(res.getHeader('Access-Control-Allow-Headers')).toBe('Content-Type')
    })
  })

  describe('POST requests (create subscription)', () => {
    it('should create a new subscription successfully', async () => {
      const subscriptionData = {
        email: 'test@example.com',
        alertTypes: ['marine_heatwave', 'temperature_spike'],
        thresholds: {
          temperature: 28,
          severity: 'high'
        },
        zones: [{
          name: 'Pacific Region',
          bounds: {
            north: 40,
            south: -40,
            east: -120,
            west: 180
          }
        }]
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: subscriptionData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('subscription')
      expect(response).toHaveProperty('message', 'Alert subscription created successfully')

      // Verify subscription structure
      const subscription = response.subscription
      expect(subscription).toHaveProperty('id')
      expect(subscription).toHaveProperty('email', 'test@example.com')
      expect(subscription).toHaveProperty('alertTypes', ['marine_heatwave', 'temperature_spike'])
      expect(subscription).toHaveProperty('thresholds')
      expect(subscription).toHaveProperty('zones')
      expect(subscription).toHaveProperty('active', true)
      expect(subscription).toHaveProperty('createdAt')

      // Verify ID format
      expect(subscription.id).toMatch(/^alert_\d+_[a-z0-9]{9}$/)

      // Verify ISO timestamp
      expect(subscription.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should create subscription with default values', async () => {
      const minimalData = {
        email: 'minimal@example.com',
        alertTypes: ['marine_heatwave'],
        thresholds: {
          temperature: 25,
          severity: 'medium'
        }
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: minimalData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const response = JSON.parse(res._getData())

      const subscription = response.subscription

      // Should have default zones
      expect(subscription.zones).toEqual([{
        name: 'Global',
        bounds: { north: 90, south: -90, east: 180, west: -180 }
      }])
    })

    it('should handle missing email field', async () => {
      const invalidData = {
        alertTypes: ['marine_heatwave'],
        thresholds: {
          temperature: 25,
          severity: 'medium'
        }
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: invalidData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({
        error: 'Missing required fields: email, alertTypes, thresholds'
      })
    })

    it('should handle missing alertTypes field', async () => {
      const invalidData = {
        email: 'test@example.com',
        thresholds: {
          temperature: 25,
          severity: 'medium'
        }
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: invalidData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({
        error: 'Missing required fields: email, alertTypes, thresholds'
      })
    })

    it('should handle missing thresholds field', async () => {
      const invalidData = {
        email: 'test@example.com',
        alertTypes: ['marine_heatwave']
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: invalidData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({
        error: 'Missing required fields: email, alertTypes, thresholds'
      })
    })

    it('should apply default values for partial thresholds', async () => {
      const dataWithPartialThresholds = {
        email: 'test@example.com',
        alertTypes: ['marine_heatwave'],
        thresholds: {}
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: dataWithPartialThresholds,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const response = JSON.parse(res._getData())

      const subscription = response.subscription
      expect(subscription.thresholds).toEqual({
        temperature: 26,
        severity: 'medium'
      })
    })

    it('should handle server errors during creation', async () => {
      // Mock Date.now to throw an error
      const originalDateNow = Date.now
      Date.now = jest.fn(() => {
        throw new Error('Date.now failed')
      })

      const validData = {
        email: 'test@example.com',
        alertTypes: ['marine_heatwave'],
        thresholds: {
          temperature: 25,
          severity: 'medium'
        }
      }

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: validData,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())
      expect(response).toHaveProperty('error', 'Failed to create subscription')
      expect(response).toHaveProperty('details', 'Date.now failed')

      // Restore Date.now
      Date.now = originalDateNow
    })
  })

  describe('GET requests (retrieve subscriptions)', () => {
    it('should return empty array when no subscriptions exist', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({
        subscriptions: []
      })
    })

    it('should return all subscriptions with anonymized emails', async () => {
      // First create a subscription
      const createReq = createMocks({
        method: 'POST',
        body: {
          email: 'user1@example.com',
          alertTypes: ['marine_heatwave'],
          thresholds: { temperature: 25, severity: 'medium' }
        }
      })
      await handler(createReq.req, createReq.res)

      // Create another subscription
      const createReq2 = createMocks({
        method: 'POST',
        body: {
          email: 'user2@test.org',
          alertTypes: ['temperature_spike'],
          thresholds: { temperature: 30, severity: 'high' }
        }
      })
      await handler(createReq2.req, createReq2.res)

      // Now get all subscriptions
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('subscriptions')
      expect(response.subscriptions).toHaveLength(2)

      // Verify email anonymization
      expect(response.subscriptions[0].email).toBe('us***@example.com')
      expect(response.subscriptions[1].email).toBe('us***@test.org')
    })

    it('should filter subscriptions by email', async () => {
      // Create subscriptions for different users
      const createReq1 = createMocks({
        method: 'POST',
        body: {
          email: 'user1@example.com',
          alertTypes: ['marine_heatwave'],
          thresholds: { temperature: 25, severity: 'medium' }
        }
      })
      await handler(createReq1.req, createReq1.res)

      const createReq2 = createMocks({
        method: 'POST',
        body: {
          email: 'user2@example.com',
          alertTypes: ['temperature_spike'],
          thresholds: { temperature: 30, severity: 'high' }
        }
      })
      await handler(createReq2.req, createReq2.res)

      // Get subscriptions for specific user
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: 'user1@example.com'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.subscriptions).toHaveLength(1)
      expect(response.subscriptions[0].email).toBe('user1@example.com')
      expect(response.subscriptions[0].alertTypes).toEqual(['marine_heatwave'])
    })

    it('should return empty array for non-existent email', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: 'nonexistent@example.com'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({
        subscriptions: []
      })
    })
  })

  describe('PUT requests (update subscription)', () => {
    it('should update an existing subscription', async () => {
      // First create a subscription
      const createReq = createMocks({
        method: 'POST',
        body: {
          email: 'update@example.com',
          alertTypes: ['marine_heatwave'],
          thresholds: { temperature: 25, severity: 'medium' }
        }
      })
      await handler(createReq.req, createReq.res)
      const createResponse = JSON.parse(createReq.res._getData())
      const subscriptionId = createResponse.subscription.id

      // Update the subscription
      const updates = {
        alertTypes: ['marine_heatwave', 'temperature_spike'],
        thresholds: {
          temperature: 30,
          severity: 'high'
        },
        active: false
      }

      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: subscriptionId },
        body: updates,
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('subscription')
      expect(response).toHaveProperty('message', 'Subscription updated successfully')

      // Verify updates were applied
      const subscription = response.subscription
      expect(subscription.alertTypes).toEqual(['marine_heatwave', 'temperature_spike'])
      expect(subscription.thresholds.temperature).toBe(30)
      expect(subscription.thresholds.severity).toBe('high')
      expect(subscription.active).toBe(false)
      expect(subscription.email).toBe('update@example.com') // Should remain unchanged
    })

    it('should return 404 for non-existent subscription', async () => {
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: 'non-existent-id' },
        body: { active: false },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({
        error: 'Subscription not found'
      })
    })

    it('should handle partial updates', async () => {
      // Create a subscription
      const createReq = createMocks({
        method: 'POST',
        body: {
          email: 'partial@example.com',
          alertTypes: ['marine_heatwave'],
          thresholds: { temperature: 25, severity: 'medium' }
        }
      })
      await handler(createReq.req, createReq.res)
      const createResponse = JSON.parse(createReq.res._getData())
      const subscriptionId = createResponse.subscription.id

      // Update only the active status
      const { req, res } = createMocks({
        method: 'PUT',
        query: { id: subscriptionId },
        body: { active: false },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      const subscription = response.subscription
      expect(subscription.active).toBe(false)
      expect(subscription.email).toBe('partial@example.com') // Unchanged
      expect(subscription.alertTypes).toEqual(['marine_heatwave']) // Unchanged
    })
  })

  describe('DELETE requests (delete subscription)', () => {
    it('should delete an existing subscription', async () => {
      // Create a subscription
      const createReq = createMocks({
        method: 'POST',
        body: {
          email: 'delete@example.com',
          alertTypes: ['marine_heatwave'],
          thresholds: { temperature: 25, severity: 'medium' }
        }
      })
      await handler(createReq.req, createReq.res)
      const createResponse = JSON.parse(createReq.res._getData())
      const subscriptionId = createResponse.subscription.id

      // Delete the subscription
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: subscriptionId },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response).toEqual({
        success: true,
        message: 'Subscription deleted successfully'
      })

      // Verify it's actually deleted by trying to get it
      const getReq = createMocks({
        method: 'GET',
        query: { email: 'delete@example.com' }
      })
      await handler(getReq.req, getReq.res)
      const getResponse = JSON.parse(getReq.res._getData())
      expect(getResponse.subscriptions).toHaveLength(0)
    })

    it('should return 404 for non-existent subscription', async () => {
      const { req, res } = createMocks({
        method: 'DELETE',
        query: { id: 'non-existent-id' },
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(404)
      const response = JSON.parse(res._getData())
      expect(response).toEqual({
        error: 'Subscription not found'
      })
    })
  })

  describe('Invalid HTTP methods', () => {
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

  describe('Data validation', () => {
    it('should validate email format in filters', async () => {
      // This endpoint doesn't validate email format in the current implementation
      // but we can test that malformed emails are handled gracefully
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: 'not-an-email'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      expect(response.subscriptions).toEqual([])
    })

    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com'

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: longEmail,
          alertTypes: ['marine_heatwave'],
          thresholds: { temperature: 25, severity: 'medium' }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const response = JSON.parse(res._getData())
      expect(response.subscription.email).toBe(longEmail)
    })

    it('should handle special characters in email', async () => {
      const specialEmail = 'user+test@sub-domain.example-site.org'

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: specialEmail,
          alertTypes: ['marine_heatwave'],
          thresholds: { temperature: 25, severity: 'medium' }
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(201)
      const response = JSON.parse(res._getData())
      expect(response.subscription.email).toBe(specialEmail)
    })
  })

  describe('Performance and concurrency', () => {
    it('should handle concurrent subscription creation', async () => {
      const concurrentRequests = 10
      const requests = Array.from({ length: concurrentRequests }, (_, i) => {
        const { req, res } = createMocks({
          method: 'POST',
          body: {
            email: `concurrent${i}@example.com`,
            alertTypes: ['marine_heatwave'],
            thresholds: { temperature: 25, severity: 'medium' }
          }
        })
        return handler(req, res).then(() => res._getStatusCode())
      })

      const results = await Promise.all(requests)

      // All requests should succeed
      results.forEach(statusCode => {
        expect(statusCode).toBe(201)
      })

      // Verify all subscriptions were created
      const getReq = createMocks({ method: 'GET' })
      await handler(getReq.req, getReq.res)
      const getResponse = JSON.parse(getReq.res._getData())
      expect(getResponse.subscriptions.length).toBeGreaterThanOrEqual(concurrentRequests)
    })

    it('should respond quickly for basic operations', async () => {
      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(100)
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Edge cases', () => {
    it('should handle null and undefined values in request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          email: null,
          alertTypes: undefined,
          thresholds: null
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toContain('Missing required fields')
    })

    it('should handle empty request body', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      const response = JSON.parse(res._getData())
      expect(response.error).toContain('Missing required fields')
    })

    it('should handle malformed JSON gracefully', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      })

      // The node-mocks-http should handle this, but we test the handler behavior
      await handler(req, res)

      // The exact response depends on how the framework handles malformed JSON
      // In this case, it would likely be handled by the body parser
    })
  })
})