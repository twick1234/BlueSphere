/**
 * Comprehensive test suite for Data Ingestion Run API endpoint
 * Tests triggering NDBC data ingestion pipeline and error handling
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/ingestion/run'
import { dataIngestionService } from '../../../lib/data-ingestion'

// Mock the data ingestion service
jest.mock('../../../lib/data-ingestion', () => ({
  dataIngestionService: {
    initializeStations: jest.fn(),
    ingestNDBCData: jest.fn(),
  },
}))

const mockedDataIngestionService = dataIngestionService as jest.Mocked<typeof dataIngestionService>

describe('/api/ingestion/run', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset console.log and console.error mocks
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('HTTP Method Validation', () => {
    it('should reject GET requests with 405 Method Not Allowed', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
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
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      })
    })

    it('should reject DELETE requests with 405 Method Not Allowed', async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'DELETE',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(405)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed'
      })
    })
  })

  describe('Successful Data Ingestion', () => {
    it('should successfully process POST request with complete job result', async () => {
      const mockJobResult = {
        id: 'job-123',
        source: 'NDBC',
        started: '2024-09-24T10:00:00Z',
        ended: '2024-09-24T10:05:00Z',
        status: 'ok',
        rows_ingested: 1250,
        total_stations: 45,
      }

      mockedDataIngestionService.initializeStations.mockResolvedValue(undefined)
      mockedDataIngestionService.ingestNDBCData.mockResolvedValue(mockJobResult)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(mockedDataIngestionService.initializeStations).toHaveBeenCalledTimes(1)
      expect(mockedDataIngestionService.ingestNDBCData).toHaveBeenCalledTimes(1)
      expect(console.log).toHaveBeenCalledWith('Starting NDBC data ingestion...')

      expect(res._getStatusCode()).toBe(200)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toMatchObject({
        message: 'Data ingestion completed',
        job_result: mockJobResult,
        performance: {
          execution_time_ms: 300000, // 5 minutes
          status: 'ok',
          rows_ingested: 1250
        },
        next_steps: expect.arrayContaining([
          expect.stringContaining('/api/ingestion/status'),
          expect.stringContaining('/api/obs'),
          expect.stringContaining('/api/stations')
        ])
      })
    })

    it('should handle job result without timestamps', async () => {
      const mockJobResult = {
        id: 'job-124',
        source: 'NDBC',
        started: null,
        ended: null,
        status: 'ok',
        rows_ingested: 890,
        total_stations: 32,
      }

      mockedDataIngestionService.initializeStations.mockResolvedValue(undefined)
      mockedDataIngestionService.ingestNDBCData.mockResolvedValue(mockJobResult)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const responseData = JSON.parse(res._getData())
      expect(responseData.performance).toMatchObject({
        execution_time_ms: null,
        status: 'ok',
        rows_ingested: 890
      })
    })

    it('should handle job result with missing rows_ingested', async () => {
      const mockJobResult = {
        id: 'job-125',
        source: 'NDBC',
        started: '2024-09-24T10:00:00Z',
        ended: '2024-09-24T10:03:00Z',
        status: 'ok',
        total_stations: 25,
      }

      mockedDataIngestionService.initializeStations.mockResolvedValue(undefined)
      mockedDataIngestionService.ingestNDBCData.mockResolvedValue(mockJobResult)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const responseData = JSON.parse(res._getData())
      expect(responseData.performance.rows_ingested).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle station initialization failure', async () => {
      const initError = new Error('Failed to connect to NDBC API')
      mockedDataIngestionService.initializeStations.mockRejectedValue(initError)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Data ingestion failed',
        details: 'Failed to connect to NDBC API'
      })
      expect(console.error).toHaveBeenCalledWith('Ingestion failed:', initError)
    })

    it('should handle data ingestion service failure', async () => {
      const ingestionError = new Error('Network timeout during data fetch')
      mockedDataIngestionService.initializeStations.mockResolvedValue(undefined)
      mockedDataIngestionService.ingestNDBCData.mockRejectedValue(ingestionError)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Data ingestion failed',
        details: 'Network timeout during data fetch'
      })
    })

    it('should handle non-Error exception objects', async () => {
      const nonErrorException = 'String error message'
      mockedDataIngestionService.initializeStations.mockRejectedValue(nonErrorException)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Data ingestion failed',
        details: 'String error message'
      })
    })

    it('should handle undefined exception', async () => {
      mockedDataIngestionService.initializeStations.mockRejectedValue(undefined)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Data ingestion failed',
        details: 'undefined'
      })
    })
  })

  describe('Marine Domain Specific Testing', () => {
    it('should handle large-scale marine data ingestion', async () => {
      const largeMockJobResult = {
        id: 'job-large-126',
        source: 'NDBC',
        started: '2024-09-24T08:00:00Z',
        ended: '2024-09-24T08:45:00Z',
        status: 'ok',
        rows_ingested: 50000, // Large dataset
        total_stations: 200,
        marine_data_types: ['sea_surface_temperature', 'wave_height', 'wind_speed', 'atmospheric_pressure'],
        quality_metrics: {
          valid_temperature_readings: 48500,
          valid_wave_measurements: 49200,
          outliers_detected: 300,
          data_completeness: 97.0
        }
      }

      mockedDataIngestionService.initializeStations.mockResolvedValue(undefined)
      mockedDataIngestionService.ingestNDBCData.mockResolvedValue(largeMockJobResult)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const responseData = JSON.parse(res._getData())
      expect(responseData.job_result.rows_ingested).toBe(50000)
      expect(responseData.performance.execution_time_ms).toBe(2700000) // 45 minutes
    })

    it('should provide marine-specific guidance in next_steps', async () => {
      const mockJobResult = {
        id: 'job-marine-127',
        source: 'NDBC',
        started: '2024-09-24T10:00:00Z',
        ended: '2024-09-24T10:05:00Z',
        status: 'ok',
        rows_ingested: 1500,
        total_stations: 60,
      }

      mockedDataIngestionService.initializeStations.mockResolvedValue(undefined)
      mockedDataIngestionService.ingestNDBCData.mockResolvedValue(mockJobResult)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.next_steps).toEqual([
        'Check /api/ingestion/status for ongoing monitoring',
        'Query /api/obs for the ingested observation data',
        'View /api/stations for updated station metadata'
      ])
    })

    it('should handle marine data quality issues during ingestion', async () => {
      const qualityIssueMockResult = {
        id: 'job-quality-128',
        source: 'NDBC',
        started: '2024-09-24T10:00:00Z',
        ended: '2024-09-24T10:08:00Z',
        status: 'ok',
        rows_ingested: 800, // Lower due to quality filtering
        total_stations: 45,
        quality_issues: {
          temperature_outliers_removed: 25,
          incomplete_wave_data: 15,
          sensor_malfunction_flags: 3
        }
      }

      mockedDataIngestionService.initializeStations.mockResolvedValue(undefined)
      mockedDataIngestionService.ingestNDBCData.mockResolvedValue(qualityIssueMockResult)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'POST',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const responseData = JSON.parse(res._getData())
      expect(responseData.job_result.rows_ingested).toBe(800)
      expect(responseData.job_result.quality_issues).toBeDefined()
    })
  })

  describe('Performance and Timing', () => {
    it('should calculate execution time correctly for various durations', async () => {
      const testCases = [
        { started: '2024-09-24T10:00:00Z', ended: '2024-09-24T10:01:00Z', expectedMs: 60000 },
        { started: '2024-09-24T08:00:00Z', ended: '2024-09-24T08:30:00Z', expectedMs: 1800000 },
        { started: '2024-09-24T06:00:00Z', ended: '2024-09-24T07:00:00Z', expectedMs: 3600000 },
      ]

      for (const testCase of testCases) {
        const mockJobResult = {
          id: `job-timing-${Date.now()}`,
          source: 'NDBC',
          started: testCase.started,
          ended: testCase.ended,
          status: 'ok',
          rows_ingested: 1000,
          total_stations: 40,
        }

        mockedDataIngestionService.initializeStations.mockResolvedValue(undefined)
        mockedDataIngestionService.ingestNDBCData.mockResolvedValue(mockJobResult)

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'POST',
        })

        await handler(req, res)

        const responseData = JSON.parse(res._getData())
        expect(responseData.performance.execution_time_ms).toBe(testCase.expectedMs)
      }
    })
  })
})