/**
 * Comprehensive test suite for Daily Summary Observations API endpoint
 * Tests marine data aggregation, filtering, and oceanographic calculations
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/obs/summary'

describe('/api/obs/summary', () => {
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
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })

    it('should reject DELETE requests with 405 Method Not Allowed', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
    })
  })

  describe('Default Query Parameters', () => {
    it('should return data with default parameters (last 30 days)', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toHaveProperty('count')
      expect(responseData).toHaveProperty('daily_summaries')
      expect(responseData).toHaveProperty('time_range')
      expect(responseData).toHaveProperty('spatial_coverage')
      expect(responseData).toHaveProperty('aggregated_statistics')

      // Should default to last 30 days
      expect(responseData.time_range.days).toBeLessThanOrEqual(31) // Could be 30 or 31 depending on month
      expect(responseData.time_range.days).toBeGreaterThanOrEqual(30)
    })

    it('should include all default stations without filtering', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.spatial_coverage.stations).toBe(10) // 10 stations defined
      expect(responseData.spatial_coverage.bbox).toBe('global')
    })
  })

  describe('Temporal Filtering', () => {
    it('should filter by start date', async () => {
      const startDate = '2024-09-20'
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { start: startDate }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.time_range.start).toBe(startDate)

      // All returned summaries should be >= start date
      responseData.daily_summaries.forEach((summary: any) => {
        expect(summary.date).toBeGreaterThanOrEqual(startDate)
      })
    })

    it('should filter by end date', async () => {
      const endDate = '2024-09-24'
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { end: endDate }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.time_range.end).toBe(endDate)

      // All returned summaries should be <= end date
      responseData.daily_summaries.forEach((summary: any) => {
        expect(summary.date).toBeLessThanOrEqual(endDate)
      })
    })

    it('should filter by date range', async () => {
      const startDate = '2024-09-20'
      const endDate = '2024-09-24'
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { start: startDate, end: endDate }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.time_range.start).toBe(startDate)
      expect(responseData.time_range.end).toBe(endDate)
      expect(responseData.time_range.days).toBe(5) // 5 days inclusive

      // All summaries should be within the date range
      responseData.daily_summaries.forEach((summary: any) => {
        expect(summary.date).toBeGreaterThanOrEqual(startDate)
        expect(summary.date).toBeLessThanOrEqual(endDate)
      })
    })
  })

  describe('Spatial Filtering', () => {
    it('should filter by bounding box', async () => {
      // North Atlantic bounding box
      const bbox = '-80,30,-60,45'
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { bbox }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.filters_applied.bbox).toEqual([-80, 30, -60, 45])

      // All returned summaries should be within the bounding box
      responseData.daily_summaries.forEach((summary: any) => {
        expect(summary.lon).toBeGreaterThanOrEqual(-80)
        expect(summary.lon).toBeLessThanOrEqual(-60)
        expect(summary.lat).toBeGreaterThanOrEqual(30)
        expect(summary.lat).toBeLessThanOrEqual(45)
      })
    })

    it('should filter by specific station', async () => {
      const stationId = '41001'
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { station: stationId }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.spatial_coverage.stations).toBe(1)

      // All summaries should be from the specified station
      responseData.daily_summaries.forEach((summary: any) => {
        expect(summary.station_id).toBe(stationId)
        expect(summary.station_name).toBe('East Hatteras')
      })
    })

    it('should return empty results for non-existent station', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { station: 'NONEXISTENT' }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.count).toBe(0)
      expect(responseData.daily_summaries).toHaveLength(0)
      expect(responseData.spatial_coverage.stations).toBe(0)
    })
  })

  describe('Pagination', () => {
    it('should apply limit parameter', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { limit: '50' }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.count).toBeLessThanOrEqual(50)
      expect(responseData.daily_summaries.length).toBeLessThanOrEqual(50)
    })

    it('should apply offset parameter', async () => {
      // First, get all results to compare
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { limit: '100' }
      })
      await handler(req1, res1)
      const allResults = JSON.parse(res1._getData())

      // Then get results with offset
      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { limit: '50', offset: '10' }
      })
      await handler(req2, res2)
      const offsetResults = JSON.parse(res2._getData())

      expect(offsetResults.count).toBeLessThanOrEqual(50)

      if (allResults.count > 10 && offsetResults.count > 0) {
        // First result with offset should not be the same as first result without offset
        expect(offsetResults.daily_summaries[0]).not.toEqual(allResults.daily_summaries[0])
      }
    })

    it('should combine limit and offset correctly', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { limit: '20', offset: '5' }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.count).toBeLessThanOrEqual(20)
    })
  })

  describe('Marine Data Quality and Calculations', () => {
    it('should generate realistic sea surface temperature values', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { station: '51001' } // Hawaii station
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      responseData.daily_summaries.forEach((summary: any) => {
        // Temperature values should be realistic for tropical waters
        expect(summary.sst_mean).toBeGreaterThan(15) // > 15°C
        expect(summary.sst_mean).toBeLessThan(35) // < 35°C
        expect(summary.sst_min).toBeLessThan(summary.sst_mean)
        expect(summary.sst_max).toBeGreaterThan(summary.sst_mean)
        expect(summary.sst_std).toBeGreaterThan(0)
        expect(summary.sst_std).toBeLessThan(5) // Reasonable daily variation
      })
    })

    it('should generate latitude-dependent temperature variations', async () => {
      // Get Arctic station data
      const { req: req1, res: res1 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { station: '46001' } // Gulf of Alaska (56.3°N)
      })
      await handler(req1, res1)
      const arcticData = JSON.parse(res1._getData())

      // Get tropical station data
      const { req: req2, res: res2 } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { station: '51001' } // NW Hawaii (23.4°N)
      })
      await handler(req2, res2)
      const tropicalData = JSON.parse(res2._getData())

      if (arcticData.count > 0 && tropicalData.count > 0) {
        const arcticTemp = arcticData.aggregated_statistics.mean_temperature
        const tropicalTemp = tropicalData.aggregated_statistics.mean_temperature

        // Tropical waters should be warmer than Arctic waters
        expect(tropicalTemp).toBeGreaterThan(arcticTemp)
      }
    })

    it('should calculate temperature anomalies correctly', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { station: '42001' } // East Gulf
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      responseData.daily_summaries.forEach((summary: any) => {
        // Anomalies should be reasonable relative to mean temperatures
        expect(Math.abs(summary.anomaly_mean)).toBeLessThan(10) // Within ±10°C
        expect(typeof summary.anomaly_mean).toBe('number')
        expect(summary.anomaly_mean).not.toBeNaN()
      })
    })

    it('should provide realistic data quality metrics', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      responseData.daily_summaries.forEach((summary: any) => {
        // Quality control percentage should be between 85-99%
        expect(summary.qc_percentage_good).toBeGreaterThanOrEqual(85)
        expect(summary.qc_percentage_good).toBeLessThanOrEqual(99)

        // Data availability should be between 90-99%
        expect(summary.data_availability).toBeGreaterThanOrEqual(90)
        expect(summary.data_availability).toBeLessThanOrEqual(99)

        // Observation counts should be realistic (20-25 per day for hourly data)
        expect(summary.observations_count).toBeGreaterThanOrEqual(20)
        expect(summary.observations_count).toBeLessThanOrEqual(25)
      })
    })
  })

  describe('Aggregated Statistics', () => {
    it('should calculate correct aggregated statistics', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { station: '41001', start: '2024-09-20', end: '2024-09-24' }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      if (responseData.count > 0) {
        // Aggregated stats should be calculated from individual summaries
        const summaries = responseData.daily_summaries
        const expectedAvgTemp = summaries.reduce((sum: number, s: any) => sum + s.sst_mean, 0) / summaries.length
        const expectedAvgAnomaly = summaries.reduce((sum: number, s: any) => sum + s.anomaly_mean, 0) / summaries.length
        const expectedAvgQuality = summaries.reduce((sum: number, s: any) => sum + s.qc_percentage_good, 0) / summaries.length

        expect(Math.abs(responseData.aggregated_statistics.mean_temperature - expectedAvgTemp)).toBeLessThan(0.01)
        expect(Math.abs(responseData.aggregated_statistics.mean_anomaly - expectedAvgAnomaly)).toBeLessThan(0.01)
        expect(Math.abs(responseData.aggregated_statistics.average_data_quality - expectedAvgQuality)).toBeLessThan(0.01)
      }
    })

    it('should handle empty results gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { station: 'NONEXISTENT' }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.count).toBe(0)
      expect(responseData.aggregated_statistics).toMatchObject({
        mean_temperature: 0,
        mean_anomaly: 0,
        average_data_quality: 0
      })
    })
  })

  describe('Response Structure and Metadata', () => {
    it('should include comprehensive metadata', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      expect(responseData.metadata).toMatchObject({
        api_version: '1.0',
        data_source: 'BlueSphere Global Network',
        aggregation_period: 'daily',
        units: expect.objectContaining({
          'sst_*': 'degrees Celsius',
          'anomaly_*': 'degrees Celsius (relative to climatology)',
          'qc_percentage_good': 'percent',
          'data_availability': 'percent'
        }),
        quality_control: expect.objectContaining({
          description: expect.any(String),
          climatology_reference: '1991-2020 baseline',
          anomaly_calculation: 'observation - climatology'
        })
      })
    })

    it('should include performance metrics', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      expect(responseData.performance).toMatchObject({
        query_time_ms: expect.any(Number),
        cache_status: 'miss',
        records_processed: expect.any(Number)
      })

      expect(responseData.performance.query_time_ms).toBeGreaterThan(0)
      expect(responseData.performance.records_processed).toBeGreaterThanOrEqual(responseData.count)
    })

    it('should provide correct data structure for each daily summary', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { limit: '1' }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      if (responseData.count > 0) {
        const summary = responseData.daily_summaries[0]

        expect(summary).toMatchObject({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          station_id: expect.any(String),
          station_name: expect.any(String),
          lat: expect.any(Number),
          lon: expect.any(Number),
          observations_count: expect.any(Number),
          sst_mean: expect.any(Number),
          sst_min: expect.any(Number),
          sst_max: expect.any(Number),
          sst_std: expect.any(Number),
          anomaly_mean: expect.any(Number),
          qc_percentage_good: expect.any(Number),
          data_availability: expect.any(Number)
        })

        // Coordinates should be properly rounded
        expect(summary.lat.toString()).toMatch(/^-?\d+\.\d{3}$/)
        expect(summary.lon.toString()).toMatch(/^-?\d+\.\d{3}$/)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed bbox parameter', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { bbox: 'invalid,bbox,format' }
      })

      // Should not throw error but might return unexpected results
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // The endpoint should handle this gracefully by either ignoring or processing what it can
    })

    it('should handle invalid date formats gracefully', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { start: 'invalid-date', end: 'also-invalid' }
      })

      // Should either use defaults or handle gracefully
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle invalid numeric parameters', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: { limit: 'not-a-number', offset: 'also-not-a-number' }
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Should use defaults when parameters can't be parsed
    })
  })

  describe('Marine-Specific Domain Testing', () => {
    it('should include all major ocean basins in station network', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      // Should have stations in different ocean regions
      const stationLocations = responseData.daily_summaries.map((s: any) => ({
        lat: s.lat,
        lon: s.lon,
        station: s.station_id
      }))

      // Remove duplicates by station_id
      const uniqueStations = stationLocations.reduce((unique: any[], current: any) => {
        const exists = unique.find(item => item.station === current.station)
        if (!exists) unique.push(current)
        return unique
      }, [])

      // Should have stations in different hemispheres and ocean basins
      const northernStations = uniqueStations.filter((s: any) => s.lat > 0)
      const southernStations = uniqueStations.filter((s: any) => s.lat < 0)
      const atlanticStations = uniqueStations.filter((s: any) => s.lon > -90 && s.lon < -30)
      const pacificStations = uniqueStations.filter((s: any) => s.lon < -90 || s.lon > 130)

      expect(northernStations.length).toBeGreaterThan(0)
      expect(southernStations.length).toBeGreaterThan(0)
      expect(atlanticStations.length).toBeGreaterThan(0)
      expect(pacificStations.length).toBeGreaterThan(0)
    })

    it('should demonstrate seasonal temperature variations', async () => {
      // Test with a full year of data for seasonal analysis
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
        query: {
          station: '41001', // East Hatteras
          start: '2024-01-01',
          end: '2024-12-31'
        }
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      if (responseData.count >= 100) { // Ensure we have enough data points
        const summaries = responseData.daily_summaries

        // Group by season
        const winter = summaries.filter((s: any) => {
          const month = parseInt(s.date.split('-')[1])
          return month === 12 || month === 1 || month === 2
        })
        const summer = summaries.filter((s: any) => {
          const month = parseInt(s.date.split('-')[1])
          return month === 6 || month === 7 || month === 8
        })

        if (winter.length > 0 && summer.length > 0) {
          const winterAvg = winter.reduce((sum: number, s: any) => sum + s.sst_mean, 0) / winter.length
          const summerAvg = summer.reduce((sum: number, s: any) => sum + s.sst_mean, 0) / summer.length

          // Summer should be warmer than winter in the Northern Hemisphere
          expect(summerAvg).toBeGreaterThan(winterAvg)
          expect(summerAvg - winterAvg).toBeGreaterThan(2) // At least 2°C seasonal difference
        }
      }
    })
  })
})