import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
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
    }
  },
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />
  },
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}))

// Mock matchMedia
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

// Mock fetch API
global.fetch = jest.fn()

// Mock leaflet
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    remove: jest.fn(),
    invalidateSize: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
  })),
  icon: jest.fn(),
  Icon: {
    Default: {
      mergeOptions: jest.fn(),
    },
  },
}))

// Mock react-leaflet
jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children }) => <div data-testid="marker">{children}</div>,
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  }),
}))

// Mock d3
jest.mock('d3', () => ({
  select: jest.fn().mockReturnThis(),
  selectAll: jest.fn().mockReturnThis(),
  append: jest.fn().mockReturnThis(),
  attr: jest.fn().mockReturnThis(),
  style: jest.fn().mockReturnThis(),
  text: jest.fn().mockReturnThis(),
  data: jest.fn().mockReturnThis(),
  enter: jest.fn().mockReturnThis(),
  exit: jest.fn().mockReturnThis(),
  remove: jest.fn().mockReturnThis(),
  scaleLinear: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  })),
  axisBottom: jest.fn(),
  axisLeft: jest.fn(),
}))

// Suppress console warnings/errors during tests
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') ||
        args[0].includes('validateDOMNesting') ||
        args[0].includes('useLayoutEffect'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps')
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

// Mock lib files that may not exist
jest.mock('@/lib/error-handling', () => ({
  EnhancedError: class MockEnhancedError extends Error {
    constructor(message, context) {
      super(message)
      this.name = 'EnhancedError'
      this.user_friendly_message = `User friendly: ${message}`
      this.recovery_suggestions = ['Try refreshing the page', 'Check your internet connection']
      this.context = context
    }
  },
  ErrorLogger: {
    logError: jest.fn().mockResolvedValue('error-id-123')
  },
  isEnhancedError: jest.fn((error) => error.name === 'EnhancedError'),
  ErrorFactory: {
    createDataProcessingError: jest.fn((message, context) => {
      const error = new Error(message)
      error.name = 'EnhancedError'
      error.user_friendly_message = `User friendly: ${message}`
      error.recovery_suggestions = ['Try refreshing the page', 'Check your internet connection']
      error.context = context
      return error
    })
  }
}))

jest.mock('@/lib/performance', () => ({
  trackErrorBoundaryPerformance: jest.fn(),
  getOptimizedImageSrc: jest.fn((src, width, quality) => `${src}?w=${width}&q=${quality}`),
  createIntersectionObserver: jest.fn((callback) => ({
    observe: jest.fn((element) => {
      setTimeout(() => callback([{ isIntersecting: true, target: element }]), 0)
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn()
  })),
  getConnectionInfo: jest.fn(() => ({
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  }))
}))

// Mock accessibility provider
jest.mock('@/components/accessibility/AccessibilityProvider', () => ({
  useAccessibility: () => ({
    announce: jest.fn(),
    prefersReducedMotion: false,
    prefersHighContrast: false,
    announcements: [],
    clearAnnouncements: jest.fn()
  })
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock