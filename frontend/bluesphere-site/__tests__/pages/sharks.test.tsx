/**
 * Comprehensive test suite for SharksPage component
 * Tests shark tracking functionality, filtering, real-time updates, and map interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SharksPage from '../../pages/sharks'
import { useRouter } from 'next/router'

// Mock shark tracking service - define before mocks
const mockSharkData = [
  {
    id: 'shark-001',
    name: 'Mary Lee',
    species: 'Great White Shark',
    sex: 'F' as const,
    length_m: 5.2,
    weight_kg: 1678,
    tag_date: '2023-01-15T00:00:00Z',
    last_ping: '2024-09-23T12:00:00Z',
    lat: 40.7128,
    lon: -74.0060,
    tracking_organization: 'OCEARCH',
    confidence_level: 'High' as const,
    status: 'Active' as const
  },
  {
    id: 'shark-002',
    name: 'Deep Blue',
    species: 'Great White Shark',
    sex: 'F' as const,
    length_m: 6.1,
    weight_kg: 2268,
    tag_date: '2023-03-20T00:00:00Z',
    last_ping: '2024-09-20T08:30:00Z',
    lat: 36.7783,
    lon: -119.4179,
    tracking_organization: 'Marine Biology Institute',
    confidence_level: 'High' as const,
    status: 'Inactive' as const
  },
  {
    id: 'shark-003',
    name: 'Bruce',
    species: 'Tiger Shark',
    sex: 'M' as const,
    length_m: 4.3,
    weight_kg: 635,
    tag_date: '2023-06-10T00:00:00Z',
    last_ping: '2024-09-15T14:45:00Z',
    lat: 25.7617,
    lon: -80.1918,
    tracking_organization: 'BlueSphere Network',
    confidence_level: 'Medium' as const,
    status: 'Lost_Signal' as const
  }
]

// Mock shark tracking library
jest.mock('../../lib/shark-tracking', () => ({
  OCEARCHService: {
    getTrackedSharks: jest.fn().mockResolvedValue(mockSharkData),
    getEnhancedMockData: jest.fn().mockResolvedValue(mockSharkData)
  },
  sharkTracker: {
    subscribeToUpdates: jest.fn((callback) => {
      // Simulate real-time updates
      setTimeout(() => callback(mockSharkData), 100)
      return jest.fn() // unsubscribe function
    })
  }
}))

// Mock next/router
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  route: '/sharks',
  pathname: '/sharks',
  query: {},
  asPath: '/sharks',
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
  const DynamicComponent = ({ sharks, onSharkSelect, selectedSharkId, enableRealTimeUpdates }: any) => (
    <div data-testid="enhanced-shark-map">
      <div data-testid="shark-count">{sharks?.length || 0} sharks</div>
      <div data-testid="real-time-status">{enableRealTimeUpdates ? 'Live' : 'Static'}</div>
      {sharks?.map((shark: any) => (
        <button
          key={shark.id}
          data-testid={`map-shark-${shark.id}`}
          onClick={() => onSharkSelect(shark)}
          className={selectedSharkId === shark.id ? 'selected' : ''}
        >
          {shark.name}
        </button>
      ))}
    </div>
  )
  DynamicComponent.displayName = 'EnhancedSharkMap'
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

// Mock SharkProfile component
jest.mock('../../components/SharkProfile', () => {
  return function MockSharkProfile({ profile, onClose }: any) {
    return (
      <div data-testid="shark-profile">
        <h3>{profile.name}</h3>
        <p>{profile.species}</p>
        <p>Length: {profile.length_m}m</p>
        <p>Weight: {profile.weight_kg}kg</p>
        <button onClick={onClose} data-testid="close-profile">Close</button>
      </div>
    )
  }
})

describe('SharksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Initial Rendering', () => {
    it('renders the page header with correct title and stats', async () => {
      render(<SharksPage />)

      // Check header
      expect(screen.getByText('🦈 Global Shark Tracking')).toBeInTheDocument()
      expect(screen.getByText('Real-time monitoring of tagged sharks worldwide')).toBeInTheDocument()

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Total sharks
      })

      expect(screen.getByText('Tagged Sharks')).toBeInTheDocument()
      expect(screen.getByText('Currently Active')).toBeInTheDocument()
      expect(screen.getByText('Species Tracked')).toBeInTheDocument()
    })

    it('shows loading state initially', () => {
      render(<SharksPage />)

      expect(screen.getByText('...')).toBeInTheDocument()
      expect(screen.getByText(/Loading.*tracked sharks/)).toBeInTheDocument()
    })

    it('renders navigation tabs', () => {
      render(<SharksPage />)

      expect(screen.getByRole('tab', { name: /Live Map/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Shark List/i })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Statistics/i })).toBeInTheDocument()
    })
  })

  describe('Data Loading', () => {
    it('loads and displays shark data', async () => {
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Total sharks
        expect(screen.getByText('1')).toBeInTheDocument() // Active sharks
        expect(screen.getByText('2')).toBeInTheDocument() // Species count
      })
    })

    it('handles loading timeout gracefully', async () => {
      // Mock service to reject with timeout
      const { OCEARCHService } = require('../../lib/shark-tracking')
      OCEARCHService.getTrackedSharks.mockRejectedValueOnce(new Error('Timeout'))

      render(<SharksPage />)

      await waitFor(() => {
        // Should fall back to mock data
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('switches between tabs correctly', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      // Initially on map tab
      expect(screen.getByTestId('enhanced-shark-map')).toBeInTheDocument()

      // Switch to list tab
      await user.click(screen.getByRole('tab', { name: /Shark List/i }))

      await waitFor(() => {
        expect(screen.getByText('Mary Lee')).toBeInTheDocument()
        expect(screen.getByText('Deep Blue')).toBeInTheDocument()
        expect(screen.getByText('Bruce')).toBeInTheDocument()
      })

      // Switch to stats tab
      await user.click(screen.getByRole('tab', { name: /Statistics/i }))

      await waitFor(() => {
        expect(screen.getByText('Species Distribution')).toBeInTheDocument()
        expect(screen.getByText('Tracking Status')).toBeInTheDocument()
      })
    })

    it('maintains proper ARIA attributes for tabs', async () => {
      render(<SharksPage />)

      const mapTab = screen.getByRole('tab', { name: /Live Map/i })
      const listTab = screen.getByRole('tab', { name: /Shark List/i })

      expect(mapTab).toHaveAttribute('aria-selected', 'true')
      expect(listTab).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('Filtering and Search', () => {
    it('filters sharks by status', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('Mary Lee')).toBeInTheDocument()
      })

      // Switch to list tab to see sharks
      await user.click(screen.getByRole('tab', { name: /Shark List/i }))

      // Filter by active status
      const statusFilter = screen.getByRole('combobox', { name: /Filter sharks by status/i })
      await user.selectOptions(statusFilter, 'active')

      await waitFor(() => {
        expect(screen.getByText('Mary Lee')).toBeInTheDocument()
        expect(screen.queryByText('Deep Blue')).not.toBeInTheDocument()
        expect(screen.queryByText('Bruce')).not.toBeInTheDocument()
      })
    })

    it('searches sharks by name and species', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('Mary Lee')).toBeInTheDocument()
      })

      // Switch to list tab
      await user.click(screen.getByRole('tab', { name: /Shark List/i }))

      // Search for "Deep"
      const searchInput = screen.getByRole('textbox', { name: /Search sharks/i })
      await user.type(searchInput, 'Deep')

      await waitFor(() => {
        expect(screen.getByText('Deep Blue')).toBeInTheDocument()
        expect(screen.queryByText('Mary Lee')).not.toBeInTheDocument()
        expect(screen.queryByText('Bruce')).not.toBeInTheDocument()
      })
    })

    it('searches by species', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('Mary Lee')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: /Shark List/i }))

      const searchInput = screen.getByRole('textbox', { name: /Search sharks/i })
      await user.type(searchInput, 'Tiger')

      await waitFor(() => {
        expect(screen.getByText('Bruce')).toBeInTheDocument()
        expect(screen.queryByText('Mary Lee')).not.toBeInTheDocument()
        expect(screen.queryByText('Deep Blue')).not.toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('enables and disables real-time updates', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByTestId('enhanced-shark-map')).toBeInTheDocument()
      })

      const realtimeCheckbox = screen.getByRole('checkbox', { name: /Enable real-time updates/i })
      expect(realtimeCheckbox).toBeChecked()

      // Disable real-time updates
      await user.click(realtimeCheckbox)
      expect(realtimeCheckbox).not.toBeChecked()

      // Re-enable
      await user.click(realtimeCheckbox)
      expect(realtimeCheckbox).toBeChecked()
    })

    it('subscribes to real-time updates when enabled', async () => {
      const { sharkTracker } = require('../../lib/shark-tracking')
      render(<SharksPage />)

      await waitFor(() => {
        expect(sharkTracker.subscribeToUpdates).toHaveBeenCalled()
      })
    })
  })

  describe('Shark Selection and Profile', () => {
    it('selects and displays shark profile from map', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByTestId('map-shark-shark-001')).toBeInTheDocument()
      })

      // Click on a shark in the map
      await user.click(screen.getByTestId('map-shark-shark-001'))

      await waitFor(() => {
        expect(screen.getByTestId('shark-profile')).toBeInTheDocument()
        expect(screen.getByText('Mary Lee')).toBeInTheDocument()
        expect(screen.getByText('Great White Shark')).toBeInTheDocument()
      })
    })

    it('selects shark from list view', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      // Switch to list tab
      await user.click(screen.getByRole('tab', { name: /Shark List/i }))

      // Click on a shark card
      const sharkCard = screen.getByText('Mary Lee').closest('.shark-card')
      expect(sharkCard).toBeInTheDocument()

      if (sharkCard) {
        await user.click(sharkCard)

        await waitFor(() => {
          expect(screen.getByTestId('shark-profile')).toBeInTheDocument()
        })
      }
    })

    it('closes shark profile', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByTestId('map-shark-shark-001')).toBeInTheDocument()
      })

      // Select a shark
      await user.click(screen.getByTestId('map-shark-shark-001'))

      await waitFor(() => {
        expect(screen.getByTestId('shark-profile')).toBeInTheDocument()
      })

      // Close profile
      await user.click(screen.getByTestId('close-profile'))

      await waitFor(() => {
        expect(screen.queryByTestId('shark-profile')).not.toBeInTheDocument()
      })
    })
  })

  describe('Keyboard Navigation', () => {
    it('supports keyboard navigation on shark cards', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: /Shark List/i }))

      const sharkCard = screen.getByText('Mary Lee').closest('div[role="button"]')
      expect(sharkCard).toBeInTheDocument()

      if (sharkCard) {
        // Focus the card
        sharkCard.focus()

        // Press Enter to select
        await user.keyboard('{Enter}')

        await waitFor(() => {
          expect(screen.getByTestId('shark-profile')).toBeInTheDocument()
        })
      }
    })

    it('supports Space key for shark selection', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: /Shark List/i }))

      const sharkCard = screen.getByText('Deep Blue').closest('div[role="button"]')
      expect(sharkCard).toBeInTheDocument()

      if (sharkCard) {
        sharkCard.focus()
        await user.keyboard(' ') // Space key

        await waitFor(() => {
          expect(screen.getByTestId('shark-profile')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Statistics View', () => {
    it('displays species distribution', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: /Statistics/i }))

      await waitFor(() => {
        expect(screen.getByText('Species Distribution')).toBeInTheDocument()
        expect(screen.getByText('Great White Shark')).toBeInTheDocument()
        expect(screen.getByText('Tiger Shark')).toBeInTheDocument()
      })
    })

    it('displays tracking status breakdown', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: /Statistics/i }))

      await waitFor(() => {
        expect(screen.getByText('Tracking Status')).toBeInTheDocument()
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })
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

      render(<SharksPage />)

      expect(screen.getByText('🦈 Global Shark Tracking')).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: /Live Map/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      render(<SharksPage />)

      // Check tablist
      const tablist = screen.getByRole('tablist')
      expect(tablist).toHaveAttribute('aria-label', 'Shark tracking view options')

      // Check form controls
      expect(screen.getByRole('combobox', { name: /Filter sharks by status/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /Search sharks/i })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /Enable real-time updates/i })).toBeInTheDocument()
    })

    it('provides screen reader labels', () => {
      render(<SharksPage />)

      // Check for sr-only labels
      expect(screen.getByLabelText(/Filter sharks by status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Search sharks by name or species/i)).toBeInTheDocument()
    })

    it('maintains proper heading hierarchy', () => {
      render(<SharksPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
      expect(h1).toHaveTextContent('🦈 Global Shark Tracking')
    })
  })

  describe('Error Handling', () => {
    it('handles shark data loading errors gracefully', async () => {
      const { OCEARCHService } = require('../../lib/shark-tracking')
      OCEARCHService.getTrackedSharks.mockRejectedValueOnce(new Error('API Error'))

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument() // Fallback data
      })

      consoleSpy.mockRestore()
    })

    it('handles real-time update errors', async () => {
      const { sharkTracker } = require('../../lib/shark-tracking')
      sharkTracker.subscribeToUpdates.mockImplementationOnce(() => {
        throw new Error('Subscription failed')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      expect(() => render(<SharksPage />)).not.toThrow()

      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('properly cleans up subscriptions on unmount', () => {
      const unsubscribeMock = jest.fn()
      const { sharkTracker } = require('../../lib/shark-tracking')
      sharkTracker.subscribeToUpdates.mockReturnValue(unsubscribeMock)

      const { unmount } = render(<SharksPage />)

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })

    it('handles multiple rapid state updates', async () => {
      const user = userEvent.setup()
      render(<SharksPage />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })

      // Rapidly change filters
      const statusFilter = screen.getByRole('combobox', { name: /Filter sharks by status/i })
      await user.selectOptions(statusFilter, 'active')
      await user.selectOptions(statusFilter, 'inactive')
      await user.selectOptions(statusFilter, 'all')

      // Should not crash
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })
})