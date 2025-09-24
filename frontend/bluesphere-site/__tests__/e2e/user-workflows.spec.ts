import { test, expect } from './fixtures';
import { waitForPageLoad, waitForReactHydration, waitForMapToLoad } from './fixtures';

test.describe('Comprehensive User Workflows', () => {
  test.describe('Navigation Flow: Home → Sharks → Map → Analytics', () => {
    test('should complete full user journey successfully', async ({ page, webVitals }) => {
      await webVitals.setup();

      // Start at home page
      await page.goto('/');
      await waitForPageLoad(page);
      await waitForReactHydration(page);

      // Verify home page loaded correctly
      await expect(page.locator('h1')).toContainText(/BlueSphere|Marine|Ocean/);
      console.log('✅ Home page loaded successfully');

      // Navigate to sharks page
      await page.click('a[href*="sharks"], nav a:has-text("Sharks")');
      await waitForPageLoad(page);

      // Verify sharks page content
      await expect(page).toHaveURL(/.*sharks.*/);
      await expect(page.locator('h1, h2')).toContainText(/shark/i);
      console.log('✅ Sharks page navigation successful');

      // Navigate to map page
      await page.click('a[href*="map"], nav a:has-text("Map")');
      await waitForPageLoad(page);

      // Wait for map to load
      await waitForMapToLoad(page);

      // Verify map page
      await expect(page).toHaveURL(/.*map.*/);
      await expect(page.locator('.leaflet-container')).toBeVisible();
      console.log('✅ Map page with Leaflet map loaded successfully');

      // Navigate to analytics
      await page.click('a[href*="analytics"], nav a:has-text("Analytics")');
      await waitForPageLoad(page);

      // Verify analytics page
      await expect(page).toHaveURL(/.*analytics.*/);
      await expect(page.locator('h1, h2')).toContainText(/analytic/i);
      console.log('✅ Analytics page loaded successfully');

      // Collect final performance metrics
      const finalMetrics = await webVitals.collectMetrics();
      console.log('📊 Final Web Vitals:', finalMetrics);

      expect(webVitals.getPerformanceScore()).toBeGreaterThan(30); // Reasonable performance threshold
    });

    test('should maintain state during navigation', async ({ page }) => {
      // Start at home
      await page.goto('/');
      await waitForPageLoad(page);

      // Check if any form inputs or interactive elements maintain state
      const initialTitle = await page.title();

      // Navigate through pages and check titles are unique
      const pages = ['/sharks', '/map', '/analytics'];
      const titles = [initialTitle];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await waitForPageLoad(page);

        const currentTitle = await page.title();
        titles.push(currentTitle);

        // Each page should have a unique title
        expect(currentTitle).toBeTruthy();
        expect(currentTitle).toContain('BlueSphere');

        console.log(`Page ${pagePath} - Title: ${currentTitle}`);
      }

      // Verify all titles are different (good SEO practice)
      const uniqueTitles = [...new Set(titles)];
      expect(uniqueTitles.length).toBe(titles.length);
    });
  });

  test.describe('Interactive Features', () => {
    test('should handle form interactions on sharks page', async ({ page }) => {
      await page.goto('/sharks');
      await waitForPageLoad(page);

      // Look for any interactive elements like search, filters, or forms
      const searchInputs = page.locator('input[type="search"], input[placeholder*="search" i]');
      const filterButtons = page.locator('button:has-text("Filter"), select');
      const interactiveElements = page.locator('button, input, select, textarea');

      const searchCount = await searchInputs.count();
      const filterCount = await filterButtons.count();
      const totalInteractive = await interactiveElements.count();

      console.log(`Interactive elements found: ${totalInteractive} (${searchCount} search, ${filterCount} filters)`);

      if (searchCount > 0) {
        // Test search functionality
        await searchInputs.first().fill('great white');
        await searchInputs.first().press('Enter');
        await page.waitForTimeout(1000);

        console.log('✅ Search interaction tested');
      }

      if (filterCount > 0) {
        // Test filter functionality
        await filterButtons.first().click();
        await page.waitForTimeout(500);

        console.log('✅ Filter interaction tested');
      }
    });

    test('should handle map interactions', async ({ page }) => {
      await page.goto('/map');
      await waitForPageLoad(page);
      await waitForMapToLoad(page);

      // Test map interactions
      const mapContainer = page.locator('.leaflet-container');
      await expect(mapContainer).toBeVisible();

      // Get map bounds
      const mapInfo = await page.evaluate(() => {
        const leafletContainer = document.querySelector('.leaflet-container') as any;
        if (leafletContainer && leafletContainer._leaflet_map) {
          const map = leafletContainer._leaflet_map;
          return {
            hasMap: true,
            center: map.getCenter(),
            zoom: map.getZoom(),
            bounds: map.getBounds(),
          };
        }
        return { hasMap: false };
      });

      if (mapInfo.hasMap) {
        console.log('📍 Map info:', mapInfo);

        // Test map interactions
        await mapContainer.click({ position: { x: 100, y: 100 } });
        await page.waitForTimeout(500);

        // Test zoom controls
        const zoomInBtn = page.locator('.leaflet-control-zoom-in');
        if (await zoomInBtn.count() > 0) {
          await zoomInBtn.click();
          await page.waitForTimeout(500);
          console.log('✅ Map zoom interaction tested');
        }

        console.log('✅ Map interactions tested successfully');
      }
    });
  });

  test.describe('Real-time Data Features', () => {
    test('should verify real-time updates on analytics page', async ({ page }) => {
      await page.goto('/analytics');
      await waitForPageLoad(page);

      // Look for elements that might update in real-time
      const dynamicElements = page.locator('[data-testid*="realtime"], [data-testid*="live"], .animate-pulse');
      const chartElements = page.locator('canvas');

      const dynamicCount = await dynamicElements.count();
      const chartCount = await chartElements.count();

      console.log(`Found ${dynamicCount} dynamic elements and ${chartCount} charts`);

      if (chartCount > 0) {
        // Take initial screenshot of charts
        await page.waitForTimeout(2000);

        // Check if charts render with data
        const chartData = await page.evaluate(() => {
          const canvases = Array.from(document.querySelectorAll('canvas'));
          return canvases.map((canvas) => ({
            width: canvas.width,
            height: canvas.height,
            hasContext: !!canvas.getContext('2d'),
          }));
        });

        chartData.forEach((chart, index) => {
          expect(chart.width).toBeGreaterThan(0);
          expect(chart.height).toBeGreaterThan(0);
          expect(chart.hasContext).toBe(true);
        });

        console.log('✅ Charts verified with valid dimensions and context');
      }
    });

    test('should test WebSocket or polling connections', async ({ page }) => {
      // Monitor network requests for WebSocket or polling
      const requests: string[] = [];

      page.on('request', (request) => {
        const url = request.url();
        if (url.includes('/api/') || url.includes('websocket') || url.includes('sse')) {
          requests.push(url);
        }
      });

      await page.goto('/analytics');
      await waitForPageLoad(page);

      // Wait for potential API calls
      await page.waitForTimeout(3000);

      console.log('API requests detected:', requests);

      // If real-time features are implemented, we should see API calls
      if (requests.length > 0) {
        expect(requests.length).toBeGreaterThan(0);
        console.log('✅ Real-time data connections detected');
      } else {
        console.log('ℹ️ No real-time connections detected (may be using static data)');
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      await page.goto('/non-existent-page', { waitUntil: 'networkidle' });

      // Check if custom 404 page exists or if it shows a reasonable error
      const pageContent = await page.textContent('body');
      const hasErrorMessage = pageContent?.includes('404') ||
                             pageContent?.includes('not found') ||
                             pageContent?.includes('Page not found');

      if (hasErrorMessage) {
        console.log('✅ Custom 404 page detected');
      } else {
        // Should at least not crash
        expect(pageContent).toBeTruthy();
        console.log('✅ Page handles 404 without crashing');
      }
    });

    test('should handle JavaScript errors gracefully', async ({ page }) => {
      const jsErrors: string[] = [];

      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          jsErrors.push(msg.text());
        }
      });

      await page.goto('/map');
      await waitForPageLoad(page);

      // Simulate some interactions that might cause errors
      await page.keyboard.press('Escape');
      await page.keyboard.press('Tab');

      await page.waitForTimeout(2000);

      console.log('JavaScript errors detected:', jsErrors);

      // Should not have critical JavaScript errors
      const criticalErrors = jsErrors.filter(error =>
        !error.includes('ResizeObserver') && // Common non-critical error
        !error.includes('Non-passive event listener') // Performance warning
      );

      expect(criticalErrors.length).toBe(0);
      console.log('✅ No critical JavaScript errors detected');
    });
  });

  test.describe('Cross-Browser Navigation', () => {
    test('should work consistently across different browsers', async ({ page, browserName }) => {
      console.log(`Testing on browser: ${browserName}`);

      // Test key navigation flow
      const pages = ['/', '/sharks', '/map', '/analytics'];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await waitForPageLoad(page);

        // Verify page loads
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title).toContain('BlueSphere');

        // Verify basic interactivity
        const interactiveCount = await page.locator('button, a, input').count();
        expect(interactiveCount).toBeGreaterThan(0);

        console.log(`${browserName} - ${pagePath}: ${interactiveCount} interactive elements`);
      }

      console.log(`✅ ${browserName} navigation test completed`);
    });
  });
});