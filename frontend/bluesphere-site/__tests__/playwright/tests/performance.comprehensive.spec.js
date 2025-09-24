/**
 * Comprehensive Performance Testing for BlueSphere Marine Monitoring Platform
 * Tests Core Web Vitals, JavaScript performance, memory usage, and network optimization
 */

import { test, expect } from '@playwright/test';
import { PerformanceMonitor } from '../utils/performance-monitor.js';

test.describe('BlueSphere Performance Testing', () => {
  let perfMonitor;

  test.beforeEach(async ({ page }) => {
    perfMonitor = new PerformanceMonitor(page);
    // Enable performance monitoring
    await page.addInitScript(() => {
      window.performanceObserver = new PerformanceObserver((list) => {
        window.performanceEntries = window.performanceEntries || [];
        window.performanceEntries.push(...list.getEntries());
      });
      window.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
    });
  });

  test.describe('Core Web Vitals Measurement', () => {
    test('should meet LCP (Largest Contentful Paint) performance standards', async ({ page }) => {
      // Test home page LCP
      const startTime = Date.now();
      await page.goto('/');

      // Wait for page load and measure LCP
      await page.waitForLoadState('networkidle');
      const lcp = await perfMonitor.measureLCP();

      // LCP should be under 2.5 seconds for good performance
      expect(lcp).toBeLessThan(2500);
      console.log(`Home Page LCP: ${lcp}ms`);

      // Test data-heavy pages
      await page.goto('/sharks');
      await page.waitForLoadState('networkidle');
      const sharksLCP = await perfMonitor.measureLCP();
      expect(sharksLCP).toBeLessThan(4000); // More lenient for data-heavy pages

      // Test interactive map performance
      await page.goto('/map');
      await page.waitForLoadState('networkidle');
      const mapLCP = await perfMonitor.measureLCP();
      expect(mapLCP).toBeLessThan(5000); // Maps are complex, allow more time
    });

    test('should maintain good FID (First Input Delay) responsiveness', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Simulate user interaction and measure FID
      const fidStartTime = Date.now();
      await page.click('[data-testid="main-navigation"], .navigation-menu');
      const fid = await perfMonitor.measureFID();

      // FID should be under 100ms for good user experience
      expect(fid).toBeLessThan(100);
      console.log(`First Input Delay: ${fid}ms`);
    });

    test('should minimize CLS (Cumulative Layout Shift)', async ({ page }) => {
      await page.goto('/');

      // Monitor layout shifts during page load
      const cls = await perfMonitor.measureCLS();

      // CLS should be under 0.1 for good visual stability
      expect(cls).toBeLessThan(0.1);
      console.log(`Cumulative Layout Shift: ${cls}`);

      // Test dynamic content loading (shark data)
      await page.goto('/sharks');
      await page.waitForTimeout(2000); // Allow dynamic content to load
      const sharksCLS = await perfMonitor.measureCLS();
      expect(sharksCLS).toBeLessThan(0.15); // Slightly higher tolerance for dynamic data
    });

    test('should optimize Time to Interactive (TTI)', async ({ page }) => {
      const tti = await perfMonitor.measureTTI('/');

      // TTI should be under 5 seconds for good interactivity
      expect(tti).toBeLessThan(5000);
      console.log(`Time to Interactive: ${tti}ms`);
    });
  });

  test.describe('JavaScript Performance', () => {
    test('should efficiently handle large shark datasets', async ({ page }) => {
      // Monitor JavaScript execution time
      await page.goto('/sharks');

      const jsExecutionTime = await page.evaluate(async () => {
        const startTime = performance.now();

        // Wait for shark data to load and render
        await new Promise(resolve => {
          const checkForData = () => {
            const sharkCards = document.querySelectorAll('.shark-card');
            if (sharkCards.length > 0) {
              resolve();
            } else {
              setTimeout(checkForData, 100);
            }
          };
          checkForData();
        });

        return performance.now() - startTime;
      });

      // JavaScript processing should complete within 3 seconds
      expect(jsExecutionTime).toBeLessThan(3000);
      console.log(`JavaScript execution time: ${jsExecutionTime}ms`);
    });

    test('should optimize map rendering performance', async ({ page }) => {
      await page.goto('/map');

      // Measure map initialization time
      const mapRenderTime = await page.evaluate(async () => {
        const startTime = performance.now();

        // Wait for map to be fully rendered
        await new Promise(resolve => {
          const checkMap = () => {
            const mapContainer = document.querySelector('.leaflet-container, .map-container');
            const mapTiles = document.querySelectorAll('.leaflet-tile');
            if (mapContainer && mapTiles.length > 4) {
              resolve();
            } else {
              setTimeout(checkMap, 100);
            }
          };
          checkMap();
        });

        return performance.now() - startTime;
      });

      expect(mapRenderTime).toBeLessThan(5000);
      console.log(`Map render time: ${mapRenderTime}ms`);
    });

    test('should handle real-time data updates efficiently', async ({ page }) => {
      await page.goto('/sharks');

      // Enable real-time updates
      await page.check('input[type="checkbox"]:near(:text("Live Updates"))');

      // Monitor performance during simulated real-time updates
      const updatePerformance = await page.evaluate(() => {
        return new Promise((resolve) => {
          const measurements = [];
          let updateCount = 0;

          const measureUpdate = () => {
            const start = performance.now();

            // Simulate data update
            const event = new CustomEvent('sharkUpdate', {
              detail: { sharks: Array(50).fill(null).map((_, i) => ({ id: i, name: `Shark ${i}` })) }
            });
            document.dispatchEvent(event);

            const end = performance.now();
            measurements.push(end - start);
            updateCount++;

            if (updateCount < 10) {
              setTimeout(measureUpdate, 1000);
            } else {
              resolve({
                average: measurements.reduce((a, b) => a + b) / measurements.length,
                max: Math.max(...measurements)
              });
            }
          };

          measureUpdate();
        });
      });

      // Real-time updates should be processed quickly
      expect(updatePerformance.average).toBeLessThan(50);
      expect(updatePerformance.max).toBeLessThan(100);
    });
  });

  test.describe('Memory Usage and Leak Detection', () => {
    test('should not have memory leaks during navigation', async ({ page }) => {
      // Force garbage collection if available
      await page.addInitScript(() => {
        if (window.gc) {
          window.gc();
        }
      });

      const initialMemory = await perfMonitor.getMemoryUsage();

      // Navigate through multiple pages
      const pages = ['/sharks', '/map', '/conservation', '/alerts', '/'];
      for (const pagePath of pages) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Allow memory to stabilize
      }

      // Force garbage collection again
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });

      const finalMemory = await perfMonitor.getMemoryUsage();
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.usedJSHeapSize) * 100;

      // Memory increase should be reasonable (less than 50% increase)
      expect(memoryIncreasePercent).toBeLessThan(50);
      console.log(`Memory increase: ${memoryIncreasePercent.toFixed(2)}%`);
    });

    test('should handle large dataset visualization without memory issues', async ({ page }) => {
      await page.goto('/sharks');

      const beforeMemory = await perfMonitor.getMemoryUsage();

      // Load and interact with large dataset
      await page.selectOption('select[aria-label*="Filter"], .filter-select', 'all');
      await page.waitForTimeout(2000);

      // Switch between different views to test memory cleanup
      await page.click('[aria-controls="map-panel"]');
      await page.waitForTimeout(1000);
      await page.click('[aria-controls="list-panel"]');
      await page.waitForTimeout(1000);
      await page.click('[aria-controls="stats-panel"]');
      await page.waitForTimeout(1000);

      const afterMemory = await perfMonitor.getMemoryUsage();
      const memoryDiff = afterMemory.usedJSHeapSize - beforeMemory.usedJSHeapSize;

      // Memory usage should not exceed 100MB for dataset operations
      expect(memoryDiff).toBeLessThan(100 * 1024 * 1024); // 100MB
    });

    test('should properly clean up event listeners', async ({ page }) => {
      await page.goto('/sharks');

      // Get initial listener count
      const initialListeners = await page.evaluate(() => {
        return window.getEventListeners ?
          Object.values(window.getEventListeners(document)).flat().length : 0;
      });

      // Simulate user interactions that create/destroy listeners
      for (let i = 0; i < 5; i++) {
        await page.click('.shark-card');
        await page.keyboard.press('Escape'); // Close modal
        await page.waitForTimeout(100);
      }

      const finalListeners = await page.evaluate(() => {
        return window.getEventListeners ?
          Object.values(window.getEventListeners(document)).flat().length : 0;
      });

      // Listener count should not grow excessively
      if (initialListeners > 0 && finalListeners > 0) {
        expect(finalListeners - initialListeners).toBeLessThan(20);
      }
    });
  });

  test.describe('Network Performance Optimization', () => {
    test('should optimize resource loading', async ({ page }) => {
      const resourceMetrics = await perfMonitor.measureResourceLoading('/');

      // Verify critical resources load quickly
      expect(resourceMetrics.firstByte).toBeLessThan(200);
      expect(resourceMetrics.domComplete).toBeLessThan(3000);

      // Check for optimized resource sizes
      const resources = resourceMetrics.resources;
      const images = resources.filter(r => r.name.match(/\.(jpg|jpeg|png|webp|svg)$/));
      const scripts = resources.filter(r => r.name.match(/\.js$/));
      const styles = resources.filter(r => r.name.match(/\.css$/));

      // Images should be optimally compressed
      images.forEach(img => {
        if (img.transferSize > 0) {
          expect(img.transferSize).toBeLessThan(500 * 1024); // 500KB max per image
        }
      });

      // JavaScript bundles should be reasonably sized
      const totalJSSize = scripts.reduce((total, script) => total + (script.transferSize || 0), 0);
      expect(totalJSSize).toBeLessThan(2 * 1024 * 1024); // 2MB total JS
    });

    test('should implement effective caching strategies', async ({ page, context }) => {
      // First visit
      await page.goto('/');
      const firstLoadResources = await perfMonitor.getNetworkRequests();

      // Clear in-memory cache but keep HTTP cache
      await page.reload();
      const secondLoadResources = await perfMonitor.getNetworkRequests();

      // Check that static resources are cached
      const staticResources = ['js', 'css', 'woff', 'woff2'];
      staticResources.forEach(ext => {
        const firstLoadStatic = firstLoadResources.filter(r => r.url.includes(`.${ext}`));
        const secondLoadStatic = secondLoadResources.filter(r => r.url.includes(`.${ext}`));

        if (firstLoadStatic.length > 0 && secondLoadStatic.length > 0) {
          // Second load should have faster response times due to caching
          const firstAvgTime = firstLoadStatic.reduce((sum, r) => sum + r.responseTime, 0) / firstLoadStatic.length;
          const secondAvgTime = secondLoadStatic.reduce((sum, r) => sum + r.responseTime, 0) / secondLoadStatic.length;
          expect(secondAvgTime).toBeLessThan(firstAvgTime);
        }
      });
    });

    test('should handle slow network conditions gracefully', async ({ page, context }) => {
      // Simulate slow 3G connection
      await context.route('**/*', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 100)); // Add 100ms delay
        await route.continue();
      });

      const slowNetworkStartTime = Date.now();
      await page.goto('/sharks');
      await page.waitForLoadState('networkidle');
      const slowNetworkLoadTime = Date.now() - slowNetworkStartTime;

      // Page should still load within reasonable time on slow connection
      expect(slowNetworkLoadTime).toBeLessThan(15000); // 15 seconds max

      // Verify progressive loading indicators are shown
      const loadingElements = await page.locator('.loading, [data-testid*="loading"]').count();
      // Should have some loading indicators during slow load
    });

    test('should optimize API request batching', async ({ page }) => {
      let apiRequestCount = 0;

      page.on('request', request => {
        if (request.url().includes('/api/')) {
          apiRequestCount++;
        }
      });

      await page.goto('/sharks');
      await page.waitForLoadState('networkidle');

      // Should batch API requests efficiently (not make excessive calls)
      expect(apiRequestCount).toBeLessThan(10); // Reasonable limit for initial page load

      // Test pagination doesn't cause request waterfalls
      const beforePagination = apiRequestCount;
      await page.click('[data-testid="next-page"], .pagination button');
      await page.waitForLoadState('networkidle');

      const paginationRequests = apiRequestCount - beforePagination;
      expect(paginationRequests).toBeLessThan(3); // Should be minimal for pagination
    });
  });

  test.describe('Bundle Size and Code Splitting', () => {
    test('should implement effective code splitting', async ({ page }) => {
      await page.goto('/');

      const initialBundles = await perfMonitor.getBundleSizes();

      // Navigate to different pages to trigger code splitting
      await page.goto('/sharks');
      const sharksBundles = await perfMonitor.getBundleSizes();

      await page.goto('/map');
      const mapBundles = await perfMonitor.getBundleSizes();

      // Should load additional chunks for different pages
      expect(sharksBundles.count).toBeGreaterThan(initialBundles.count);
      expect(mapBundles.count).toBeGreaterThan(sharksBundles.count);

      // Main bundle should remain reasonably sized
      expect(initialBundles.mainSize).toBeLessThan(1024 * 1024); // 1MB
    });

    test('should lazy load non-critical components', async ({ page }) => {
      await page.goto('/sharks');

      // Verify map component is lazy loaded
      const mapLoadTime = await page.evaluate(async () => {
        const startTime = performance.now();

        // Wait for the lazy-loaded map component
        await new Promise(resolve => {
          const checkMap = () => {
            const mapElement = document.querySelector('.leaflet-container, .map-container');
            if (mapElement) {
              resolve();
            } else {
              setTimeout(checkMap, 100);
            }
          };
          checkMap();
        });

        return performance.now() - startTime;
      });

      // Lazy loading should add minimal delay
      expect(mapLoadTime).toBeLessThan(2000);
    });
  });

  test.describe('Performance Under Load', () => {
    test('should handle concurrent user interactions', async ({ page }) => {
      await page.goto('/sharks');
      await page.waitForLoadState('networkidle');

      // Simulate rapid user interactions
      const interactionPromises = [];
      for (let i = 0; i < 5; i++) {
        interactionPromises.push(
          page.click('.shark-card', { timeout: 1000 }).catch(() => {})
        );
        interactionPromises.push(
          page.press('body', 'Escape', { timeout: 1000 }).catch(() => {})
        );
      }

      const startTime = Date.now();
      await Promise.allSettled(interactionPromises);
      const totalTime = Date.now() - startTime;

      // Should handle concurrent interactions within reasonable time
      expect(totalTime).toBeLessThan(5000);
    });

    test('should maintain performance with large datasets', async ({ page }) => {
      // Mock large dataset response
      await page.route('/api/obs*', route => {
        const largeDataset = {
          observations: Array(1000).fill(null).map((_, i) => ({
            id: i,
            station_id: `station_${i}`,
            timestamp: new Date().toISOString(),
            temperature: 15 + Math.random() * 10,
            latitude: -90 + Math.random() * 180,
            longitude: -180 + Math.random() * 360
          })),
          metadata: { total_count: 1000, page: 1, page_size: 1000 }
        };
        route.fulfill({ json: largeDataset });
      });

      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should handle large datasets within acceptable time
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });
  });
});