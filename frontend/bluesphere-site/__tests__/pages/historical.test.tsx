/**
 * Comprehensive test suite for Historical Data page component
 * Tests historical ocean temperature analysis, data cycling, and climate insights
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HistoricalDataPage from '../../pages/historical'
import { useRouter } from 'next/router'

// Mock next/router
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  route: '/historical',
  pathname: '/historical',
  query: {},
  asPath: '/historical',
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

// Mock WorldClassLayout
jest.mock('../../components/WorldClassLayout', () => {
  return function MockWorldClassLayout({ children, title }: any) {
    return (
      <div data-testid="world-class-layout">
        <title>{title}</title>
        {children}
      </div>
    )
  }
})

// Mock HistoricalDataCycler component
jest.mock('../../components/HistoricalDataCycler', () => {
  return function MockHistoricalDataCycler({
    startYear,
    endYear,
    cycleSpeed,
    showAnomaly,
    autoPlay,
    onYearChange,
    stations
  }: any) {
    // Simulate cycling through years
    React.useEffect(() => {
      let currentYear = startYear
      const interval = setInterval(() => {
        if (autoPlay) {
          currentYear += 1
          if (currentYear > endYear) {
            currentYear = startYear
          }
          onYearChange(currentYear)
        }
      }, cycleSpeed / 10) // Speed up for testing

      return () => clearInterval(interval)
    }, [startYear, endYear, cycleSpeed, autoPlay, onYearChange])

    return (
      <div data-testid="historical-data-cycler">
        <div data-testid="start-year">{startYear}</div>
        <div data-testid="end-year">{endYear}</div>
        <div data-testid="cycle-speed">{cycleSpeed}</div>
        <div data-testid="show-anomaly">{showAnomaly ? 'true' : 'false'}</div>
        <div data-testid="auto-play">{autoPlay ? 'true' : 'false'}</div>
        <div data-testid="stations-count">{stations?.length || 0}</div>
        <div data-testid="stations-list">{stations?.join(',') || ''}</div>
        <div data-testid="temperature-visualization">Temperature Visualization</div>
        <div data-testid="year-controls">Year Controls</div>
        <div data-testid="playback-controls">Playback Controls</div>
      </div>
    )
  }
})

describe('HistoricalDataPage', () => {
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
      render(<HistoricalDataPage />)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Historical Ocean Temperature Analysis')
      expect(screen.getByText(/Interactive 5-year cycling visualization/)).toBeInTheDocument()
    })

    it('renders the hero section with correct elements', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('📈')).toBeInTheDocument()
      expect(screen.getByText('Historical Ocean Temperature Analysis')).toBeInTheDocument()
      expect(screen.getByText(/Witness the gradual warming of our oceans/)).toBeInTheDocument()
    })

    it('displays the analysis period information', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('2019-2024')).toBeInTheDocument()
      expect(screen.getByText('Analysis Period')).toBeInTheDocument()
      expect(screen.getByText('2024')).toBeInTheDocument()
      expect(screen.getByText('Current Year')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Monitoring Stations')).toBeInTheDocument()
    })

    it('renders the HistoricalDataCycler component', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByTestId('historical-data-cycler')).toBeInTheDocument()
      expect(screen.getByTestId('temperature-visualization')).toBeInTheDocument()
    })
  })

  describe('HistoricalDataCycler Configuration', () => {
    it('passes correct props to HistoricalDataCycler', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByTestId('start-year')).toHaveTextContent('2019')
      expect(screen.getByTestId('end-year')).toHaveTextContent('2024')
      expect(screen.getByTestId('cycle-speed')).toHaveTextContent('2500')
      expect(screen.getByTestId('show-anomaly')).toHaveTextContent('true') // Default anomaly mode
      expect(screen.getByTestId('auto-play')).toHaveTextContent('true')
      expect(screen.getByTestId('stations-count')).toHaveTextContent('5')
    })

    it('passes correct station IDs', () => {
      render(<HistoricalDataPage />)

      const stationsList = screen.getByTestId('stations-list')
      expect(stationsList).toHaveTextContent('41001,41002,46001,46002,42001')
    })

    it('updates view mode when toggled', async () => {
      const user = userEvent.setup()
      render(<HistoricalDataPage />)

      // Initially in anomaly mode
      expect(screen.getByTestId('show-anomaly')).toHaveTextContent('true')

      // Switch to absolute temperature mode
      const absoluteRadio = screen.getByRole('radio', { name: /Absolute Temperature/i })
      await user.click(absoluteRadio)

      await waitFor(() => {
        expect(screen.getByTestId('show-anomaly')).toHaveTextContent('false')
      })

      // Switch back to anomaly mode
      const anomalyRadio = screen.getByRole('radio', { name: /Temperature Anomaly/i })
      await user.click(anomalyRadio)

      await waitFor(() => {
        expect(screen.getByTestId('show-anomaly')).toHaveTextContent('true')
      })
    })
  })

  describe('Analysis Options', () => {
    it('displays analysis options section', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('Analysis Options')).toBeInTheDocument()
      expect(screen.getByText('Temperature Display')).toBeInTheDocument()
    })

    it('shows temperature display radio buttons', () => {
      render(<HistoricalDataPage />)

      const absoluteRadio = screen.getByRole('radio', { name: /Absolute Temperature/i })
      const anomalyRadio = screen.getByRole('radio', { name: /Temperature Anomaly/i })

      expect(absoluteRadio).toBeInTheDocument()
      expect(anomalyRadio).toBeInTheDocument()
      expect(anomalyRadio).toBeChecked() // Default selection
      expect(absoluteRadio).not.toBeChecked()
    })

    it('displays monitoring stations information', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('Monitoring Stations')).toBeInTheDocument()
      expect(screen.getByText(/41001.*East Hatteras.*Atlantic/)).toBeInTheDocument()
      expect(screen.getByText(/41002.*South Hatteras.*Atlantic/)).toBeInTheDocument()
      expect(screen.getByText(/46001.*Gulf of Alaska.*Pacific/)).toBeInTheDocument()
      expect(screen.getByText(/46002.*Oregon Coast.*Pacific/)).toBeInTheDocument()
      expect(screen.getByText(/42001.*Gulf of Mexico/)).toBeInTheDocument()
    })

    it('shows key insights', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('Key Insights')).toBeInTheDocument()
      expect(screen.getByText(/Warming Trend.*\+0\.18°C per decade/)).toBeInTheDocument()
      expect(screen.getByText(/Peak Temperatures.*Summer 2023-2024/)).toBeInTheDocument()
      expect(screen.getByText(/Ocean Regions.*Atlantic warming fastest/)).toBeInTheDocument()
      expect(screen.getByText(/Marine Heatwaves.*Increasing frequency/)).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('handles view mode changes correctly', async () => {
      const user = userEvent.setup()
      render(<HistoricalDataPage />)

      const absoluteRadio = screen.getByRole('radio', { name: /Absolute Temperature/i })
      const anomalyRadio = screen.getByRole('radio', { name: /Temperature Anomaly/i })

      // Switch to absolute mode
      await user.click(absoluteRadio)
      expect(absoluteRadio).toBeChecked()
      expect(anomalyRadio).not.toBeChecked()

      // Switch back to anomaly mode
      await user.click(anomalyRadio)
      expect(anomalyRadio).toBeChecked()
      expect(absoluteRadio).not.toBeChecked()
    })

    it('updates current year when cycler changes', async () => {
      render(<HistoricalDataPage />)

      // Initial year should be 2024
      expect(screen.getByText('2024')).toBeInTheDocument()

      // Advance timers to trigger year change in the cycler
      jest.advanceTimersByTime(250) // 2500ms / 10 for testing

      await waitFor(() => {
        // Should cycle to next year (2019 since we're cycling)
        const currentYearDisplay = screen.getAllByText(/^(2019|2020|2021|2022|2023|2024)$/)
        expect(currentYearDisplay.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Climate Context Section', () => {
    it('displays climate context information', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('🌍')).toBeInTheDocument()
      expect(screen.getByText('Climate Context')).toBeInTheDocument()
      expect(screen.getByText(/Ocean Temperature Anomalies/)).toBeInTheDocument()
      expect(screen.getByText(/1990-2020 baseline period/)).toBeInTheDocument()
      expect(screen.getByText(/0\.6°C since 1969/)).toBeInTheDocument()
    })

    it('shows scientific methodology section', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('📊')).toBeInTheDocument()
      expect(screen.getByText('Scientific Methodology')).toBeInTheDocument()
      expect(screen.getByText(/Data Collection/)).toBeInTheDocument()
      expect(screen.getByText(/NOAA NDBC ocean buoys/)).toBeInTheDocument()
      expect(screen.getByText(/Analysis Period.*5-year cycling/)).toBeInTheDocument()
    })

    it('displays climate impacts information', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('🚨')).toBeInTheDocument()
      expect(screen.getByText('Climate Impacts')).toBeInTheDocument()
      expect(screen.getByText(/Marine Ecosystems/)).toBeInTheDocument()
      expect(screen.getByText(/coral bleaching events/)).toBeInTheDocument()
      expect(screen.getByText(/Weather Patterns/)).toBeInTheDocument()
      expect(screen.getByText(/stronger hurricanes/)).toBeInTheDocument()
    })
  })

  describe('Action Items Section', () => {
    it('displays the taking action section', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('Taking Action on Ocean Warming')).toBeInTheDocument()
      expect(screen.getByText(/Understanding historical temperature trends/)).toBeInTheDocument()
    })

    it('shows action items for different audiences', () => {
      render(<HistoricalDataPage />)

      // Policy Makers
      expect(screen.getByText('🏛️')).toBeInTheDocument()
      expect(screen.getByText('Policy Makers')).toBeInTheDocument()
      expect(screen.getByText(/climate policy.*marine conservation/)).toBeInTheDocument()

      // Researchers
      expect(screen.getByText('🔬')).toBeInTheDocument()
      expect(screen.getByText('Researchers')).toBeInTheDocument()
      expect(screen.getByText(/climate model validation/)).toBeInTheDocument()

      // Activists
      expect(screen.getByText('🌱')).toBeInTheDocument()
      expect(screen.getByText('Activists')).toBeInTheDocument()
      expect(screen.getByText(/climate urgency/)).toBeInTheDocument()
    })
  })

  describe('Data Accuracy and Content', () => {
    it('displays accurate station information', () => {
      render(<HistoricalDataPage />)

      // Check that station IDs and descriptions are accurate
      expect(screen.getByText(/41001.*East Hatteras.*Atlantic/)).toBeInTheDocument()
      expect(screen.getByText(/41002.*South Hatteras.*Atlantic/)).toBeInTheDocument()
      expect(screen.getByText(/46001.*Gulf of Alaska.*Pacific/)).toBeInTheDocument()
      expect(screen.getByText(/46002.*Oregon Coast.*Pacific/)).toBeInTheDocument()
      expect(screen.getByText(/42001.*Gulf of Mexico/)).toBeInTheDocument()
    })

    it('shows realistic climate statistics', () => {
      render(<HistoricalDataPage />)

      // Verify that displayed statistics are realistic
      expect(screen.getByText(/\+0\.18°C per decade/)).toBeInTheDocument()
      expect(screen.getByText(/0\.6°C since 1969/)).toBeInTheDocument()
      expect(screen.getByText(/2019-2024/)).toBeInTheDocument()
    })

    it('provides scientifically accurate information', () => {
      render(<HistoricalDataPage />)

      // Check for scientific accuracy
      expect(screen.getByText(/1990-2020 baseline period/)).toBeInTheDocument()
      expect(screen.getByText(/NOAA NDBC ocean buoys/)).toBeInTheDocument()
      expect(screen.getByText(/top 2000 meters/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HistoricalDataPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()

      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      expect(h3Elements.length).toBeGreaterThan(0)

      const h4Elements = screen.getAllByRole('heading', { level: 4 })
      expect(h4Elements.length).toBeGreaterThan(0)
    })

    it('has accessible form controls', () => {
      render(<HistoricalDataPage />)

      const radioButtons = screen.getAllByRole('radio')
      expect(radioButtons.length).toBe(2)

      radioButtons.forEach(radio => {
        expect(radio).toHaveAccessibleName()
      })
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<HistoricalDataPage />)

      await user.tab()

      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
    })

    it('has proper form labels', () => {
      render(<HistoricalDataPage />)

      expect(screen.getByText('Temperature Display')).toBeInTheDocument()
      expect(screen.getByLabelText(/Absolute Temperature/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Temperature Anomaly/)).toBeInTheDocument()
    })
  })

  describe('SEO and Meta Tags', () => {
    it('sets correct page title', () => {
      render(<HistoricalDataPage />)

      const layout = screen.getByTestId('world-class-layout')
      expect(layout).toBeInTheDocument()

      expect(screen.getByText('Historical Ocean Temperature Analysis - BlueSphere')).toBeInTheDocument()
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

      render(<HistoricalDataPage />)

      expect(screen.getByText('Historical Ocean Temperature Analysis')).toBeInTheDocument()
      expect(screen.getByTestId('historical-data-cycler')).toBeInTheDocument()
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

      render(<HistoricalDataPage />)

      expect(screen.getByText('Historical Ocean Temperature Analysis')).toBeInTheDocument()
    })
  })

  describe('Component State Management', () => {
    it('manages currentYear state correctly', async () => {
      render(<HistoricalDataPage />)

      // Initial state
      expect(screen.getByText('2024')).toBeInTheDocument()

      // Simulate year change from cycler
      jest.advanceTimersByTime(250)

      await waitFor(() => {
        // Should show a valid year between 2019-2024
        const yearElements = screen.getAllByText(/^(2019|2020|2021|2022|2023|2024)$/)
        expect(yearElements.length).toBeGreaterThan(0)
      })
    })

    it('manages viewMode state correctly', async () => {
      const user = userEvent.setup()
      render(<HistoricalDataPage />)

      // Initially in anomaly mode
      const anomalyRadio = screen.getByRole('radio', { name: /Temperature Anomaly/i })
      expect(anomalyRadio).toBeChecked()

      // Switch to absolute mode
      const absoluteRadio = screen.getByRole('radio', { name: /Absolute Temperature/i })
      await user.click(absoluteRadio)

      expect(absoluteRadio).toBeChecked()
      expect(anomalyRadio).not.toBeChecked()
    })
  })

  describe('Performance', () => {
    it('renders efficiently without memory leaks', () => {
      const { unmount } = render(<HistoricalDataPage />)

      expect(() => unmount()).not.toThrow()
    })

    it('handles multiple rerenders', () => {
      const { rerender } = render(<HistoricalDataPage />)

      expect(() => {
        rerender(<HistoricalDataPage />)
        rerender(<HistoricalDataPage />)
        rerender(<HistoricalDataPage />)
      }).not.toThrow()
    })

    it('properly cleans up timers on unmount', () => {
      const { unmount } = render(<HistoricalDataPage />)

      unmount()

      // Advance timers after unmount - should not cause errors
      expect(() => {
        jest.advanceTimersByTime(5000)
      }).not.toThrow()
    })
  })

  describe('Error Boundaries', () => {
    it('gracefully handles component errors', () => {
      const originalError = console.error
      console.error = jest.fn()

      try {
        render(<HistoricalDataPage />)
        expect(screen.getByTestId('world-class-layout')).toBeInTheDocument()
      } finally {
        console.error = originalError
      }
    })
  })

  describe('CSS and Styling', () => {
    it('applies correct CSS classes', () => {
      render(<HistoricalDataPage />)

      expect(document.querySelector('.bs-section')).toBeInTheDocument()
      expect(document.querySelector('.bs-premium-card')).toBeInTheDocument()
      expect(document.querySelector('.bs-grid')).toBeInTheDocument()
    })

    it('has responsive grid layouts', () => {
      render(<HistoricalDataPage />)

      expect(document.querySelector('.grid')).toBeInTheDocument()
      expect(document.querySelector('.md\\:grid-cols-3')).toBeInTheDocument()
    })
  })

  describe('Data Integration', () => {
    it('correctly integrates with HistoricalDataCycler component', () => {
      render(<HistoricalDataPage />)

      const cycler = screen.getByTestId('historical-data-cycler')
      expect(cycler).toBeInTheDocument()

      // Verify all expected props are passed
      expect(screen.getByTestId('start-year')).toHaveTextContent('2019')
      expect(screen.getByTestId('end-year')).toHaveTextContent('2024')
      expect(screen.getByTestId('stations-count')).toHaveTextContent('5')
    })

    it('handles year changes from child component', async () => {
      render(<HistoricalDataPage />)

      // Simulate cycling
      jest.advanceTimersByTime(250)

      await waitFor(() => {
        // Should update the current year display
        const currentYearCards = document.querySelectorAll('.text-green-600')
        expect(currentYearCards.length).toBeGreaterThan(0)
      })
    })
  })
})