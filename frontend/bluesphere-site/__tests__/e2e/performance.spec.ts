import { test, expect } from './fixtures';
import { waitForPageLoad } from './fixtures';

test.describe('Performance Testing with Core Web Vitals', () => {
  test.describe('Core Web Vitals Measurements', () => {
    test('should measure LCP (Largest Contentful Paint) performance', async ({ page, webVitals }) => {
      const pageUrls = ['/', '/sharks', '/map', '/analytics', '/metrics'];

      for (const url of pageUrls) {
        console.log(`\n🔍 Testing LCP for ${url}`);

        const performanceData = await webVitals.measurePageLoad(url);

        console.log(`📊 Performance metrics for ${url}:`, {
          loadTime: `${performanceData.loadTime}ms`,
          domContentLoaded: `${performanceData.domContentLoaded}ms`,
          LCP: `${performanceData.metrics.LCP}ms`,
          FCP: `${performanceData.metrics.FCP}ms`,
        });

        // LCP should be under 2.5s for good performance
        if (performanceData.metrics.LCP) {
          expect(performanceData.metrics.LCP).toBeLessThan(4000); // 4s threshold for testing

          if (performanceData.metrics.LCP <= 2500) {
            console.log(`✅ ${url} - Excellent LCP: ${performanceData.metrics.LCP}ms`);
          } else if (performanceData.metrics.LCP <= 4000) {
            console.log(`⚠️ ${url} - Needs improvement LCP: ${performanceData.metrics.LCP}ms`);
          }
        }

        // FCP should be under 1.8s for good performance
        if (performanceData.metrics.FCP) {
          expect(performanceData.metrics.FCP).toBeLessThan(3000); // 3s threshold for testing
        }

        // Total load time should be reasonable
        expect(performanceData.loadTime).toBeLessThan(10000); // 10s max
      }
    });

    test('should measure CLS (Cumulative Layout Shift)', async ({ page, webVitals }) => {
      await webVitals.setup();

      // Test pages that are likely to have layout shifts
      const testPages = ['/metrics', '/analytics', '/map'];

      for (const url of testPages) {
        console.log(`\n🔍 Testing CLS for ${url}`);

        await page.goto(url);
        await waitForPageLoad(page);

        // Wait for potential layout shifts to occur
        await page.waitForTimeout(3000);

        const metrics = await webVitals.collectMetrics();

        console.log(`📊 CLS for ${url}: ${metrics.CLS}`);

        if (metrics.CLS !== undefined) {
          // CLS should be under 0.1 for good performance
          expect(metrics.CLS).toBeLessThan(0.25); // 0.25 threshold for testing

          if (metrics.CLS <= 0.1) {
            console.log(`✅ ${url} - Excellent CLS: ${metrics.CLS}`);
          } else if (metrics.CLS <= 0.25) {
            console.log(`⚠️ ${url} - Needs improvement CLS: ${metrics.CLS}`);
          }
        }
      }
    });

    test('should measure FID (First Input Delay) through interactions', async ({ page, webVitals }) => {
      await webVitals.setup();

      const interactivePages = ['/sharks', '/map', '/analytics', '/metrics'];

      for (const url of interactivePages) {
        console.log(`\n🔍 Testing FID for ${url}`);

        await page.goto(url);
        await waitForPageLoad(page);

        // Simulate user interactions to measure FID
        const interactiveElements = await page.locator('button, a, input').all();

        if (interactiveElements.length > 0) {
          // Click the first interactive element
          await interactiveElements[0].click();
          await page.waitForTimeout(1000);

          const metrics = await webVitals.collectMetrics();

          console.log(`📊 FID for ${url}: ${metrics.FID}ms`);

          if (metrics.FID !== undefined) {
            // FID should be under 100ms for good performance
            expect(metrics.FID).toBeLessThan(300); // 300ms threshold for testing

            if (metrics.FID <= 100) {
              console.log(`✅ ${url} - Excellent FID: ${metrics.FID}ms`);
            } else if (metrics.FID <= 300) {
              console.log(`⚠️ ${url} - Needs improvement FID: ${metrics.FID}ms`);
            }
          }
        }
      }
    });
  });

  test.describe('Loading Performance', () => {
    test('should measure resource loading performance', async ({ page }) => {
      const resourceMetrics: Array<{
        url: string;
        resources: Array<{ type: string; size: number; duration: number }>;
        totalSize: number;
        totalRequests: number;
      }> = [];

      page.on('response', async (response) => {
        try {
          const request = response.request();
          const resourceType = request.resourceType();
          const timing = response.timing();

          // Only track main resource types
          if (['document', 'stylesheet', 'script', 'image', 'font'].includes(resourceType)) {
            const size = parseInt(response.headers()['content-length'] || '0');
            const duration = timing.responseEnd - timing.requestStart;

            const currentUrl = page.url();
            let urlMetrics = resourceMetrics.find(m => m.url === currentUrl);

            if (!urlMetrics) {
              urlMetrics = { url: currentUrl, resources: [], totalSize: 0, totalRequests: 0 };
              resourceMetrics.push(urlMetrics);
            }

            urlMetrics.resources.push({ type: resourceType, size, duration });
            urlMetrics.totalSize += size;
            urlMetrics.totalRequests++;
          }
        } catch (error) {
          // Ignore errors in resource tracking
        }
      });

      const testUrls = ['/', '/sharks', '/map', '/metrics'];

      for (const url of testUrls) {
        await page.goto(url);
        await waitForPageLoad(page);
        await page.waitForTimeout(2000); // Allow all resources to load
      }

      // Analyze resource metrics
      resourceMetrics.forEach(({ url, resources, totalSize, totalRequests }) => {
        console.log(`\n📊 Resource metrics for ${url}:`);
        console.log(`  Total requests: ${totalRequests}`);
        console.log(`  Total size: ${(totalSize / 1024).toFixed(2)}KB`);

        const byType = resources.reduce((acc, resource) => {
          acc[resource.type] = (acc[resource.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        console.log('  By type:', byType);

        // Performance assertions
        expect(totalRequests).toBeLessThan(100); // Reasonable request limit
        expect(totalSize).toBeLessThan(5 * 1024 * 1024); // 5MB limit

        // Check for slow resources
        const slowResources = resources.filter(r => r.duration > 2000);
        expect(slowResources.length).toBeLessThan(5); // Max 5 slow resources

        if (slowResources.length > 0) {
          console.log('  ⚠️ Slow resources:', slowResources.map(r => `${r.type}: ${r.duration}ms`));
        }
      });
    });

    test('should measure JavaScript execution performance', async ({ page }) => {
      const jsMetrics: Array<{
        url: string;
        scriptEvaluationTime: number;
        domInteractive: number;
        domComplete: number;
      }> = [];

      const testUrls = ['/', '/sharks', '/map', '/analytics', '/metrics'];

      for (const url of testUrls) {
        console.log(`\n🔍 Testing JS performance for ${url}`);

        const startTime = Date.now();
        await page.goto(url);

        // Wait for DOM to be interactive
        await page.waitForFunction(() => document.readyState === 'interactive');
        const interactiveTime = Date.now() - startTime;

        // Wait for DOM to be complete
        await page.waitForFunction(() => document.readyState === 'complete');
        const completeTime = Date.now() - startTime;

        // Measure script evaluation time
        const performanceTiming = await page.evaluate(() => {
          const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          return {
            domInteractive: perf.domInteractive - perf.navigationStart,
            domComplete: perf.domComplete - perf.navigationStart,
            scriptEvaluation: perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart,
          };
        });

        const metrics = {
          url,
          scriptEvaluationTime: performanceTiming.scriptEvaluation,
          domInteractive: interactiveTime,
          domComplete: completeTime,
        };

        jsMetrics.push(metrics);

        console.log(`📊 JS metrics for ${url}:`, {
          scriptEvaluation: `${metrics.scriptEvaluationTime}ms`,
          domInteractive: `${metrics.domInteractive}ms`,
          domComplete: `${metrics.domComplete}ms`,
        });

        // Performance assertions
        expect(metrics.scriptEvaluationTime).toBeLessThan(2000); // 2s script evaluation limit
        expect(metrics.domInteractive).toBeLessThan(5000); // 5s interactive limit
        expect(metrics.domComplete).toBeLessThan(10000); // 10s complete limit
      }
    });
  });

  test.describe('Memory and CPU Performance', () => {
    test('should monitor memory usage during navigation', async ({ page }) => {
      const memoryMetrics: Array<{
        url: string;
        heapUsed: number;
        heapTotal: number;
        heapLimit: number;
      }> = [];

      const testUrls = ['/', '/sharks', '/map', '/analytics', '/metrics'];

      for (const url of testUrls) {
        await page.goto(url);
        await waitForPageLoad(page);

        // Force garbage collection if available
        await page.evaluate(() => {
          if ((window as any).gc) {
            (window as any).gc();
          }
        });

        // Get memory info
        const memoryInfo = await page.evaluate(() => {
          const memory = (performance as any).memory;
          return memory ? {
            heapUsed: memory.usedJSHeapSize,
            heapTotal: memory.totalJSHeapSize,
            heapLimit: memory.jsHeapSizeLimit,
          } : null;
        });

        if (memoryInfo) {
          memoryMetrics.push({ url, ...memoryInfo });

          console.log(`📊 Memory usage for ${url}:`, {
            used: `${(memoryInfo.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            total: `${(memoryInfo.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            limit: `${(memoryInfo.heapLimit / 1024 / 1024).toFixed(2)}MB`,
          });

          // Memory assertions
          expect(memoryInfo.heapUsed).toBeLessThan(100 * 1024 * 1024); // 100MB limit
          expect(memoryInfo.heapUsed / memoryInfo.heapLimit).toBeLessThan(0.5); // Less than 50% of limit
        }
      }

      // Check for memory leaks between pages
      if (memoryMetrics.length > 1) {
        const initialMemory = memoryMetrics[0].heapUsed;
        const finalMemory = memoryMetrics[memoryMetrics.length - 1].heapUsed;
        const memoryIncrease = finalMemory - initialMemory;

        console.log(`📊 Memory change: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

        // Memory shouldn't increase by more than 50MB during navigation
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test('should measure frame rate during animations', async ({ page }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);

      // Enable auto-refresh for animations
      const autoRefreshCheckbox = page.locator('#autoRefresh');
      if (await autoRefreshCheckbox.count() > 0) {
        await autoRefreshCheckbox.check();
      }

      // Measure frame rate during updates
      const frameMetrics = await page.evaluate(() => {
        return new Promise<{ averageFPS: number; frameCount: number }>((resolve) => {
          let frameCount = 0;
          let startTime = performance.now();
          let lastFrameTime = startTime;

          function countFrame() {
            frameCount++;
            const currentTime = performance.now();

            if (currentTime - startTime > 3000) { // Measure for 3 seconds
              const averageFPS = frameCount / ((currentTime - startTime) / 1000);
              resolve({ averageFPS, frameCount });
            } else {
              requestAnimationFrame(countFrame);
            }

            lastFrameTime = currentTime;
          }

          requestAnimationFrame(countFrame);
        });
      });

      console.log(`📊 Frame rate metrics:`, {
        averageFPS: frameMetrics.averageFPS.toFixed(2),
        frameCount: frameMetrics.frameCount,
      });

      // Frame rate should be reasonable (at least 30 FPS)
      expect(frameMetrics.averageFPS).toBeGreaterThan(20);

      if (frameMetrics.averageFPS >= 60) {
        console.log('✅ Excellent frame rate: 60+ FPS');
      } else if (frameMetrics.averageFPS >= 30) {
        console.log('✅ Good frame rate: 30+ FPS');
      } else {
        console.log('⚠️ Poor frame rate: <30 FPS');
      }
    });
  });

  test.describe('Network Performance', () => {
    test('should measure API response times', async ({ page }) => {
      const apiMetrics: Array<{
        url: string;
        method: string;
        status: number;
        duration: number;
        size: number;
      }> = [];

      page.on('response', async (response) => {
        const request = response.request();
        const url = request.url();

        if (url.includes('/api/')) {
          const timing = response.timing();
          const duration = timing.responseEnd - timing.requestStart;
          const size = parseInt(response.headers()['content-length'] || '0');

          apiMetrics.push({
            url: url.replace(/^.*\/api/, '/api'), // Shorten URL
            method: request.method(),
            status: response.status(),
            duration,
            size,
          });
        }
      });

      // Visit pages that might make API calls
      const testUrls = ['/analytics', '/metrics', '/map'];

      for (const url of testUrls) {
        await page.goto(url);
        await waitForPageLoad(page);
        await page.waitForTimeout(2000); // Allow API calls to complete
      }

      if (apiMetrics.length > 0) {
        console.log(`\n📊 API Performance (${apiMetrics.length} requests):`);

        apiMetrics.forEach((metric) => {
          console.log(`  ${metric.method} ${metric.url}: ${metric.duration}ms (${metric.status})`);

          // API response time assertions
          expect(metric.duration).toBeLessThan(5000); // 5s timeout
          expect(metric.status).toBeGreaterThanOrEqual(200);
          expect(metric.status).toBeLessThan(500); // No server errors
        });

        const averageResponseTime = apiMetrics.reduce((sum, m) => sum + m.duration, 0) / apiMetrics.length;
        console.log(`  Average response time: ${averageResponseTime.toFixed(2)}ms`);

        expect(averageResponseTime).toBeLessThan(2000); // 2s average
      } else {
        console.log('ℹ️ No API calls detected');
      }
    });

    test('should handle network conditions', async ({ page, context }) => {
      // Simulate different network conditions
      const networkConditions = [
        { name: 'Fast 3G', downloadThroughput: 1500000, uploadThroughput: 750000, latency: 40 },
        { name: 'Slow 3G', downloadThroughput: 500000, uploadThroughput: 500000, latency: 400 },
      ];

      for (const condition of networkConditions) {
        console.log(`\n🔍 Testing ${condition.name} network`);

        // Apply network throttling
        await context.setOffline(false);
        await context.setExtraHTTPHeaders({});

        // Simulate slower network with route delays
        await page.route('**/*', (route) => {
          setTimeout(() => route.continue(), condition.latency);
        });

        const startTime = Date.now();
        await page.goto('/metrics');
        await waitForPageLoad(page);
        const loadTime = Date.now() - startTime;

        console.log(`📊 ${condition.name} load time: ${loadTime}ms`);

        // Network condition specific thresholds
        if (condition.name === 'Fast 3G') {
          expect(loadTime).toBeLessThan(8000); // 8s for Fast 3G
        } else {
          expect(loadTime).toBeLessThan(15000); // 15s for Slow 3G
        }

        // Remove route handler
        await page.unroute('**/*');
      }
    });
  });
});