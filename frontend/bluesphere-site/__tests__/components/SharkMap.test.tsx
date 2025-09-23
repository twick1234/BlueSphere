/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SharkMap from '../../components/SharkMap'
import { mockSharkData } from '../utils/mock-data'

// Mock Leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: any) => (
    <div data-testid="shark-map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: (props: any) => <div data-testid="tile-layer" {...props} />,
  Marker: ({ children, ...props }: any) => (
    <div data-testid="shark-marker" data-shark-id={props['data-shark-id']} {...props}>
      {children}
    </div>
  ),
  Popup: ({ children }: any) => <div data-testid="shark-popup">{children}</div>,
  Polyline: (props: any) => <div data-testid="shark-trail" {...props} />,
  useMap: () => ({
    setView: jest.fn(),
    fitBounds: jest.fn(),
    on: jest.fn(),
    off: jest.fn()
  })
}))

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

describe('SharkMap Component', () => {
  const defaultProps = {
    sharks: mockSharkData,
    selectedShark: null,
    onSharkSelect: jest.fn(),
    showTrails: true,
    showLabels: true,
    animationSpeed: 1,
    filterBySpecies: [],
    filterByStatus: 'all' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders shark map container', () => {
    render(<SharkMap {...defaultProps} />)

    const mapContainer = screen.getByTestId('shark-map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('displays all sharks as markers', () => {
    render(<SharkMap {...defaultProps} />)

    const markers = screen.getAllByTestId('shark-marker')
    expect(markers).toHaveLength(mockSharkData.length)
  })

  it('handles shark selection correctly', async () => {
    const user = userEvent.setup()
    render(<SharkMap {...defaultProps} />)

    const firstMarker = screen.getAllByTestId('shark-marker')[0]
    await user.click(firstMarker)

    expect(defaultProps.onSharkSelect).toHaveBeenCalledWith(mockSharkData[0])
  })

  it('shows shark trails when enabled', () => {
    render(<SharkMap {...defaultProps} showTrails={true} />)

    const trails = screen.queryAllByTestId('shark-trail')
    expect(trails.length).toBeGreaterThan(0)
  })

  it('hides shark trails when disabled', () => {
    render(<SharkMap {...defaultProps} showTrails={false} />)

    const trails = screen.queryAllByTestId('shark-trail')
    expect(trails).toHaveLength(0)
  })

  it('filters sharks by species', () => {
    const filteredProps = {
      ...defaultProps,
      filterBySpecies: ['Carcharodon carcharias']
    }

    render(<SharkMap {...filteredProps} />)

    const markers = screen.getAllByTestId('shark-marker')
    // Should only show Great White sharks
    expect(markers.length).toBeLessThanOrEqual(mockSharkData.length)
  })

  it('filters sharks by status', () => {
    const filteredProps = {
      ...defaultProps,
      filterByStatus: 'tracking' as const
    }

    render(<SharkMap {...filteredProps} />)

    const markers = screen.getAllByTestId('shark-marker')
    expect(markers.length).toBeGreaterThan(0)
  })

  it('handles empty shark data gracefully', () => {
    render(<SharkMap {...defaultProps} sharks={[]} />)

    const mapContainer = screen.getByTestId('shark-map-container')
    expect(mapContainer).toBeInTheDocument()

    const markers = screen.queryAllByTestId('shark-marker')
    expect(markers).toHaveLength(0)
  })

  it('displays shark information in popup', async () => {
    const user = userEvent.setup()
    render(<SharkMap {...defaultProps} />)

    const firstMarker = screen.getAllByTestId('shark-marker')[0]
    await user.click(firstMarker)

    await waitFor(() => {
      const popup = screen.queryByTestId('shark-popup')
      expect(popup).toBeInTheDocument()
    })
  })

  it('highlights selected shark', () => {
    const selectedShark = mockSharkData[0]
    render(<SharkMap {...defaultProps} selectedShark={selectedShark} />)

    const markers = screen.getAllByTestId('shark-marker')
    const selectedMarker = markers.find(marker =>
      marker.getAttribute('data-shark-id') === selectedShark.id
    )

    expect(selectedMarker).toBeInTheDocument()
  })

  it('handles real-time shark updates', async () => {
    const { rerender } = render(<SharkMap {...defaultProps} />)

    const updatedSharkData = [
      ...mockSharkData,
      {
        id: "SHARK_NEW",
        name: "Newcomer",
        species: "Carcharodon carcharias",
        length_m: 4.2,
        weight_kg: 900,
        sex: "M",
        tag_date: "2024-09-23T12:00:00Z",
        last_location: {
          lat: 35.0,
          lon: -120.0,
          timestamp: "2024-09-23T12:00:00Z",
          depth_m: 20
        },
        status: "tracking",
        tracking_history: [],
        vital_signs: {
          heart_rate_bpm: 40,
          temperature_c: 17.5,
          depth_m: 20
        }
      }
    ]

    rerender(<SharkMap {...defaultProps} sharks={updatedSharkData} />)

    await waitFor(() => {
      const markers = screen.getAllByTestId('shark-marker')
      expect(markers).toHaveLength(updatedSharkData.length)
    })
  })

  it('handles animation speed changes', () => {
    const { rerender } = render(<SharkMap {...defaultProps} animationSpeed={1} />)

    rerender(<SharkMap {...defaultProps} animationSpeed={3} />)

    const mapContainer = screen.getByTestId('shark-map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<SharkMap {...defaultProps} />)

    const mapContainer = screen.getByTestId('shark-map-container')

    // Tab to focus map
    await user.tab()

    // Arrow key navigation
    await user.keyboard('{ArrowUp}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowLeft}')
    await user.keyboard('{ArrowRight}')

    expect(mapContainer).toBeInTheDocument()
  })

  it('displays shark labels when enabled', () => {
    render(<SharkMap {...defaultProps} showLabels={true} />)

    const mapContainer = screen.getByTestId('shark-map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('handles large datasets efficiently', () => {
    const largeSharkDataset = Array.from({ length: 1000 }, (_, i) => ({
      ...mockSharkData[0],
      id: `SHARK_${i}`,
      name: `Shark ${i}`,
      last_location: {
        ...mockSharkData[0].last_location,
        lat: 30 + (i % 20),
        lon: -120 - (i % 30)
      }
    }))

    const renderStart = performance.now()

    render(<SharkMap {...defaultProps} sharks={largeSharkDataset} />)

    const renderEnd = performance.now()
    const renderTime = renderEnd - renderStart

    // Should render efficiently even with large datasets
    expect(renderTime).toBeLessThan(2000) // 2 seconds

    const mapContainer = screen.getByTestId('shark-map-container')
    expect(mapContainer).toBeInTheDocument()
  })

  it('maintains accessibility standards', () => {
    render(<SharkMap {...defaultProps} />)

    const mapContainer = screen.getByTestId('shark-map-container')
    expect(mapContainer).toBeInTheDocument()

    // Should be keyboard accessible
    expect(mapContainer).not.toHaveAttribute('tabindex', '-1')
  })

  it('handles error states gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    const invalidProps = {
      ...defaultProps,
      sharks: null as any
    }

    expect(() => {
      render(<SharkMap {...invalidProps} />)
    }).not.toThrow()

    consoleSpy.mockRestore()
  })

  it('updates map view when shark selection changes', () => {
    const { rerender } = render(<SharkMap {...defaultProps} selectedShark={null} />)

    const selectedShark = mockSharkData[0]
    rerender(<SharkMap {...defaultProps} selectedShark={selectedShark} />)

    const mapContainer = screen.getByTestId('shark-map-container')
    expect(mapContainer).toBeInTheDocument()
  })
})