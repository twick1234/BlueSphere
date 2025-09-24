import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OptimizedImage from '../../components/OptimizedImage'

// Mock the performance utilities
jest.mock('../../lib/performance', () => ({
  getOptimizedImageSrc: jest.fn((src: string, width: number, quality: number) => {
    return `${src}?w=${width}&q=${quality}`
  }),
  createIntersectionObserver: jest.fn((callback) => {
    // Mock IntersectionObserver
    return {
      observe: jest.fn((element) => {
        // Simulate immediate intersection for non-priority images
        setTimeout(() => {
          callback([{ isIntersecting: true, target: element }])
        }, 0)
      }),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }
  }),
  getConnectionInfo: jest.fn(() => ({
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  }))
}))

// Mock IntersectionObserver globally
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn((element) => {
    setTimeout(() => {
      callback([{ isIntersecting: true, target: element }])
    }, 0)
  }),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}))

describe('OptimizedImage', () => {
  const defaultProps = {
    src: '/test-image.jpg',
    alt: 'Test image description',
    width: 800,
    height: 400
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      render(<OptimizedImage {...defaultProps} />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('renders with correct alt text', () => {
      render(<OptimizedImage {...defaultProps} />)
      expect(screen.getByAltText('Test image description')).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <OptimizedImage {...defaultProps} className="custom-image-class" />
      )
      expect(container.querySelector('.custom-image-class')).toBeInTheDocument()
    })

    it('sets correct image dimensions', () => {
      render(<OptimizedImage {...defaultProps} width={600} height={300} />)
      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '600')
      expect(img).toHaveAttribute('height', '300')
    })
  })

  describe('Image Optimization', () => {
    it('calls getOptimizedImageSrc with correct parameters', async () => {
      const mockGetOptimizedImageSrc = require('../../lib/performance').getOptimizedImageSrc

      render(<OptimizedImage {...defaultProps} quality={90} />)

      await waitFor(() => {
        expect(mockGetOptimizedImageSrc).toHaveBeenCalledWith(
          '/test-image.jpg',
          800,
          90
        )
      })
    })

    it('uses default quality when not specified', async () => {
      const mockGetOptimizedImageSrc = require('../../lib/performance').getOptimizedImageSrc

      render(<OptimizedImage {...defaultProps} />)

      await waitFor(() => {
        expect(mockGetOptimizedImageSrc).toHaveBeenCalledWith(
          '/test-image.jpg',
          800,
          80 // default quality
        )
      })
    })

    it('falls back to original src if optimization fails', async () => {
      const mockGetOptimizedImageSrc = require('../../lib/performance').getOptimizedImageSrc
      mockGetOptimizedImageSrc.mockImplementation(() => {
        throw new Error('Optimization failed')
      })

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(<OptimizedImage {...defaultProps} />)

      await waitFor(() => {
        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('src', '/test-image.jpg')
      })

      expect(consoleSpy).toHaveBeenCalledWith('Failed to optimize image source:', expect.any(Error))
      consoleSpy.mockRestore()
    })
  })

  describe('Lazy Loading', () => {
    it('shows placeholder initially for non-priority images', () => {
      const { container } = render(<OptimizedImage {...defaultProps} priority={false} />)

      // Should show loading state initially
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('loads immediately for priority images', () => {
      render(<OptimizedImage {...defaultProps} priority={true} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'eager')
    })

    it('sets lazy loading for non-priority images', async () => {
      render(<OptimizedImage {...defaultProps} priority={false} />)

      await waitFor(() => {
        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('loading', 'lazy')
      })
    })

    it('uses intersection observer for lazy loading', () => {
      const mockCreateIntersectionObserver = require('../../lib/performance').createIntersectionObserver

      render(<OptimizedImage {...defaultProps} priority={false} />)

      expect(mockCreateIntersectionObserver).toHaveBeenCalledWith(expect.any(Function))
    })

    it('skips intersection observer for priority images', () => {
      const mockCreateIntersectionObserver = require('../../lib/performance').createIntersectionObserver

      render(<OptimizedImage {...defaultProps} priority={true} />)

      expect(mockCreateIntersectionObserver).not.toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('shows loading spinner while image loads', () => {
      const { container } = render(<OptimizedImage {...defaultProps} />)

      expect(container.querySelector('.animate-spin')).toBeInTheDocument()
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('hides loading state after image loads', async () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')

      // Simulate image load
      fireEvent.load(img)

      await waitFor(() => {
        expect(screen.queryByRole('img')).toHaveClass('opacity-100')
      })
    })

    it('shows placeholder background while loading', () => {
      const customPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48L3N2Zz4K'
      const { container } = render(
        <OptimizedImage {...defaultProps} placeholder={customPlaceholder} />
      )

      const placeholderDiv = container.querySelector('.animate-pulse')
      expect(placeholderDiv).toHaveStyle({
        backgroundImage: `url("${customPlaceholder}")`
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error fallback when image fails to load', async () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')

      // Simulate image error
      fireEvent.error(img)

      await waitFor(() => {
        expect(screen.getByText('📷')).toBeInTheDocument()
        expect(screen.getByText('Image failed to load')).toBeInTheDocument()
        expect(screen.getByText('Test image description')).toBeInTheDocument()
      })
    })

    it('calls onError callback when image fails', () => {
      const onErrorMock = jest.fn()
      render(<OptimizedImage {...defaultProps} onError={onErrorMock} />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      expect(onErrorMock).toHaveBeenCalledWith(expect.any(Event))
    })

    it('maintains dimensions in error state', async () => {
      const { container } = render(<OptimizedImage {...defaultProps} width={600} height={300} />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      await waitFor(() => {
        const errorDiv = container.querySelector('.bg-gray-200')
        expect(errorDiv).toHaveStyle({
          width: '600px',
          height: '300px'
        })
      })
    })
  })

  describe('Load Callbacks', () => {
    it('calls onLoad callback when image loads successfully', () => {
      const onLoadMock = jest.fn()
      render(<OptimizedImage {...defaultProps} onLoad={onLoadMock} />)

      const img = screen.getByRole('img')
      fireEvent.load(img)

      expect(onLoadMock).toHaveBeenCalledTimes(1)
    })

    it('does not call onLoad when image fails', () => {
      const onLoadMock = jest.fn()
      render(<OptimizedImage {...defaultProps} onLoad={onLoadMock} />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      expect(onLoadMock).not.toHaveBeenCalled()
    })
  })

  describe('Responsive Behavior', () => {
    it('adjusts dimensions for slow connections', () => {
      const mockGetConnectionInfo = require('../../lib/performance').getConnectionInfo
      mockGetConnectionInfo.mockReturnValue({
        effectiveType: '2g',
        downlink: 0.5,
        rtt: 2000,
        saveData: false
      })

      render(<OptimizedImage {...defaultProps} width={1200} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '600') // reduced for 2g
    })

    it('uses moderate reduction for 3g connections', () => {
      const mockGetConnectionInfo = require('../../lib/performance').getConnectionInfo
      mockGetConnectionInfo.mockReturnValue({
        effectiveType: '3g',
        downlink: 1.5,
        rtt: 500,
        saveData: false
      })

      render(<OptimizedImage {...defaultProps} width={1200} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '800') // reduced for 3g
    })

    it('maintains full dimensions for fast connections', () => {
      const mockGetConnectionInfo = require('../../lib/performance').getConnectionInfo
      mockGetConnectionInfo.mockReturnValue({
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false
      })

      render(<OptimizedImage {...defaultProps} width={1200} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '1200') // full size for 4g
    })

    it('calculates height from aspect ratio when not provided', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" width={800} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '800')
      expect(img).toHaveAttribute('height', '400') // 0.5 aspect ratio default
    })

    it('uses provided height when specified', () => {
      render(<OptimizedImage {...defaultProps} width={800} height={600} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '800')
      expect(img).toHaveAttribute('height', '600')
    })
  })

  describe('Image Attributes', () => {
    it('sets correct decoding attribute', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('decoding', 'async')
    })

    it('sets object-fit style', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      expect(img).toHaveStyle({ objectFit: 'cover' })
    })

    it('applies opacity transition classes correctly', async () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')

      // Initially should be transparent
      expect(img).toHaveClass('opacity-0')

      // After load should be visible
      fireEvent.load(img)

      await waitFor(() => {
        expect(img).toHaveClass('opacity-100')
      })
    })
  })

  describe('Progressive Enhancement', () => {
    it('shows progressive overlay while loading', () => {
      const { container } = render(<OptimizedImage {...defaultProps} />)

      expect(container.querySelector('.bg-gradient-to-r')).toBeInTheDocument()
      expect(container.querySelector('.from-blue-50')).toBeInTheDocument()
      expect(container.querySelector('.to-green-50')).toBeInTheDocument()
    })

    it('removes progressive overlay after load', async () => {
      const { container } = render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      fireEvent.load(img)

      await waitFor(() => {
        expect(container.querySelector('.bg-gradient-to-r')).not.toBeInTheDocument()
      })
    })
  })

  describe('Default Values', () => {
    it('uses default width when not specified', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '800')
    })

    it('uses default quality when not specified', async () => {
      const mockGetOptimizedImageSrc = require('../../lib/performance').getOptimizedImageSrc

      render(<OptimizedImage src="/test.jpg" alt="Test" />)

      await waitFor(() => {
        expect(mockGetOptimizedImageSrc).toHaveBeenCalledWith(
          '/test.jpg',
          800,
          80 // default quality
        )
      })
    })

    it('defaults to non-priority loading', () => {
      render(<OptimizedImage src="/test.jpg" alt="Test" />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('Accessibility', () => {
    it('includes alt text for screen readers', () => {
      render(<OptimizedImage {...defaultProps} alt="Marine life in the ocean" />)

      expect(screen.getByAltText('Marine life in the ocean')).toBeInTheDocument()
    })

    it('shows alt text in error state for accessibility', async () => {
      render(<OptimizedImage {...defaultProps} alt="Important ocean data visualization" />)

      const img = screen.getByRole('img')
      fireEvent.error(img)

      await waitFor(() => {
        expect(screen.getByText('Important ocean data visualization')).toBeInTheDocument()
      })
    })

    it('sets appropriate ARIA attributes', () => {
      render(<OptimizedImage {...defaultProps} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('alt', 'Test image description')
    })
  })

  describe('Performance Optimizations', () => {
    it('skips intersection observer in SSR environment', () => {
      const originalWindow = global.window
      delete (global as any).window

      const mockCreateIntersectionObserver = require('../../lib/performance').createIntersectionObserver

      render(<OptimizedImage {...defaultProps} priority={false} />)

      expect(mockCreateIntersectionObserver).not.toHaveBeenCalled()

      global.window = originalWindow
    })

    it('immediately loads images when window is undefined', () => {
      const originalWindow = global.window
      delete (global as any).window

      const { container } = render(<OptimizedImage {...defaultProps} priority={false} />)

      // Should not show loading state in SSR
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument()

      global.window = originalWindow
    })

    it('cleans up intersection observer on unmount', () => {
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn()
      }

      const mockCreateIntersectionObserver = require('../../lib/performance').createIntersectionObserver
      mockCreateIntersectionObserver.mockReturnValue(mockObserver)

      const { unmount } = render(<OptimizedImage {...defaultProps} priority={false} />)

      unmount()

      expect(mockObserver.unobserve).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles missing src gracefully', () => {
      expect(() => {
        render(<OptimizedImage src="" alt="Empty src" />)
      }).not.toThrow()
    })

    it('handles extremely small dimensions', () => {
      render(<OptimizedImage {...defaultProps} width={1} height={1} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '1')
      expect(img).toHaveAttribute('height', '1')
    })

    it('handles extremely large dimensions', () => {
      render(<OptimizedImage {...defaultProps} width={10000} height={10000} />)

      const img = screen.getByRole('img')
      expect(img).toHaveAttribute('width', '10000')
      expect(img).toHaveAttribute('height', '10000')
    })

    it('handles zero quality', async () => {
      const mockGetOptimizedImageSrc = require('../../lib/performance').getOptimizedImageSrc

      render(<OptimizedImage {...defaultProps} quality={0} />)

      await waitFor(() => {
        expect(mockGetOptimizedImageSrc).toHaveBeenCalledWith(
          '/test-image.jpg',
          800,
          0
        )
      })
    })

    it('handles maximum quality', async () => {
      const mockGetOptimizedImageSrc = require('../../lib/performance').getOptimizedImageSrc

      render(<OptimizedImage {...defaultProps} quality={100} />)

      await waitFor(() => {
        expect(mockGetOptimizedImageSrc).toHaveBeenCalledWith(
          '/test-image.jpg',
          800,
          100
        )
      })
    })
  })
})