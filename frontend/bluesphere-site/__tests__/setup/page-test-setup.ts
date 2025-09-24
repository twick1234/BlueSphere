/**
 * Enhanced Jest setup for page component testing
 * Provides comprehensive mocks and utilities for BlueSphere page tests
 */

import '@testing-library/jest-dom'

// Enhanced Next.js mocks
jest.mock('next/router', () => ({
  __esModule: true,
  useRouter: jest.fn(() => ({
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
  })),
  default: {
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
  }
}))

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { src, alt, width, height, priority, placeholder, ...restProps } = props
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        data-priority={priority}
        data-placeholder={placeholder}
        {...restProps}
      />
    )
  },
}))

// Mock Next.js Head component
jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => {
    return <head>{children}</head>
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

// Mock Next.js Script component
jest.mock('next/script', () => ({
  __esModule: true,
  default: (props: any) => {
    return <script {...props} />
  },
}))

// Enhanced dynamic import mock
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (importFunc: any, options?: any) => {
    const DynamicComponent = (props: any) => {
      // Try to determine component type from import function
      const importString = importFunc.toString()

      if (importString.includes('OceanMap')) {
        return (
          <div data-testid="ocean-map" {...props}>
            Ocean Map Component
          </div>
        )
      }

      if (importString.includes('EnhancedSharkMap')) {
        return (
          <div data-testid="enhanced-shark-map" {...props}>
            Enhanced Shark Map Component
          </div>
        )
      }

      if (importString.includes('Chart') || importString.includes('react-chartjs-2')) {
        return (
          <div data-testid="chart-component" {...props}>
            Chart Component
          </div>
        )
      }

      if (importString.includes('PredictiveAnalytics')) {
        return (
          <div data-testid="predictive-analytics" {...props}>
            Predictive Analytics Component
          </div>
        )
      }

      if (importString.includes('HistoricalDataCycler')) {
        return (
          <div data-testid="historical-data-cycler" {...props}>
            Historical Data Cycler Component
          </div>
        )
      }

      // Generic dynamic component
      return (
        <div data-testid="dynamic-component" {...props}>
          Dynamic Component
          {options?.loading && <div data-testid="loading">Loading...</div>}
        </div>
      )
    }

    DynamicComponent.displayName = 'DynamicComponent'
    return DynamicComponent
  },
}))

// Browser API mocks
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

global.MutationObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn(),
}))

// Mock matchMedia with responsive breakpoints
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: jest.fn(),
})

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getPropertyValue: jest.fn(),
    width: '1024px',
    height: '768px',
  })),
})

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16))
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id))

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
  })
) as jest.Mock

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = MockWebSocket.CONNECTING
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null

  constructor(public url: string, public protocols?: string | string[]) {
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 10)
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState === MockWebSocket.OPEN) {
      setTimeout(() => {
        if (this.onmessage) {
          this.onmessage(new MessageEvent('message', { data }))
        }
      }, 10)
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = MockWebSocket.CLOSING
    setTimeout(() => {
      this.readyState = MockWebSocket.CLOSED
      if (this.onclose) {
        this.onclose(new CloseEvent('close', { code, reason }))
      }
    }, 10)
  }

  addEventListener(type: string, listener: EventListener): void {
    // Mock implementation
  }

  removeEventListener(type: string, listener: EventListener): void {
    // Mock implementation
  }

  dispatchEvent(event: Event): boolean {
    return true
  }
}

global.WebSocket = MockWebSocket as any

// Mock localStorage and sessionStorage
const createStorageMock = () => {
  let store: { [key: string]: string } = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
  }
}

Object.defineProperty(window, 'localStorage', {
  value: createStorageMock(),
})

Object.defineProperty(window, 'sessionStorage', {
  value: createStorageMock(),
})

// Mock geolocation
Object.defineProperty(navigator, 'geolocation', {
  value: {
    getCurrentPosition: jest.fn((success) =>
      success({
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 100,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      })
    ),
    watchPosition: jest.fn(),
    clearWatch: jest.fn(),
  },
})

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
})

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    ...window.performance,
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByName: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    clearMarks: jest.fn(),
    clearMeasures: jest.fn(),
    now: jest.fn(() => Date.now()),
  },
})

// Chart.js mocks
jest.mock('chart.js/auto', () => ({
  Chart: jest.fn(),
  defaults: {
    font: {},
    color: '#333',
  },
  register: jest.fn(),
}))

jest.mock('react-chartjs-2', () => ({
  Chart: ({ data, options, type }: any) => (
    <div data-testid={`chart-${type || 'unknown'}`}>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Bar: ({ data, options }: any) => (
    <div data-testid="bar-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Doughnut: ({ data, options }: any) => (
    <div data-testid="doughnut-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
  Pie: ({ data, options }: any) => (
    <div data-testid="pie-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}))

// Leaflet and react-leaflet mocks
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    invalidateSize: jest.fn(),
    fitBounds: jest.fn(),
    getBounds: jest.fn(),
    getZoom: jest.fn(),
    setZoom: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
    remove: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
    openPopup: jest.fn(),
    closePopup: jest.fn(),
    setLatLng: jest.fn(),
    remove: jest.fn(),
  })),
  popup: jest.fn(() => ({
    setLatLng: jest.fn(),
    setContent: jest.fn(),
    openOn: jest.fn(),
  })),
  icon: jest.fn(),
  Icon: {
    Default: {
      mergeOptions: jest.fn(),
    },
  },
  latLng: jest.fn((lat, lng) => ({ lat, lng })),
  latLngBounds: jest.fn(),
}))

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }: any) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: (props: any) => <div data-testid="tile-layer" {...props} />,
  Marker: ({ children, ...props }: any) => (
    <div data-testid="marker" {...props}>
      {children}
    </div>
  ),
  Popup: ({ children, ...props }: any) => (
    <div data-testid="popup" {...props}>
      {children}
    </div>
  ),
  Circle: (props: any) => <div data-testid="circle" {...props} />,
  CircleMarker: (props: any) => <div data-testid="circle-marker" {...props} />,
  Polyline: (props: any) => <div data-testid="polyline" {...props} />,
  Polygon: (props: any) => <div data-testid="polygon" {...props} />,
  useMap: () => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    fitBounds: jest.fn(),
    getBounds: jest.fn(),
    getZoom: jest.fn(),
    setZoom: jest.fn(),
  }),
  useMapEvents: jest.fn(),
}))

// D3.js mock
jest.mock('d3', () => ({
  select: jest.fn().mockReturnThis(),
  selectAll: jest.fn().mockReturnThis(),
  append: jest.fn().mockReturnThis(),
  attr: jest.fn().mockReturnThis(),
  style: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  html: jest.fn().mockReturnThis(),
  data: jest.fn().mockReturnThis(),
  enter: jest.fn().mockReturnThis(),
  exit: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  merge: jest.fn().mockReturnThis(),
  transition: jest.fn().mockReturnThis(),
  duration: jest.fn().mockReturnThis(),
  ease: jest.fn().mockReturnThis(),
  scaleLinear: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  })),
  scaleOrdinal: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  })),
  scaleTime: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  })),
  axisBottom: jest.fn(),
  axisLeft: jest.fn(),
  axisRight: jest.fn(),
  axisTop: jest.fn(),
  line: jest.fn(() => jest.fn()),
  area: jest.fn(() => jest.fn()),
  arc: jest.fn(() => jest.fn()),
  pie: jest.fn(() => jest.fn()),
  max: jest.fn(),
  min: jest.fn(),
  extent: jest.fn(),
  format: jest.fn(() => jest.fn()),
  timeFormat: jest.fn(() => jest.fn()),
}))

// Suppress console warnings/errors during tests unless explicitly testing error conditions
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('validateDOMNesting') ||
        args[0].includes('useLayoutEffect') ||
        args[0].includes('act(...)') ||
        args[0].includes('ReactDOM.render is no longer supported'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillUpdate') ||
        args[0].includes('ReactDOM.render is no longer supported'))
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks()

  // Reset fetch mock
  if (global.fetch) {
    (global.fetch as jest.Mock).mockClear()
  }

  // Clear localStorage and sessionStorage
  if (window.localStorage) {
    window.localStorage.clear()
  }
  if (window.sessionStorage) {
    window.sessionStorage.clear()
  }

  // Clean up any timers
  jest.clearAllTimers()

  // Reset document body
  document.body.innerHTML = ''

  // Reset head elements added during tests
  const testElements = document.head.querySelectorAll('[data-test]')
  testElements.forEach(element => element.remove())
})

// Export utilities for tests
export const testUtils = {
  // Mock implementations
  mockFetch: (responses: Record<string, any>) => {
    global.fetch = jest.fn((url: string) => {
      for (const [pattern, response] of Object.entries(responses)) {
        if (url.includes(pattern)) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response)),
          })
        }
      }
      return Promise.reject(new Error(`No mock response for ${url}`))
    }) as jest.Mock
  },

  // Async utilities
  waitFor: (condition: () => boolean, timeout = 5000) => {
    return new Promise<void>((resolve, reject) => {
      const startTime = Date.now()
      const check = () => {
        if (condition()) {
          resolve()
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('Condition not met within timeout'))
        } else {
          setTimeout(check, 10)
        }
      }
      check()
    })
  },

  // Performance testing
  measurePerformance: (fn: () => void) => {
    const start = performance.now()
    fn()
    const end = performance.now()
    return end - start
  },
}