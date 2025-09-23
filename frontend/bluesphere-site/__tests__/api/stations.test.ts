/**
 * Marine Stations API Tests
 */

import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/stations'

describe('/api/stations', () => {
  it('returns station data with valid request', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.stations).toBeDefined()
    expect(Array.isArray(data.stations)).toBe(true)
  })

  it('filters by active status', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { active: 'true' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    data.stations.forEach((station: any) => {
      expect(station.status).toBe('active')
    })
  })

  it('handles region filtering', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { region: 'atlantic' }
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
  })

  it('returns station metadata', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(200)
    const data = JSON.parse(res._getData())
    expect(data.metadata).toBeDefined()
  })
})