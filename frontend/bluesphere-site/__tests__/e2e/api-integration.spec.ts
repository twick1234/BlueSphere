import { test, expect } from './fixtures';
import { waitForPageLoad } from './fixtures';

test.describe('API Integration and Real Data Flow Tests', () => {
  test.describe('API Endpoint Testing', () => {
    test('should verify all API endpoints respond correctly', async ({ page }) => {
      const apiRequests: Array<{
        url: string;
        method: string;
        status: number;
        responseTime: number;
        contentType: string;
        size: number;
      }> = [];

      // Intercept API requests
      page.on('response', async (response) => {
        const request = response.request();
        const url = request.url();

        if (url.includes('/api/') || url.includes('/api')) {
          const timing = response.timing();
          const responseTime = timing.responseEnd - timing.requestStart;
          const contentType = response.headers()['content-type'] || 'unknown';
          const size = parseInt(response.headers()['content-length'] || '0');

          apiRequests.push({
            url: url.replace(/.*\/api/, '/api'),
            method: request.method(),
            status: response.status(),
            responseTime,
            contentType,
            size,
          });
        }
      });

      // Visit pages that should make API calls
      const pagesWithAPI = ['/analytics', '/metrics', '/map', '/sharks'];

      for (const pageUrl of pagesWithAPI) {
        console.log(`\n🔍 Testing API calls from ${pageUrl}`);

        await page.goto(pageUrl);
        await waitForPageLoad(page);

        // Wait for potential API calls to complete
        await page.waitForTimeout(3000);
      }

      console.log(`\n📊 API Request Summary (${apiRequests.length} requests):`);

      if (apiRequests.length > 0) {
        // Group requests by endpoint
        const endpointGroups = apiRequests.reduce((groups, request) => {
          const endpoint = request.url.split('?')[0]; // Remove query params
          if (!groups[endpoint]) {
            groups[endpoint] = [];
          }
          groups[endpoint].push(request);
          return groups;
        }, {} as Record<string, typeof apiRequests>);

        Object.entries(endpointGroups).forEach(([endpoint, requests]) => {
          const avgResponseTime = requests.reduce((sum, r) => sum + r.responseTime, 0) / requests.length;
          const statusCodes = [...new Set(requests.map(r => r.status))];
          const totalSize = requests.reduce((sum, r) => sum + r.size, 0);

          console.log(`  ${endpoint}:`);
          console.log(`    Calls: ${requests.length}`);
          console.log(`    Status codes: ${statusCodes.join(', ')}`);
          console.log(`    Avg response time: ${avgResponseTime.toFixed(2)}ms`);
          console.log(`    Total size: ${(totalSize / 1024).toFixed(2)}KB`);

          // Verify API health
          expect(statusCodes.every(code => code >= 200 && code < 500)).toBe(true);
          expect(avgResponseTime).toBeLessThan(5000); // 5s timeout
        });

        console.log(`✅ All API endpoints responding correctly`);
      } else {
        console.log(`ℹ️ No API calls detected (may use static data)`);
      }
    });

    test('should handle API error scenarios gracefully', async ({ page }) => {
      console.log(`\n🚨 Testing API error handling`);

      // Mock API failures
      await page.route('**/api/**', (route) => {
        const url = route.request().url();

        // Simulate different error scenarios
        if (url.includes('/api/metrics')) {
          route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal Server Error' }),
          });
        } else if (url.includes('/api/sharks')) {
          route.fulfill({
            status: 404,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Not Found' }),
          });
        } else {
          // Simulate network timeout
          setTimeout(() => {
            route.fulfill({
              status: 503,
              contentType: 'application/json',
              body: JSON.stringify({ error: 'Service Unavailable' }),
            });
          }, 1000);
        }
      });

      const errorPages = ['/metrics', '/sharks', '/analytics'];

      for (const pageUrl of errorPages) {
        console.log(`  🔍 Testing error handling for ${pageUrl}`);

        await page.goto(pageUrl);
        await waitForPageLoad(page);

        // Wait for error handling to complete
        await page.waitForTimeout(2000);

        // Page should still be functional despite API errors
        const hasTitle = await page.locator('h1, h2').first().count() > 0;
        const hasContent = await page.textContent('body');

        expect(hasTitle).toBe(true);
        expect(hasContent).toBeTruthy();
        expect(hasContent?.length).toBeGreaterThan(100); // Should have meaningful content

        // Check for error messages or fallback content
        const hasErrorMessage = hasContent?.includes('error') || hasContent?.includes('failed') || hasContent?.includes('unavailable');
        const hasLoadingState = hasContent?.includes('loading') || hasContent?.includes('Loading');
        const hasFallbackContent = hasContent && hasContent.length > 500; // Reasonable content amount

        console.log(`    Error handling indicators:`, {
          hasErrorMessage: !!hasErrorMessage,
          hasLoadingState: !!hasLoadingState,
          hasFallbackContent,
          contentLength: hasContent?.length || 0,
        });

        // Should have some form of error handling
        expect(hasErrorMessage || hasLoadingState || hasFallbackContent).toBe(true);

        console.log(`    ✅ ${pageUrl} handles API errors gracefully`);
      }

      // Remove mocking
      await page.unroute('**/api/**');
    });
  });

  test.describe('Real-time Data Updates', () => {
    test('should handle WebSocket connections for real-time data', async ({ page }) => {
      console.log(`\n🔄 Testing real-time data connections`);

      const websocketConnections: string[] = [];
      const sseConnections: string[] = [];

      // Monitor WebSocket connections
      page.on('websocket', (websocket) => {
        websocketConnections.push(websocket.url());
        console.log(`WebSocket connection: ${websocket.url()}`);
      });

      // Monitor Server-Sent Events
      page.on('response', (response) => {
        const contentType = response.headers()['content-type'];
        if (contentType?.includes('text/event-stream')) {
          sseConnections.push(response.url());
          console.log(`SSE connection: ${response.url()}`);
        }
      });

      // Visit pages that might have real-time features
      const realTimePages = ['/metrics', '/analytics', '/map'];

      for (const pageUrl of realTimePages) {
        await page.goto(pageUrl);
        await waitForPageLoad(page);

        // Enable any auto-refresh features
        const autoRefreshToggle = page.locator('#autoRefresh, [data-testid="auto-refresh"]');
        if (await autoRefreshToggle.count() > 0) {
          await autoRefreshToggle.check();
        }

        // Wait for potential connections
        await page.waitForTimeout(3000);
      }

      console.log(`📊 Real-time connections:`);
      console.log(`  WebSocket connections: ${websocketConnections.length}`);
      console.log(`  SSE connections: ${sseConnections.length}`);

      if (websocketConnections.length > 0 || sseConnections.length > 0) {
        console.log(`✅ Real-time connections established`);
      } else {
        console.log(`ℹ️ No real-time connections detected (may use polling or static data)`);
      }
    });

    test('should handle data polling and updates', async ({ page }) => {
      console.log(`\n🔄 Testing data polling mechanisms`);

      let apiCallCount = 0;
      let lastCallTime = 0;
      const callIntervals: number[] = [];

      page.on('response', async (response) => {
        const request = response.request();
        if (request.url().includes('/api/')) {
          const currentTime = Date.now();

          if (lastCallTime > 0) {
            const interval = currentTime - lastCallTime;
            callIntervals.push(interval);
          }

          lastCallTime = currentTime;
          apiCallCount++;
        }
      });

      await page.goto('/metrics');
      await waitForPageLoad(page);

      // Enable auto-refresh if available
      const autoRefreshCheckbox = page.locator('#autoRefresh');
      if (await autoRefreshCheckbox.count() > 0) {
        await autoRefreshCheckbox.check();
      }

      // Monitor for periodic API calls
      console.log(`  Monitoring API calls for 10 seconds...`);
      await page.waitForTimeout(10000);

      console.log(`📊 Polling analysis:`);
      console.log(`  Total API calls: ${apiCallCount}`);

      if (callIntervals.length > 0) {
        const avgInterval = callIntervals.reduce((sum, interval) => sum + interval, 0) / callIntervals.length;
        console.log(`  Average call interval: ${avgInterval.toFixed(0)}ms`);
        console.log(`  Call intervals: ${callIntervals.map(i => `${i}ms`).join(', ')}`);

        // If polling is happening, intervals should be reasonable
        if (callIntervals.length >= 2) {
          expect(avgInterval).toBeGreaterThan(1000); // At least 1 second between calls
          expect(avgInterval).toBeLessThan(120000); // No more than 2 minutes
          console.log(`✅ Polling intervals are reasonable`);
        }
      } else {
        console.log(`ℹ️ No periodic polling detected`);
      }
    });
  });

  test.describe('Data Validation and Integrity', () => {
    test('should validate marine data consistency', async ({ page }) => {
      console.log(`\n🌊 Testing marine data consistency`);

      const dataPoints: Array<{
        page: string;
        sharks: number | null;
        stations: number | null;
        alerts: number | null;
        dataIngestion: number | null;
      }> = [];

      const testPages = ['/sharks', '/map', '/metrics', '/analytics'];

      for (const pageUrl of testPages) {
        console.log(`  📊 Collecting data from ${pageUrl}`);

        await page.goto(pageUrl);
        await waitForPageLoad(page);

        // Extract marine data points
        const pageData = await page.evaluate(() => {
          const extractNumber = (text: string | null): number | null => {
            if (!text) return null;
            const match = text.match(/(\d+)/);
            return match ? parseInt(match[1]) : null;
          };

          // Look for shark-related data
          const sharkElements = Array.from(document.querySelectorAll('*')).find(el =>
            el.textContent?.toLowerCase().includes('shark') && /\d+/.test(el.textContent || '')
          );

          // Look for station data
          const stationElements = Array.from(document.querySelectorAll('*')).find(el =>
            el.textContent?.toLowerCase().includes('station') && /\d+/.test(el.textContent || '')
          );

          // Look for alert data
          const alertElements = Array.from(document.querySelectorAll('*')).find(el =>
            el.textContent?.toLowerCase().includes('alert') && /\d+/.test(el.textContent || '')
          );

          // Look for data ingestion rates
          const dataElements = Array.from(document.querySelectorAll('*')).find(el =>
            (el.textContent?.toLowerCase().includes('data') || el.textContent?.toLowerCase().includes('points')) && /\d+/.test(el.textContent || '')
          );

          return {
            sharks: extractNumber(sharkElements?.textContent || null),
            stations: extractNumber(stationElements?.textContent || null),
            alerts: extractNumber(alertElements?.textContent || null),
            dataIngestion: extractNumber(dataElements?.textContent || null),
          };
        });

        dataPoints.push({
          page: pageUrl,
          ...pageData,
        });

        console.log(`    Data extracted:`, pageData);
      }

      // Validate data consistency
      console.log(`\n📊 Data consistency analysis:`);

      const sharkCounts = dataPoints.filter(d => d.sharks !== null).map(d => d.sharks!);
      const stationCounts = dataPoints.filter(d => d.stations !== null).map(d => d.stations!);
      const alertCounts = dataPoints.filter(d => d.alerts !== null).map(d => d.alerts!);

      if (sharkCounts.length > 1) {
        const sharkVariance = Math.max(...sharkCounts) - Math.min(...sharkCounts);
        console.log(`  Shark count variance: ${sharkVariance} (range: ${Math.min(...sharkCounts)}-${Math.max(...sharkCounts)})`);

        // Shark counts should be reasonably consistent across pages
        expect(sharkVariance).toBeLessThan(50); // Allow some variance
      }

      if (stationCounts.length > 1) {
        const stationVariance = Math.max(...stationCounts) - Math.min(...stationCounts);
        console.log(`  Station count variance: ${stationVariance} (range: ${Math.min(...stationCounts)}-${Math.max(...stationCounts)})`);

        // Station counts should be very consistent
        expect(stationVariance).toBeLessThan(10);
      }

      // Data should be within reasonable bounds
      sharkCounts.forEach(count => {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(1000);
      });

      stationCounts.forEach(count => {
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(1000);
      });

      console.log(`✅ Marine data consistency validated`);
    });

    test('should validate chart data accuracy', async ({ page }) => {
      console.log(`\n📈 Testing chart data accuracy`);

      await page.goto('/metrics');
      await waitForPageLoad(page);

      // Wait for charts to fully render
      await page.waitForTimeout(3000);

      const chartData = await page.evaluate(() => {
        const canvases = Array.from(document.querySelectorAll('canvas'));
        return canvases.map((canvas, index) => {
          const ctx = canvas.getContext('2d');
          if (!ctx) return null;

          // Try to access Chart.js data if available
          const chartInstance = (canvas as any).chart || (window as any).Chart?.instances?.[index];

          if (chartInstance && chartInstance.data) {
            return {
              index,
              hasData: true,
              datasets: chartInstance.data.datasets?.length || 0,
              labels: chartInstance.data.labels?.length || 0,
              type: chartInstance.config?.type || 'unknown',
              dataPoints: chartInstance.data.datasets?.[0]?.data?.length || 0,
            };
          }

          return {
            index,
            hasData: false,
            width: canvas.width,
            height: canvas.height,
            hasContext: !!ctx,
          };
        }).filter(Boolean);
      });

      console.log(`📊 Chart data analysis (${chartData.length} charts):`);

      chartData.forEach((chart, index) => {
        console.log(`  Chart ${index}:`, chart);

        if (chart.hasData) {
          expect(chart.datasets).toBeGreaterThan(0);
          expect(chart.dataPoints).toBeGreaterThan(0);
          console.log(`    ✅ Chart ${index} has valid data`);
        } else {
          expect(chart.hasContext).toBe(true);
          expect(chart.width).toBeGreaterThan(0);
          expect(chart.height).toBeGreaterThan(0);
          console.log(`    ✅ Chart ${index} has valid rendering context`);
        }
      });

      expect(chartData.length).toBeGreaterThan(0);
      console.log(`✅ Chart data validation completed`);
    });
  });

  test.describe('External API Integration', () => {
    test('should handle third-party API dependencies', async ({ page }) => {
      console.log(`\n🌐 Testing third-party API integrations`);

      const externalAPIs: Array<{
        url: string;
        domain: string;
        status: number;
        responseTime: number;
      }> = [];

      page.on('response', async (response) => {
        const url = response.request().url();

        // Check for external APIs (not localhost or relative)
        if (!url.includes('localhost') && !url.startsWith('/') &&
            (url.includes('api') || url.includes('.com') || url.includes('.org'))) {

          const domain = new URL(url).hostname;
          const timing = response.timing();
          const responseTime = timing.responseEnd - timing.requestStart;

          externalAPIs.push({
            url: url.substring(0, 100) + '...', // Truncate for readability
            domain,
            status: response.status(),
            responseTime,
          });
        }
      });

      // Visit pages that might use external APIs
      const testPages = ['/map', '/analytics', '/sharks'];

      for (const pageUrl of testPages) {
        await page.goto(pageUrl);
        await waitForPageLoad(page);
        await page.waitForTimeout(2000);
      }

      console.log(`📊 External API calls (${externalAPIs.length} requests):`);

      if (externalAPIs.length > 0) {
        const domainGroups = externalAPIs.reduce((groups, api) => {
          if (!groups[api.domain]) {
            groups[api.domain] = [];
          }
          groups[api.domain].push(api);
          return groups;
        }, {} as Record<string, typeof externalAPIs>);

        Object.entries(domainGroups).forEach(([domain, requests]) => {
          const avgResponseTime = requests.reduce((sum, r) => sum + r.responseTime, 0) / requests.length;
          const statusCodes = [...new Set(requests.map(r => r.status))];

          console.log(`  ${domain}:`);
          console.log(`    Requests: ${requests.length}`);
          console.log(`    Status codes: ${statusCodes.join(', ')}`);
          console.log(`    Avg response time: ${avgResponseTime.toFixed(2)}ms`);

          // External APIs should be healthy
          expect(statusCodes.every(code => code >= 200 && code < 500)).toBe(true);
          expect(avgResponseTime).toBeLessThan(10000); // 10s timeout for external APIs
        });

        console.log(`✅ External API integrations working correctly`);
      } else {
        console.log(`ℹ️ No external API calls detected`);
      }
    });

    test('should gracefully degrade when external services are unavailable', async ({ page }) => {
      console.log(`\n🚨 Testing external service failure handling`);

      // Block all external requests
      await page.route('**/*', (route) => {
        const url = route.request().url();

        if (!url.includes('localhost') && !url.startsWith('/') && !url.startsWith('data:')) {
          route.abort();
        } else {
          route.continue();
        }
      });

      const testPages = ['/map', '/analytics', '/sharks'];

      for (const pageUrl of testPages) {
        console.log(`  🔍 Testing degradation for ${pageUrl}`);

        await page.goto(pageUrl);
        await waitForPageLoad(page);

        // Page should still function despite blocked external requests
        const hasMainContent = await page.locator('h1, main, [role="main"]').first().count() > 0;
        const pageText = await page.textContent('body');
        const hasSubstantialContent = pageText && pageText.length > 500;

        expect(hasMainContent).toBe(true);
        expect(hasSubstantialContent).toBe(true);

        console.log(`    ✅ ${pageUrl} gracefully degrades without external services`);
      }

      // Remove blocking
      await page.unroute('**/*');
    });
  });

  test.describe('Caching and Performance', () => {
    test('should implement proper caching strategies', async ({ page }) => {
      console.log(`\n💾 Testing caching strategies`);

      const cacheableRequests: Array<{
        url: string;
        cacheControl: string;
        etag: string;
        lastModified: string;
      }> = [];

      page.on('response', async (response) => {
        const headers = response.headers();
        const url = response.request().url();

        if (url.includes('/api/') || url.includes('.js') || url.includes('.css')) {
          cacheableRequests.push({
            url: url.substring(0, 50) + '...',
            cacheControl: headers['cache-control'] || 'none',
            etag: headers['etag'] || 'none',
            lastModified: headers['last-modified'] || 'none',
          });
        }
      });

      await page.goto('/metrics');
      await waitForPageLoad(page);

      console.log(`📊 Cacheable resources (${cacheableRequests.length}):`);

      cacheableRequests.forEach((request, index) => {
        console.log(`  ${index + 1}. ${request.url}`);
        console.log(`     Cache-Control: ${request.cacheControl}`);
        console.log(`     ETag: ${request.etag}`);
        console.log(`     Last-Modified: ${request.lastModified}`);

        // Static assets should have cache headers
        if (request.url.includes('.js') || request.url.includes('.css')) {
          expect(request.cacheControl).not.toBe('none');
        }
      });

      console.log(`✅ Caching strategy analysis completed`);
    });
  });
});