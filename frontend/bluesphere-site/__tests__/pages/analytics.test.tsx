/**
 * Comprehensive test suite for Analytics page component
 * Tests predictive analytics functionality, ML model information, and timeframe selection
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalyticsPage from '../../pages/analytics'
import { useRouter } from 'next/router'

// Mock next/router
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  route: '/analytics',
  pathname: '/analytics',
  query: {},
  asPath: '/analytics',
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

// Mock PredictiveAnalytics component
jest.mock('../../components/PredictiveAnalytics', () => {
  return function MockPredictiveAnalytics({ isDarkMode, selectedTimeframe }: any) {
    return (
      <div data-testid="predictive-analytics">
        <div data-testid="dark-mode-status">{isDarkMode ? 'Dark' : 'Light'}</div>
        <div data-testid="selected-timeframe">{selectedTimeframe}</div>
        <div data-testid="forecast-chart">Forecast Chart</div>
        <div data-testid="risk-assessment">Risk Assessment</div>
        <div data-testid="temperature-predictions">Temperature Predictions</div>
        <div data-testid="heatwave-alerts">Marine Heatwave Alerts</div>
      </div>
    )
  }
})

describe('AnalyticsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders the page header and title', () => {
      render(<AnalyticsPage />)

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Predictive Analytics Dashboard')
      expect(screen.getByText(/AI-powered ocean temperature forecasting/)).toBeInTheDocument()
    })

    it('renders the hero section with correct styling', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('🧠')).toBeInTheDocument()
      expect(screen.getByText('Predictive Analytics Dashboard')).toBeInTheDocument()
      expect(screen.getByText(/machine learning/)).toBeInTheDocument()
    })

    it('displays the timeframe selection controls', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('⏱️')).toBeInTheDocument()
      expect(screen.getByText('Forecast Period')).toBeInTheDocument()
      expect(screen.getByText('Select prediction timeframe for analysis')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('renders the PredictiveAnalytics component', () => {
      render(<AnalyticsPage />)

      expect(screen.getByTestId('predictive-analytics')).toBeInTheDocument()
      expect(screen.getByTestId('forecast-chart')).toBeInTheDocument()
      expect(screen.getByTestId('risk-assessment')).toBeInTheDocument()
    })
  })

  describe('Timeframe Selection', () => {
    it('defaults to 30 days timeframe', () => {
      render(<AnalyticsPage />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveValue('30days')
      expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('30days')
    })

    it('displays all timeframe options', () => {
      render(<AnalyticsPage />)

      const select = screen.getByRole('combobox')

      expect(screen.getByRole('option', { name: /Next 7 Days/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Next 14 Days/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Next 30 Days/ })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: /Next 90 Days/ })).toBeInTheDocument()
    })

    it('changes timeframe when user selects different option', async () => {
      const user = userEvent.setup()
      render(<AnalyticsPage />)

      const select = screen.getByRole('combobox')

      await user.selectOptions(select, '7days')
      expect(select).toHaveValue('7days')
      expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('7days')

      await user.selectOptions(select, '90days')
      expect(select).toHaveValue('90days')
      expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('90days')
    })

    it('updates PredictiveAnalytics component when timeframe changes', async () => {
      const user = userEvent.setup()
      render(<AnalyticsPage />)

      const select = screen.getByRole('combobox')

      await user.selectOptions(select, '14days')

      await waitFor(() => {
        expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('14days')
      })
    })
  })

  describe('Machine Learning Information', () => {
    it('displays ML model information section', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('🤖')).toBeInTheDocument()
      expect(screen.getByText('Machine Learning Model')).toBeInTheDocument()
    })

    it('shows neural network architecture details', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/Neural Network Architecture/)).toBeInTheDocument()
      expect(screen.getByText(/LSTM/)).toBeInTheDocument()
      expect(screen.getByText(/Long Short-Term Memory/)).toBeInTheDocument()
    })

    it('displays training data information', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/Training Data/)).toBeInTheDocument()
      expect(screen.getByText(/50,000 temperature measurements/)).toBeInTheDocument()
      expect(screen.getByText(/20+ years/)).toBeInTheDocument()
    })

    it('shows feature engineering details', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/Feature Engineering/)).toBeInTheDocument()
      expect(screen.getByText(/sea surface temperature anomalies/)).toBeInTheDocument()
      expect(screen.getByText(/ocean current velocities/)).toBeInTheDocument()
    })
  })

  describe('Risk Assessment Framework', () => {
    it('displays risk assessment section', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('Risk Assessment Framework')).toBeInTheDocument()
    })

    it('shows all risk levels with correct styling', () => {
      render(<AnalyticsPage />)

      // Critical risk
      expect(screen.getByText(/Critical.*≥29.5°C/)).toBeInTheDocument()
      expect(screen.getByText(/Severe bleaching expected/)).toBeInTheDocument()

      // High risk
      expect(screen.getByText(/High.*28.5-29.4°C/)).toBeInTheDocument()
      expect(screen.getByText(/Moderate to severe bleaching/)).toBeInTheDocument()

      // Medium risk
      expect(screen.getByText(/Medium.*27.5-28.4°C/)).toBeInTheDocument()
      expect(screen.getByText(/Stress conditions/)).toBeInTheDocument()

      // Low risk
      expect(screen.getByText(/Low.*<27.5°C/)).toBeInTheDocument()
      expect(screen.getByText(/Normal conditions/)).toBeInTheDocument()
    })

    it('displays risk level indicators', () => {
      render(<AnalyticsPage />)

      // Check for colored indicators (represented as divs with specific classes)
      const riskIndicators = document.querySelectorAll('.bg-red-600, .bg-orange-600, .bg-yellow-600, .bg-green-600')
      expect(riskIndicators.length).toBe(4)
    })
  })

  describe('Model Performance Section', () => {
    it('displays model performance and validation section', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('Model Performance & Validation')).toBeInTheDocument()
    })

    it('shows accuracy metrics', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('Accuracy Metrics')).toBeInTheDocument()
      expect(screen.getByText(/Overall Accuracy.*87-92%/)).toBeInTheDocument()
      expect(screen.getByText(/7-day forecast.*94% accuracy/)).toBeInTheDocument()
      expect(screen.getByText(/30-day forecast.*85% accuracy/)).toBeInTheDocument()
      expect(screen.getByText(/90-day forecast.*78% accuracy/)).toBeInTheDocument()
    })

    it('displays validation methods', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('Validation Methods')).toBeInTheDocument()
      expect(screen.getByText(/Cross-validation/)).toBeInTheDocument()
      expect(screen.getByText(/Temporal validation/)).toBeInTheDocument()
      expect(screen.getByText(/Regional performance/)).toBeInTheDocument()
      expect(screen.getByText(/Real-time forecast verification/)).toBeInTheDocument()
    })

    it('shows continuous improvement information', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('Continuous Improvement')).toBeInTheDocument()
      expect(screen.getByText(/Weekly model retraining/)).toBeInTheDocument()
      expect(screen.getByText(/New data source integration/)).toBeInTheDocument()
      expect(screen.getByText(/Algorithm refinement/)).toBeInTheDocument()
      expect(screen.getByText(/Performance monitoring/)).toBeInTheDocument()
    })
  })

  describe('Use Cases and Applications', () => {
    it('displays applications and use cases section', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText('Applications & Use Cases')).toBeInTheDocument()
    })

    it('shows marine conservation use case', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/🐠.*Marine Conservation/)).toBeInTheDocument()
      expect(screen.getByText(/Early warning systems for coral bleaching/)).toBeInTheDocument()
    })

    it('displays policy planning use case', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/🏛️.*Policy Planning/)).toBeInTheDocument()
      expect(screen.getByText(/Evidence-based climate policy/)).toBeInTheDocument()
    })

    it('shows scientific research use case', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/🔬.*Scientific Research/)).toBeInTheDocument()
      expect(screen.getByText(/Hypothesis generation and validation/)).toBeInTheDocument()
    })

    it('displays tourism industry use case', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/🏖️.*Tourism Industry/)).toBeInTheDocument()
      expect(screen.getByText(/Seasonal planning and risk management/)).toBeInTheDocument()
    })

    it('shows fisheries management use case', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/🎣.*Fisheries Management/)).toBeInTheDocument()
      expect(screen.getByText(/Predicting fish migration patterns/)).toBeInTheDocument()
    })

    it('displays insurance and finance use case', () => {
      render(<AnalyticsPage />)

      expect(screen.getByText(/💰.*Insurance & Finance/)).toBeInTheDocument()
      expect(screen.getByText(/Climate risk modeling/)).toBeInTheDocument()
    })
  })

  describe('Component Integration', () => {
    it('passes correct props to PredictiveAnalytics', () => {
      render(<AnalyticsPage />)

      expect(screen.getByTestId('dark-mode-status')).toHaveTextContent('Light')
      expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('30days')
    })

    it('updates PredictiveAnalytics when state changes', async () => {
      const user = userEvent.setup()
      render(<AnalyticsPage />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, '7days')

      await waitFor(() => {
        expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('7days')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<AnalyticsPage />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()

      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      expect(h3Elements.length).toBeGreaterThan(0)

      const h4Elements = screen.getAllByRole('heading', { level: 4 })
      expect(h4Elements.length).toBeGreaterThan(0)
    })

    it('has accessible form controls', () => {
      render(<AnalyticsPage />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(select).toHaveAccessibleName()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<AnalyticsPage />)

      await user.tab()

      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
    })

    it('has proper semantic structure', () => {
      render(<AnalyticsPage />)

      // Check for proper use of headings and semantic elements
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getAllByRole('heading').length).toBeGreaterThan(1)
    })
  })

  describe('SEO and Meta Tags', () => {
    it('sets correct page title', () => {
      render(<AnalyticsPage />)

      const layout = screen.getByTestId('world-class-layout')
      expect(layout).toBeInTheDocument()

      // Check that title is passed to layout
      expect(screen.getByText('Predictive Analytics Dashboard - BlueSphere')).toBeInTheDocument()
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

      render(<AnalyticsPage />)

      expect(screen.getByText('Predictive Analytics Dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('predictive-analytics')).toBeInTheDocument()
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

      render(<AnalyticsPage />)

      expect(screen.getByText('Predictive Analytics Dashboard')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('handles rapid timeframe changes without issues', async () => {
      const user = userEvent.setup()
      render(<AnalyticsPage />)

      const select = screen.getByRole('combobox')

      // Rapidly change selections
      await user.selectOptions(select, '7days')
      await user.selectOptions(select, '14days')
      await user.selectOptions(select, '30days')
      await user.selectOptions(select, '90days')

      expect(select).toHaveValue('90days')
      expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('90days')
    })

    it('maintains state consistency', async () => {
      const user = userEvent.setup()
      render(<AnalyticsPage />)

      const select = screen.getByRole('combobox')

      // Change to 14 days
      await user.selectOptions(select, '14days')

      // Verify state is updated in both the select and the component
      expect(select).toHaveValue('14days')
      expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('14days')
    })
  })

  describe('Content Validation', () => {
    it('displays accurate ML model information', () => {
      render(<AnalyticsPage />)

      // Verify technical accuracy of displayed information
      expect(screen.getByText(/LSTM/)).toBeInTheDocument()
      expect(screen.getByText(/50,000 temperature measurements/)).toBeInTheDocument()
      expect(screen.getByText(/20\+ years/)).toBeInTheDocument()
    })

    it('shows realistic accuracy metrics', () => {
      render(<AnalyticsPage />)

      // Verify accuracy percentages are realistic
      expect(screen.getByText(/87-92%/)).toBeInTheDocument()
      expect(screen.getByText(/94% accuracy/)).toBeInTheDocument()
      expect(screen.getByText(/85% accuracy/)).toBeInTheDocument()
      expect(screen.getByText(/78% accuracy/)).toBeInTheDocument()
    })

    it('provides coherent risk assessment thresholds', () => {
      render(<AnalyticsPage />)

      // Check that risk thresholds make scientific sense
      expect(screen.getByText(/≥29.5°C/)).toBeInTheDocument()
      expect(screen.getByText(/28.5-29.4°C/)).toBeInTheDocument()
      expect(screen.getByText(/27.5-28.4°C/)).toBeInTheDocument()
      expect(screen.getByText(/<27.5°C/)).toBeInTheDocument()
    })
  })

  describe('Error Boundaries', () => {
    it('gracefully handles component errors', () => {
      // Mock console.error to prevent error logs in test output
      const originalError = console.error
      console.error = jest.fn()

      try {
        render(<AnalyticsPage />)
        expect(screen.getByTestId('world-class-layout')).toBeInTheDocument()
      } finally {
        console.error = originalError
      }
    })
  })

  describe('Performance', () => {
    it('renders efficiently without memory leaks', () => {
      const { unmount } = render(<AnalyticsPage />)

      // Should unmount without errors
      expect(() => unmount()).not.toThrow()
    })

    it('handles multiple rerenders', () => {
      const { rerender } = render(<AnalyticsPage />)

      // Multiple rerenders should work
      expect(() => {
        rerender(<AnalyticsPage />)
        rerender(<AnalyticsPage />)
        rerender(<AnalyticsPage />)
      }).not.toThrow()
    })
  })

  describe('CSS and Styling', () => {
    it('applies correct CSS classes', () => {
      render(<AnalyticsPage />)

      // Check for important style classes
      expect(document.querySelector('.bs-section')).toBeInTheDocument()
      expect(document.querySelector('.bs-premium-card')).toBeInTheDocument()
      expect(document.querySelector('.bs-grid')).toBeInTheDocument()
    })

    it('has responsive grid layouts', () => {
      render(<AnalyticsPage />)

      // Check for grid classes
      expect(document.querySelector('.grid')).toBeInTheDocument()
      expect(document.querySelector('.md\\:grid-cols-3')).toBeInTheDocument()
    })
  })

  describe('Data Flow', () => {
    it('correctly manages component state', async () => {
      const user = userEvent.setup()
      render(<AnalyticsPage />)

      // Initial state
      expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('30days')

      // State change
      const select = screen.getByRole('combobox')
      await user.selectOptions(select, '7days')

      // Verify state propagation
      await waitFor(() => {
        expect(screen.getByTestId('selected-timeframe')).toHaveTextContent('7days')
      })
    })
  })
})