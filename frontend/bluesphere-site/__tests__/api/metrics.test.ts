import { createMocks } from 'node-mocks-http'
import handler from '../../pages/api/metrics'
import fs from 'fs'
import path from 'path'

// Mock fs module
jest.mock('fs')
const mockFs = fs as jest.Mocked<typeof fs>

// Mock child_process
jest.mock('child_process', () => ({
  execSync: jest.fn()
}))

describe('/api/metrics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock console.log and console.error to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  const mockCoverageData = {
    total: {
      lines: { pct: 85.2 },
      statements: { pct: 84.8 },
      functions: { pct: 87.1 },
      branches: { pct: 82.3 }
    }
  }

  const mockTestResults = {
    numTotalTests: 120,
    numPassedTests: 118,
    numFailedTests: 2,
    testExecTime: 15400
  }

  const mockPackageJson = {
    version: '2.1.0'
  }

  describe('CORS headers', () => {
    it('should set CORS headers for all requests', async () => {
      // Mock successful file reads
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(mockCoverageData))
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(mockTestResults))
      mockFs.readFileSync.mockReturnValueOnce(JSON.stringify(mockPackageJson))

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
    it('should return comprehensive metrics with proper structure', async () => {
      // Mock file system calls
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('coverage-summary.json')) {
          return JSON.stringify(mockCoverageData)
        }
        if (filePath.toString().includes('test-results.json')) {
          return JSON.stringify(mockTestResults)
        }
        if (filePath.toString().includes('package.json')) {
          return JSON.stringify(mockPackageJson)
        }
        return '{}'
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Verify top-level structure
      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('timestamp')
      expect(response).toHaveProperty('status', 'success')

      const metrics = response.data

      // Verify main sections
      expect(metrics).toHaveProperty('coverage')
      expect(metrics).toHaveProperty('performance')
      expect(metrics).toHaveProperty('system')
      expect(metrics).toHaveProperty('tests')
      expect(metrics).toHaveProperty('build')
    })

    it('should have properly structured coverage metrics', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('coverage-summary.json')) {
          return JSON.stringify(mockCoverageData)
        }
        return JSON.stringify({})
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const coverage = response.data.coverage

      expect(coverage).toHaveProperty('total')
      expect(coverage).toHaveProperty('components')
      expect(coverage).toHaveProperty('api')
      expect(coverage).toHaveProperty('pages')
      expect(coverage).toHaveProperty('trend')
      expect(coverage).toHaveProperty('lastUpdated')

      // Verify data types
      expect(typeof coverage.total).toBe('number')
      expect(typeof coverage.components).toBe('number')
      expect(typeof coverage.api).toBe('number')
      expect(typeof coverage.pages).toBe('number')
      expect(Array.isArray(coverage.trend)).toBe(true)
      expect(typeof coverage.lastUpdated).toBe('string')

      // Verify percentage ranges
      expect(coverage.total).toBeGreaterThanOrEqual(0)
      expect(coverage.total).toBeLessThanOrEqual(100)

      // Verify trend array
      expect(coverage.trend).toHaveLength(5)
      coverage.trend.forEach((value: number) => {
        expect(typeof value).toBe('number')
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(100)
      })

      // Verify ISO timestamp
      expect(coverage.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should have properly structured performance metrics', async () => {
      mockFs.existsSync.mockReturnValue(true)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const performance = response.data.performance

      expect(performance).toHaveProperty('lcp')
      expect(performance).toHaveProperty('fid')
      expect(performance).toHaveProperty('cls')
      expect(performance).toHaveProperty('bundleSize')
      expect(performance).toHaveProperty('apiResponseTime')
      expect(performance).toHaveProperty('trend')

      // Verify data types
      expect(typeof performance.lcp).toBe('number')
      expect(typeof performance.fid).toBe('number')
      expect(typeof performance.cls).toBe('number')
      expect(typeof performance.bundleSize).toBe('number')
      expect(typeof performance.apiResponseTime).toBe('number')
      expect(Array.isArray(performance.trend)).toBe(true)

      // Verify reasonable ranges
      expect(performance.lcp).toBeGreaterThan(0)
      expect(performance.lcp).toBeLessThan(10000) // Reasonable LCP range
      expect(performance.fid).toBeGreaterThan(0)
      expect(performance.fid).toBeLessThan(1000) // Reasonable FID range
      expect(performance.cls).toBeGreaterThan(0)
      expect(performance.cls).toBeLessThan(1) // CLS should be < 1
      expect(performance.bundleSize).toBeGreaterThan(0)
      expect(performance.apiResponseTime).toBeGreaterThan(0)

      // Verify trend array
      expect(performance.trend).toHaveLength(5)
    })

    it('should have properly structured system metrics', async () => {
      mockFs.existsSync.mockReturnValue(true)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const system = response.data.system

      expect(system).toHaveProperty('uptime')
      expect(system).toHaveProperty('activeStations')
      expect(system).toHaveProperty('trackingSharks')
      expect(system).toHaveProperty('alertsToday')
      expect(system).toHaveProperty('dataIngestionRate')
      expect(system).toHaveProperty('lastFailure')

      // Verify data types
      expect(typeof system.uptime).toBe('number')
      expect(typeof system.activeStations).toBe('number')
      expect(typeof system.trackingSharks).toBe('number')
      expect(typeof system.alertsToday).toBe('number')
      expect(typeof system.dataIngestionRate).toBe('number')
      expect(typeof system.lastFailure).toBe('string')

      // Verify reasonable ranges
      expect(system.uptime).toBeGreaterThan(90)
      expect(system.uptime).toBeLessThanOrEqual(100)
      expect(system.activeStations).toBeGreaterThan(0)
      expect(system.trackingSharks).toBeGreaterThan(0)
      expect(system.alertsToday).toBeGreaterThanOrEqual(0)
      expect(system.dataIngestionRate).toBeGreaterThan(0)

      // Verify ISO timestamp
      expect(system.lastFailure).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should have properly structured test metrics', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('test-results.json')) {
          return JSON.stringify(mockTestResults)
        }
        return JSON.stringify({})
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const tests = response.data.tests

      expect(tests).toHaveProperty('total')
      expect(tests).toHaveProperty('passing')
      expect(tests).toHaveProperty('failing')
      expect(tests).toHaveProperty('duration')
      expect(tests).toHaveProperty('recentRuns')

      // Verify data types
      expect(typeof tests.total).toBe('number')
      expect(typeof tests.passing).toBe('number')
      expect(typeof tests.failing).toBe('number')
      expect(typeof tests.duration).toBe('number')
      expect(Array.isArray(tests.recentRuns)).toBe(true)

      // Verify logical relationships
      expect(tests.total).toBe(tests.passing + tests.failing)
      expect(tests.total).toBeGreaterThan(0)
      expect(tests.passing).toBeGreaterThanOrEqual(0)
      expect(tests.failing).toBeGreaterThanOrEqual(0)
      expect(tests.duration).toBeGreaterThan(0)

      // Verify recent runs structure
      expect(tests.recentRuns).toHaveLength(3)
      tests.recentRuns.forEach((run: any) => {
        expect(run).toHaveProperty('timestamp')
        expect(run).toHaveProperty('success')
        expect(run).toHaveProperty('coverage')
        expect(run).toHaveProperty('duration')

        expect(typeof run.timestamp).toBe('string')
        expect(typeof run.success).toBe('boolean')
        expect(typeof run.coverage).toBe('number')
        expect(typeof run.duration).toBe('number')

        expect(run.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      })
    })

    it('should have properly structured build metrics', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('package.json')) {
          return JSON.stringify(mockPackageJson)
        }
        return JSON.stringify({})
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const build = response.data.build

      expect(build).toHaveProperty('status')
      expect(build).toHaveProperty('lastBuild')
      expect(build).toHaveProperty('buildTime')
      expect(build).toHaveProperty('version')

      // Verify data types
      expect(typeof build.status).toBe('string')
      expect(typeof build.lastBuild).toBe('string')
      expect(typeof build.buildTime).toBe('number')
      expect(typeof build.version).toBe('string')

      // Verify valid values
      const validStatuses = ['success', 'failed', 'building']
      expect(validStatuses).toContain(build.status)
      expect(build.buildTime).toBeGreaterThan(0)
      expect(build.version).toMatch(/^\d+\.\d+\.\d+$/)
      expect(build.lastBuild).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should set proper cache headers', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res.getHeader('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(res.getHeader('Pragma')).toBe('no-cache')
      expect(res.getHeader('Expires')).toBe('0')
    })

    it('should use fallback data when files are not available', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())
      const metrics = response.data

      // Should still return valid structure with fallback data
      expect(metrics.coverage.total).toBe(2.81) // Default coverage
      expect(metrics.tests.total).toBe(47) // Default test count
      expect(metrics.build.version).toBe('1.0.0') // Default version
      expect(metrics.performance.bundleSize).toBe(496) // Default bundle size
    })
  })

  describe('File system interactions', () => {
    it('should handle coverage file read errors gracefully', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('coverage-summary.json')
      })
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('coverage-summary.json')) {
          throw new Error('File read error')
        }
        return JSON.stringify({})
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should fallback to default coverage data
      expect(response.data.coverage.total).toBe(2.81)
      expect(console.log).toHaveBeenCalledWith(
        'Coverage data not available:',
        expect.any(Error)
      )
    })

    it('should handle test results file read errors gracefully', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        return filePath.toString().includes('test-results.json')
      })
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('test-results.json')) {
          throw new Error('Test results read error')
        }
        return JSON.stringify({})
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should fallback to default test data
      expect(response.data.tests.total).toBe(47)
      expect(console.log).toHaveBeenCalledWith(
        'Test results not available:',
        expect.any(Error)
      )
    })

    it('should handle package.json read errors gracefully', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('package.json')) {
          throw new Error('Package.json read error')
        }
        return JSON.stringify({})
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should fallback to default build info
      expect(response.data.build.version).toBe('1.0.0')
    })

    it('should handle bundle size calculation errors gracefully', async () => {
      mockFs.existsSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('.next')) {
          return false // .next directory doesn't exist
        }
        return true
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      const response = JSON.parse(res._getData())

      // Should fallback to default bundle size
      expect(response.data.performance.bundleSize).toBe(496)
    })

    it('should calculate bundle size from existing files', async () => {
      const mockFiles = ['chunk1.js', 'chunk2.js', 'chunk3.css', 'chunk4.js']
      const mockStats = { size: 1024 } // 1KB per JS file

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readdirSync.mockReturnValue(mockFiles as any)
      mockFs.statSync.mockReturnValue(mockStats as any)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // Should calculate size from 3 JS files (3KB total)
      expect(response.data.performance.bundleSize).toBe(3)
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
    it('should handle top-level errors gracefully', async () => {
      // Mock Date to throw an error
      const originalDate = global.Date
      global.Date = jest.fn(() => {
        throw new Error('Date construction failed')
      }) as any
      global.Date.now = originalDate.now

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(500)
      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error', 'Failed to generate metrics')
      expect(response).toHaveProperty('timestamp')
      expect(response).toHaveProperty('status', 'error')

      expect(console.error).toHaveBeenCalledWith(
        'Metrics API error:',
        expect.any(Error)
      )

      // Restore Date
      global.Date = originalDate
    })

    it('should handle JSON parsing errors', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('invalid json')

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
      // Should fallback to default data when JSON parsing fails
      const response = JSON.parse(res._getData())
      expect(response.data.coverage.total).toBe(2.81)
    })
  })

  describe('Time-based variations', () => {
    it('should generate different values over time', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockCoverageData))

      // Mock different times
      const originalDateNow = Date.now
      const baseTime = 1600000000000

      Date.now = jest.fn().mockReturnValueOnce(baseTime)
      const { req: req1, res: res1 } = createMocks({ method: 'GET' })
      await handler(req1, res1)
      const response1 = JSON.parse(res1._getData())

      Date.now = jest.fn().mockReturnValueOnce(baseTime + 60000) // 1 minute later
      const { req: req2, res: res2 } = createMocks({ method: 'GET' })
      await handler(req2, res2)
      const response2 = JSON.parse(res2._getData())

      // Performance metrics should vary slightly due to time-based variation
      expect(response1.data.performance.lcp).not.toBe(response2.data.performance.lcp)
      expect(response1.data.system.activeStations).not.toBe(response2.data.system.activeStations)

      Date.now = originalDateNow
    })

    it('should have recent timestamps in test runs', async () => {
      mockFs.existsSync.mockReturnValue(true)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const recentRuns = response.data.tests.recentRuns

      const now = new Date()

      recentRuns.forEach((run: any, index: number) => {
        const runTime = new Date(run.timestamp)
        const expectedMinutesAgo = (index + 1) * 15

        // Should be approximately the expected time ago
        const timeDiff = now.getTime() - runTime.getTime()
        const expectedTimeDiff = expectedMinutesAgo * 60 * 1000

        expect(Math.abs(timeDiff - expectedTimeDiff)).toBeLessThan(60000) // Within 1 minute
      })
    })
  })

  describe('Response format validation', () => {
    it('should return valid JSON', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const responseData = res._getData()
      expect(() => JSON.parse(responseData)).not.toThrow()
    })

    it('should have consistent success response structure', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('data')
      expect(response).toHaveProperty('timestamp')
      expect(response).toHaveProperty('status')

      expect(typeof response.data).toBe('object')
      expect(typeof response.timestamp).toBe('string')
      expect(typeof response.status).toBe('string')

      expect(response.status).toBe('success')
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
    })

    it('should have consistent error response structure', async () => {
      // Force an error
      const originalDate = global.Date
      global.Date = jest.fn(() => {
        throw new Error('Test error')
      }) as any

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      expect(response).toHaveProperty('error')
      expect(response).toHaveProperty('timestamp')
      expect(response).toHaveProperty('status')

      expect(typeof response.error).toBe('string')
      expect(typeof response.timestamp).toBe('string')
      expect(response.status).toBe('error')

      global.Date = originalDate
    })
  })

  describe('Performance', () => {
    it('should respond quickly', async () => {
      mockFs.existsSync.mockReturnValue(false)

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(1000) // Should respond within 1 second
      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle file system operations efficiently', async () => {
      // Mock many file operations
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockCoverageData))
      mockFs.readdirSync.mockReturnValue(['file1.js', 'file2.js'])
      mockFs.statSync.mockReturnValue({ size: 1024 } as any)

      const start = Date.now()
      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(500) // Should be fast even with file operations
      expect(res._getStatusCode()).toBe(200)
    })
  })

  describe('Data consistency', () => {
    it('should return logically consistent metrics', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockImplementation((filePath) => {
        if (filePath.toString().includes('test-results.json')) {
          return JSON.stringify(mockTestResults)
        }
        return JSON.stringify(mockCoverageData)
      })

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const metrics = response.data

      // Test totals should match
      expect(metrics.tests.total).toBe(metrics.tests.passing + metrics.tests.failing)

      // Coverage should be derived consistently
      expect(metrics.coverage.components).toBeGreaterThan(metrics.coverage.total)
      expect(metrics.coverage.api).toBeLessThanOrEqual(metrics.coverage.total)

      // System metrics should be reasonable
      expect(metrics.system.uptime).toBeGreaterThan(99)
      expect(metrics.system.uptime).toBeLessThanOrEqual(100)

      // Performance metrics should be positive
      expect(metrics.performance.lcp).toBeGreaterThan(0)
      expect(metrics.performance.fid).toBeGreaterThan(0)
      expect(metrics.performance.cls).toBeGreaterThan(0)
    })

    it('should maintain trend data consistency', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockCoverageData))

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())
      const coverage = response.data.coverage

      // Trend should end with current value
      expect(coverage.trend[coverage.trend.length - 1]).toBe(coverage.total)

      // Trend values should be ascending (showing improvement)
      for (let i = 1; i < coverage.trend.length; i++) {
        expect(coverage.trend[i]).toBeGreaterThanOrEqual(coverage.trend[i - 1])
      }
    })
  })

  describe('Edge cases', () => {
    it('should handle empty coverage data', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue('{}')

      const { req, res } = createMocks({
        method: 'GET',
      })

      // Should not crash
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle missing nested properties in coverage', async () => {
      const incompleteCoverage = {
        total: {
          lines: {} // Missing pct property
        }
      }

      mockFs.existsSync.mockReturnValue(true)
      mockFs.readFileSync.mockReturnValue(JSON.stringify(incompleteCoverage))

      const { req, res } = createMocks({
        method: 'GET',
      })

      // Should not crash and fallback to defaults
      await handler(req, res)

      expect(res._getStatusCode()).toBe(200)
    })

    it('should handle very large file sizes', async () => {
      mockFs.existsSync.mockReturnValue(true)
      mockFs.readdirSync.mockReturnValue(['huge-file.js'])
      mockFs.statSync.mockReturnValue({ size: 10 * 1024 * 1024 } as any) // 10MB

      const { req, res } = createMocks({
        method: 'GET',
      })

      await handler(req, res)

      const response = JSON.parse(res._getData())

      // Should handle large bundle size
      expect(response.data.performance.bundleSize).toBe(10240) // 10MB in KB
    })
  })
})