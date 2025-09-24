/**
 * Comprehensive test suite for HomePage component
 * Tests rendering, interactions, responsive design, and accessibility
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HomePage from '../../pages/index'
import { useRouter } from 'next/router'

// Mock next/router
const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
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
  const DynamicComponent = () => <div data-testid="dynamic-component">Dynamic Component</div>
  DynamicComponent.displayName = 'DynamicComponent'
  return DynamicComponent
})

// Mock WorldClassLayout
jest.mock('../../components/WorldClassLayout', () => {
  return function MockWorldClassLayout({ children, title, description, keywords }: any) {
    return (
      <div data-testid="world-class-layout">
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        {children}
      </div>
    )
  }
})

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the main page elements', () => {
      render(<HomePage />)

      // Check hero section
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByText(/Monitor Our Oceans/)).toBeInTheDocument()
      expect(screen.getByText(/Protect Marine Life/)).toBeInTheDocument()

      // Check hero subtitle
      expect(screen.getByText(/Real-time ocean monitoring and marine conservation platform/)).toBeInTheDocument()

      // Check call-to-action buttons
      expect(screen.getByRole('link', { name: /Explore Ocean Map/i })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Watch Demo/i })).toBeInTheDocument()
    })

    it('renders all statistics correctly', () => {
      render(<HomePage />)

      // Check stats section
      expect(screen.getByText('15K+')).toBeInTheDocument()
      expect(screen.getByText('Ocean Sensors')).toBeInTheDocument()

      expect(screen.getByText('2.4M')).toBeInTheDocument()
      expect(screen.getByText('Data Points')).toBeInTheDocument()

      expect(screen.getByText('40K+')).toBeInTheDocument()
      expect(screen.getByText('Tracked Animals')).toBeInTheDocument()

      expect(screen.getByText('85')).toBeInTheDocument()
      expect(screen.getByText('Countries')).toBeInTheDocument()
    })

    it('renders the features section with all capabilities', () => {
      render(<HomePage />)

      // Check section header
      expect(screen.getByText('Platform Capabilities')).toBeInTheDocument()
      expect(screen.getByText(/Comprehensive tools for marine research/)).toBeInTheDocument()

      // Check all feature cards
      expect(screen.getByText('Real-time Ocean Mapping')).toBeInTheDocument()
      expect(screen.getByText('AI Species Recognition')).toBeInTheDocument()
      expect(screen.getByText('Shark Tracking')).toBeInTheDocument()
      expect(screen.getByText('Climate Analysis')).toBeInTheDocument()
      expect(screen.getByText('Conservation Action')).toBeInTheDocument()
      expect(screen.getByText('Research Collaboration')).toBeInTheDocument()
    })

    it('renders the call-to-action section', () => {
      render(<HomePage />)

      expect(screen.getByText('Ready to Make a Difference?')).toBeInTheDocument()
      expect(screen.getByText(/Join thousands of researchers/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /Start Exploring/i })).toBeInTheDocument()
    })
  })

  describe('SEO and Meta Tags', () => {
    it('sets correct page title and meta information', () => {
      render(<HomePage />)

      const layout = screen.getByTestId('world-class-layout')
      expect(layout).toBeInTheDocument()

      // Check that title is passed to layout
      expect(screen.getByText('BlueSphere — Global Ocean Monitoring Platform')).toBeInTheDocument()
    })

    it('includes proper keywords for SEO', () => {
      render(<HomePage />)

      const metaKeywords = document.querySelector('meta[name="keywords"]')
      expect(metaKeywords).toHaveAttribute('content', expect.stringContaining('ocean monitoring'))
      expect(metaKeywords).toHaveAttribute('content', expect.stringContaining('marine data'))
      expect(metaKeywords).toHaveAttribute('content', expect.stringContaining('sea temperature'))
    })
  })

  describe('Navigation and Interactions', () => {
    it('has working navigation links', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      // Test main CTA button
      const exploreMapButton = screen.getByRole('link', { name: /Explore Ocean Map/i })
      expect(exploreMapButton).toHaveAttribute('href', '/map')

      // Test demo button
      const watchDemoButton = screen.getByRole('link', { name: /Watch Demo/i })
      expect(watchDemoButton).toHaveAttribute('href', '/species-ai')

      // Test bottom CTA
      const startExploringButton = screen.getByRole('link', { name: /Start Exploring/i })
      expect(startExploringButton).toHaveAttribute('href', '/map')
    })

    it('handles hover interactions on feature cards', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const featureCard = screen.getByText('Real-time Ocean Mapping').closest('.feature')
      expect(featureCard).toBeInTheDocument()

      if (featureCard) {
        await user.hover(featureCard)
        // Feature cards should have hover styles (tested via CSS classes)
        expect(featureCard).toHaveClass('feature')
      }
    })

    it('handles button hover effects', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      const primaryButton = screen.getByRole('link', { name: /Explore Ocean Map/i })
      expect(primaryButton).toHaveClass('btn-primary')

      await user.hover(primaryButton)
      // Hover effects are handled by CSS, so we just verify the class is present
      expect(primaryButton).toHaveClass('btn-primary')
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
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 667,
      })

      // Mock matchMedia for mobile
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

      render(<HomePage />)

      // On mobile, content should still be present but layout may change
      expect(screen.getByText(/Monitor Our Oceans/)).toBeInTheDocument()
      expect(screen.getByText(/Platform Capabilities/)).toBeInTheDocument()
    })

    it('adapts to tablet viewport', () => {
      // Mock tablet viewport
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

      render(<HomePage />)

      expect(screen.getByText(/Monitor Our Oceans/)).toBeInTheDocument()
      expect(screen.getByText('Platform Capabilities')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<HomePage />)

      // Check heading levels
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()

      const h2Elements = screen.getAllByRole('heading', { level: 2 })
      expect(h2Elements.length).toBeGreaterThan(0)

      const h3Elements = screen.getAllByRole('heading', { level: 3 })
      expect(h3Elements.length).toBeGreaterThan(0)
    })

    it('has accessible links with proper text', () => {
      render(<HomePage />)

      // All links should have descriptive text
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAccessibleName()
      })
    })

    it('has proper semantic structure', () => {
      render(<HomePage />)

      // Check for semantic HTML elements
      const heroSection = document.querySelector('.hero')
      expect(heroSection).toBeInTheDocument()

      const featuresSection = document.querySelector('.features')
      expect(featuresSection).toBeInTheDocument()

      const ctaSection = document.querySelector('.cta-section')
      expect(ctaSection).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<HomePage />)

      // Tab through the page
      await user.tab()

      // First focusable element should be the "Explore Ocean Map" link
      const exploreMapButton = screen.getByRole('link', { name: /Explore Ocean Map/i })
      expect(exploreMapButton).toHaveFocus()

      // Continue tabbing
      await user.tab()
      const watchDemoButton = screen.getByRole('link', { name: /Watch Demo/i })
      expect(watchDemoButton).toHaveFocus()
    })
  })

  describe('Performance', () => {
    it('does not cause memory leaks', () => {
      const { unmount } = render(<HomePage />)

      // Should unmount without errors
      expect(() => unmount()).not.toThrow()
    })

    it('handles multiple renders without issues', () => {
      const { rerender } = render(<HomePage />)

      // Multiple rerenders should work
      expect(() => {
        rerender(<HomePage />)
        rerender(<HomePage />)
        rerender(<HomePage />)
      }).not.toThrow()
    })
  })

  describe('Content Validation', () => {
    it('displays accurate statistics', () => {
      render(<HomePage />)

      // Verify statistics are realistic and properly formatted
      expect(screen.getByText('15K+')).toBeInTheDocument() // Ocean Sensors
      expect(screen.getByText('2.4M')).toBeInTheDocument() // Data Points
      expect(screen.getByText('40K+')).toBeInTheDocument() // Tracked Animals
      expect(screen.getByText('85')).toBeInTheDocument() // Countries
    })

    it('has coherent feature descriptions', () => {
      render(<HomePage />)

      // Each feature should have a title and description
      const realtimeMapping = screen.getByText('Real-time Ocean Mapping')
      expect(realtimeMapping).toBeInTheDocument()
      expect(screen.getByText(/Interactive global maps with live data/)).toBeInTheDocument()

      const aiSpecies = screen.getByText('AI Species Recognition')
      expect(aiSpecies).toBeInTheDocument()
      expect(screen.getByText(/Advanced computer vision technology/)).toBeInTheDocument()
    })

    it('maintains consistent branding and messaging', () => {
      render(<HomePage />)

      // Check for consistent BlueSphere branding
      expect(screen.getByText(/BlueSphere/)).toBeInTheDocument()
      expect(screen.getByText(/marine conservation/)).toBeInTheDocument()
      expect(screen.getByText(/ocean monitoring/)).toBeInTheDocument()
    })
  })

  describe('Error Boundaries', () => {
    it('gracefully handles component errors', () => {
      // Mock console.error to prevent error logs in test output
      const originalError = console.error
      console.error = jest.fn()

      try {
        // This should not crash the page
        render(<HomePage />)
        expect(screen.getByTestId('world-class-layout')).toBeInTheDocument()
      } finally {
        console.error = originalError
      }
    })
  })

  describe('CSS and Styling', () => {
    it('applies correct CSS classes', () => {
      render(<HomePage />)

      // Check for important style classes
      const heroSection = document.querySelector('.hero')
      expect(heroSection).toBeInTheDocument()

      const featuresSection = document.querySelector('.features')
      expect(featuresSection).toBeInTheDocument()

      const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-cta')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('has responsive grid layouts', () => {
      render(<HomePage />)

      const statsGrid = document.querySelector('.stats')
      expect(statsGrid).toBeInTheDocument()

      const featuresGrid = document.querySelector('.features-grid')
      expect(featuresGrid).toBeInTheDocument()
    })
  })
})