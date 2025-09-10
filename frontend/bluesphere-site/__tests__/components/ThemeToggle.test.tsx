import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggle from '../../components/ThemeToggle'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
    // Reset document.documentElement attributes
    document.documentElement.removeAttribute('data-theme')
    // Create a mock logo element
    const logoElement = document.createElement('img')
    logoElement.id = 'bs-logo'
    document.body.appendChild(logoElement)
  })

  afterEach(() => {
    // Clean up mock logo element
    const logoElement = document.getElementById('bs-logo')
    if (logoElement) {
      document.body.removeChild(logoElement)
    }
  })

  it('renders with default system theme', async () => {
    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Theme: System')
      expect(screen.getByText('🖥️')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })
  })

  it('loads saved theme from localStorage', async () => {
    localStorageMock.getItem.mockReturnValue('light')
    
    render(<ThemeToggle />)
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Theme: Light')
      expect(screen.getByText('☀️')).toBeInTheDocument()
      expect(screen.getByText('Light')).toBeInTheDocument()
    })
  })

  it('cycles through themes when clicked', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button')

    // Initial state: System
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Theme: System')
    })

    // Click to go to Light
    await user.click(button)
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Theme: Light')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bs-theme', 'light')
    })

    // Click to go to Dark
    await user.click(button)
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Theme: Dark')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bs-theme', 'dark')
    })

    // Click to go back to System
    await user.click(button)
    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Theme: System')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('bs-theme', 'system')
    })
  })

  it('applies correct theme attributes to document element', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button')

    // Click to light theme
    await user.click(button)
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'light')
    })

    // Click to dark theme
    await user.click(button)
    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    })

    // Click to system theme (should remove attribute)
    await user.click(button)
    await waitFor(() => {
      expect(document.documentElement).not.toHaveAttribute('data-theme')
    })
  })

  it('updates logo source based on theme', async () => {
    const user = userEvent.setup()
    const logoElement = document.getElementById('bs-logo') as HTMLImageElement
    
    render(<ThemeToggle />)
    const button = screen.getByRole('button')

    // Click to light theme
    await user.click(button)
    await waitFor(() => {
      expect(logoElement.src).toContain('/brand/logo.svg')
    })

    // Click to dark theme
    await user.click(button)
    await waitFor(() => {
      expect(logoElement.src).toContain('/brand/logo-mono-light.svg')
    })
  })

  it('displays correct icon for each theme', async () => {
    const user = userEvent.setup()
    render(<ThemeToggle />)

    const button = screen.getByRole('button')

    // System theme
    expect(screen.getByText('🖥️')).toBeInTheDocument()

    // Light theme
    await user.click(button)
    await waitFor(() => {
      expect(screen.getByText('☀️')).toBeInTheDocument()
    })

    // Dark theme
    await user.click(button)
    await waitFor(() => {
      expect(screen.getByText('🌙')).toBeInTheDocument()
    })
  })

  it('has correct accessibility attributes', () => {
    render(<ThemeToggle />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title')
    expect(button).toHaveAttribute('aria-label')
  })

  it('handles media query changes for system theme', async () => {
    // Mock matchMedia to simulate dark preference change
    const mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    
    window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList)
    
    render(<ThemeToggle />)
    
    // Verify that media query listener was set up
    expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)')
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('cleans up media query listener on unmount', () => {
    const mockMediaQueryList = {
      matches: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    
    window.matchMedia = jest.fn().mockReturnValue(mockMediaQueryList)
    
    const { unmount } = render(<ThemeToggle />)
    unmount()
    
    expect(mockMediaQueryList.removeEventListener).toHaveBeenCalled()
  })
})