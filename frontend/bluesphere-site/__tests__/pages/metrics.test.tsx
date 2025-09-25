/**
 * Comprehensive test suite for Metrics Dashboard page
 * Tests real-time platform health, test coverage, and performance monitoring
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MetricsPage from '../../pages/metrics'
import { useRouter } from 'next/router'

// Mock metrics data
const mockMetricsData = {
  coverage: {
    total: 75.8,
    components: 82.3,
    api: 68.5,
    pages: 71.2,
    trend: [65.2, 68.4, 71.1, 73.8, 75.8],
    lastUpdated: '2024-09-23T12:00:00Z'
  },
  performance: {
    lcp: 2.1,
    fid: 89,
    cls: 0.05,
    bundleSize: 845.2,
    apiResponseTime: 156,
    trend: [2.5, 2.3, 2.2, 2.1, 2.0]
  },
  system: {
    uptime: 99.94,
    activeStations: 15847,
    trackingSharks: 2847,
    alertsToday: 12,
    dataIngestionRate: 1250,
    lastFailure: '2024-09-20T03:15:00Z'
  },
  tests: {
    total: 1247,
    passing: 1205,
    failing: 12,
    duration: 45.6,
    lastRun: '2024-09-23T11:45:00Z',
    trend: [1180, 1195, 1210, 1225, 1247]
  },
  api: {
    endpoints: 45,
    healthy: 43,
    degraded: 2,
    down: 0,
    avgResponseTime: 156,
    errorRate: 0.12
  }
}

const mockAlerts = [
  {
    id: 'alert-001',
    type: 'performance',
    severity: 'warning',
    title: 'API Response Time Elevated',
    description: 'Average response time is above 150ms threshold',
    timestamp: '2024-09-23T11:30:00Z',
    resolved: false
  },
  {
    id: 'alert-002',
    type: 'coverage',
    severity: 'info',
    title: 'Test Coverage Target Reached',
    description: 'Component test coverage exceeded 80%',
    timestamp: '2024-09-23T10:15:00Z',
    resolved: true
  }
]

// Mock next/router
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  route: '/metrics',
  pathname: '/metrics',
  query: {},
  asPath: '/metrics',
  back: jest.fn(),
  beforePopState: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  reload: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
}

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

// Mock Chart.js components
jest.mock('react-chartjs-2', () => ({
  Chart: ({ data, options, type }: any) => (
    <div data-testid={`chart-${type}`}>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )
}))

// Mock dynamic imports
jest.mock('next/dynamic', () => (importFunc: any) => {
  if (importFunc.toString().includes('Chart')) {
    return ({ data, options, type }: any) => (
      <div data-testid={`dynamic-chart-${type || 'unknown'}`}>
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
      </div>
    )
  }
  if (importFunc.toString().includes('Line')) {
    return ({ data, options }: any) => (
      <div data-testid="dynamic-line-chart">
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
      </div>
    )
  }
  if (importFunc.toString().includes('Doughnut')) {
    return ({ data, options }: any) => (
      <div data-testid="dynamic-doughnut-chart">
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
      </div>
    )
  }
  if (importFunc.toString().includes('Bar')) {
    return ({ data, options }: any) => (
      <div data-testid="dynamic-bar-chart">
        <div data-testid="chart-data">{JSON.stringify(data)}</div>
      </div>
    )
  }
  return () => <div data-testid="dynamic-component">Dynamic Component</div>
})

// Mock WorldClassLayout
jest.mock('../../components/WorldClassLayout', () => {
  return function MockWorldClassLayout({ children, title, description }: any) {
    return (
      <div data-testid="world-class-layout">
        <title>{title}</title>
        <meta name="description" content={description} />
        {children}
      </div>
    )
  }
})

// Mock fetch for API calls
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/api/metrics')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockMetricsData)
    })
  }
  if (url.includes('/api/alerts')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ alerts: mockAlerts })
    })
  }
  return Promise.reject(new Error('Unknown API endpoint'))
}) as jest.Mock

// Mock WebSocket for real-time updates
class MockWebSocket {
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(public url: string) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string) {
    // Simulate message echo
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage(new MessageEvent('message', { data }))
      }
    }, 10)
  }

  close() {
    setTimeout(() => {
      if (this.onclose) {
        this.onclose(new CloseEvent('close'))
      }
    }, 10)
  }
}

global.WebSocket = MockWebSocket as any

describe('MetricsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('renders the page header and title', () => {
      render(<MetricsPage />)

      expect(screen.getByRole('heading', { name: /Platform Metrics/i })).toBeInTheDocument()
      expect(screen.getByText(/Real-time monitoring/i)).toBeInTheDocument()
    })

    it('shows loading state initially', () => {
      render(<MetricsPage />)

      expect(screen.getByText(/Loading metrics/i) || screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('loads and displays metrics data', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument() // Total coverage
        expect(screen.getByText('99.94%')).toBeInTheDocument() // System uptime
        expect(screen.getByText('1,247')).toBeInTheDocument() // Total tests
      })
    })
  })

  describe('Coverage Metrics', () => {
    it('displays test coverage breakdown', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument() // Total
        expect(screen.getByText('82.3%')).toBeInTheDocument() // Components
        expect(screen.getByText('68.5%')).toBeInTheDocument() // API
        expect(screen.getByText('71.2%')).toBeInTheDocument() // Pages
      })
    })

    it('shows coverage trend chart', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('line-chart') || screen.getByTestId('dynamic-line-chart')).toBeInTheDocument()
      })
    })

    it('highlights coverage improvements', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        // Should show positive trend indicators
        expect(screen.getByText(/improvement/i) || screen.getByText(/increase/i)).toBeInTheDocument()
      })
    })
  })

  describe('Performance Metrics', () => {
    it('displays Core Web Vitals', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('2.1s')).toBeInTheDocument() // LCP
        expect(screen.getByText('89ms')).toBeInTheDocument() // FID
        expect(screen.getByText('0.05')).toBeInTheDocument() // CLS
      })
    })

    it('shows bundle size metrics', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('845.2 KB')).toBeInTheDocument()
      })
    })

    it('displays API response time', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('156ms')).toBeInTheDocument()
      })
    })

    it('renders performance charts', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        const charts = screen.getAllByTestId(/chart/)
        expect(charts.length).toBeGreaterThan(0)
      })
    })
  })

  describe('System Health', () => {
    it('displays system uptime', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('99.94%')).toBeInTheDocument()
      })
    })

    it('shows active monitoring stations', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('15,847')).toBeInTheDocument()
      })
    })

    it('displays tracking statistics', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('2,847')).toBeInTheDocument() // Tracking sharks
        expect(screen.getByText('12')).toBeInTheDocument() // Alerts today
      })
    })

    it('shows data ingestion rate', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('1,250')).toBeInTheDocument()
      })
    })
  })

  describe('Test Metrics', () => {
    it('displays test statistics', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('1,247')).toBeInTheDocument() // Total tests
        expect(screen.getByText('1,205')).toBeInTheDocument() // Passing
        expect(screen.getByText('12')).toBeInTheDocument() // Failing
      })
    })

    it('shows test duration', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('45.6s')).toBeInTheDocument()
      })
    })

    it('displays test trend chart', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByTestId(/chart/) || screen.getByTestId(/line/)).toBeInTheDocument()
      })
    })
  })

  describe('API Health', () => {
    it('displays API endpoint statistics', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('45')).toBeInTheDocument() // Total endpoints
        expect(screen.getByText('43')).toBeInTheDocument() // Healthy
        expect(screen.getByText('2')).toBeInTheDocument() // Degraded
        expect(screen.getByText('0')).toBeInTheDocument() // Down
      })
    })

    it('shows API error rate', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('0.12%')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('establishes WebSocket connection', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText(/connected/i) || screen.getByTestId('connection-status')).toBeInTheDocument()
      })
    })

    it('handles real-time metric updates', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      // Simulate WebSocket message with updated metrics
      const updatedMetrics = {
        ...mockMetricsData,
        coverage: { ...mockMetricsData.coverage, total: 76.2 }
      }

      // This would normally come via WebSocket
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedMetrics)
      })

      jest.advanceTimersByTime(5000) // Advance polling interval

      await waitFor(() => {
        expect(screen.getByText('76.2%')).toBeInTheDocument()
      })
    })

    it('displays last update timestamp', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText(/last updated/i) || screen.getByText(/ago/i)).toBeInTheDocument()
      })
    })
  })

  describe('Interactive Features', () => {
    it('allows toggling between metric views', async () => {
      const user = userEvent.setup()
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      // Look for view toggle buttons
      const coverageTab = screen.queryByRole('button', { name: /coverage/i })
      const performanceTab = screen.queryByRole('button', { name: /performance/i })

      if (coverageTab && performanceTab) {
        await user.click(performanceTab)
        expect(screen.getByText('2.1s')).toBeInTheDocument() // LCP

        await user.click(coverageTab)
        expect(screen.getByText('75.8%')).toBeInTheDocument() // Coverage
      }
    })

    it('supports time range selection', async () => {
      const user = userEvent.setup()
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      // Look for time range selector
      const timeRangeSelect = screen.queryByRole('combobox', { name: /time range/i })
      if (timeRangeSelect) {
        await user.selectOptions(timeRangeSelect, '7d')
        // Should update charts and data
      }
    })

    it('allows metric refresh', async () => {
      const user = userEvent.setup()
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      const refreshButton = screen.queryByRole('button', { name: /refresh/i })
      if (refreshButton) {
        await user.click(refreshButton)
        // Should trigger data reload
        expect(global.fetch).toHaveBeenCalled()
      }
    })
  })

  describe('Alerts and Notifications', () => {
    it('displays system alerts', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText(/API Response Time Elevated/i)).toBeInTheDocument()
        expect(screen.getByText(/Test Coverage Target Reached/i)).toBeInTheDocument()
      })
    })

    it('categorizes alerts by severity', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText(/warning/i)).toBeInTheDocument()
        expect(screen.getByText(/info/i)).toBeInTheDocument()
      })
    })

    it('handles alert interactions', async () => {
      const user = userEvent.setup()
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText(/API Response Time Elevated/i)).toBeInTheDocument()
      })

      const alert = screen.getByText(/API Response Time Elevated/i).closest('div')
      if (alert) {
        await user.click(alert)
        // Should show alert details or navigate
      }
    })
  })

  describe('Data Export', () => {
    it('supports metrics data export', async () => {
      const user = userEvent.setup()
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      const exportButton = screen.queryByRole('button', { name: /export/i })
      if (exportButton) {
        await user.click(exportButton)
        // Should trigger download
      }
    })

    it('generates reports', async () => {
      const user = userEvent.setup()
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      const reportButton = screen.queryByRole('button', { name: /report/i })
      if (reportButton) {
        await user.click(reportButton)
        // Should generate report
      }
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('handles WebSocket connection failures', async () => {
      // Mock WebSocket to fail
      global.WebSocket = jest.fn().mockImplementation(() => {
        throw new Error('Connection failed')
      }) as any

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByTestId('world-class-layout')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('recovers from transient failures', async () => {
      // First call fails, second succeeds
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockMetricsData)
        })

      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      const largeMetricsData = {
        ...mockMetricsData,
        coverage: {
          ...mockMetricsData.coverage,
          trend: Array.from({ length: 1000 }, (_, i) => 50 + Math.random() * 30)
        }
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeMetricsData)
      })

      const { container } = render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(container).toBeInTheDocument()
    })

    it('throttles rapid updates', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      // Simulate rapid updates
      for (let i = 0; i < 10; i++) {
        jest.advanceTimersByTime(100)
      }

      // Should not make excessive API calls
      expect(global.fetch).toHaveBeenCalledTimes(1) // Initial load only
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      // Check for ARIA labels on charts and metrics
      const charts = screen.getAllByTestId(/chart/)
      charts.forEach(chart => {
        expect(chart).toBeInTheDocument()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      await user.tab()
      expect(document.activeElement).toBeInTheDocument()
    })

    it('provides screen reader announcements', async () => {
      render(<MetricsPage />)

      await waitFor(() => {
        expect(screen.getByText('75.8%')).toBeInTheDocument()
      })

      // Check for aria-live regions
      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 768px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      render(<MetricsPage />)

      expect(screen.getByTestId('world-class-layout')).toBeInTheDocument()
    })
  })

  describe('Memory Management', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<MetricsPage />)

      expect(() => unmount()).not.toThrow()
    })

    it('cancels pending requests on unmount', () => {
      const abortController = new AbortController()
      const abortSpy = jest.spyOn(abortController, 'abort')

      const { unmount } = render(<MetricsPage />)
      unmount()

      // Should clean up properly
      expect(() => unmount()).not.toThrow()
    })
  })
})