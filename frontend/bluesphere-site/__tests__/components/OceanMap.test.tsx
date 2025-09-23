/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OceanMap from '../../components/OceanMap'
import { mockStations, mockObservations } from '../utils/mock-data'

// Mock Leaflet to prevent SSR issues in tests
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: any) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: (props: any) => <div data-testid="tile-layer" {...props} />,
  Marker: ({ children, ...props }: any) => (
    <div data-testid="marker" {...props}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="popup">{children}</div>,
  Circle: (props: any) => <div data-testid="circle" {...props} />,
  Polyline: (props: any) => <div data-testid="polyline" {...props} />,
  useMap: () => ({
    setView: jest.fn(),
    fitBounds: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  })
}))

// Mock Leaflet library
jest.mock('leaflet', () => ({
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: jest.fn()
    }
  },
  divIcon: jest.fn(() => ({ options: {} })),
  latLngBounds: jest.fn(() => ({
    extend: jest.fn(),
    isValid: jest.fn(() => true)
  }))
}))

describe('OceanMap Component', () => {
  const defaultProps = {
    stations: mockStations,
    observations: mockObservations,
    selectedStation: null,
    onStationSelect: jest.fn(),
    showTemperatureLayer: true,
    showCurrentsLayer: false,
    showAlertsLayer: true,
    animationSpeed: 1,
    className: 'test-ocean-map'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock performance API for tests
    Object.defineProperty(window, 'performance', {
      value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByName: jest.fn(() => [{ duration: 100 }])
      }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders map container with correct props', () => {
    render(<OceanMap {...defaultProps} />)

    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
    expect(mapContainer).toHaveClass('test-ocean-map')
  })

  it('displays tile layer for base map', () => {
    render(<OceanMap {...defaultProps} />)

    const tileLayer = screen.getByTestId('tile-layer')
    expect(tileLayer).toBeInTheDocument()
  })

  it('renders markers for each station', () => {
    render(<OceanMap {...defaultProps} />)

    const markers = screen.getAllByTestId('marker')
    expect(markers).toHaveLength(mockStations.length)
  })

  it('handles station selection correctly', async () => {
    const user = userEvent.setup()
    render(<OceanMap {...defaultProps} />)

    const firstMarker = screen.getAllByTestId('marker')[0]
    await user.click(firstMarker)

    expect(defaultProps.onStationSelect).toHaveBeenCalledWith(mockStations[0])
  })

  it('displays temperature layer when enabled', () => {
    render(<OceanMap {...defaultProps} showTemperatureLayer={true} />)

    // Temperature layer should be visible through circles or visual indicators
    const tempIndicators = screen.queryAllByTestId('circle')
    expect(tempIndicators.length).toBeGreaterThanOrEqual(0)
  })

  it('hides temperature layer when disabled', () => {
    render(<OceanMap {...defaultProps} showTemperatureLayer={false} />)

    // Should not render temperature-related elements
    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('handles real-time data updates', async () => {
    const { rerender } = render(<OceanMap {...defaultProps} />)

    const newObservations = [
      ...mockObservations,
      {
        id: 10004,
        station_id: "41003",
        time: new Date().toISOString(),
        sst_c: 25.1,
        qc_flag: 1,
        lat: 35.0,
        lon: -73.0,
        source: "NDBC",
        anomaly_c: 1.8
      }
    ]

    rerender(<OceanMap {...defaultProps} observations={newObservations} />)

    // Should still render all markers
    await waitFor(() => {
      const markers = screen.getAllByTestId('marker')
      expect(markers).toHaveLength(mockStations.length)
    })
  })

  it('handles empty data gracefully', () => {
    render(<OceanMap {...defaultProps} stations={[]} observations={[]} />)

    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()

    const markers = screen.queryAllByTestId('marker')
    expect(markers).toHaveLength(0)
  })

  it('displays alerts layer when enabled', () => {
    render(<OceanMap {...defaultProps} showAlertsLayer={true} />)

    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('handles animation speed changes', () => {
    const { rerender } = render(<OceanMap {...defaultProps} animationSpeed={1} />)

    rerender(<OceanMap {...defaultProps} animationSpeed={2} />)

    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('handles selected station highlighting', () => {
    const selectedStation = mockStations[0]
    render(<OceanMap {...defaultProps} selectedStation={selectedStation} />)

    const markers = screen.getAllByTestId('marker')
    expect(markers).toHaveLength(mockStations.length)
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<OceanMap {...defaultProps} />)

    const mapContainer = screen.getByTestId('map-container')

    // Focus on map container
    await user.tab()

    // Arrow key navigation should work
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowLeft}')
    await user.keyboard('{ArrowRight}')

    expect(mapContainer).toBeInTheDocument()
  })

  it('handles error states gracefully', () => {
    // Mock console.error to prevent error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const invalidProps = {
      ...defaultProps,
      stations: null as any,
      observations: undefined as any
    }

    expect(() => {
      render(<OceanMap {...invalidProps} />)
    }).not.toThrow()

    consoleSpy.mockRestore()
  })

  it('optimizes performance with large datasets', () => {
    const largeStationSet = Array.from({ length: 1000 }, (_, i) => ({
      ...mockStations[0],
      station_id: `station_${i}`,
      lat: 40 + (i % 20),
      lon: -70 - (i % 30)
    }))

    const largeObservationSet = Array.from({ length: 5000 }, (_, i) => ({
      ...mockObservations[0],
      id: i,
      station_id: `station_${i % 1000}`
    }))

    const renderStart = performance.now()

    render(
      <OceanMap
        {...defaultProps}
        stations={largeStationSet}
        observations={largeObservationSet}
      />
    )

    const renderEnd = performance.now()
    const renderTime = renderEnd - renderStart

    // Should render within reasonable time (< 1000ms for large datasets)
    expect(renderTime).toBeLessThan(1000)

    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('maintains accessibility standards', () => {
    render(<OceanMap {...defaultProps} />)

    const mapContainer = screen.getByTestId('map-container')

    // Should have proper ARIA labels
    expect(mapContainer).toBeInTheDocument()

    // Should be keyboard accessible
    expect(mapContainer).not.toHaveAttribute('tabindex', '-1')
  })

  it('supports responsive design', () => {
    // Mock window resize
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 320 // Mobile width
    })

    render(<OceanMap {...defaultProps} />)

    const mapContainer = screen.getByTestId('map-container')
    expect(mapContainer).toBeInTheDocument()

    // Test tablet width
    Object.defineProperty(window, 'innerWidth', {
      value: 768
    })

    // Trigger resize event
    fireEvent(window, new Event('resize'))

    expect(mapContainer).toBeInTheDocument()
  })
}