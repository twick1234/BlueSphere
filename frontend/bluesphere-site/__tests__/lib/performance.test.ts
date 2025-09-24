/**
 * Comprehensive tests for Performance utilities
 * Tests debounce, throttle, device detection, memory monitoring, and caching
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import {
  debounce,
  throttle,
  prefersReducedMotion,
  getDeviceInfo,
  getMemoryInfo,
  getConnectionInfo,
  getOptimizedImageSrc,
  preloadResource,
  useLazyImage,
  measurePerformance,
  trackWebVitals,
  SimpleCache,
  performanceCache,
  analyzeBundleSize,
  trackErrorBoundaryPerformance,
  createIntersectionObserver
} from '@/lib/performance';

// Mock window and navigator objects
const mockWindow = {
  matchMedia: jest.fn(),
  devicePixelRatio: 2,
  performance: {
    now: jest.fn(),
    mark: jest.fn(),
    measure: jest.fn(),
    memory: {
      usedJSHeapSize: 10 * 1024 * 1024, // 10MB
      totalJSHeapSize: 20 * 1024 * 1024, // 20MB
      jsHeapSizeLimit: 100 * 1024 * 1024 // 100MB
    }
  }
};

const mockNavigator = {
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false
  }
};

const mockDocument = {
  createElement: jest.fn(),
  head: {
    appendChild: jest.fn()
  }
};

// Mock DOM globals
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

// Mock IntersectionObserver
const mockIntersectionObserver = {
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
};

Object.defineProperty(global, 'IntersectionObserver', {
  value: jest.fn(() => mockIntersectionObserver),
  writable: true
});

// Mock PerformanceObserver
Object.defineProperty(global, 'PerformanceObserver', {
  value: jest.fn(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
  })),
  writable: true
});

beforeEach(() => {
  jest.clearAllMocks();
  mockWindow.performance.now.mockReturnValue(1000);
});

describe('debounce', () => {
  it('should delay function execution', (done) => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('arg1', 'arg2');
    debouncedFn('arg3', 'arg4');

    // Function should not be called immediately
    expect(mockFn).not.toHaveBeenCalled();

    setTimeout(() => {
      // Function should be called with latest arguments after delay
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('arg3', 'arg4');
      done();
    }, 150);
  });

  it('should cancel previous calls when called again', (done) => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 100);

    debouncedFn('first');

    setTimeout(() => {
      debouncedFn('second');
    }, 50);

    setTimeout(() => {
      // Only the second call should execute
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('second');
      done();
    }, 200);
  });

  it('should handle multiple arguments correctly', (done) => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 50);

    debouncedFn(1, 'two', { three: 3 }, [4, 5]);

    setTimeout(() => {
      expect(mockFn).toHaveBeenCalledWith(1, 'two', { three: 3 }, [4, 5]);
      done();
    }, 75);
  });

  it('should work with zero delay', () => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 0);

    debouncedFn('immediate');

    // Should still be async
    expect(mockFn).not.toHaveBeenCalled();

    // Use setTimeout to check async execution
    setTimeout(() => {
      expect(mockFn).toHaveBeenCalledWith('immediate');
    }, 10);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should limit function calls', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    // First call should execute immediately
    throttledFn('first');
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('first');

    // Subsequent calls within delay should be ignored
    throttledFn('second');
    throttledFn('third');
    expect(mockFn).toHaveBeenCalledTimes(1);

    // After delay, next call should execute
    jest.advanceTimersByTime(100);
    throttledFn('fourth');
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenLastCalledWith('fourth');
  });

  it('should handle rapid successive calls', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 1000);

    // Simulate rapid scroll events
    for (let i = 0; i < 10; i++) {
      throttledFn(`call-${i}`);
      jest.advanceTimersByTime(50); // 50ms between calls
    }

    // Only first call should execute
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith('call-0');
  });

  it('should preserve function context and arguments', () => {
    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    throttledFn(1, 'test', { key: 'value' });
    expect(mockFn).toHaveBeenCalledWith(1, 'test', { key: 'value' });
  });
});

describe('prefersReducedMotion', () => {
  it('should return true when user prefers reduced motion', () => {
    mockWindow.matchMedia.mockReturnValue({ matches: true });

    const result = prefersReducedMotion();
    expect(result).toBe(true);
    expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('should return false when user does not prefer reduced motion', () => {
    mockWindow.matchMedia.mockReturnValue({ matches: false });

    const result = prefersReducedMotion();
    expect(result).toBe(false);
  });

  it('should return false when window is undefined (SSR)', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const result = prefersReducedMotion();
    expect(result).toBe(false);

    global.window = originalWindow;
  });
});

describe('getDeviceInfo', () => {
  it('should detect mobile devices', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
    Object.defineProperty(global, 'ontouchstart', { value: true, writable: true });

    const deviceInfo = getDeviceInfo();

    expect(deviceInfo.isMobile).toBe(true);
    expect(deviceInfo.isTablet).toBe(false);
    expect(deviceInfo.isDesktop).toBe(false);
    expect(deviceInfo.hasTouch).toBe(true);
    expect(deviceInfo.pixelRatio).toBe(2);
  });

  it('should detect tablet devices', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)';

    const deviceInfo = getDeviceInfo();

    expect(deviceInfo.isMobile).toBe(false); // iPad is not considered mobile in this logic
    expect(deviceInfo.isTablet).toBe(true);
    expect(deviceInfo.isDesktop).toBe(false);
  });

  it('should detect Android tablets', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Linux; Android 10; SM-T510) AppleWebKit/537.36';

    const deviceInfo = getDeviceInfo();

    expect(deviceInfo.isTablet).toBe(true);
    expect(deviceInfo.isMobile).toBe(false);
  });

  it('should detect desktop devices', () => {
    mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

    const deviceInfo = getDeviceInfo();

    expect(deviceInfo.isMobile).toBe(false);
    expect(deviceInfo.isTablet).toBe(false);
    expect(deviceInfo.isDesktop).toBe(true);
  });

  it('should handle SSR environment', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const deviceInfo = getDeviceInfo();

    expect(deviceInfo).toEqual({
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      pixelRatio: 1
    });

    global.window = originalWindow;
  });

  it('should handle missing devicePixelRatio', () => {
    const originalRatio = mockWindow.devicePixelRatio;
    // @ts-ignore
    delete mockWindow.devicePixelRatio;

    const deviceInfo = getDeviceInfo();

    expect(deviceInfo.pixelRatio).toBe(1);

    mockWindow.devicePixelRatio = originalRatio;
  });
});

describe('getMemoryInfo', () => {
  it('should return memory information when available', () => {
    const memoryInfo = getMemoryInfo();

    expect(memoryInfo).toEqual({
      used: 10, // 10MB
      total: 20, // 20MB
      limit: 100 // 100MB
    });
  });

  it('should return null when memory API is not available', () => {
    const originalMemory = mockWindow.performance.memory;
    // @ts-ignore
    delete mockWindow.performance.memory;

    const memoryInfo = getMemoryInfo();

    expect(memoryInfo).toBeNull();

    mockWindow.performance.memory = originalMemory;
  });

  it('should return null in SSR environment', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const memoryInfo = getMemoryInfo();

    expect(memoryInfo).toBeNull();

    global.window = originalWindow;
  });
});

describe('getConnectionInfo', () => {
  it('should return connection information when available', () => {
    const connectionInfo = getConnectionInfo();

    expect(connectionInfo).toEqual({
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false
    });
  });

  it('should return default values when connection API is not available', () => {
    const originalConnection = mockNavigator.connection;
    // @ts-ignore
    delete mockNavigator.connection;

    const connectionInfo = getConnectionInfo();

    expect(connectionInfo).toEqual({
      effectiveType: '4g',
      downlink: 10
    });

    mockNavigator.connection = originalConnection;
  });

  it('should handle partial connection information', () => {
    mockNavigator.connection = {
      effectiveType: '3g'
      // Missing other properties
    } as any;

    const connectionInfo = getConnectionInfo();

    expect(connectionInfo.effectiveType).toBe('3g');
    expect(connectionInfo.downlink).toBe(10); // Default
    expect(connectionInfo.rtt).toBe(100); // Default
    expect(connectionInfo.saveData).toBe(false); // Default
  });

  it('should return default values in SSR environment', () => {
    const originalNavigator = global.navigator;
    // @ts-ignore
    delete global.navigator;

    const connectionInfo = getConnectionInfo();

    expect(connectionInfo).toEqual({
      effectiveType: '4g',
      downlink: 10
    });

    global.navigator = originalNavigator;
  });
});

describe('getOptimizedImageSrc', () => {
  it('should generate optimized image URL with default quality', () => {
    const src = getOptimizedImageSrc('image.jpg', 800);

    expect(src).toBe('image.jpg?w=1200&q=80'); // 800 * 1.5 (high DPI) = 1200
  });

  it('should adjust quality for slow connections', () => {
    mockNavigator.connection = {
      effectiveType: '2g',
      saveData: false
    } as any;

    const src = getOptimizedImageSrc('image.jpg', 800, 90);

    expect(src).toBe('image.jpg?w=1200&q=60'); // Quality reduced to 60
  });

  it('should adjust quality for data saver mode', () => {
    mockNavigator.connection = {
      effectiveType: '4g',
      saveData: true
    } as any;

    const src = getOptimizedImageSrc('image.jpg', 800, 90);

    expect(src).toBe('image.jpg?w=1200&q=60'); // Quality reduced to 60
  });

  it('should not scale for low DPI displays', () => {
    mockWindow.devicePixelRatio = 1;

    const src = getOptimizedImageSrc('image.jpg', 800);

    expect(src).toBe('image.jpg?w=800&q=80'); // No scaling
  });

  it('should handle custom quality values', () => {
    const src = getOptimizedImageSrc('image.jpg', 600, 95);

    expect(src).toBe('image.jpg?w=900&q=95');
  });
});

describe('preloadResource', () => {
  beforeEach(() => {
    const mockLink = {
      rel: '',
      href: '',
      as: '',
      type: ''
    };
    mockDocument.createElement.mockReturnValue(mockLink);
  });

  it('should create and append preload link', () => {
    preloadResource('styles.css', 'style', 'text/css');

    expect(mockDocument.createElement).toHaveBeenCalledWith('link');
    expect(mockDocument.head.appendChild).toHaveBeenCalled();

    const link = mockDocument.createElement.mock.results[0].value;
    expect(link.rel).toBe('preload');
    expect(link.href).toBe('styles.css');
    expect(link.as).toBe('style');
    expect(link.type).toBe('text/css');
  });

  it('should work without type parameter', () => {
    preloadResource('script.js', 'script');

    const link = mockDocument.createElement.mock.results[0].value;
    expect(link.rel).toBe('preload');
    expect(link.href).toBe('script.js');
    expect(link.as).toBe('script');
    expect(link.type).toBe('');
  });

  it('should not run in SSR environment', () => {
    const originalDocument = global.document;
    // @ts-ignore
    delete global.document;

    preloadResource('test.css', 'style');

    // Should not throw and not call any methods
    expect(mockDocument.createElement).not.toHaveBeenCalled();

    global.document = originalDocument;
  });
});

describe('useLazyImage', () => {
  it('should observe image element', () => {
    const mockRef = { current: document.createElement('img') } as React.RefObject<HTMLImageElement>;
    const src = 'lazy-image.jpg';

    renderHook(() => useLazyImage(mockRef, src));

    expect(IntersectionObserver).toHaveBeenCalled();
    expect(mockIntersectionObserver.observe).toHaveBeenCalledWith(mockRef.current);
    expect(mockRef.current.classList.contains('lazy-loading')).toBe(true);
  });

  it('should handle null ref', () => {
    const mockRef = { current: null } as React.RefObject<HTMLImageElement>;
    const src = 'lazy-image.jpg';

    renderHook(() => useLazyImage(mockRef, src));

    expect(mockIntersectionObserver.observe).not.toHaveBeenCalled();
  });

  it('should cleanup observer on unmount', () => {
    const mockRef = { current: document.createElement('img') } as React.RefObject<HTMLImageElement>;
    const src = 'lazy-image.jpg';

    const { unmount } = renderHook(() => useLazyImage(mockRef, src));

    unmount();

    expect(mockIntersectionObserver.unobserve).toHaveBeenCalledWith(mockRef.current);
  });

  it('should simulate intersection observer callback', () => {
    const mockImg = document.createElement('img');
    const mockRef = { current: mockImg } as React.RefObject<HTMLImageElement>;
    const src = 'lazy-image.jpg';

    renderHook(() => useLazyImage(mockRef, src));

    // Get the callback from IntersectionObserver constructor
    const callback = (IntersectionObserver as jest.Mock).mock.calls[0][0];

    // Simulate intersection
    const entries = [{
      isIntersecting: true,
      target: mockImg
    }];

    act(() => {
      callback(entries);
    });

    expect(mockImg.src).toBe(src);
    expect(mockImg.classList.contains('lazy-loaded')).toBe(true);
    expect(mockImg.classList.contains('lazy-loading')).toBe(false);
  });
});

describe('measurePerformance', () => {
  beforeEach(() => {
    mockWindow.performance.now
      .mockReturnValueOnce(1000) // Start time
      .mockReturnValueOnce(1050); // End time
  });

  it('should measure function performance', () => {
    const mockFn = jest.fn();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    measurePerformance('test-function', mockFn);

    expect(mockFn).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Performance: test-function took 50ms');
    expect(mockWindow.performance.mark).toHaveBeenCalledWith('test-function-start');
    expect(mockWindow.performance.mark).toHaveBeenCalledWith('test-function-end');
    expect(mockWindow.performance.measure).toHaveBeenCalledWith(
      'test-function',
      'test-function-start',
      'test-function-end'
    );

    consoleSpy.mockRestore();
  });

  it('should work without performance.mark support', () => {
    const originalMark = mockWindow.performance.mark;
    // @ts-ignore
    delete mockWindow.performance.mark;

    const mockFn = jest.fn();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    measurePerformance('test-function', mockFn);

    expect(mockFn).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Performance: test-function took 50ms');

    mockWindow.performance.mark = originalMark;
    consoleSpy.mockRestore();
  });

  it('should work in SSR environment', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const mockFn = jest.fn();

    measurePerformance('test-function', mockFn);

    expect(mockFn).toHaveBeenCalled();

    global.window = originalWindow;
  });
});

describe('trackWebVitals', () => {
  it('should set up performance observers', () => {
    trackWebVitals();

    expect(PerformanceObserver).toHaveBeenCalledTimes(2);

    const observers = (PerformanceObserver as jest.Mock).mock.results;
    expect(observers[0].value.observe).toHaveBeenCalledWith({
      entryTypes: ['largest-contentful-paint']
    });
    expect(observers[1].value.observe).toHaveBeenCalledWith({
      entryTypes: ['first-input']
    });
  });

  it('should handle observer creation failures gracefully', () => {
    const mockObserver = {
      observe: jest.fn().mockImplementation(() => {
        throw new Error('Observer not supported');
      })
    };
    (PerformanceObserver as jest.Mock).mockReturnValue(mockObserver);

    expect(() => trackWebVitals()).not.toThrow();
  });

  it('should not run in SSR environment', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    trackWebVitals();

    expect(PerformanceObserver).not.toHaveBeenCalled();

    global.window = originalWindow;
  });
});

describe('SimpleCache', () => {
  let cache: SimpleCache<string>;

  beforeEach(() => {
    cache = new SimpleCache<string>();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should store and retrieve data', () => {
    cache.set('key1', 'value1');

    const result = cache.get('key1');
    expect(result).toBe('value1');
  });

  it('should return null for non-existent keys', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
  });

  it('should expire data after TTL', () => {
    cache.set('key1', 'value1', 1); // 1 minute TTL

    // Data should be available immediately
    expect(cache.get('key1')).toBe('value1');

    // Fast-forward time beyond TTL
    jest.advanceTimersByTime(61 * 1000); // 61 seconds

    // Data should be expired
    expect(cache.get('key1')).toBeNull();
  });

  it('should use default TTL when not specified', () => {
    cache.set('key1', 'value1'); // Uses default 15 minutes

    jest.advanceTimersByTime(14 * 60 * 1000); // 14 minutes
    expect(cache.get('key1')).toBe('value1');

    jest.advanceTimersByTime(2 * 60 * 1000); // +2 minutes = 16 minutes total
    expect(cache.get('key1')).toBeNull();
  });

  it('should clear all data', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    expect(cache.size()).toBe(2);

    cache.clear();

    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('should report correct size', () => {
    expect(cache.size()).toBe(0);

    cache.set('key1', 'value1');
    expect(cache.size()).toBe(1);

    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);

    cache.get('key1'); // Should not affect size
    expect(cache.size()).toBe(2);
  });

  it('should handle different data types', () => {
    const objectCache = new SimpleCache<any>();

    objectCache.set('string', 'text');
    objectCache.set('number', 42);
    objectCache.set('object', { key: 'value' });
    objectCache.set('array', [1, 2, 3]);

    expect(objectCache.get('string')).toBe('text');
    expect(objectCache.get('number')).toBe(42);
    expect(objectCache.get('object')).toEqual({ key: 'value' });
    expect(objectCache.get('array')).toEqual([1, 2, 3]);
  });
});

describe('performanceCache', () => {
  beforeEach(() => {
    performanceCache.clear();
  });

  it('should be a global cache instance', () => {
    performanceCache.set('global-key', 'global-value');

    expect(performanceCache.get('global-key')).toBe('global-value');
    expect(performanceCache.size()).toBe(1);
  });

  it('should persist between imports', () => {
    // This tests that the cache is a singleton
    performanceCache.set('persistent-key', 'persistent-value');

    // In a real scenario, this would be tested by importing in different modules
    expect(performanceCache.get('persistent-key')).toBe('persistent-value');
  });
});

describe('analyzeBundleSize', () => {
  it('should log bundle analysis in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    analyzeBundleSize();

    expect(consoleSpy).toHaveBeenCalledWith('Bundle analysis: Use `npm run analyze` to analyze bundle size');
    expect(consoleSpy).toHaveBeenCalledWith('Performance metrics:', expect.any(Object));

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });

  it('should not log in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    analyzeBundleSize();

    expect(consoleSpy).not.toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
    consoleSpy.mockRestore();
  });
});

describe('trackErrorBoundaryPerformance', () => {
  it('should log error boundary performance data', () => {
    const error = new Error('Component crashed');
    const errorInfo = {
      componentStack: 'Component stack trace'
    };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    trackErrorBoundaryPerformance(error, errorInfo);

    expect(consoleSpy).toHaveBeenCalledWith('Error Boundary Performance Impact:', {
      error: 'Component crashed',
      componentStack: 'Component stack trace',
      timestamp: expect.any(String),
      userAgent: expect.any(String),
      memoryInfo: expect.any(Object),
      connectionInfo: expect.any(Object)
    });

    consoleSpy.mockRestore();
  });

  it('should handle missing navigator', () => {
    const originalNavigator = global.navigator;
    // @ts-ignore
    delete global.navigator;

    const error = new Error('Test error');
    const errorInfo = { componentStack: 'stack' };

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    trackErrorBoundaryPerformance(error, errorInfo);

    expect(consoleSpy).toHaveBeenCalledWith('Error Boundary Performance Impact:', {
      error: 'Test error',
      componentStack: 'stack',
      timestamp: expect.any(String),
      userAgent: 'unknown',
      memoryInfo: expect.any(Object),
      connectionInfo: expect.any(Object)
    });

    global.navigator = originalNavigator;
    consoleSpy.mockRestore();
  });
});

describe('createIntersectionObserver', () => {
  it('should create intersection observer with callback', () => {
    const mockCallback = jest.fn();

    const observer = createIntersectionObserver(mockCallback);

    expect(IntersectionObserver).toHaveBeenCalledWith(mockCallback, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });
    expect(observer).toBe(mockIntersectionObserver);
  });

  it('should return null in SSR environment', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;

    const observer = createIntersectionObserver(jest.fn());

    expect(observer).toBeNull();

    global.window = originalWindow;
  });
});

// Performance and stress tests
describe('Performance Utilities Performance', () => {
  it('should handle rapid debounce calls efficiently', (done) => {
    const mockFn = jest.fn();
    const debouncedFn = debounce(mockFn, 10);

    const start = performance.now();

    // Simulate rapid calls
    for (let i = 0; i < 1000; i++) {
      debouncedFn(`call-${i}`);
    }

    setTimeout(() => {
      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should handle 1000 calls quickly
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call-999');
      done();
    }, 25);
  });

  it('should handle large cache operations efficiently', () => {
    const cache = new SimpleCache<string>();
    const start = performance.now();

    // Add many items to cache
    for (let i = 0; i < 1000; i++) {
      cache.set(`key-${i}`, `value-${i}`);
    }

    // Retrieve all items
    for (let i = 0; i < 1000; i++) {
      cache.get(`key-${i}`);
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete within 100ms
    expect(cache.size()).toBe(1000);
  });

  it('should handle concurrent throttle calls', () => {
    jest.useFakeTimers();

    const mockFn = jest.fn();
    const throttledFn = throttle(mockFn, 100);

    const start = performance.now();

    // Simulate concurrent calls from different sources
    const promises = Array(100).fill(0).map((_, i) => {
      return new Promise<void>(resolve => {
        setTimeout(() => {
          throttledFn(`concurrent-${i}`);
          resolve();
        }, i); // Stagger calls by 1ms each
      });
    });

    jest.runAllTimers();

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50); // Should handle concurrent calls efficiently
    expect(mockFn).toHaveBeenCalledTimes(1); // Only first call should execute

    jest.useRealTimers();
  });
});

// Edge cases and error scenarios
describe('Performance Utilities Edge Cases', () => {
  it('should handle debounce with function that throws', (done) => {
    const errorFn = jest.fn(() => {
      throw new Error('Function error');
    });
    const debouncedFn = debounce(errorFn, 50);

    debouncedFn();

    setTimeout(() => {
      expect(errorFn).toHaveBeenCalled();
      // Error should not prevent debounce from working
      done();
    }, 75);
  });

  it('should handle throttle with function that throws', () => {
    const errorFn = jest.fn(() => {
      throw new Error('Function error');
    });
    const throttledFn = throttle(errorFn, 100);

    expect(() => throttledFn()).toThrow('Function error');
    expect(errorFn).toHaveBeenCalled();
  });

  it('should handle cache with undefined and null values', () => {
    const cache = new SimpleCache<any>();

    cache.set('undefined-key', undefined);
    cache.set('null-key', null);
    cache.set('false-key', false);
    cache.set('zero-key', 0);
    cache.set('empty-string-key', '');

    expect(cache.get('undefined-key')).toBeUndefined();
    expect(cache.get('null-key')).toBeNull();
    expect(cache.get('false-key')).toBe(false);
    expect(cache.get('zero-key')).toBe(0);
    expect(cache.get('empty-string-key')).toBe('');
  });

  it('should handle device detection with unusual user agents', () => {
    // Test with empty user agent
    mockNavigator.userAgent = '';
    let deviceInfo = getDeviceInfo();
    expect(deviceInfo.isDesktop).toBe(true);

    // Test with unusual mobile user agent
    mockNavigator.userAgent = 'Custom Mobile Browser 1.0 (iPhone-like)';
    deviceInfo = getDeviceInfo();
    expect(deviceInfo.isMobile).toBe(false); // Doesn't match standard patterns

    // Test with bot user agent
    mockNavigator.userAgent = 'GoogleBot/2.1';
    deviceInfo = getDeviceInfo();
    expect(deviceInfo.isDesktop).toBe(true);
  });

  it('should handle image optimization with extreme values', () => {
    // Very large width
    let src = getOptimizedImageSrc('image.jpg', 10000, 100);
    expect(src).toBe('image.jpg?w=15000&q=100');

    // Zero width
    src = getOptimizedImageSrc('image.jpg', 0, 50);
    expect(src).toBe('image.jpg?w=0&q=50');

    // Negative width (should still work)
    src = getOptimizedImageSrc('image.jpg', -100, 75);
    expect(src).toBe('image.jpg?w=-150&q=75');
  });
});