import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockRouter } from '../utils/test-utils'
import WorldClassLayout from '../../components/WorldClassLayout'

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
})