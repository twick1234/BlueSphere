/**
 * Comprehensive test suite for Ocean Currents Vector Tiles API endpoint
 * Tests vector tile generation, oceanographic current modeling, and marine circulation patterns
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../pages/api/tiles/currents/[...params]'

describe('/api/tiles/currents/[...params]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {})
    // Mock Math.random for predictable test results
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('HTTP Method Validation', () => {
    it('should reject POST requests with 405 Method Not Allowed', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
        query: { params: ['8', '128', '64'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      })
    })

    it('should reject PUT requests with 405 Method Not Allowed', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'PUT',
        query: { params: ['5', '16', '12'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should reject DELETE requests with 405 Method Not Allowed', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'DELETE',
        query: { params: ['10', '512', '256'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe('Parameter Validation', () => {
    it('should reject requests with insufficient parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '128'] } // Missing y parameter
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile parameters. Expected format: /tiles/currents/{z}/{x}/{y}.mvt'
      })
    })

    it('should reject requests with too many parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '128', '64', 'extra', 'params'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should reject non-numeric parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['invalid', '128', '64'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile parameters. z, x, y must be valid numbers'
      })
    })

    it('should validate zoom level bounds (0-18)', async () => {
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['-1', '0', '0'] }
      })

      await handler(req1, res1)

      expect(res1._getStatusCode()).toBe(400)
      expect(JSON.parse(res1._getData())).toEqual({
        error: 'Invalid zoom level. Must be between 0 and 18'
      })

      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['19', '0', '0'] }
      })

      await handler(req2, res2)

      expect(res2._getStatusCode()).toBe(400)
    })

    it('should validate tile coordinates for given zoom level', async () => {
      // For zoom level 3, valid x,y range is 0-7
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['3', '8', '4'] } // x=8 is invalid for z=3
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile coordinates for zoom level 3. x and y must be between 0 and 7'
      })
    })
  })

  describe('Vector Tile Generation', () => {
    it('should return vector tile with correct headers', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '32', '24'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Content-Type')).toBe('application/x-protobuf')
      expect(res.getHeader('Cache-Control')).toBe('public, max-age=3600')
    })

    it('should return meaningful vector data structure', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '128', '64'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toHaveProperty('vectors')
      expect(responseData).toHaveProperty('tile_bounds')
      expect(responseData).toHaveProperty('metadata')

      expect(Array.isArray(responseData.vectors)).toBe(true)
      if (responseData.vectors.length > 0) {
        const vector = responseData.vectors[0]
        expect(vector).toHaveProperty('lat')
        expect(vector).toHaveProperty('lon')
        expect(vector).toHaveProperty('u_velocity')
        expect(vector).toHaveProperty('v_velocity')
        expect(vector).toHaveProperty('magnitude')
        expect(vector).toHaveProperty('direction')
      }
    })

    it('should generate different vector fields for different coordinates', async () => {
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['5', '16', '8'] }
      })
      await handler(req1, res1)
      const tile1Data = JSON.parse(res1._getData())

      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['5', '17', '8'] }
      })
      await handler(req2, res2)
      const tile2Data = JSON.parse(res2._getData())

      // Different coordinates should produce different vector fields
      expect(tile1Data.vectors).not.toEqual(tile2Data.vectors)
    })
  })

  describe('Oceanographic Current Modeling', () => {
    it('should model Gulf Stream current pattern in North Atlantic', async () => {
      // Tile covering Gulf Stream region (approximately 35°N, -70°W)
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '20', '24'] } // North Atlantic region
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.vectors.length).toBeGreaterThan(0)

      // Check for strong eastward currents characteristic of Gulf Stream
      const strongEastwardCurrents = responseData.vectors.filter((v: any) =>
        v.lat > 25 && v.lat < 45 &&
        v.lon > -80 && v.lon < -40 &&
        v.u_velocity > 0.5 // Strong eastward component
      )

      // Should have some vectors showing Gulf Stream characteristics
      expect(strongEastwardCurrents.length).toBeGreaterThan(0)
    })

    it('should model California Current southward flow', async () => {
      // Tile covering California Current region (approximately 40°N, -125°W)
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '8', '20'] } // North Pacific west coast
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      // Check for southward currents characteristic of California Current
      const southwardCurrents = responseData.vectors.filter((v: any) =>
        v.lat > 30 && v.lat < 50 &&
        v.lon > -130 && v.lon < -115 &&
        v.v_velocity < 0 // Southward component
      )

      expect(southwardCurrents.length).toBeGreaterThan(0)
    })

    it('should model Antarctic Circumpolar Current eastward flow', async () => {
      // Tile covering Southern Ocean
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['5', '16', '28'] } // Southern Ocean region
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      // Check for strong eastward currents in Southern Ocean
      const circumpolarCurrents = responseData.vectors.filter((v: any) =>
        v.lat < -40 &&
        v.u_velocity > 0.3 // Strong eastward component
      )

      if (responseData.vectors.some((v: any) => v.lat < -40)) {
        expect(circumpolarCurrents.length).toBeGreaterThan(0)
      }
    })

    it('should model equatorial current systems', async () => {
      // Tile covering equatorial Pacific
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '40', '32'] } // Equatorial Pacific
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      // Check for equatorial currents (trade wind driven)
      const equatorialCurrents = responseData.vectors.filter((v: any) =>
        Math.abs(v.lat) < 10 &&
        v.u_velocity > 0.2 // Eastward trade wind driven currents
      )

      if (responseData.vectors.some((v: any) => Math.abs(v.lat) < 10)) {
        expect(equatorialCurrents.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Vector Field Properties', () => {
    it('should generate physically realistic velocity magnitudes', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['7', '64', '32'] }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      responseData.vectors.forEach((vector: any) => {
        // Ocean currents typically range from 0 to 3 m/s
        expect(vector.magnitude).toBeGreaterThanOrEqual(0)
        expect(vector.magnitude).toBeLessThan(3.5)

        // Velocity components should be realistic
        expect(Math.abs(vector.u_velocity)).toBeLessThan(3)
        expect(Math.abs(vector.v_velocity)).toBeLessThan(3)

        // Direction should be in valid range (0-360 degrees)
        expect(vector.direction).toBeGreaterThanOrEqual(0)
        expect(vector.direction).toBeLessThan(360)

        // Magnitude should match calculated from components
        const calculatedMagnitude = Math.sqrt(
          vector.u_velocity * vector.u_velocity + vector.v_velocity * vector.v_velocity
        )
        expect(Math.abs(vector.magnitude - calculatedMagnitude)).toBeLessThan(0.01)
      })
    })

    it('should maintain consistency between velocity components and direction', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '128', '96'] }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      responseData.vectors.forEach((vector: any) => {
        // Verify direction calculation from components
        const expectedDirection = (Math.atan2(vector.u_velocity, vector.v_velocity) * 180 / Math.PI + 360) % 360
        const directionDiff = Math.abs(vector.direction - expectedDirection)

        // Allow for small floating point differences
        expect(directionDiff < 0.1 || directionDiff > 359.9).toBe(true)
      })
    })

    it('should provide appropriate vector density for zoom levels', async () => {
      // Lower zoom levels should have fewer vectors
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['3', '4', '2'] }
      })
      await handler(req1, res1)
      const lowZoomData = JSON.parse(res1._getData())

      // Higher zoom levels should have more vectors
      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['10', '512', '256'] }
      })
      await handler(req2, res2)
      const highZoomData = JSON.parse(res2._getData())

      expect(highZoomData.vectors.length).toBeGreaterThanOrEqual(lowZoomData.vectors.length)
    })
  })

  describe('Geographic Bounds and Coverage', () => {
    it('should provide correct tile bounds information', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['5', '16', '12'] }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.tile_bounds).toMatchObject({
        z: 5,
        x: 16,
        y: 12,
        lon_min: expect.any(Number),
        lon_max: expect.any(Number),
        lat_min: expect.any(Number),
        lat_max: expect.any(Number)
      })

      // Verify bounds are logically consistent
      expect(responseData.tile_bounds.lon_max).toBeGreaterThan(responseData.tile_bounds.lon_min)
      expect(responseData.tile_bounds.lat_max).toBeGreaterThan(responseData.tile_bounds.lat_min)

      // All vectors should be within tile bounds
      responseData.vectors.forEach((vector: any) => {
        expect(vector.lon).toBeGreaterThanOrEqual(responseData.tile_bounds.lon_min)
        expect(vector.lon).toBeLessThanOrEqual(responseData.tile_bounds.lon_max)
        expect(vector.lat).toBeGreaterThanOrEqual(responseData.tile_bounds.lat_min)
        expect(vector.lat).toBeLessThanOrEqual(responseData.tile_bounds.lat_max)
      })
    })

    it('should handle tiles crossing the international date line', async () => {
      // Tile that crosses 180°/-180° longitude
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['4', '0', '8'] }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toHaveProperty('vectors')
      expect(responseData).toHaveProperty('tile_bounds')

      // Should handle date line crossing gracefully
      if (responseData.tile_bounds.lon_min > responseData.tile_bounds.lon_max) {
        // This indicates date line crossing
        responseData.vectors.forEach((vector: any) => {
          expect(
            vector.lon >= responseData.tile_bounds.lon_min ||
            vector.lon <= responseData.tile_bounds.lon_max
          ).toBe(true)
        })
      }
    })
  })

  describe('Metadata and Performance', () => {
    it('should include comprehensive metadata', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['7', '64', '48'] }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.metadata).toMatchObject({
        tile_id: expect.stringMatching(/^7\/64\/48$/),
        vector_count: responseData.vectors.length,
        data_source: 'BlueSphere Ocean Circulation Model',
        generation_time: expect.any(String),
        coordinate_system: 'WGS84',
        velocity_units: 'm/s',
        direction_units: 'degrees_from_north'
      })
    })

    it('should provide oceanographic context in metadata', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '32', '20'] }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.metadata.model_description).toContain('ocean circulation')
      expect(responseData.metadata).toHaveProperty('current_patterns')
      expect(Array.isArray(responseData.metadata.current_patterns)).toBe(true)
    })

    it('should set appropriate cache headers for performance', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '128', '64'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Content-Type')).toBe('application/x-protobuf')
      expect(res.getHeader('Cache-Control')).toBe('public, max-age=3600')
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle floating point coordinates', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8.5', '128.7', '64.3'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile parameters. z, x, y must be valid numbers'
      })
    })

    it('should handle negative coordinates', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '-1', '64'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle missing params array', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile parameters. Expected format: /tiles/currents/{z}/{x}/{y}.mvt'
      })
    })

    it('should handle empty params array', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: [] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })
  })

  describe('Marine Domain Integration', () => {
    it('should model major ocean circulation patterns', async () => {
      // Test tiles covering major ocean basins
      const majorOceanTiles = [
        ['5', '16', '20'], // North Atlantic
        ['5', '8', '24'],  // North Pacific
        ['5', '24', '28'], // South Atlantic
        ['5', '40', '28']  // South Pacific
      ]

      for (const [z, x, y] of majorOceanTiles) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
          query: { params: [z, x, y] }
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const responseData = JSON.parse(res._getData())
        expect(responseData.vectors.length).toBeGreaterThan(0)

        // Each ocean basin should show distinct circulation patterns
        const avgMagnitude = responseData.vectors.reduce((sum: number, v: any) => sum + v.magnitude, 0) / responseData.vectors.length
        expect(avgMagnitude).toBeGreaterThan(0)
        expect(avgMagnitude).toBeLessThan(2) // Realistic current speeds
      }
    })

    it('should incorporate Coriolis effect in circulation patterns', async () => {
      // Northern hemisphere should show clockwise gyre tendencies
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '32', '16'] } // Northern mid-latitudes
      })
      await handler(req1, res1)
      const northernData = JSON.parse(res1._getData())

      // Southern hemisphere should show counter-clockwise tendencies
      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '32', '48'] } // Southern mid-latitudes
      })
      await handler(req2, res2)
      const southernData = JSON.parse(res2._getData())

      // Both hemispheres should have circulation patterns
      expect(northernData.vectors.length).toBeGreaterThan(0)
      expect(southernData.vectors.length).toBeGreaterThan(0)

      // Verify that Coriolis effect is considered in metadata
      expect(northernData.metadata.current_patterns).toContain('coriolis')
      expect(southernData.metadata.current_patterns).toContain('coriolis')
    })
  })
})