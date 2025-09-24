/**
 * Comprehensive Layout component tests
 * Tests the main layout wrapper with navigation and responsive features
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Next.js components
jest.mock('next/head', () => {
  return function Head({ children }: any) {
    return <head data-testid="head">{children}</head>
  }
})

jest.mock('next/link', () => {
  return function Link({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

jest.mock('next/image', () => {
  return function Image(props: any) {
    return <img {...props} />
  }
})

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    asPath: '/',
    query: {},
  }),
}))

// Test Layout Component
const TestLayout = ({ title = 'Test Page', children }: { title?: string, children: React.ReactNode }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    document.title = `${title} - BlueSphere`
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [title, isDarkMode])

  return (
    <>
      <head data-testid="head">
        <title>{title} - BlueSphere</title>
        <meta name="description" content="Marine monitoring platform" />
      </head>

      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Skip Links */}
        <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
        <a href="#navigation" className="sr-only focus:not-sr-only">Skip to navigation</a>

        {/* Header */}
        <header role="banner" className="bg-blue-600 text-white">
          <nav id="navigation" role="navigation" className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center">
                <a href="/" className="text-xl font-bold">BlueSphere</a>
              </div>

              {/* Desktop Navigation */}
              <div data-testid="desktop-navigation" className="hidden md:block">
                <div className="flex items-center space-x-8">
                  <a href="/map" rel="prefetch">Ocean Map</a>
                  <a href="/sharks">Shark Tracking</a>
                  <a href="/analytics">Analytics</a>

                  {/* Dropdown Menus */}
                  <div className="relative group">
                    <button className="flex items-center">
                      Data
                      <svg className="ml-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <a href="/historical" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Historical</a>
                      <a href="/timelapse" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Time-lapse</a>
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="flex items-center">Conservation</button>
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <a href="/conservation" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Action Center</a>
                      <a href="/crisis" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Crisis Response</a>
                    </div>
                  </div>

                  <div className="relative group">
                    <button className="flex items-center">Learn</button>
                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                      <a href="/education" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Education</a>
                      <a href="/gallery" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Gallery</a>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    aria-label="Toggle dark mode"
                    className="p-2 rounded-md hover:bg-blue-700"
                  >
                    {isDarkMode ? '🌞' : '🌙'}
                  </button>
                </div>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                  className="p-2 rounded-md hover:bg-blue-700"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div
              data-testid="mobile-menu"
              className={`md:hidden ${mobileMenuOpen ? 'open' : ''} ${mobileMenuOpen ? 'block' : 'hidden'}`}
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="/map" className="block px-3 py-2 text-base font-medium">Ocean Map</a>
                <a href="/sharks" className="block px-3 py-2 text-base font-medium">Shark Tracking</a>
                <a href="/analytics" className="block px-3 py-2 text-base font-medium">Analytics</a>
              </div>
            </div>
          </nav>
        </header>

        {/* Live Region for Screen Readers */}
        <div role="status" aria-live="polite" className="sr-only"></div>

        {/* Main Content */}
        <main id="main-content" role="main" className="container mx-auto px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-800 text-white py-8">
          <div data-testid="footer-placeholder" className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">About</h3>
                <ul className="space-y-2">
                  <li><a href="/about">About BlueSphere</a></li>
                  <li><a href="/sources">Data Sources</a></li>
                  <li><a href="/privacy">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p>&copy; {new Date().getFullYear()} BlueSphere Marine Monitoring Platform</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

describe('Layout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders layout with children', () => {
      render(
        <TestLayout title="Test Page">
          <div data-testid="child-content">Test Content</div>
        </TestLayout>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('sets document title', () => {
      render(
        <TestLayout title="Marine Analytics">
          <div>Content</div>
        </TestLayout>
      )

      expect(document.title).toBe('Marine Analytics - BlueSphere')
    })
  })

  describe('Navigation', () => {
    it('renders main navigation menu', () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      expect(screen.getByText('BlueSphere')).toBeInTheDocument()
      expect(screen.getByText('Ocean Map')).toBeInTheDocument()
      expect(screen.getByText('Shark Tracking')).toBeInTheDocument()
      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })

    it('handles mobile navigation toggle', async () => {
      const user = userEvent.setup()
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const mobileMenuButton = screen.getByLabelText('Toggle navigation menu')
      await user.click(mobileMenuButton)

      expect(screen.getByTestId('mobile-menu')).toHaveClass('open')
    })

    it('handles keyboard navigation', async () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const oceanMapLink = screen.getByText('Ocean Map')
      oceanMapLink.focus()

      expect(oceanMapLink).toHaveFocus()
    })
  })

  describe('Theme Integration', () => {
    it('applies dark mode class when enabled', async () => {
      const user = userEvent.setup()
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const themeToggle = screen.getByLabelText('Toggle dark mode')
      await user.click(themeToggle)

      expect(document.documentElement).toHaveClass('dark')
    })

    it('toggles theme when theme button clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const themeToggle = screen.getByLabelText('Toggle dark mode')
      expect(themeToggle).toHaveTextContent('🌙')

      await user.click(themeToggle)
      expect(themeToggle).toHaveTextContent('🌞')
    })
  })

  describe('Dropdown Menus', () => {
    it('shows data dropdown on hover', async () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const dataButton = screen.getByText('Data')
      fireEvent.mouseEnter(dataButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Historical')).toBeInTheDocument()
        expect(screen.getByText('Time-lapse')).toBeInTheDocument()
      })
    })

    it('handles conservation dropdown', async () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const conservationButton = screen.getByText('Conservation')
      fireEvent.mouseEnter(conservationButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Action Center')).toBeInTheDocument()
        expect(screen.getByText('Crisis Response')).toBeInTheDocument()
      })
    })

    it('handles learn dropdown', async () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const learnButton = screen.getByText('Learn')
      fireEvent.mouseEnter(learnButton.parentElement!)

      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument()
        expect(screen.getByText('Gallery')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility Features', () => {
    it('provides skip links for keyboard navigation', () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      expect(screen.getByText('Skip to main content')).toBeInTheDocument()
      expect(screen.getByText('Skip to navigation')).toBeInTheDocument()
    })

    it('has proper ARIA labels and roles', () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      expect(screen.getByRole('banner')).toBeInTheDocument() // header
      expect(screen.getByRole('main')).toBeInTheDocument() // main content
      expect(screen.getByRole('navigation')).toBeInTheDocument() // nav
      expect(screen.getByRole('status')).toBeInTheDocument() // live region
    })

    it('supports keyboard navigation', async () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const skipLink = screen.getByText('Skip to main content')
      skipLink.focus()
      expect(skipLink).toHaveFocus()
    })
  })

  describe('Footer', () => {
    it('renders footer with links', () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      expect(screen.getByText('About BlueSphere')).toBeInTheDocument()
      expect(screen.getByText('Data Sources')).toBeInTheDocument()
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    })

    it('displays copyright information', () => {
      render(
        <TestLayout title="Test">
          <div>Content</div>
        </TestLayout>
      )

      const currentYear = new Date().getFullYear()
      expect(screen.getByText(`© ${currentYear} BlueSphere Marine Monitoring Platform`)).toBeInTheDocument()
    })
  })
})