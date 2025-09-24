/**
 * Comprehensive test suite for Data Ingestion Status API endpoint
 * Tests system health monitoring, job status tracking, and marine data quality metrics
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createMocks } from 'node-mocks-http'
import handler from '../../../pages/api/ingestion/status'
import { dataIngestionService } from '../../../lib/data-ingestion'

// Mock the data ingestion service
jest.mock('../../../lib/data-ingestion', () => ({
  dataIngestionService: {
    getIngestionStatus: jest.fn(),
  },
}))

const mockedDataIngestionService = dataIngestionService as jest.Mocked<typeof dataIngestionService>

describe('/api/ingestion/status', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => {})
    // Mock Math.random for predictable data quality metrics
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
    jest.spyOn(Math, 'floor').mockImplementation((x) => Math.floor(x))
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

  describe('System Status Assessment', () => {
    it('should return operational status with successful recent jobs', async () => {
      const mockStatus = {
        total_observations: 125000,
        total_stations: 50,
        last_jobs: [
          {
            id: 'job-1',
            source: 'NDBC',
            started: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
            ended: new Date(Date.now() - 50000).toISOString(),
            status: 'ok',
            rows_ingested: 1200,
          },
          {
            id: 'job-2',
            source: 'NDBC',
            started: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
            ended: new Date(Date.now() - 110000).toISOString(),
            status: 'ok',
            rows_ingested: 1150,
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toMatchObject({
        system_status: 'operational',
        status_message: 'All systems operational',
        ingestion_health: {
          total_observations_ingested: 125000,
          active_stations: 50,
          recent_success_rate: 100,
          last_successful_ingestion: mockStatus.last_jobs[1].ended,
          time_since_last_run_hours: expect.any(Number)
        }
      })
    })

    it('should return warning status when no jobs are found', async () => {
      const mockStatus = {
        total_observations: 0,
        total_stations: 0,
        last_jobs: []
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toMatchObject({
        system_status: 'warning',
        status_message: 'No ingestion jobs found',
        ingestion_health: {
          recent_success_rate: 0,
          last_successful_ingestion: null,
          time_since_last_run_hours: null
        }
      })
    })

    it('should return error status when last job failed', async () => {
      const mockStatus = {
        total_observations: 85000,
        total_stations: 35,
        last_jobs: [
          {
            id: 'job-failed',
            source: 'NDBC',
            started: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            ended: new Date(Date.now() - 290000).toISOString(),
            status: 'failed',
            error: 'Network timeout',
            rows_ingested: 0,
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toMatchObject({
        system_status: 'error',
        status_message: 'Last ingestion job failed'
      })
    })

    it('should return warning status when data ingestion is overdue (>24 hours)', async () => {
      const oneDayAgo = new Date(Date.now() - (25 * 60 * 60 * 1000)).toISOString() // 25 hours ago

      const mockStatus = {
        total_observations: 95000,
        total_stations: 40,
        last_jobs: [
          {
            id: 'job-old',
            source: 'NDBC',
            started: oneDayAgo,
            ended: new Date(new Date(oneDayAgo).getTime() + 300000).toISOString(), // 5 min later
            status: 'ok',
            rows_ingested: 800,
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toMatchObject({
        system_status: 'warning',
        status_message: 'Data ingestion is overdue'
      })
    })

    it('should return warning status when success rate is low (<80%)', async () => {
      const mockStatus = {
        total_observations: 75000,
        total_stations: 30,
        last_jobs: [
          {
            id: 'job-1',
            source: 'NDBC',
            started: new Date(Date.now() - 60000).toISOString(),
            ended: new Date(Date.now() - 50000).toISOString(),
            status: 'failed',
            error: 'API error',
          },
          {
            id: 'job-2',
            source: 'NDBC',
            started: new Date(Date.now() - 120000).toISOString(),
            ended: new Date(Date.now() - 110000).toISOString(),
            status: 'failed',
            error: 'Timeout',
          },
          {
            id: 'job-3',
            source: 'NDBC',
            started: new Date(Date.now() - 180000).toISOString(),
            ended: new Date(Date.now() - 170000).toISOString(),
            status: 'ok',
            rows_ingested: 1000,
          },
          {
            id: 'job-4',
            source: 'NDBC',
            started: new Date(Date.now() - 240000).toISOString(),
            ended: new Date(Date.now() - 230000).toISOString(),
            status: 'failed',
            error: 'Data corruption',
          },
          {
            id: 'job-5',
            source: 'NDBC',
            started: new Date(Date.now() - 300000).toISOString(),
            ended: new Date(Date.now() - 290000).toISOString(),
            status: 'failed',
            error: 'Network error',
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData).toMatchObject({
        system_status: 'warning',
        status_message: 'Recent job success rate is low',
        ingestion_health: {
          recent_success_rate: 20 // 1 out of 5 successful
        }
      })
    })
  })

  describe('Marine Data Quality Metrics', () => {
    it('should calculate realistic marine data quality metrics', async () => {
      const mockStatus = {
        total_observations: 150000,
        total_stations: 60,
        last_jobs: [
          {
            id: 'job-quality',
            source: 'NDBC',
            started: new Date(Date.now() - 60000).toISOString(),
            ended: new Date(Date.now() - 50000).toISOString(),
            status: 'ok',
            rows_ingested: 1440, // 60 stations * 24 hours
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.data_quality_metrics).toMatchObject({
        expected_daily_observations: 1440, // 60 stations * 24 hours
        actual_daily_observations: expect.any(Number),
        data_freshness_minutes: expect.any(Number),
        quality_control_pass_rate: expect.any(Number)
      })

      // Validate ranges
      expect(responseData.data_quality_metrics.data_freshness_minutes).toBeGreaterThanOrEqual(30)
      expect(responseData.data_quality_metrics.data_freshness_minutes).toBeLessThanOrEqual(150)
      expect(responseData.data_quality_metrics.quality_control_pass_rate).toBeGreaterThanOrEqual(95)
      expect(responseData.data_quality_metrics.quality_control_pass_rate).toBeLessThanOrEqual(99)
    })

    it('should provide comprehensive marine monitoring system information', async () => {
      const mockStatus = {
        total_observations: 200000,
        total_stations: 80,
        last_jobs: [
          {
            id: 'job-comprehensive',
            source: 'NDBC',
            started: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
            ended: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            status: 'ok',
            rows_ingested: 1920, // 80 stations * 24 hours
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())

      // Verify marine monitoring system structure
      expect(responseData).toHaveProperty('next_scheduled_ingestion')
      expect(responseData.ingestion_frequency).toBe('hourly')
      expect(responseData.data_sources).toMatchObject({
        ndbc_stations: 80,
        ersst_grids: 0,
        erddap_feeds: 0
      })
      expect(responseData.performance_targets).toMatchObject({
        ingestion_completion_time: '< 10 minutes',
        data_latency: '< 2 hours',
        quality_control_rate: '> 95%',
        system_availability: '> 99%'
      })
    })
  })

  describe('Job Processing and Metrics', () => {
    it('should process and format job history correctly', async () => {
      const mockStatus = {
        total_observations: 100000,
        total_stations: 45,
        last_jobs: [
          {
            id: 'job-1',
            source: 'NDBC',
            started: '2024-09-24T10:00:00Z',
            ended: '2024-09-24T10:05:00Z',
            status: 'ok',
            rows_ingested: 1080,
          },
          {
            id: 'job-2',
            source: 'NDBC',
            started: '2024-09-24T09:00:00Z',
            ended: '2024-09-24T09:03:00Z',
            status: 'ok',
            rows_ingested: 810,
          },
          {
            id: 'job-3',
            source: 'NDBC',
            started: '2024-09-24T08:00:00Z',
            ended: null, // Still running or failed
            status: 'failed',
            error: 'Connection timeout',
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.recent_jobs).toHaveLength(3)

      // Check first job formatting
      expect(responseData.recent_jobs[0]).toMatchObject({
        id: 'job-1',
        source: 'NDBC',
        started: '2024-09-24T10:00:00Z',
        ended: '2024-09-24T10:05:00Z',
        status: 'ok',
        rows_ingested: 1080,
        duration_seconds: 300 // 5 minutes
      })

      // Check failed job formatting
      expect(responseData.recent_jobs[2]).toMatchObject({
        id: 'job-3',
        source: 'NDBC',
        started: '2024-09-24T08:00:00Z',
        ended: null,
        status: 'failed',
        rows_ingested: 0,
        duration_seconds: null,
        error: 'Connection timeout'
      })
    })

    it('should handle edge cases in success rate calculation', async () => {
      const testCases = [
        {
          jobs: [],
          expectedRate: 0
        },
        {
          jobs: [
            { id: 'job-1', status: 'ok' },
            { id: 'job-2', status: 'ok' },
            { id: 'job-3', status: 'ok' }
          ],
          expectedRate: 100
        },
        {
          jobs: [
            { id: 'job-1', status: 'failed' },
            { id: 'job-2', status: 'failed' },
            { id: 'job-3', status: 'failed' }
          ],
          expectedRate: 0
        }
      ]

      for (const testCase of testCases) {
        const mockStatus = {
          total_observations: 50000,
          total_stations: 25,
          last_jobs: testCase.jobs.map(job => ({
            ...job,
            source: 'NDBC',
            started: new Date().toISOString(),
            ended: new Date().toISOString(),
            rows_ingested: job.status === 'ok' ? 500 : 0,
          }))
        }

        mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

        const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
          method: 'GET',
        })

        await handler(req, res)

        const responseData = JSON.parse(res._getData())
        expect(responseData.ingestion_health.recent_success_rate).toBe(testCase.expectedRate)
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      const serviceError = new Error('Database connection failed')
      mockedDataIngestionService.getIngestionStatus.mockRejectedValue(serviceError)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Failed to get ingestion status',
        details: 'Database connection failed'
      })
      expect(console.error).toHaveBeenCalledWith('Error getting ingestion status:', serviceError)
    })

    it('should handle non-Error exceptions', async () => {
      const stringError = 'Service unavailable'
      mockedDataIngestionService.getIngestionStatus.mockRejectedValue(stringError)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Failed to get ingestion status',
        details: 'Service unavailable'
      })
    })
  })

  describe('Time-based Calculations', () => {
    it('should calculate time since last run correctly', async () => {
      const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000)).toISOString()

      const mockStatus = {
        total_observations: 75000,
        total_stations: 35,
        last_jobs: [
          {
            id: 'job-time',
            source: 'NDBC',
            started: twoHoursAgo,
            ended: new Date(new Date(twoHoursAgo).getTime() + 300000).toISOString(),
            status: 'ok',
            rows_ingested: 840,
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = JSON.parse(res._getData())
      expect(responseData.ingestion_health.time_since_last_run_hours).toBeCloseTo(2, 1)
    })

    it('should schedule next ingestion appropriately', async () => {
      const mockStatus = {
        total_observations: 100000,
        total_stations: 50,
        last_jobs: [
          {
            id: 'job-schedule',
            source: 'NDBC',
            started: new Date(Date.now() - 60000).toISOString(),
            ended: new Date(Date.now() - 50000).toISOString(),
            status: 'ok',
            rows_ingested: 1200,
          }
        ]
      }

      mockedDataIngestionService.getIngestionStatus.mockResolvedValue(mockStatus)

      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: 'GET',
      })

      const beforeRequest = Date.now()
      await handler(req, res)
      const afterRequest = Date.now()

      const responseData = JSON.parse(res._getData())
      const nextScheduled = new Date(responseData.next_scheduled_ingestion).getTime()

      // Should be approximately 1 hour from now (with some tolerance for test execution time)
      const expectedTime = beforeRequest + (60 * 60 * 1000) // 1 hour
      const tolerance = 5000 // 5 seconds tolerance

      expect(nextScheduled).toBeGreaterThan(expectedTime - tolerance)
      expect(nextScheduled).toBeLessThan(afterRequest + (60 * 60 * 1000) + tolerance)
    })
  })
})