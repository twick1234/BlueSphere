import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { jest } from '@jest/globals'

// Mock next/router for tests
export const mockRouter = {
  route: '/',
  pathname: '/',
  query: {},
  asPath: '/',
  push: jest.fn(),
  pop: jest.fn(),
  reload: jest.fn(),
  back: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  beforePopState: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isLocaleDomain: false,
  isReady: true,
  defaultLocale: 'en',
  domainLocales: [],
  isPreview: false,
}

// Mock fetch with default responses
export const mockFetch = jest.fn()

// Enhanced render function with common providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[]
  router?: typeof mockRouter
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { router = mockRouter, ...renderOptions } = options

  // You can add providers here if needed (ThemeProvider, etc.)
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <>{children}</>
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Marine data generators for testing
export const generateMockStation = (overrides = {}) => ({
  id: 'STATION_001',
  lat: 34.7,
  lon: -72.7,
  name: 'Test Marine Station',
  depth: 100,
  status: 'active',
  lastUpdate: new Date().toISOString(),
  ...overrides,
})

export const generateMockObservation = (overrides = {}) => ({
  id: 1001,
  station_id: 'STATION_001',
  time: new Date().toISOString(),
  sst_c: 24.5,
  qc_flag: 1,
  lat: 34.7,
  lon: -72.7,
  source: 'NDBC',
  anomaly_c: 1.2,
  ...overrides,
})

export const generateMockAlertData = (overrides = {}) => ({
  id: 'ALERT_001',
  type: 'marine_heatwave',
  severity: 'moderate',
  region: 'North Atlantic',
  description: 'Marine heatwave detected in region',
  coordinates: { lat: 40.0, lon: -70.0 },
  timestamp: new Date().toISOString(),
  active: true,
  ...overrides,
})

export const generateMockSharkData = (overrides = {}) => ({
  id: 'SHARK_001',
  species: 'Great White',
  name: 'Bruce',
  lat: 37.7749,
  lon: -122.4194,
  timestamp: new Date().toISOString(),
  depth: 50,
  temperature: 18.5,
  speed: 2.3,
  direction: 145,
  batteryLevel: 87,
  ...overrides,
})

// API response helpers
export const createMockApiResponse = (data: any, options = {}) => ({
  ok: true,
  status: 200,
  statusText: 'OK',
  json: jest.fn().mockResolvedValue(data),
  text: jest.fn().mockResolvedValue(JSON.stringify(data)),
  headers: new Headers(),
  ...options,
})

export const createMockApiError = (status = 500, message = 'Internal Server Error') => ({
  ok: false,
  status,
  statusText: message,
  json: jest.fn().mockResolvedValue({ error: message }),
  text: jest.fn().mockResolvedValue(JSON.stringify({ error: message })),
  headers: new Headers(),
})

// Async test helpers
export const waitFor = (conditionFn: () => boolean, timeout = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkCondition = () => {
      if (conditionFn()) {
        resolve()
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'))
      } else {
        setTimeout(checkCondition, 50)
      }
    }

    checkCondition()
  })
}

// Mock DOM elements commonly used in marine components
export const createMockMapElement = () => {
  const mapElement = document.createElement('div')
  mapElement.id = 'test-map'
  mapElement.style.width = '800px'
  mapElement.style.height = '600px'
  document.body.appendChild(mapElement)
  return mapElement
}

export const createMockCanvasElement = (width = 800, height = 600) => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext = jest.fn(() => ({
    clearRect: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    arc: jest.fn(),
  }))
  return canvas
}

// Mock chart/visualization data
export const generateMockChartData = (points = 10) => {
  return Array.from({ length: points }, (_, index) => ({
    x: index,
    y: Math.random() * 100,
    timestamp: new Date(Date.now() - (points - index) * 3600000).toISOString(),
  }))
}

// Re-export everything from @testing-library/react for convenience
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'