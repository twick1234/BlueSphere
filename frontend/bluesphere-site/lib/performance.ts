/*
 * BlueSphere Performance Utilities
 * Copyright (c) 2025 Mark Lindon — BlueSphere
 *
 * Performance optimization utilities for enhanced mobile and desktop experience
 */

import React from 'react';

// Lazy loading utility for images
export const createIntersectionObserver = (callback: IntersectionObserverCallback) => {
  if (typeof window === 'undefined') return null;

  return new IntersectionObserver(callback, {
    rootMargin: '50px 0px',
    threshold: 0.1
  });
};

// Debounce utility for performance-critical operations
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Throttle utility for scroll and resize events
export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// Check if user prefers reduced motion
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Device detection utilities
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      hasTouch: false,
      pixelRatio: 1
    };
  }

  const userAgent = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
  const hasTouch = 'ontouchstart' in window;

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    hasTouch,
    pixelRatio: window.devicePixelRatio || 1
  };
};

// Memory usage monitoring
export const getMemoryInfo = () => {
  if (typeof window === 'undefined' || !('memory' in performance)) {
    return null;
  }

  const memory = (performance as any).memory;
  return {
    used: Math.round(memory.usedJSHeapSize / 1048576), // MB
    total: Math.round(memory.totalJSHeapSize / 1048576), // MB
    limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
  };
};

// Connection speed detection
export const getConnectionInfo = () => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return { effectiveType: '4g', downlink: 10 };
  }

  const connection = (navigator as any).connection;
  return {
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 100,
    saveData: connection.saveData || false
  };
};

// Image optimization utilities
export const getOptimizedImageSrc = (
  baseSrc: string,
  width: number,
  quality: number = 80
): string => {
  // In a real implementation, this would integrate with Next.js Image optimization
  // or a service like Cloudinary/Vercel Image Optimization
  const connection = getConnectionInfo();
  const device = getDeviceInfo();

  // Reduce quality for slower connections or data saver mode
  if (connection.effectiveType === '2g' || connection.saveData) {
    quality = Math.min(quality, 60);
  }

  // Adjust for high DPI displays
  const scaledWidth = Math.round(width * (device.pixelRatio > 1 ? 1.5 : 1));

  return `${baseSrc}?w=${scaledWidth}&q=${quality}`;
};

// Preload critical resources
export const preloadResource = (href: string, as: string, type?: string) => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  if (type) link.type = type;

  document.head.appendChild(link);
};

// Lazy load images with intersection observer
export const useLazyImage = (ref: React.RefObject<HTMLImageElement>, src: string) => {
  React.useEffect(() => {
    if (!ref.current) return;

    const observer = createIntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target instanceof HTMLImageElement) {
          entry.target.src = src;
          entry.target.classList.remove('lazy-loading');
          entry.target.classList.add('lazy-loaded');
          observer?.unobserve(entry.target);
        }
      });
    });

    if (observer && ref.current) {
      ref.current.classList.add('lazy-loading');
      observer.observe(ref.current);
    }

    return () => {
      if (observer && ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref, src]);
};

// Performance monitoring
export const measurePerformance = (name: string, fn: () => void) => {
  if (typeof window === 'undefined') {
    fn();
    return;
  }

  const startTime = performance.now();
  fn();
  const endTime = performance.now();

  console.log(`Performance: ${name} took ${endTime - startTime}ms`);

  // Mark performance in browser dev tools
  if ('mark' in performance) {
    performance.mark(`${name}-start`);
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  }
};

// Web Vitals tracking
export const trackWebVitals = () => {
  if (typeof window === 'undefined') return;

  // Track Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1] as PerformanceEntry;

    if (lastEntry) {
      console.log(`LCP: ${lastEntry.startTime}ms`);
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // Fallback for browsers that don't support LCP
  }

  // Track First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry: any) => {
      console.log(`FID: ${entry.processingStart - entry.startTime}ms`);
    });
  });

  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // Fallback for browsers that don't support FID
  }
};

// Cache utilities
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttlMinutes: number = 15): void {
    const ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Global performance cache instance
export const performanceCache = new SimpleCache();

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV !== 'development') return;

  console.log('Bundle analysis: Use `npm run analyze` to analyze bundle size');

  // Log current performance metrics instead
  if (typeof window !== 'undefined') {
    const memory = getMemoryInfo();
    const connection = getConnectionInfo();

    console.log('Performance metrics:', {
      memory,
      connection,
      timestamp: new Date().toISOString()
    });
  }
};

// Error boundary performance tracking
export const trackErrorBoundaryPerformance = (error: Error, errorInfo: any) => {
  console.error('Error Boundary Performance Impact:', {
    error: error.message,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    memoryInfo: getMemoryInfo(),
    connectionInfo: getConnectionInfo()
  });
};

export default {
  debounce,
  throttle,
  prefersReducedMotion,
  getDeviceInfo,
  getMemoryInfo,
  getConnectionInfo,
  getOptimizedImageSrc,
  preloadResource,
  measurePerformance,
  trackWebVitals,
  performanceCache,
  analyzeBundleSize,
  trackErrorBoundaryPerformance
};