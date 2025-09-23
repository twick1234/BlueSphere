/**
 * Marine Observations API Tests
 * Comprehensive testing for ocean data endpoints
 */

import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/obs'

describe('/api/obs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns marine observations with valid request', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: '10' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.observations).toBeDefined()
    expect(Array.isArray(data.observations)).toBe(true)
  })

  it('handles station parameter correctly', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { station: '41001', limit: '5' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.observations).toBeDefined()
    data.observations.forEach((obs: any) => {
      expect(obs.station_id).toBe('41001')
    })
  })

  it('validates limit parameter', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: 'invalid' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const error = JSON.parse(res._getData())
    expect(error.error).toContain('Invalid limit parameter')
  })

  it('handles date range filtering', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        start_date: '2024-09-22T00:00:00Z',
        end_date: '2024-09-22T23:59:59Z'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    data.observations.forEach((obs: any) => {
      const obsDate = new Date(obs.time)
      expect(obsDate >= new Date('2024-09-22T00:00:00Z')).toBe(true)
      expect(obsDate <= new Date('2024-09-22T23:59:59Z')).toBe(true)
    })
  })

  it('returns empty array for no matching observations', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { station: 'NONEXISTENT' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.observations).toEqual([])
  })

  it('handles quality control flags', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { qc_flag: '1' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    data.observations.forEach((obs: any) => {
      expect(obs.qc_flag).toBe(1)
    })
  })

  it('supports pagination', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: '5', offset: '10' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.observations.length).toBeLessThanOrEqual(5)
    expect(data.pagination).toBeDefined()
    expect(data.pagination.offset).toBe(10)
  })

  it('handles temperature range queries', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { min_temp: '20', max_temp: '30' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    data.observations.forEach((obs: any) => {
      expect(obs.sst_c).toBeGreaterThanOrEqual(20)
      expect(obs.sst_c).toBeLessThanOrEqual(30)
    })
  })

  it('rejects unsupported HTTP methods', async () => {
    const { req, res } = createMocks({
      method: 'POST'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(405)
    const error = JSON.parse(res._getData())
    expect(error.error).toContain('Method not allowed')
  })

  it('handles large limit values appropriately', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: '10000' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    // Should cap at reasonable limit
    expect(data.observations.length).toBeLessThanOrEqual(1000)
  })

  it('validates date format', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { start_date: 'invalid-date' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const error = JSON.parse(res._getData())
    expect(error.error).toContain('Invalid date format')
  })

  it('returns metadata with observations', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { limit: '5' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.metadata).toBeDefined()
    expect(data.metadata.total_count).toBeDefined()
    expect(data.metadata.last_updated).toBeDefined()
  })

  it('handles coordinate-based queries', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        lat: '35.0',
        lon: '-75.0',
        radius: '100'
      }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.observations).toBeDefined()
  })

  it('handles anomaly threshold queries', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { anomaly_threshold: '2.0' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    data.observations.forEach((obs: any) => {
      if (obs.anomaly_c !== null) {
        expect(Math.abs(obs.anomaly_c)).toBeGreaterThanOrEqual(2.0)
      }
    })
  })

  it('returns proper CORS headers', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await handler(req, res)

    expect(res.getHeader('Access-Control-Allow-Origin')).toBeDefined()
  })

  it('handles concurrent requests efficiently', async () => {
    const requests = Array.from({ length: 10 }, () =>
      createMocks({
        method: 'GET',
        query: { limit: '5' }
      })
    )

    const startTime = performance.now()

    const promises = requests.map(async ({ req, res }) => {
      await handler(req, res)
      return res._getStatusCode()
    })

    const results = await Promise.all(promises)
    const endTime = performance.now()

    // All requests should succeed
    results.forEach(statusCode => {
      expect(statusCode).toBe(200)
    })

    // Should handle concurrent requests efficiently
    expect(endTime - startTime).toBeLessThan(5000) // 5 seconds
  })
})