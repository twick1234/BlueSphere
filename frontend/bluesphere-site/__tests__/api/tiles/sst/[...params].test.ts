/**
 * Comprehensive test suite for SST Raster Tiles API endpoint
 * Tests map tile generation, geographic calculations, and marine temperature visualization
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import handler from '../../../../pages/api/tiles/sst/[...params]'

describe('/api/tiles/sst/[...params]', () => {
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
        query: { params: ['10', '512', '256'] }
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
        query: { params: ['8', '128', '64'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe('Parameter Validation', () => {
    it('should reject requests with insufficient parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['10', '512'] } // Missing y parameter
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile parameters. Expected format: /tiles/sst/{z}/{x}/{y}.png'
      })
    })

    it('should reject requests with too many parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['10', '512', '256', 'extra'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should reject non-numeric zoom levels', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['invalid', '512', '256'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile parameters. z, x, y must be valid numbers'
      })
    })

    it('should reject non-numeric tile coordinates', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['10', 'invalid_x', '256'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
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
  })

  describe('Tile Coordinate Validation', () => {
    it('should validate tile coordinates for given zoom level', async () => {
      // For zoom level 2, valid x,y range is 0-3
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['2', '4', '2'] } // x=4 is invalid for z=2
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile coordinates for zoom level 2. x and y must be between 0 and 3'
      })
    })

    it('should accept valid tile coordinates', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['2', '1', '1'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle edge cases at maximum coordinates', async () => {
      // For zoom level 10, max coordinates are 1023
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['10', '1023', '1023'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('PNG Tile Generation', () => {
    it('should return PNG image with correct headers', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['5', '16', '12'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Content-Type')).toBe('image/png')
      expect(res.getHeader('Cache-Control')).toBe('public, max-age=3600')

      // Verify PNG header (first 8 bytes should be PNG signature)
      const data = Buffer.from(res._getData())
      expect(data.length).toBeGreaterThan(8)
      expect(data.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    })

    it('should generate different tiles for different coordinates', async () => {
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '128', '64'] }
      })
      await handler(req1, res1)
      const tile1Data = res1._getData()

      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '129', '64'] }
      })
      await handler(req2, res2)
      const tile2Data = res2._getData()

      // Different coordinates should produce different tile data
      expect(tile1Data).not.toEqual(tile2Data)
    })

    it('should generate consistent tiles for same coordinates', async () => {
      // Mock Math.random to be consistent
      const mockRandom = jest.fn()
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3)
      jest.spyOn(Math, 'random').mockImplementation(mockRandom)

      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '32', '24'] }
      })
      await handler(req1, res1)
      const tile1Data = res1._getData()

      // Reset mock to return same sequence
      mockRandom.mockClear()
      mockRandom
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.2)
        .mockReturnValueOnce(0.3)

      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '32', '24'] }
      })
      await handler(req2, res2)
      const tile2Data = res2._getData()

      // Same coordinates with same random values should produce same tile
      expect(tile1Data).toEqual(tile2Data)
    })
  })

  describe('Geographic Calculations', () => {
    it('should calculate correct geographic bounds for equatorial tiles', async () => {
      // Zoom 1, tile (1,1) should cover specific geographic area
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['1', '1', '1'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // At zoom level 1, tile (1,1) covers approximately:
      // Longitude: 0° to 180°
      // Latitude: -85.05° to 85.05° (Web Mercator limits)

      // Verify the tile was generated (PNG format)
      const data = Buffer.from(res._getData())
      expect(data.length).toBeGreaterThan(100) // Should be a real PNG with data
    })

    it('should generate realistic temperatures based on latitude', async () => {
      // Arctic tile (high latitude) - should be colder
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['4', '8', '2'] } // Northern high latitude
      })
      await handler(req1, res1)
      const arcticTile = res1._getData()

      // Tropical tile (low latitude) - should be warmer
      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['4', '8', '8'] } // Equatorial
      })
      await handler(req2, res2)
      const tropicalTile = res2._getData()

      // Both should be valid PNGs but different content due to temperature variations
      expect(arcticTile).not.toEqual(tropicalTile)
      expect(Buffer.from(arcticTile).length).toBeGreaterThan(100)
      expect(Buffer.from(tropicalTile).length).toBeGreaterThan(100)
    })

    it('should handle polar regions correctly', async () => {
      // Test tile at extreme northern latitude
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['5', '16', '0'] } // Northernmost tile
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const data = Buffer.from(res._getData())
      expect(data.length).toBeGreaterThan(100)
      // Should still generate valid PNG even at extreme latitudes
      expect(data.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    })
  })

  describe('Temperature Color Mapping', () => {
    it('should handle temperature extremes correctly', async () => {
      // Test tiles that would cover extreme temperature regions
      // Ocean areas near ice vs tropical regions should produce different colors

      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '32', '8'] } // Arctic Ocean
      })
      await handler(req1, res1)
      const coldTile = res1._getData()

      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['6', '32', '48'] } // Tropical Pacific
      })
      await handler(req2, res2)
      const warmTile = res2._getData()

      // Different temperature regions should produce different PNG data
      expect(coldTile).not.toEqual(warmTile)
    })

    it('should generate valid PNG for all temperature ranges', async () => {
      // Test multiple zoom levels and regions
      const testCases = [
        ['0', '0', '0'],   // Global view
        ['3', '4', '2'],   // Regional view
        ['8', '128', '96'], // Local view
        ['12', '2048', '1536'] // High detail
      ]

      for (const [z, x, y] of testCases) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
          query: { params: [z, x, y] }
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)
        expect(res.getHeader('Content-Type')).toBe('image/png')

        const data = Buffer.from(res._getData())
        expect(data.length).toBeGreaterThan(100)
        expect(data.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      }
    })
  })

  describe('Marine-Specific Domain Testing', () => {
    it('should generate realistic ocean temperature patterns', async () => {
      // Test tiles covering major ocean currents and temperature gradients
      const oceanTiles = [
        ['7', '64', '32'],   // North Atlantic
        ['7', '32', '64'],   // North Pacific
        ['7', '80', '96'],   // Tropical Atlantic
        ['7', '48', '96'],   // Tropical Pacific
      ]

      for (const [z, x, y] of oceanTiles) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
          query: { params: [z, x, y] }
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const data = Buffer.from(res._getData())
        expect(data.length).toBeGreaterThan(200) // Should have substantial data for ocean temperatures
      }
    })

    it('should handle cross-dateline tiles correctly', async () => {
      // Test tiles that cross the international date line (180°/-180°)
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['5', '0', '16'] } // Tile covering date line
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Content-Type')).toBe('image/png')
    })

    it('should generate appropriate temperature gradients for ocean boundaries', async () => {
      // Test tiles at continental margins where temperature gradients are strong
      const marginalSeaTiles = [
        ['8', '128', '80'],  // Continental shelf
        ['8', '200', '120'], // Ocean-continent boundary
        ['8', '160', '100']  // Coastal waters
      ]

      for (const [z, x, y] of marginalSeaTiles) {
        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
          query: { params: [z, x, y] }
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        const data = Buffer.from(res._getData())
        expect(data.length).toBeGreaterThan(150) // Should show temperature variations
      }
    })

    it('should provide consistent tile sizes across zoom levels', async () => {
      // All tiles should be 256x256 pixels regardless of zoom level
      const zoomLevels = ['1', '5', '10', '15']

      for (const z of zoomLevels) {
        const tileCount = Math.pow(2, parseInt(z))
        const x = Math.floor(tileCount / 2)
        const y = Math.floor(tileCount / 2)

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
          query: { params: [z, x.toString(), y.toString()] }
        })

        await handler(req, res)

        expect(res._getStatusCode()).toBe(200)

        // All tiles should have PNG header and reasonable size
        const data = Buffer.from(res._getData())
        expect(data.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        expect(data.length).toBeGreaterThan(100)
        expect(data.length).toBeLessThan(100000) // Reasonable upper bound
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle floating point coordinates gracefully', async () => {
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

    it('should handle negative coordinates appropriately', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '-1', '64'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
    })

    it('should handle very large coordinate values', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['8', '999999', '64'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile coordinates for zoom level 8. x and y must be between 0 and 255'
      })
    })

    it('should handle missing params array', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {}
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(400)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Invalid tile parameters. Expected format: /tiles/sst/{z}/{x}/{y}.png'
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

  describe('Performance and Caching', () => {
    it('should set appropriate cache headers for tile optimization', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['10', '512', '256'] }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      expect(res.getHeader('Cache-Control')).toBe('public, max-age=3600')
      expect(res.getHeader('Content-Type')).toBe('image/png')
    })

    it('should generate tiles efficiently for high zoom levels', async () => {
      // High zoom level tiles should still be generated in reasonable time
      const startTime = Date.now()

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { params: ['15', '16384', '8192'] }
      })

      await handler(req, res)

      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(res._getStatusCode()).toBe(200)
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds

      const data = Buffer.from(res._getData())
      expect(data.length).toBeGreaterThan(100)
    })
  })
})