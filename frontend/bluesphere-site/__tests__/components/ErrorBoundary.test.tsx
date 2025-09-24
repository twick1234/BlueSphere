import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ErrorBoundary,
  PageErrorFallback,
  ComponentErrorFallback,
  WidgetErrorFallback,
  withErrorBoundary
} from '../../components/ErrorBoundary'

// Mock the error handling utilities
jest.mock('@/lib/error-handling', () => ({
  EnhancedError: class MockEnhancedError extends Error {
    constructor(message: string, public context?: any) {
      super(message)
      this.name = 'EnhancedError'
      this.user_friendly_message = `User friendly: ${message}`
      this.recovery_suggestions = ['Try refreshing the page', 'Check your internet connection']
    }
    user_friendly_message: string
    recovery_suggestions: string[]
  },
  ErrorLogger: {
    logError: jest.fn().mockResolvedValue('error-id-123')
  },
  isEnhancedError: jest.fn((error: any) => error.name === 'EnhancedError'),
  ErrorFactory: {
    createDataProcessingError: jest.fn((message: string, context?: any) => {
      const error = new Error(message) as any
      error.name = 'EnhancedError'
      error.user_friendly_message = `User friendly: ${message}`
      error.recovery_suggestions = ['Try refreshing the page', 'Check your internet connection']
      error.context = context
      return error
    })
  }
}))

// Mock performance tracking
jest.mock('@/lib/performance', () => ({
  trackErrorBoundaryPerformance: jest.fn()
}))

// Component that throws an error for testing
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({
  shouldThrow = true,
  errorMessage = 'Test error'
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage)
  }
  return <div data-testid="success-component">Component rendered successfully</div>
}

// Enhanced error throwing component
const ThrowEnhancedError: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    const error = new Error('Enhanced test error') as any
    error.name = 'EnhancedError'
    error.user_friendly_message = 'Something went wrong with the marine data'
    error.recovery_suggestions = ['Refresh the page', 'Try again later', 'Contact support']
    throw error
  }
  return <div data-testid="success-component">Component rendered successfully</div>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for cleaner test output
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.clearAllMocks()
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Basic Error Handling', () => {
    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary level="component">
          <div data-testid="child-component">Child content</div>
        </ErrorBoundary>
      )

      expect(screen.getByTestId('child-component')).toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('catches errors and displays fallback UI', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.queryByTestId('success-component')).not.toBeInTheDocument()
      expect(screen.getByText('Component Error')).toBeInTheDocument()
    })

    it('does not catch errors when component works correctly', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('success-component')).toBeInTheDocument()
      expect(screen.queryByText('Component Error')).not.toBeInTheDocument()
    })
  })

  describe('Error Boundary Levels', () => {
    it('renders page-level error fallback', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Rough Waters Ahead')).toBeInTheDocument()
      expect(screen.getByText('🌊')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Return Home' })).toBeInTheDocument()
    })

    it('renders component-level error fallback', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Component Error')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })

    it('renders widget-level error fallback', () => {
      render(
        <ErrorBoundary level="widget">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Unable to load')).toBeInTheDocument()
      expect(screen.getByText('⚠️')).toBeInTheDocument()
    })
  })

  describe('Enhanced Error Handling', () => {
    it('handles enhanced errors with user-friendly messages', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowEnhancedError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong with the marine data')).toBeInTheDocument()
    })

    it('displays recovery suggestions for enhanced errors', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowEnhancedError />
        </ErrorBoundary>
      )

      expect(screen.getByText('What you can try:')).toBeInTheDocument()
      expect(screen.getByText('Refresh the page')).toBeInTheDocument()
      expect(screen.getByText('Try again later')).toBeInTheDocument()
      expect(screen.getByText('Contact support')).toBeInTheDocument()
    })

    it('converts regular errors to enhanced errors', () => {
      const mockCreateDataProcessingError = require('@/lib/error-handling').ErrorFactory.createDataProcessingError

      render(
        <ErrorBoundary level="component" context={{ userId: '123', page: 'dashboard' }}>
          <ThrowError errorMessage="Regular error message" />
        </ErrorBoundary>
      )

      expect(mockCreateDataProcessingError).toHaveBeenCalledWith(
        'Component error: Regular error message',
        expect.objectContaining({
          userId: '123',
          page: 'dashboard',
          errorBoundaryLevel: 'component'
        })
      )
    })
  })

  describe('Retry Functionality', () => {
    it('provides retry button that works', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      const ToggleError: React.FC = () => {
        if (shouldThrow) {
          throw new Error('Retryable error')
        }
        return <div data-testid="success-after-retry">Success after retry!</div>
      }

      render(
        <ErrorBoundary level="component">
          <ToggleError />
        </ErrorBoundary>
      )

      // Error should be displayed initially
      expect(screen.getByText('Component Error')).toBeInTheDocument()

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      expect(retryButton).toBeInTheDocument()

      // Simulate fixing the error
      shouldThrow = false

      await user.click(retryButton)

      // Component should render successfully after retry
      await waitFor(() => {
        expect(screen.getByTestId('success-after-retry')).toBeInTheDocument()
      })
    })

    it('limits retry attempts to maximum count', async () => {
      const user = userEvent.setup()

      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      )

      // Should have retry button initially
      expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()

      // Click retry 3 times (max retry count)
      for (let i = 0; i < 3; i++) {
        const retryButton = screen.getByRole('button', { name: 'Retry' })
        await user.click(retryButton)

        // Error should still be displayed since component keeps throwing
        expect(screen.getByText('Component Error')).toBeInTheDocument()
      }

      // After max retries, retry button should not be available
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument()
    })

    it('resets retry count on successful render', async () => {
      const user = userEvent.setup()
      let shouldThrow = true

      const ToggleError: React.FC = () => {
        if (shouldThrow) {
          throw new Error('Intermittent error')
        }
        return <div data-testid="success-component">Working now</div>
      }

      const { rerender } = render(
        <ErrorBoundary level="component">
          <ToggleError />
        </ErrorBoundary>
      )

      // Error initially
      expect(screen.getByText('Component Error')).toBeInTheDocument()

      // Fix the error and retry
      shouldThrow = false
      const retryButton = screen.getByRole('button', { name: 'Retry' })
      await user.click(retryButton)

      // Should render successfully
      await waitFor(() => {
        expect(screen.getByTestId('success-component')).toBeInTheDocument()
      })

      // Break it again by re-rendering with error
      shouldThrow = true
      rerender(
        <ErrorBoundary level="component">
          <ToggleError />
        </ErrorBoundary>
      )

      // Should show error again and retry should be available (retry count reset)
      await waitFor(() => {
        expect(screen.getByText('Component Error')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
      })
    })
  })

  describe('Custom Fallback', () => {
    it('uses custom fallback when provided', () => {
      const customFallback = (error: any, errorId?: string, retry?: () => void) => (
        <div data-testid="custom-fallback">
          <h2>Custom Error UI</h2>
          <p>Error: {error.message}</p>
          {errorId && <span data-testid="error-id">ID: {errorId}</span>}
          {retry && <button onClick={retry}>Custom Retry</button>}
        </div>
      )

      render(
        <ErrorBoundary level="component" fallback={customFallback}>
          <ThrowError errorMessage="Custom error test" />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument()
      expect(screen.getByText('Error: Custom error test')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Custom Retry' })).toBeInTheDocument()
    })

    it('passes error ID to custom fallback', () => {
      const customFallback = (error: any, errorId?: string) => (
        <div data-testid="custom-fallback">
          {errorId && <span data-testid="error-id">Error ID: {errorId}</span>}
        </div>
      )

      render(
        <ErrorBoundary level="component" fallback={customFallback}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-id')).toBeInTheDocument()
      expect(screen.getByText('Error ID: error-id-123')).toBeInTheDocument()
    })
  })

  describe('Error Logging and Callbacks', () => {
    it('logs errors using ErrorLogger', async () => {
      const mockLogError = require('@/lib/error-handling').ErrorLogger.logError

      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(mockLogError).toHaveBeenCalled()
      })
    })

    it('calls onError callback when provided', async () => {
      const onErrorMock = jest.fn()

      render(
        <ErrorBoundary level="component" onError={onErrorMock}>
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(onErrorMock).toHaveBeenCalledWith(
          expect.any(Object), // enhanced error
          'error-id-123' // error ID
        )
      })
    })

    it('tracks performance impact', async () => {
      const mockTrackPerformance = require('@/lib/performance').trackErrorBoundaryPerformance

      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      )

      await waitFor(() => {
        expect(mockTrackPerformance).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({
            componentStack: expect.any(String)
          })
        )
      })
    })
  })

  describe('Context Handling', () => {
    it('includes context in error processing', () => {
      const mockCreateDataProcessingError = require('@/lib/error-handling').ErrorFactory.createDataProcessingError
      const context = {
        userId: 'user-123',
        feature: 'marine-mapping',
        timestamp: new Date().toISOString()
      }

      render(
        <ErrorBoundary level="component" context={context}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockCreateDataProcessingError).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining(context)
      )
    })

    it('includes component stack in context', () => {
      const mockCreateDataProcessingError = require('@/lib/error-handling').ErrorFactory.createDataProcessingError

      render(
        <ErrorBoundary level="component">
          <ThrowError />
        </ErrorBoundary>
      )

      expect(mockCreateDataProcessingError).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          componentStack: expect.any(String),
          errorBoundaryLevel: 'component'
        })
      )
    })
  })
})

describe('Error Fallback Components', () => {
  const mockError = {
    message: 'Test error',
    user_friendly_message: 'Something went wrong with the ocean data',
    recovery_suggestions: ['Refresh the page', 'Check your connection', 'Try again later']
  }

  describe('PageErrorFallback', () => {
    it('renders page error with all elements', () => {
      render(<PageErrorFallback error={mockError} errorId="test-123" />)

      expect(screen.getByText('🌊')).toBeInTheDocument()
      expect(screen.getByText('Rough Waters Ahead')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong with the ocean data')).toBeInTheDocument()
      expect(screen.getByText('What you can try:')).toBeInTheDocument()
      expect(screen.getByText('Error ID: test-123')).toBeInTheDocument()
    })

    it('renders all recovery suggestions', () => {
      render(<PageErrorFallback error={mockError} />)

      expect(screen.getByText('Refresh the page')).toBeInTheDocument()
      expect(screen.getByText('Check your connection')).toBeInTheDocument()
      expect(screen.getByText('Try again later')).toBeInTheDocument()
    })

    it('shows retry button when onRetry is provided', () => {
      const onRetry = jest.fn()
      render(<PageErrorFallback error={mockError} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: 'Try Again' })
      expect(retryButton).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = jest.fn()
      render(<PageErrorFallback error={mockError} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: 'Try Again' })
      await user.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('shows return home button', () => {
      render(<PageErrorFallback error={mockError} />)

      const homeButton = screen.getByRole('button', { name: 'Return Home' })
      expect(homeButton).toBeInTheDocument()
    })

    it('navigates home when return home button is clicked', async () => {
      const user = userEvent.setup()
      const originalLocation = window.location

      // Mock window.location
      delete (window as any).location
      window.location = { ...originalLocation, href: '' }

      render(<PageErrorFallback error={mockError} />)

      const homeButton = screen.getByRole('button', { name: 'Return Home' })
      await user.click(homeButton)

      expect(window.location.href).toBe('/')

      // Restore original location
      window.location = originalLocation
    })
  })

  describe('ComponentErrorFallback', () => {
    it('renders component error with warning icon', () => {
      render(<ComponentErrorFallback error={mockError} />)

      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('Component Error')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong with the ocean data')).toBeInTheDocument()
    })

    it('shows retry button when onRetry is provided', () => {
      const onRetry = jest.fn()
      render(<ComponentErrorFallback error={mockError} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      expect(retryButton).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = jest.fn()
      render(<ComponentErrorFallback error={mockError} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      await user.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('displays error ID when provided', () => {
      render(<ComponentErrorFallback error={mockError} errorId="comp-error-456" />)

      expect(screen.getByText('Error ID: comp-error-456')).toBeInTheDocument()
    })
  })

  describe('WidgetErrorFallback', () => {
    it('renders minimal widget error UI', () => {
      render(<WidgetErrorFallback error={mockError} />)

      expect(screen.getByText('⚠️')).toBeInTheDocument()
      expect(screen.getByText('Unable to load')).toBeInTheDocument()
    })

    it('shows retry button when onRetry is provided', () => {
      const onRetry = jest.fn()
      render(<WidgetErrorFallback error={mockError} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      expect(retryButton).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = jest.fn()
      render(<WidgetErrorFallback error={mockError} onRetry={onRetry} />)

      const retryButton = screen.getByRole('button', { name: 'Retry' })
      await user.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('does not show error ID (minimal design)', () => {
      render(<WidgetErrorFallback error={mockError} errorId="widget-error-789" />)

      expect(screen.queryByText('Error ID: widget-error-789')).not.toBeInTheDocument()
    })
  })
})

describe('withErrorBoundary HOC', () => {
  const TestComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
    if (shouldThrow) {
      throw new Error('HOC test error')
    }
    return <div data-testid="hoc-test-component">HOC Test Component</div>
  }

  it('wraps component with error boundary', () => {
    const WrappedComponent = withErrorBoundary(TestComponent)

    render(<WrappedComponent />)

    expect(screen.getByTestId('hoc-test-component')).toBeInTheDocument()
  })

  it('catches errors in wrapped component', () => {
    const WrappedComponent = withErrorBoundary(TestComponent)

    render(<WrappedComponent shouldThrow={true} />)

    expect(screen.queryByTestId('hoc-test-component')).not.toBeInTheDocument()
    expect(screen.getByText('Component Error')).toBeInTheDocument()
  })

  it('uses specified error boundary level', () => {
    const WrappedComponent = withErrorBoundary(TestComponent, 'page')

    render(<WrappedComponent shouldThrow={true} />)

    expect(screen.getByText('Rough Waters Ahead')).toBeInTheDocument()
  })

  it('includes context in error boundary', () => {
    const mockCreateDataProcessingError = require('@/lib/error-handling').ErrorFactory.createDataProcessingError
    const context = { feature: 'hoc-test' }
    const WrappedComponent = withErrorBoundary(TestComponent, 'component', context)

    render(<WrappedComponent shouldThrow={true} />)

    expect(mockCreateDataProcessingError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining(context)
    )
  })

  it('sets correct display name', () => {
    TestComponent.displayName = 'TestComponent'
    const WrappedComponent = withErrorBoundary(TestComponent)

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)')
  })

  it('falls back to component name when displayName is not set', () => {
    const UnnamedComponent: React.FC = () => <div>Unnamed</div>
    const WrappedComponent = withErrorBoundary(UnnamedComponent)

    expect(WrappedComponent.displayName).toBe('withErrorBoundary(UnnamedComponent)')
  })

  it('defaults to component level when no level specified', () => {
    const WrappedComponent = withErrorBoundary(TestComponent)

    render(<WrappedComponent shouldThrow={true} />)

    // Should use component-level fallback (default)
    expect(screen.getByText('Component Error')).toBeInTheDocument()
  })
})

describe('Error Boundary Edge Cases', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('handles errors during componentDidMount', () => {
    const ComponentWithMountError: React.FC = () => {
      React.useEffect(() => {
        throw new Error('Mount error')
      }, [])
      return <div>Should not render</div>
    }

    render(
      <ErrorBoundary level="component">
        <ComponentWithMountError />
      </ErrorBoundary>
    )

    // Note: useEffect errors are not caught by error boundaries
    // This test documents the limitation
    expect(screen.getByText('Should not render')).toBeInTheDocument()
  })

  it('handles null/undefined errors gracefully', () => {
    const ComponentThrowingNull: React.FC = () => {
      throw null
    }

    render(
      <ErrorBoundary level="component">
        <ComponentThrowingNull />
      </ErrorBoundary>
    )

    expect(screen.getByText('Component Error')).toBeInTheDocument()
  })

  it('handles errors without recovery suggestions', () => {
    const errorWithoutSuggestions = {
      message: 'Error without suggestions',
      user_friendly_message: 'Something went wrong',
      recovery_suggestions: []
    }

    render(<PageErrorFallback error={errorWithoutSuggestions} />)

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.queryByText('What you can try:')).not.toBeInTheDocument()
  })

  it('handles very long error messages', () => {
    const longError = {
      message: 'A'.repeat(1000),
      user_friendly_message: 'B'.repeat(500),
      recovery_suggestions: ['C'.repeat(100)]
    }

    render(<ComponentErrorFallback error={longError} />)

    expect(screen.getByText('B'.repeat(500))).toBeInTheDocument()
  })

  it('maintains state consistency across multiple errors', () => {
    let errorCount = 0

    const MultiErrorComponent: React.FC = () => {
      errorCount++
      throw new Error(`Error number ${errorCount}`)
    }

    const { rerender } = render(
      <ErrorBoundary level="component">
        <MultiErrorComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Component Error')).toBeInTheDocument()

    rerender(
      <ErrorBoundary level="component">
        <div>Fixed component</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Fixed component')).toBeInTheDocument()
  })
})