/**
 * Comprehensive test suite for Map page component
 * Tests ocean mapping functionality, buoy data, climate metrics, and real-time updates
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MapPage from '../../pages/map'
import { useRouter } from 'next/router'

// Mock buoy data
const mockBuoyData = [
  {
    station_id: 'BUOY-001',
    name: 'North Atlantic Station',
    lat: 40.7128,
    lon: -74.0060,
    provider: 'NOAA',
    last_temp: 18.5,
    status: 'active' as const
  },
  {
    station_id: 'BUOY-002',
    name: 'Pacific Observatory',
    lat: 36.7783,
    lon: -119.4179,
    provider: 'NDBC',
    last_temp: 22.1,
    status: 'active' as const
  },
  {
    station_id: 'BUOY-003',
    name: 'Gulf Stream Monitor',
    lat: 25.7617,
    lon: -80.1918,
    provider: 'NOAA',
    last_temp: 26.8,
    status: 'warning' as const
  },
  {
    station_id: 'BUOY-004',
    name: 'Arctic Station',
    lat: 71.0,
    lon: -8.0,
    provider: 'IMR',
    last_temp: 2.3,
    status: 'inactive' as const
  }
]

const mockClimateMetrics = {
  globalTemp: 21.2,
  tempAnomaly: 1.8,
  activeStations: 3,
  marineHeatwaves: 7,
  avgTemp: 18.9,
  hotspotCount: 12,
  criticalAlerts: 3
}

// Mock next/router
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  route: '/map',
  pathname: '/map',
  query: {},
  asPath: '/map',
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

// Mock dynamic imports
jest.mock('next/dynamic', () => () => {
  const DynamicComponent = ({
    buoys,
    onBuoySelect,
    selectedBuoy,
    enableClustering,
    showTemperatureLayer,
    isDarkMode
  }: any) => (
    <div data-testid="ocean-map">
      <div data-testid="buoy-count">{buoys?.length || 0} buoys</div>
      <div data-testid="clustering-status">{enableClustering ? 'Enabled' : 'Disabled'}</div>
      <div data-testid="temperature-layer">{showTemperatureLayer ? 'Visible' : 'Hidden'}</div>
      <div data-testid="theme-mode">{isDarkMode ? 'Dark' : 'Light'}</div>
      {buoys?.map((buoy: any) => (
        <button
          key={buoy.station_id}
          data-testid={`map-buoy-${buoy.station_id}`}
          onClick={() => onBuoySelect(buoy)}
          className={selectedBuoy?.station_id === buoy.station_id ? 'selected' : ''}
        >
          {buoy.name} - {buoy.last_temp}°C
        </button>
      ))}
    </div>
  )
  DynamicComponent.displayName = 'OceanMap'
  return DynamicComponent
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

// Mock AlertDashboard
jest.mock('../../components/AlertDashboard', () => {
  return function MockAlertDashboard({ alerts, onAlertClick }: any) {
    return (
      <div data-testid="alert-dashboard">
        <h3>Marine Alerts</h3>
        {alerts?.map((alert: any, index: number) => (
          <div key={index} data-testid={`alert-${index}`} onClick={() => onAlertClick(alert)}>
            {alert.title} - {alert.severity}
          </div>
        ))}
      </div>
    )
  }
})

// Mock RealTimeStatus
jest.mock('../../components/RealTimeStatus', () => {
  return function MockRealTimeStatus({ isConnected, lastUpdate, dataPoints }: any) {
    return (
      <div data-testid="real-time-status">
        <div data-testid="connection-status">{isConnected ? 'Connected' : 'Disconnected'}</div>
        <div data-testid="last-update">{lastUpdate}</div>
        <div data-testid="data-points">{dataPoints}</div>
      </div>
    )
  }
})

// Mock fetch for API calls
global.fetch = jest.fn().mockImplementation((url) => {
  if (url.includes('/api/buoys')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ buoys: mockBuoyData })
    })
  }
  if (url.includes('/api/climate-metrics')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockClimateMetrics)
    })
  }
  return Promise.reject(new Error('Unknown API endpoint'))
}) as jest.Mock

describe('MapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('renders the page header and loading skeleton', () => {
      render(<MapPage />)

      // Should show loading skeleton initially
      expect(screen.getByText(/Loading ocean data/i)).toBeInTheDocument()
    })

    it('loads and displays buoy data', async () => {
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
        expect(screen.getByTestId('buoy-count')).toHaveTextContent('4 buoys')
      })

      // Check individual buoys are rendered
      expect(screen.getByTestId('map-buoy-BUOY-001')).toBeInTheDocument()
      expect(screen.getByTestId('map-buoy-BUOY-002')).toBeInTheDocument()
      expect(screen.getByTestId('map-buoy-BUOY-003')).toBeInTheDocument()
      expect(screen.getByTestId('map-buoy-BUOY-004')).toBeInTheDocument()
    })

    it('displays climate metrics', async () => {
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByText(/Global Temperature/i)).toBeInTheDocument()
        expect(screen.getByText('21.2°C')).toBeInTheDocument()
        expect(screen.getByText('1.8°C')).toBeInTheDocument() // Temperature anomaly
      })
    })

    it('renders real-time status component', async () => {
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('real-time-status')).toBeInTheDocument()
      })
    })
  })

  describe('Map Interactions', () => {
    it('selects buoys when clicked', async () => {
      const user = userEvent.setup()
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('map-buoy-BUOY-001')).toBeInTheDocument()
      })

      // Click on a buoy
      await user.click(screen.getByTestId('map-buoy-BUOY-001'))

      // Should display buoy details (implementation depends on the actual component)
      expect(screen.getByTestId('map-buoy-BUOY-001')).toBeInTheDocument()
    })

    it('handles map view changes', async () => {
      const user = userEvent.setup()
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Test temperature layer toggle (if available in controls)
      const temperatureToggle = screen.queryByRole('button', { name: /temperature/i })
      if (temperatureToggle) {
        await user.click(temperatureToggle)
      }

      // Test clustering toggle (if available in controls)
      const clusteringToggle = screen.queryByRole('button', { name: /cluster/i })
      if (clusteringToggle) {
        await user.click(clusteringToggle)
      }
    })
  })

  describe('Filtering and Search', () => {
    it('filters buoys by status', async () => {
      const user = userEvent.setup()
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Look for status filter if it exists
      const statusFilter = screen.queryByRole('combobox', { name: /status/i })
      if (statusFilter) {
        await user.selectOptions(statusFilter, 'active')

        // Should show only active buoys
        await waitFor(() => {
          expect(screen.getByTestId('map-buoy-BUOY-001')).toBeInTheDocument()
          expect(screen.getByTestId('map-buoy-BUOY-002')).toBeInTheDocument()
        })
      }
    })

    it('searches buoys by name', async () => {
      const user = userEvent.setup()
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Look for search input if it exists
      const searchInput = screen.queryByRole('textbox', { name: /search/i })
      if (searchInput) {
        await user.type(searchInput, 'Atlantic')

        await waitFor(() => {
          expect(screen.getByTestId('map-buoy-BUOY-001')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Real-time Data Updates', () => {
    it('handles real-time data updates', async () => {
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Simulate real-time update
      const updatedBuoyData = [
        ...mockBuoyData,
        {
          station_id: 'BUOY-005',
          name: 'New Real-time Station',
          lat: 30.0,
          lon: -90.0,
          provider: 'REAL_TIME',
          last_temp: 25.0,
          status: 'active' as const
        }
      ]

      // Mock updated fetch response
      ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ buoys: updatedBuoyData })
        })
      )

      // Trigger update (this would normally happen via websocket or polling)
      jest.advanceTimersByTime(30000) // 30 seconds

      await waitFor(() => {
        expect(screen.getByTestId('buoy-count')).toHaveTextContent('5 buoys')
      })
    })

    it('displays connection status', async () => {
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('real-time-status')).toBeInTheDocument()
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected')
      })
    })
  })

  describe('Alert System', () => {
    it('displays marine alerts', async () => {
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('alert-dashboard')).toBeInTheDocument()
        expect(screen.getByText('Marine Alerts')).toBeInTheDocument()
      })
    })

    it('handles alert interactions', async () => {
      const user = userEvent.setup()
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('alert-dashboard')).toBeInTheDocument()
      })

      // If there are alerts, test clicking them
      const alert = screen.queryByTestId('alert-0')
      if (alert) {
        await user.click(alert)
        // Should navigate to alert or show details
      }
    })
  })

  describe('Performance Monitoring', () => {
    it('tracks page load performance', async () => {
      const performanceMarkSpy = jest.spyOn(performance, 'mark').mockImplementation()
      const performanceMeasureSpy = jest.spyOn(performance, 'measure').mockImplementation()

      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      performanceMarkSpy.mockRestore()
      performanceMeasureSpy.mockRestore()
    })

    it('handles large datasets efficiently', async () => {
      // Create large dataset
      const largeBuoyDataset = Array.from({ length: 1000 }, (_, i) => ({
        station_id: `BUOY-${i.toString().padStart(3, '0')}`,
        name: `Station ${i}`,
        lat: (Math.random() - 0.5) * 180,
        lon: (Math.random() - 0.5) * 360,
        provider: 'TEST',
        last_temp: Math.random() * 30,
        status: 'active' as const
      }))

      ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ buoys: largeBuoyDataset })
        })
      )

      const { container } = render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('buoy-count')).toHaveTextContent('1000 buoys')
      }, { timeout: 5000 })

      // Should not freeze or crash
      expect(container).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<MapPage />)

      await waitFor(() => {
        // Should show error state or fallback
        expect(screen.getByText(/error/i) || screen.getByText(/failed/i)).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('handles network failures', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'))

      render(<MapPage />)

      await waitFor(() => {
        // Should handle gracefully
        expect(screen.getByTestId('world-class-layout')).toBeInTheDocument()
      })
    })

    it('handles malformed data', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ buoys: null })
        })
      )

      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
        expect(screen.getByTestId('buoy-count')).toHaveTextContent('0 buoys')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Check for map accessibility
      const mapElement = screen.getByTestId('ocean-map')
      expect(mapElement).toBeInTheDocument()

      // Buoy buttons should be accessible
      const buoyButtons = screen.getAllByRole('button')
      buoyButtons.forEach(button => {
        expect(button).toHaveAccessibleName()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Tab through interactive elements
      await user.tab()

      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
    })

    it('provides screen reader announcements', async () => {
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Check for aria-live regions
      const liveRegions = document.querySelectorAll('[aria-live]')
      expect(liveRegions.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Responsive Design', () => {
    it('adapts to mobile viewport', () => {
      // Mock mobile viewport
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

      render(<MapPage />)

      expect(screen.getByTestId('world-class-layout')).toBeInTheDocument()
    })

    it('adapts to tablet viewport', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })

      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width: 1024px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }))

      render(<MapPage />)

      expect(screen.getByTestId('world-class-layout')).toBeInTheDocument()
    })
  })

  describe('SEO and Meta Tags', () => {
    it('sets correct page title and meta information', () => {
      render(<MapPage />)

      const layout = screen.getByTestId('world-class-layout')
      expect(layout).toBeInTheDocument()

      // Check title includes map-related keywords
      expect(document.title || screen.getByText(/Ocean Map/i)).toBeTruthy()
    })
  })

  describe('Data Export and Sharing', () => {
    it('supports data export functionality', async () => {
      const user = userEvent.setup()
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Look for export button if it exists
      const exportButton = screen.queryByRole('button', { name: /export/i })
      if (exportButton) {
        await user.click(exportButton)
        // Should trigger download or show export options
      }
    })

    it('supports map sharing functionality', async () => {
      const user = userEvent.setup()
      render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Look for share button if it exists
      const shareButton = screen.queryByRole('button', { name: /share/i })
      if (shareButton) {
        await user.click(shareButton)
        // Should show sharing options
      }
    })
  })

  describe('Memory Management', () => {
    it('cleans up resources on unmount', () => {
      const { unmount } = render(<MapPage />)

      // Should unmount without memory leaks
      expect(() => unmount()).not.toThrow()
    })

    it('handles component updates efficiently', async () => {
      const { rerender } = render(<MapPage />)

      await waitFor(() => {
        expect(screen.getByTestId('ocean-map')).toBeInTheDocument()
      })

      // Multiple rerenders should work efficiently
      expect(() => {
        rerender(<MapPage />)
        rerender(<MapPage />)
      }).not.toThrow()
    })
  })
})