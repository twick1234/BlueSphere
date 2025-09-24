/**
 * Utility functions for page component testing
 * Provides common mocks, helpers, and test setup for BlueSphere pages
 */

import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock data generators
export const mockBuoyData = (count: number = 5) =>
  Array.from({ length: count }, (_, i) => ({
    station_id: `BUOY-${(i + 1).toString().padStart(3, '0')}`,
    name: `Test Station ${i + 1}`,
    lat: (Math.random() - 0.5) * 180,
    lon: (Math.random() - 0.5) * 360,
    provider: ['NOAA', 'NDBC', 'IMR'][i % 3],
    last_temp: Math.random() * 30 + 5,
    status: ['active', 'inactive', 'warning'][i % 3] as 'active' | 'inactive' | 'warning'
  }))

export const mockSharkData = (count: number = 10) =>
  Array.from({ length: count }, (_, i) => ({
    id: `shark-${(i + 1).toString().padStart(3, '0')}`,
    name: ['Mary Lee', 'Deep Blue', 'Bruce', 'Jaws', 'Tiger', 'Hammerhead', 'Bull', 'Mako', 'Reef', 'Nurse'][i] || `Shark ${i + 1}`,
    species: ['Great White Shark', 'Tiger Shark', 'Bull Shark', 'Hammerhead Shark'][i % 4],
    sex: ['M', 'F', 'Unknown'][i % 3] as 'M' | 'F' | 'Unknown',
    length_m: Math.random() * 4 + 2,
    weight_kg: Math.random() * 1000 + 200,
    tag_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
    last_ping: new Date(2024, 8, Math.floor(Math.random() * 23) + 1).toISOString(),
    lat: (Math.random() - 0.5) * 180,
    lon: (Math.random() - 0.5) * 360,
    tracking_organization: ['OCEARCH', 'Marine Biology Institute', 'BlueSphere Network'][i % 3],
    confidence_level: ['High', 'Medium', 'Low'][i % 3] as 'High' | 'Medium' | 'Low',
    status: ['Active', 'Inactive', 'Lost_Signal'][i % 3] as 'Active' | 'Inactive' | 'Lost_Signal'
  }))

export const mockMetricsData = () => ({
  coverage: {
    total: 75.8 + Math.random() * 10,
    components: 82.3 + Math.random() * 10,
    api: 68.5 + Math.random() * 15,
    pages: 71.2 + Math.random() * 12,
    trend: Array.from({ length: 5 }, () => 60 + Math.random() * 30),
    lastUpdated: new Date().toISOString()
  },
  performance: {
    lcp: 2.1 + Math.random() * 0.5,
    fid: 89 + Math.random() * 20,
    cls: 0.05 + Math.random() * 0.03,
    bundleSize: 845.2 + Math.random() * 100,
    apiResponseTime: 156 + Math.random() * 50,
    trend: Array.from({ length: 5 }, () => 2 + Math.random() * 0.5)
  },
  system: {
    uptime: 99.94 + Math.random() * 0.05,
    activeStations: 15847 + Math.floor(Math.random() * 100),
    trackingSharks: 2847 + Math.floor(Math.random() * 50),
    alertsToday: Math.floor(Math.random() * 20),
    dataIngestionRate: 1250 + Math.floor(Math.random() * 200),
    lastFailure: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
  },
  tests: {
    total: 1247 + Math.floor(Math.random() * 100),
    passing: 1205 + Math.floor(Math.random() * 30),
    failing: Math.floor(Math.random() * 20),
    duration: 45.6 + Math.random() * 10,
    lastRun: new Date().toISOString(),
    trend: Array.from({ length: 5 }, () => 1000 + Math.floor(Math.random() * 300))
  },
  api: {
    endpoints: 45 + Math.floor(Math.random() * 10),
    healthy: 43 + Math.floor(Math.random() * 5),
    degraded: Math.floor(Math.random() * 5),
    down: Math.floor(Math.random() * 2),
    avgResponseTime: 156 + Math.random() * 50,
    errorRate: Math.random() * 0.5
  }
})

// Viewport utilities
export const setMobileViewport = () => {
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
}

export const setTabletViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 768,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1024,
  })

  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: query.includes('max-width: 1024px') && !query.includes('max-width: 768px'),
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

export const setDesktopViewport = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1920,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: 1080,
  })

  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }))
}

// Mock API responses
export const mockApiResponse = (data: any, delay: number = 0) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        ok: true,
        json: () => Promise.resolve(data)
      })
    }, delay)
  })
}

export const mockApiError = (message: string = 'API Error', delay: number = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(message))
    }, delay)
  })
}

// Setup fetch mock with common endpoints
export const setupFetchMock = () => {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes('/api/buoys')) {
      return mockApiResponse({ buoys: mockBuoyData() })
    }
    if (url.includes('/api/sharks')) {
      return mockApiResponse({ sharks: mockSharkData() })
    }
    if (url.includes('/api/metrics')) {
      return mockApiResponse(mockMetricsData())
    }
    if (url.includes('/api/climate-metrics')) {
      return mockApiResponse({
        globalTemp: 21.2,
        tempAnomaly: 1.8,
        activeStations: mockBuoyData().length,
        marineHeatwaves: 7,
        avgTemp: 18.9,
        hotspotCount: 12,
        criticalAlerts: 3
      })
    }
    return mockApiError('Unknown endpoint')
  }) as jest.Mock
}

// Next.js router mock
export const createMockRouter = (overrides: Partial<any> = {}) => ({
  push: jest.fn(),
  replace: jest.fn(),
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
  ...overrides
})

// Custom render function with common providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any custom options here
}

export const renderPage = (ui: ReactElement, options?: CustomRenderOptions) => {
  return {
    user: userEvent.setup(),
    ...render(ui, options),
  }
}

// Common test patterns
export const testAccessibility = async (component: ReactElement) => {
  const { container } = render(component)

  // Check for basic accessibility requirements
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const images = container.querySelectorAll('img')
  const buttons = container.querySelectorAll('button')
  const links = container.querySelectorAll('a')
  const inputs = container.querySelectorAll('input, select, textarea')

  return {
    hasHeadings: headings.length > 0,
    imagesHaveAlt: Array.from(images).every(img => img.hasAttribute('alt')),
    buttonsHaveLabels: Array.from(buttons).every(btn =>
      btn.textContent?.trim() || btn.hasAttribute('aria-label') || btn.hasAttribute('aria-labelledby')
    ),
    linksHaveText: Array.from(links).every(link =>
      link.textContent?.trim() || link.hasAttribute('aria-label') || link.hasAttribute('aria-labelledby')
    ),
    inputsHaveLabels: Array.from(inputs).every(input =>
      input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby') || input.id && document.querySelector(`label[for="${input.id}"]`)
    )
  }
}

export const testResponsiveDesign = (component: ReactElement) => {
  const results = {
    mobile: { renders: false, error: null as Error | null },
    tablet: { renders: false, error: null as Error | null },
    desktop: { renders: false, error: null as Error | null }
  }

  try {
    setMobileViewport()
    render(component)
    results.mobile.renders = true
  } catch (error) {
    results.mobile.error = error as Error
  }

  try {
    setTabletViewport()
    render(component)
    results.tablet.renders = true
  } catch (error) {
    results.tablet.error = error as Error
  }

  try {
    setDesktopViewport()
    render(component)
    results.desktop.renders = true
  } catch (error) {
    results.desktop.error = error as Error
  }

  return results
}

// Performance testing utilities
export const measureRenderTime = (component: ReactElement) => {
  const startTime = performance.now()
  render(component)
  const endTime = performance.now()
  return endTime - startTime
}

export const testMemoryLeaks = (component: ReactElement) => {
  const { unmount } = render(component)

  try {
    unmount()
    return { hasMemoryLeaks: false, error: null }
  } catch (error) {
    return { hasMemoryLeaks: true, error: error as Error }
  }
}

// Error boundary testing
export const testErrorBoundaries = (component: ReactElement) => {
  const originalError = console.error
  console.error = jest.fn()

  try {
    render(component)
    return { rendersWithoutError: true, error: null }
  } catch (error) {
    return { rendersWithoutError: false, error: error as Error }
  } finally {
    console.error = originalError
  }
}

// SEO testing
export const testSEO = (component: ReactElement) => {
  const { container } = render(component)

  const title = document.querySelector('title')
  const metaDescription = document.querySelector('meta[name="description"]')
  const metaKeywords = document.querySelector('meta[name="keywords"]')
  const h1Elements = container.querySelectorAll('h1')

  return {
    hasTitle: !!title,
    hasMetaDescription: !!metaDescription,
    hasMetaKeywords: !!metaKeywords,
    hasH1: h1Elements.length > 0,
    hasUniqueH1: h1Elements.length === 1,
    titleContent: title?.textContent || '',
    metaDescriptionContent: metaDescription?.getAttribute('content') || '',
    metaKeywordsContent: metaKeywords?.getAttribute('content') || ''
  }
}