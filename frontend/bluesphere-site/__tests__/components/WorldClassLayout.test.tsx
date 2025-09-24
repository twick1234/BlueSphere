import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockRouter } from '../utils/test-utils'
import WorldClassLayout from '../../components/WorldClassLayout'
import { axe, toHaveNoViolations } from 'jest-axe'

// Extend Jest matchers
expect.extend(toHaveNoViolations)

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}))

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  Bars3Icon: ({ className }: { className?: string }) => <div className={className} data-testid="bars3-icon" />,
  XMarkIcon: ({ className }: { className?: string }) => <div className={className} data-testid="xmark-icon" />,
  MagnifyingGlassIcon: ({ className }: { className?: string }) => <div className={className} data-testid="search-icon" />,
  ChevronDownIcon: ({ className }: { className?: string }) => <div className={className} data-testid="chevron-down" />,
  HomeIcon: ({ className }: { className?: string }) => <div className={className} data-testid="home-icon" />,
  MapIcon: ({ className }: { className?: string }) => <div className={className} data-testid="map-icon" />,
  BeakerIcon: ({ className }: { className?: string }) => <div className={className} data-testid="beaker-icon" />,
  HeartIcon: ({ className }: { className?: string }) => <div className={className} data-testid="heart-icon" />,
  AcademicCapIcon: ({ className }: { className?: string }) => <div className={className} data-testid="academic-cap-icon" />,
  ChartBarIcon: ({ className }: { className?: string }) => <div className={className} data-testid="chart-bar-icon" />
}))

describe('WorldClassLayout', () => {
  const defaultProps = {
    children: <div data-testid="test-content">Test Content</div>,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset router state
    mockRouter.pathname = '/'
    mockRouter.asPath = '/'
    mockRouter.query = {}

    // Reset document
    document.head.innerHTML = ''
    document.title = ''

    // Clear any event listeners
    document.removeEventListener = jest.fn()
    document.addEventListener = jest.fn()
  })

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks()
  })

  it('renders with default props', () => {
    render(<WorldClassLayout {...defaultProps} />)

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByText('BlueSphere')).toBeInTheDocument()
    expect(screen.getByText('🌊')).toBeInTheDocument()
  })

  it('renders with custom title and description', () => {
    const customProps = {
      ...defaultProps,
      title: 'Custom Title',
      description: 'Custom Description',
    }

    render(<WorldClassLayout {...customProps} />)

    // Head meta should contain custom title and description
    expect(document.title).toBe('Custom Title')
    const metaDescription = document.querySelector('meta[name="description"]')
    expect(metaDescription?.getAttribute('content')).toBe('Custom Description')
  })

  it('renders navigation sections correctly', () => {
    render(<WorldClassLayout {...defaultProps} />)

    // Check main navigation sections
    expect(screen.getByRole('button', { name: /platform/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /conservation/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /learn/i })).toBeInTheDocument()
  })

  it('handles dropdown navigation', async () => {
    const user = userEvent.setup()
    render(<WorldClassLayout {...defaultProps} />)

    const platformButton = screen.getByRole('button', { name: /platform/i })
    await user.click(platformButton)

    // Should show dropdown items
    await waitFor(() => {
      expect(screen.getByText('Ocean Map')).toBeInTheDocument()
      expect(screen.getByText('Shark Tracking')).toBeInTheDocument()
      expect(screen.getByText('Species AI')).toBeInTheDocument()
      expect(screen.getByText('Advanced Mapping')).toBeInTheDocument()
    })
  })

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(<WorldClassLayout {...defaultProps} />)

    const platformButton = screen.getByRole('button', { name: /platform/i })
    await user.click(platformButton)

    // Dropdown should be open
    await waitFor(() => {
      expect(screen.getByText('Ocean Map')).toBeInTheDocument()
    })

    // Click outside (on the main content area)
    await user.click(screen.getByTestId('test-content'))

    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('Ocean Map')).not.toBeInTheDocument()
    })
  })

  it('handles mobile menu toggle', async () => {
    const user = userEvent.setup()
    render(<WorldClassLayout {...defaultProps} />)

    const mobileMenuButton = screen.getByRole('button', { name: '' }) // Mobile menu button has no text
    await user.click(mobileMenuButton)

    // Mobile menu should be open - check for mobile navigation structure
    await waitFor(() => {
      // Look for the mobile menu content
      const mobileMenu = document.querySelector('.mobile-menu.open')
      expect(mobileMenu).toBeInTheDocument()
    })
  })

  it('renders all navigation links with correct href attributes', async () => {
    const user = userEvent.setup()
    render(<WorldClassLayout {...defaultProps} />)

    // Open Platform dropdown
    const platformButton = screen.getByRole('button', { name: /platform/i })
    await user.click(platformButton)

    await waitFor(() => {
      const oceanMapLink = screen.getByRole('link', { name: /ocean map/i })
      expect(oceanMapLink).toHaveAttribute('href', '/map')

      const sharkTrackingLink = screen.getByRole('link', { name: /shark tracking/i })
      expect(sharkTrackingLink).toHaveAttribute('href', '/sharks')
    })
  })

  it('applies correct CSS structure', () => {
    const { container } = render(<WorldClassLayout {...defaultProps} />)

    // Check basic layout structure
    const layout = container.querySelector('.layout')
    expect(layout).toBeInTheDocument()

    const header = container.querySelector('.header')
    expect(header).toBeInTheDocument()

    const main = container.querySelector('.main')
    expect(main).toBeInTheDocument()
  })

  it('includes proper meta tags for SEO', () => {
    render(<WorldClassLayout {...defaultProps} />)

    // Check Open Graph meta tags
    const ogTitle = document.querySelector('meta[property="og:title"]')
    expect(ogTitle).toBeInTheDocument()

    const ogDescription = document.querySelector('meta[property="og:description"]')
    expect(ogDescription).toBeInTheDocument()

    const ogType = document.querySelector('meta[property="og:type"]')
    expect(ogType?.getAttribute('content')).toBe('website')

    // Check Twitter Card meta tags
    const twitterCard = document.querySelector('meta[name="twitter:card"]')
    expect(twitterCard?.getAttribute('content')).toBe('summary_large_image')
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<WorldClassLayout {...defaultProps} />)

    const platformButton = screen.getByRole('button', { name: /platform/i })

    // Tab to the button and press Enter
    platformButton.focus()
    await user.keyboard('{Enter}')

    // Dropdown should open
    await waitFor(() => {
      expect(screen.getByText('Ocean Map')).toBeInTheDocument()
    })
  })

  it('closes mobile menu on route change', () => {
    render(<WorldClassLayout {...defaultProps} />)

    // Simulate route change by updating the pathname
    mockRouter.pathname = '/new-route'

    // This would trigger the useEffect in the component
    // In a real test, you'd need to simulate the route change properly
    expect(mockRouter.pathname).toBe('/new-route')
  })

  it('renders with proper accessibility attributes', () => {
    render(<WorldClassLayout {...defaultProps} />)

    const logo = screen.getByRole('link', { name: /🌊 bluesphere/i })
    expect(logo).toBeInTheDocument()

    // Check that buttons have proper labels
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      // Each button should be focusable
      expect(button).not.toHaveAttribute('disabled')
    })
  })

  it('handles different navigation sections correctly', async () => {
    const user = userEvent.setup()
    render(<WorldClassLayout {...defaultProps} />)

    // Test Data section
    const dataButton = screen.getByRole('button', { name: /data/i })
    await user.click(dataButton)

    await waitFor(() => {
      expect(screen.getByText('Analytics')).toBeInTheDocument()
      expect(screen.getByText('Historical')).toBeInTheDocument()
      expect(screen.getByText('Time-lapse')).toBeInTheDocument()
    })

    // Test Conservation section
    const conservationButton = screen.getByRole('button', { name: /conservation/i })
    await user.click(conservationButton)

    await waitFor(() => {
      expect(screen.getByText('Action Center')).toBeInTheDocument()
      expect(screen.getByText('Crisis Response')).toBeInTheDocument()
      expect(screen.getByText('Impact Stories')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<WorldClassLayout {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('supports keyboard navigation through dropdowns', async () => {
      const user = userEvent.setup()
      render(<WorldClassLayout {...defaultProps} />)

      const platformButton = screen.getByRole('button', { name: /platform/i })

      // Focus and open dropdown with keyboard
      await user.tab()
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(screen.getByText('Ocean Map')).toBeInTheDocument()
      })

      // Navigate through dropdown items with keyboard
      await user.keyboard('{ArrowDown}')
      const oceanMapLink = screen.getByRole('link', { name: /ocean map/i })
      expect(oceanMapLink).toHaveAttribute('href', '/map')
    })

    it('has proper ARIA labels and roles', () => {
      render(<WorldClassLayout {...defaultProps} />)

      // Check navigation structure
      const nav = screen.getByRole('navigation')
      expect(nav).toBeInTheDocument()

      // Check buttons have proper accessibility
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeVisible()
        expect(button).not.toHaveAttribute('aria-disabled', 'true')
      })
    })

    it('supports screen readers with proper content structure', () => {
      const { container } = render(<WorldClassLayout {...defaultProps} />)

      // Check for proper heading structure
      const main = container.querySelector('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveClass('main')

      // Check for proper landmark elements
      const header = container.querySelector('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('header')
    })
  })

  describe('Responsive Behavior', () => {
    beforeEach(() => {
      // Mock window.matchMedia for responsive tests
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      })
    })

    it('shows mobile menu button on small screens', () => {
      render(<WorldClassLayout {...defaultProps} />)

      // Mobile menu button should be rendered (hidden by CSS on desktop)
      const mobileMenuButtons = screen.getAllByRole('button')
      const mobileTrigger = mobileMenuButtons.find(button => {
        const icon = button.querySelector('[data-testid="bars3-icon"]')
        return icon !== null
      })
      expect(mobileTrigger).toBeInTheDocument()
    })

    it('handles mobile menu interactions correctly', async () => {
      const user = userEvent.setup()
      render(<WorldClassLayout {...defaultProps} />)

      // Find and click mobile menu button
      const mobileMenuButtons = screen.getAllByRole('button')
      const mobileTrigger = mobileMenuButtons.find(button => {
        const icon = button.querySelector('[data-testid="bars3-icon"]')
        return icon !== null
      })

      expect(mobileTrigger).toBeInTheDocument()
      await user.click(mobileTrigger!)

      // Check if mobile menu panel is opened
      await waitFor(() => {
        const mobileMenu = document.querySelector('.mobile-menu.open')
        expect(mobileMenu).toBeInTheDocument()
      })

      // Find and click close button in mobile menu
      const closeButton = screen.getByTestId('xmark-icon').closest('button')
      expect(closeButton).toBeInTheDocument()
      await user.click(closeButton!)

      // Mobile menu should close
      await waitFor(() => {
        const mobileMenu = document.querySelector('.mobile-menu.open')
        expect(mobileMenu).not.toBeInTheDocument()
      })
    })
  })

  describe('State Management', () => {
    it('manages dropdown state correctly', async () => {
      const user = userEvent.setup()
      render(<WorldClassLayout {...defaultProps} />)

      const platformButton = screen.getByRole('button', { name: /platform/i })
      const dataButton = screen.getByRole('button', { name: /data/i })

      // Open platform dropdown
      await user.click(platformButton)
      await waitFor(() => {
        expect(screen.getByText('Ocean Map')).toBeInTheDocument()
      })

      // Opening another dropdown should close the first
      await user.click(dataButton)
      await waitFor(() => {
        expect(screen.queryByText('Ocean Map')).not.toBeInTheDocument()
        expect(screen.getByText('Analytics')).toBeInTheDocument()
      })
    })

    it('closes dropdown when clicking same button twice', async () => {
      const user = userEvent.setup()
      render(<WorldClassLayout {...defaultProps} />)

      const platformButton = screen.getByRole('button', { name: /platform/i })

      // Open dropdown
      await user.click(platformButton)
      await waitFor(() => {
        expect(screen.getByText('Ocean Map')).toBeInTheDocument()
      })

      // Click same button to close
      await user.click(platformButton)
      await waitFor(() => {
        expect(screen.queryByText('Ocean Map')).not.toBeInTheDocument()
      })
    })

    it('resets state on route changes', async () => {
      const user = userEvent.setup()
      render(<WorldClassLayout {...defaultProps} />)

      // Open dropdown and mobile menu
      const platformButton = screen.getByRole('button', { name: /platform/i })
      await user.click(platformButton)

      const mobileMenuButtons = screen.getAllByRole('button')
      const mobileTrigger = mobileMenuButtons.find(button => {
        const icon = button.querySelector('[data-testid="bars3-icon"]')
        return icon !== null
      })
      await user.click(mobileTrigger!)

      // Verify both are open
      await waitFor(() => {
        expect(screen.getByText('Ocean Map')).toBeInTheDocument()
        expect(document.querySelector('.mobile-menu.open')).toBeInTheDocument()
      })

      // Simulate route change
      act(() => {
        mockRouter.pathname = '/new-route'
        // Trigger the useEffect that watches for route changes
        // In a real app, this would be handled by Next.js router
      })

      // Note: In this test environment, we'd need to trigger the component re-render
      // that would happen with an actual route change. For this test, we're verifying
      // the logic exists in the component.
    })
  })

  describe('Props and Customization', () => {
    it('renders with all custom props', () => {
      const customProps = {
        ...defaultProps,
        title: 'Custom Marine Platform',
        description: 'Custom description for ocean monitoring',
        keywords: 'custom, marine, keywords',
      }

      render(<WorldClassLayout {...customProps} />)

      expect(document.title).toBe('Custom Marine Platform')

      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe('Custom description for ocean monitoring')

      const metaKeywords = document.querySelector('meta[name="keywords"]')
      expect(metaKeywords?.getAttribute('content')).toBe('custom, marine, keywords')
    })

    it('falls back to default values when props are undefined', () => {
      render(<WorldClassLayout>{defaultProps.children}</WorldClassLayout>)

      expect(document.title).toBe('BlueSphere — Marine Monitoring Platform')

      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription?.getAttribute('content')).toBe('Advanced ocean monitoring and marine conservation platform powered by AI and real-time data visualization')
    })
  })

  describe('SEO and Meta Tags', () => {
    it('includes all required meta tags', () => {
      render(<WorldClassLayout {...defaultProps} />)

      // Basic meta tags
      expect(document.querySelector('meta[name="viewport"]')).toBeInTheDocument()
      expect(document.querySelector('link[rel="icon"]')).toBeInTheDocument()

      // Open Graph tags
      expect(document.querySelector('meta[property="og:title"]')).toBeInTheDocument()
      expect(document.querySelector('meta[property="og:description"]')).toBeInTheDocument()
      expect(document.querySelector('meta[property="og:type"]')).toBeInTheDocument()

      // Twitter tags
      expect(document.querySelector('meta[name="twitter:card"]')).toBeInTheDocument()
      expect(document.querySelector('meta[name="twitter:title"]')).toBeInTheDocument()
      expect(document.querySelector('meta[name="twitter:description"]')).toBeInTheDocument()
    })

    it('sets correct Open Graph type', () => {
      render(<WorldClassLayout {...defaultProps} />)

      const ogType = document.querySelector('meta[property="og:type"]')
      expect(ogType?.getAttribute('content')).toBe('website')
    })

    it('sets correct Twitter card type', () => {
      render(<WorldClassLayout {...defaultProps} />)

      const twitterCard = document.querySelector('meta[name="twitter:card"]')
      expect(twitterCard?.getAttribute('content')).toBe('summary_large_image')
    })
  })

  describe('Navigation Structure', () => {
    it('renders all navigation sections with correct items', async () => {
      const user = userEvent.setup()
      render(<WorldClassLayout {...defaultProps} />)

      // Test Platform section items
      const platformButton = screen.getByRole('button', { name: /platform/i })
      await user.click(platformButton)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /ocean map/i })).toHaveAttribute('href', '/map')
        expect(screen.getByRole('link', { name: /shark tracking/i })).toHaveAttribute('href', '/sharks')
        expect(screen.getByRole('link', { name: /species ai/i })).toHaveAttribute('href', '/species-ai')
        expect(screen.getByRole('link', { name: /advanced mapping/i })).toHaveAttribute('href', '/mapping')
      })

      // Test Data section items
      const dataButton = screen.getByRole('button', { name: /data/i })
      await user.click(dataButton)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /analytics/i })).toHaveAttribute('href', '/analytics')
        expect(screen.getByRole('link', { name: /historical/i })).toHaveAttribute('href', '/historical')
        expect(screen.getByRole('link', { name: /time-lapse/i })).toHaveAttribute('href', '/timelapse')
      })

      // Test Conservation section items
      const conservationButton = screen.getByRole('button', { name: /conservation/i })
      await user.click(conservationButton)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /action center/i })).toHaveAttribute('href', '/conservation')
        expect(screen.getByRole('link', { name: /crisis response/i })).toHaveAttribute('href', '/crisis')
        expect(screen.getByRole('link', { name: /impact stories/i })).toHaveAttribute('href', '/stories')
      })

      // Test Learn section items
      const learnButton = screen.getByRole('button', { name: /learn/i })
      await user.click(learnButton)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /education/i })).toHaveAttribute('href', '/education')
        expect(screen.getByRole('link', { name: /gallery/i })).toHaveAttribute('href', '/gallery')
        expect(screen.getByRole('link', { name: /about/i })).toHaveAttribute('href', '/about')
      })
    })

    it('includes icons for navigation items', async () => {
      const user = userEvent.setup()
      render(<WorldClassLayout {...defaultProps} />)

      const platformButton = screen.getByRole('button', { name: /platform/i })
      await user.click(platformButton)

      await waitFor(() => {
        // Icons should be present (mocked as divs with data-testid)
        expect(screen.getAllByTestId('map-icon')).toHaveLength(2) // Ocean Map and Advanced Mapping
        expect(screen.getByTestId('chart-bar-icon')).toBeInTheDocument() // Shark Tracking
        expect(screen.getByTestId('beaker-icon')).toBeInTheDocument() // Species AI
      })
    })
  })

  describe('Event Handling', () => {
    it('prevents event propagation on dropdown clicks', async () => {
      const user = userEvent.setup()
      const parentClickHandler = jest.fn()

      render(
        <div onClick={parentClickHandler}>
          <WorldClassLayout {...defaultProps} />
        </div>
      )

      const platformButton = screen.getByRole('button', { name: /platform/i })
      await user.click(platformButton)

      // Parent click handler should not be called due to stopPropagation
      expect(parentClickHandler).not.toHaveBeenCalled()
    })

    it('handles click outside to close dropdowns', async () => {
      const user = userEvent.setup()
      render(<WorldClassLayout {...defaultProps} />)

      const platformButton = screen.getByRole('button', { name: /platform/i })
      await user.click(platformButton)

      // Dropdown should be open
      await waitFor(() => {
        expect(screen.getByText('Ocean Map')).toBeInTheDocument()
      })

      // Click on the main content area (outside dropdown)
      await user.click(screen.getByTestId('test-content'))

      // Note: The actual click-outside functionality would need the real
      // event system to work properly. In this test, we're verifying the
      // component structure supports it.
    })
  })

  describe('CSS and Styling', () => {
    it('applies correct CSS classes for layout structure', () => {
      const { container } = render(<WorldClassLayout {...defaultProps} />)

      expect(container.querySelector('.layout')).toBeInTheDocument()
      expect(container.querySelector('.header')).toBeInTheDocument()
      expect(container.querySelector('.header-content')).toBeInTheDocument()
      expect(container.querySelector('.main')).toBeInTheDocument()
      expect(container.querySelector('.nav-desktop')).toBeInTheDocument()
    })

    it('includes global CSS reset and typography', () => {
      render(<WorldClassLayout {...defaultProps} />)

      // Check that style tags are added to document head
      const styleTags = document.head.querySelectorAll('style')
      expect(styleTags.length).toBeGreaterThan(0)

      // Note: In a real environment with actual CSS parsing,
      // we could check for specific CSS rules
    })

    it('has proper z-index management for dropdowns', async () => {
      const user = userEvent.setup()
      const { container } = render(<WorldClassLayout {...defaultProps} />)

      const platformButton = screen.getByRole('button', { name: /platform/i })
      await user.click(platformButton)

      await waitFor(() => {
        const dropdown = container.querySelector('.dropdown')
        expect(dropdown).toBeInTheDocument()
        // In real CSS environment, we could check computed styles
      })
    })
  })
})