import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/notifications/history'

describe('/api/notifications/history', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('CORS headers', () => {
    it('should set CORS headers for all requests', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res.getHeader('Access-Control-Allow-Origin')).toBe('*')
      expect(res.getHeader('Access-Control-Allow-Methods')).toBe('GET, OPTIONS')
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
    it('should return notification history with proper structure', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Verify top-level structure
      expect(response).toHaveProperty('success', true)
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('pagination')
      expect(response).toHaveProperty('stats')
      expect(response).toHaveProperty('insights')
      expect(response).toHaveProperty('metadata')

      // Verify data array
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data.length).toBeGreaterThan(0)

      // Verify pagination structure
      expect(response.pagination).toHaveProperty('total')
      expect(response.pagination).toHaveProperty('offset')
      expect(response.pagination).toHaveProperty('limit')
      expect(response.pagination).toHaveProperty('hasMore')

      // Verify stats structure
      expect(response.stats).toHaveProperty('total')
      expect(response.stats).toHaveProperty('sent')
      expect(response.stats).toHaveProperty('failed')
      expect(response.stats).toHaveProperty('bounced')
      expect(response.stats).toHaveProperty('pending')
      expect(response.stats).toHaveProperty('totalRetries')
      expect(response.stats).toHaveProperty('averageRetries')
      expect(response.stats).toHaveProperty('successRate')

      // Verify insights structure
      expect(response.insights).toHaveProperty('byAlertType')
      expect(response.insights).toHaveProperty('bySeverity')

      // Verify metadata structure
      expect(response.metadata).toHaveProperty('timestamp')
      expect(response.metadata).toHaveProperty('source', 'BlueSphere Notification System')
      expect(response.metadata).toHaveProperty('filters')
    })

    it('should have properly structured notification history objects', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.data.forEach((notification: any) => {
        // Verify required properties
        expect(notification).toHaveProperty('id')
        expect(notification).toHaveProperty('subscriptionId')
        expect(notification).toHaveProperty('alertId')
        expect(notification).toHaveProperty('email')
        expect(notification).toHaveProperty('status')
        expect(notification).toHaveProperty('retryCount')

        // Verify data types
        expect(typeof notification.id).toBe('string')
        expect(typeof notification.subscriptionId).toBe('string')
        expect(typeof notification.alertId).toBe('string')
        expect(typeof notification.email).toBe('string')
        expect(typeof notification.status).toBe('string')
        expect(typeof notification.retryCount).toBe('number')

        // Verify ID format
        expect(notification.id).toMatch(/^notif_\d+_\d+$/)

        // Verify valid status values
        const validStatuses = ['pending', 'sent', 'failed', 'bounced']
        expect(validStatuses).toContain(notification.status)

        // Verify retry count is non-negative
        expect(notification.retryCount).toBeGreaterThanOrEqual(0)

        // Check conditional properties
        if (notification.status === 'sent') {
          expect(notification).toHaveProperty('sentAt')
          expect(typeof notification.sentAt).toBe('string')
          expect(notification.sentAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        }

        if (notification.status === 'failed' || notification.status === 'bounced') {
          expect(notification).toHaveProperty('failureReason')
          expect(typeof notification.failureReason).toBe('string')
          expect(notification.failureReason.length).toBeGreaterThan(0)
        }

        // Verify alert data structure if present
        if (notification.alertData) {
          expect(notification.alertData).toHaveProperty('type')
          expect(notification.alertData).toHaveProperty('severity')
          expect(notification.alertData).toHaveProperty('title')
          expect(notification.alertData).toHaveProperty('location')

          expect(typeof notification.alertData.type).toBe('string')
          expect(typeof notification.alertData.severity).toBe('string')
          expect(typeof notification.alertData.title).toBe('string')

          const location = notification.alertData.location
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
        }
      })
    })

    it('should calculate statistics correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const { data, stats } = response

      // Verify total matches data length
      expect(stats.total).toBe(data.length)

      // Count statuses manually and verify
      const actualCounts = {
        sent: data.filter((n: any) => n.status === 'sent').length,
        failed: data.filter((n: any) => n.status === 'failed').length,
        bounced: data.filter((n: any) => n.status === 'bounced').length,
        pending: data.filter((n: any) => n.status === 'pending').length
      }

      expect(stats.sent).toBe(actualCounts.sent)
      expect(stats.failed).toBe(actualCounts.failed)
      expect(stats.bounced).toBe(actualCounts.bounced)
      expect(stats.pending).toBe(actualCounts.pending)

      // Verify sum equals total
      expect(stats.sent + stats.failed + stats.bounced + stats.pending).toBe(stats.total)

      // Verify retry calculations
      const actualTotalRetries = data.reduce((sum: number, n: any) => sum + n.retryCount, 0)
      expect(stats.totalRetries).toBe(actualTotalRetries)

      const expectedAverageRetries = data.length > 0
        ? (actualTotalRetries / data.length).toFixed(2)
        : '0'
      expect(stats.averageRetries).toBe(expectedAverageRetries)

      // Verify success rate calculation
      const expectedSuccessRate = data.length > 0
        ? ((actualCounts.sent / data.length) * 100).toFixed(1) + '%'
        : '0%'
      expect(stats.successRate).toBe(expectedSuccessRate)
    })

    it('should generate insights correctly', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const { data, insights } = response

      // Verify alert type counts
      const expectedByAlertType = data.reduce((acc: any, n: any) => {
        if (n.alertData?.type) {
          acc[n.alertData.type] = (acc[n.alertData.type] || 0) + 1
        }
        return acc
      }, {})

      expect(insights.byAlertType).toEqual(expectedByAlertType)

      // Verify severity counts
      const expectedBySeverity = data.reduce((acc: any, n: any) => {
        if (n.alertData?.severity) {
          acc[n.alertData.severity] = (acc[n.alertData.severity] || 0) + 1
        }
        return acc
      }, {})

      expect(insights.bySeverity).toEqual(expectedBySeverity)
    })

    it('should have recent timestamps', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const now = new Date()

      // Metadata timestamp should be very recent
      const metadataTimestamp = new Date(response.metadata.timestamp)
      expect(metadataTimestamp.getTime()).toBeGreaterThan(now.getTime() - 60000) // Within last minute

      // Sent timestamps should be within reasonable range
      response.data.forEach((notification: any) => {
        if (notification.sentAt) {
          const sentAt = new Date(notification.sentAt)
          expect(sentAt.getTime()).toBeLessThanOrEqual(now.getTime())
          expect(sentAt.getTime()).toBeGreaterThan(now.getTime() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      })
    })
  })

  describe('Filtering', () => {
    it('should filter by email', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: 'researcher@marine.org'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      response.data.forEach((notification: any) => {
        expect(notification.email).toBe('researcher@marine.org')
      })

      expect(response.metadata.filters.email).toBe('researcher@marine.org')
    })

    it('should filter by status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          status: 'sent'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      response.data.forEach((notification: any) => {
        expect(notification.status).toBe('sent')
      })

      expect(response.metadata.filters.status).toBe('sent')
    })

    it('should filter by subscription ID', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          subscriptionId: 'sub_001'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      response.data.forEach((notification: any) => {
        expect(notification.subscriptionId).toBe('sub_001')
      })

      expect(response.metadata.filters.subscriptionId).toBe('sub_001')
    })

    it('should combine multiple filters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: 'researcher@marine.org',
          status: 'sent'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      response.data.forEach((notification: any) => {
        expect(notification.email).toBe('researcher@marine.org')
        expect(notification.status).toBe('sent')
      })

      expect(response.metadata.filters.email).toBe('researcher@marine.org')
      expect(response.metadata.filters.status).toBe('sent')
    })

    it('should handle non-existent filter values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: 'nonexistent@example.com'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.data).toEqual([])
      expect(response.stats.total).toBe(0)
      expect(response.pagination.total).toBe(0)
    })

    it('should handle array query parameters', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          status: ['sent', 'failed']
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should use first value in array
      response.data.forEach((notification: any) => {
        expect(notification.status).toBe('sent')
      })
    })
  })

  describe('Sorting', () => {
    it('should sort by sentAt descending by default', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const notifications = response.data.filter((n: any) => n.sentAt)

      for (let i = 1; i < notifications.length; i++) {
        const prevTime = new Date(notifications[i - 1].sentAt).getTime()
        const currTime = new Date(notifications[i].sentAt).getTime()
        expect(prevTime).toBeGreaterThanOrEqual(currTime)
      }
    })

    it('should sort by status', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          orderBy: 'status',
          order: 'asc'
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const notifications = response.data

      for (let i = 1; i < notifications.length; i++) {
        expect(notifications[i - 1].status <= notifications[i].status).toBe(true)
      }
    })

    it('should sort by email', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          orderBy: 'email',
          order: 'asc'
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const notifications = response.data

      for (let i = 1; i < notifications.length; i++) {
        expect(notifications[i - 1].email <= notifications[i].email).toBe(true)
      }
    })

    it('should sort by retryCount', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          orderBy: 'retryCount',
          order: 'desc'
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const notifications = response.data

      for (let i = 1; i < notifications.length; i++) {
        expect(notifications[i - 1].retryCount >= notifications[i].retryCount).toBe(true)
      }
    })

    it('should handle invalid orderBy field', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          orderBy: 'invalid_field'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Should fall back to default sorting (sentAt)
      const response = JSON.parse(res._getData())
      expect(response.data).toBeDefined()
    })

    it('should handle invalid order direction', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          order: 'invalid_order'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Should fall back to default order (desc)
      const response = JSON.parse(res._getData())
      expect(response.data).toBeDefined()
    })
  })

  describe('Pagination', () => {
    it('should paginate results with default values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.pagination.offset).toBe(0)
      expect(response.pagination.limit).toBe(50)
      expect(response.pagination.total).toBeGreaterThan(0)
      expect(typeof response.pagination.hasMore).toBe('boolean')
    })

    it('should respect custom limit and offset', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '2',
          offset: '1'
        }
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response.data.length).toBeLessThanOrEqual(2)
      expect(response.pagination.offset).toBe(1)
      expect(response.pagination.limit).toBe(2)
    })

    it('should calculate hasMore correctly', async () => {
      // Get first page
      const { req: req1, res: res1 } = createMocks({
        method: 'GET',
        query: {
          limit: '2',
          offset: '0'
        }
      })

      await handler(req1, res1)
      const response1 = JSON.parse(res1._getData())

      if (response1.pagination.total > 2) {
        expect(response1.pagination.hasMore).toBe(true)
      } else {
        expect(response1.pagination.hasMore).toBe(false)
      }

      // Get last page
      const lastOffset = Math.max(0, response1.pagination.total - 2)
      const { req: req2, res: res2 } = createMocks({
        method: 'GET',
        query: {
          limit: '2',
          offset: lastOffset.toString()
        }
      })

      await handler(req2, res2)
      const response2 = JSON.parse(res2._getData())

      expect(response2.pagination.hasMore).toBe(false)
    })

    it('should handle invalid pagination values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: 'invalid',
          offset: 'invalid'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should use default values or handle gracefully
      expect(response.pagination.offset).toBe(0) // NaN becomes 0
      expect(response.pagination.limit).toBe(0)  // NaN becomes 0
    })

    it('should handle negative pagination values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '-5',
          offset: '-10'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.pagination.offset).toBe(-10)
      expect(response.pagination.limit).toBe(-5)
      // Should handle gracefully without crashing
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
  })

  describe('Error handling', () => {
    it('should handle server errors gracefully', async () => {
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

      expect(response).toHaveProperty('error', 'Failed to fetch notification history')
      expect(response).toHaveProperty('details', 'Date.now failed')

      // Restore Date.now
      Date.now = originalDateNow
    })

    it('should handle array operation errors', async () => {
      // Mock Array.prototype.filter to throw an error
      const originalFilter = Array.prototype.filter
      Array.prototype.filter = jest.fn(() => {
        throw new Error('Filter operation failed')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error', 'Failed to fetch notification history')

      // Restore Array.prototype.filter
      Array.prototype.filter = originalFilter
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
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('pagination')
      expect(response).toHaveProperty('stats')
      expect(response).toHaveProperty('insights')
      expect(response).toHaveProperty('metadata')

      expect(Array.isArray(response.data)).toBe(true)
      expect(typeof response.pagination).toBe('object')
      expect(typeof response.stats).toBe('object')
      expect(typeof response.insights).toBe('object')
      expect(typeof response.metadata).toBe('object')
    })

    it('should have consistent error response structure', async () => {
      const originalDateNow = Date.now
      Date.now = jest.fn(() => {
        throw new Error('Test error')
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error')
      expect(response).toHaveProperty('details')

      expect(typeof response.error).toBe('string')
      expect(typeof response.details).toBe('string')

      Date.now = originalDateNow
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

    it('should handle large result sets efficiently', async () => {
      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '1000'
        }
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should respond within 1 second
      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle complex filtering efficiently', async () => {
      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: 'researcher@marine.org',
          status: 'sent',
          orderBy: 'sentAt',
          order: 'desc',
          limit: '50',
          offset: '0'
        }
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(200) // Should respond within 200ms
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Data consistency', () => {
    it('should return consistent data across multiple requests', async () => {
      const responses = []

      for (let i = 0; i < 3; i++) {
        const { req, res } = createMocks({
          method: 'GET',
        })

        await handler(req, res)
        responses.push(JSON.parse(res._getData()))
      }

      // All responses should have the same structure and static data
      responses.forEach((response, index) => {
        expect(response.metadata.source).toBe('BlueSphere Notification System')

        // Data content should be consistent (since it's generated statically)
        if (index > 0) {
          expect(response.data.length).toBe(responses[0].data.length)
          expect(response.stats.total).toBe(responses[0].stats.total)
        }
      })
    })

    it('should have unique notification IDs', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const ids = response.data.map((n: any) => n.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should maintain referential integrity', async () => {
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      response.data.forEach((notification: any) => {
        // Subscription IDs should follow pattern
        expect(notification.subscriptionId).toMatch(/^sub_\d+$/)

        // Alert IDs should follow pattern
        expect(notification.alertId).toMatch(/^alert_\d+$/)

        // Email should be valid format
        expect(notification.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle extreme pagination values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '999999',
          offset: '999999'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.data).toEqual([])
      expect(response.pagination.hasMore).toBe(false)
    })

    it('should handle zero pagination values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          limit: '0',
          offset: '0'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      expect(response.data).toEqual([])
    })

    it('should handle special characters in filter values', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: 'test+special@sub-domain.example.org'
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should not crash and return empty results
      expect(response.data).toEqual([])
    })

    it('should handle empty query strings', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {
          email: '',
          status: '',
          orderBy: '',
          order: ''
        }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should return all data when filters are empty
      expect(response.data.length).toBeGreaterThan(0)
    })
  })
})