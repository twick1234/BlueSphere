import { test, expect } from './fixtures';
import { waitForPageLoad, waitForChartsToRender, waitForMapToLoad } from './fixtures';

test.describe('Visual Regression Tests', () => {
  // Set up consistent viewport for visual tests
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test.describe('Chart.js Visualizations', () => {
    test('should render metrics dashboard charts consistently', async ({ page }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);
      await waitForChartsToRender(page);

      // Wait for all animations to complete
      await page.waitForTimeout(2000);

      // Take full page screenshot
      await expect(page).toHaveScreenshot('metrics-dashboard-full.png', {
        fullPage: true,
        threshold: 0.2, // Allow 20% difference for dynamic content
      });

      // Test individual chart components
      const chartContainers = await page.locator('.bg-white.rounded-xl').all();

      for (let i = 0; i < Math.min(chartContainers.length, 5); i++) {
        const chart = chartContainers[i];
        const hasCanvas = await chart.locator('canvas').count() > 0;

        if (hasCanvas) {
          await expect(chart).toHaveScreenshot(`chart-component-${i}.png`, {
            threshold: 0.3, // Charts can have dynamic data
          });

          console.log(`✅ Chart ${i} visual test passed`);
        }
      }
    });

    test('should render analytics charts consistently', async ({ page }) => {
      await page.goto('/analytics');
      await waitForPageLoad(page);
      await waitForChartsToRender(page);

      // Wait for chart animations
      await page.waitForTimeout(2000);

      // Screenshot the entire analytics page
      await expect(page).toHaveScreenshot('analytics-page-full.png', {
        fullPage: true,
        threshold: 0.25,
      });

      // Test individual chart sections
      const canvasElements = await page.locator('canvas').all();

      for (let i = 0; i < canvasElements.length; i++) {
        const canvasContainer = canvasElements[i].locator('..');

        await expect(canvasContainer).toHaveScreenshot(`analytics-chart-${i}.png`, {
          threshold: 0.3,
        });

        console.log(`✅ Analytics chart ${i} visual test passed`);
      }
    });

    test('should handle chart responsiveness', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 375, height: 812, name: 'mobile' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/metrics');
        await waitForPageLoad(page);
        await waitForChartsToRender(page);

        // Wait for responsive adjustments
        await page.waitForTimeout(1000);

        await expect(page).toHaveScreenshot(`metrics-${viewport.name}.png`, {
          fullPage: true,
          threshold: 0.3,
        });

        console.log(`✅ ${viewport.name} responsive test passed`);
      }
    });
  });

  test.describe('Leaflet Map Visualizations', () => {
    test('should render map consistently', async ({ page }) => {
      await page.goto('/map');
      await waitForPageLoad(page);
      await waitForMapToLoad(page);

      // Wait for tiles to load
      await page.waitForTimeout(3000);

      // Hide dynamic elements that change frequently
      await page.addStyleTag({
        content: `
          .leaflet-control-attribution { display: none !important; }
          .leaflet-popup { display: none !important; }
          [data-testid*="time"], [data-testid*="timestamp"] { display: none !important; }
        `
      });

      // Screenshot the map area
      const mapContainer = page.locator('.leaflet-container').first();
      await expect(mapContainer).toHaveScreenshot('leaflet-map-main.png', {
        threshold: 0.4, // Maps can have loading variations
      });

      // Screenshot the entire map page
      await expect(page).toHaveScreenshot('map-page-full.png', {
        fullPage: true,
        threshold: 0.3,
      });

      console.log('✅ Map visual regression test passed');
    });

    test('should render enhanced shark map consistently', async ({ page }) => {
      await page.goto('/sharks');
      await waitForPageLoad(page);

      // Look for embedded maps in sharks page
      const mapElements = page.locator('.leaflet-container');
      const mapCount = await mapElements.count();

      if (mapCount > 0) {
        await waitForMapToLoad(page);
        await page.waitForTimeout(3000);

        // Screenshot shark tracking map
        await expect(mapElements.first()).toHaveScreenshot('shark-tracking-map.png', {
          threshold: 0.4,
        });

        console.log(`✅ Shark map visual test passed (${mapCount} maps found)`);
      } else {
        console.log('ℹ️ No maps found on sharks page');
      }
    });

    test('should handle map interactions visually', async ({ page }) => {
      await page.goto('/map');
      await waitForPageLoad(page);
      await waitForMapToLoad(page);
      await page.waitForTimeout(3000);

      // Test zoom controls
      const zoomInBtn = page.locator('.leaflet-control-zoom-in');
      if (await zoomInBtn.count() > 0) {
        await zoomInBtn.click();
        await page.waitForTimeout(1000);

        // Screenshot after zoom
        const mapContainer = page.locator('.leaflet-container').first();
        await expect(mapContainer).toHaveScreenshot('map-after-zoom.png', {
          threshold: 0.4,
        });

        console.log('✅ Map zoom interaction visual test passed');
      }

      // Test map click interaction
      const mapContainer = page.locator('.leaflet-container').first();
      await mapContainer.click({ position: { x: 200, y: 200 } });
      await page.waitForTimeout(1000);

      // Check if popup or marker appeared
      const hasPopup = await page.locator('.leaflet-popup').count() > 0;
      if (hasPopup) {
        await expect(page.locator('.leaflet-container').first()).toHaveScreenshot('map-with-popup.png', {
          threshold: 0.4,
        });

        console.log('✅ Map popup interaction visual test passed');
      }
    });
  });

  test.describe('Component Visual Consistency', () => {
    test('should render navigation consistently', async ({ page }) => {
      const pages = ['/', '/sharks', '/map', '/analytics', '/metrics'];

      for (const pagePath of pages) {
        await page.goto(pagePath);
        await waitForPageLoad(page);

        // Screenshot just the navigation area
        const navElement = page.locator('nav, header').first();
        if (await navElement.count() > 0) {
          await expect(navElement).toHaveScreenshot(`navigation-${pagePath.replace('/', 'home')}.png`, {
            threshold: 0.1, // Navigation should be very consistent
          });
        }
      }

      console.log('✅ Navigation consistency tests passed');
    });

    test('should render forms and interactive elements consistently', async ({ page }) => {
      const pagesWithForms = ['/sharks', '/map', '/analytics'];

      for (const pagePath of pagesWithForms) {
        await page.goto(pagePath);
        await waitForPageLoad(page);

        // Find form elements
        const forms = await page.locator('form, .form-container').all();
        const inputs = await page.locator('input, select, textarea').all();

        if (forms.length > 0) {
          for (let i = 0; i < forms.length; i++) {
            await expect(forms[i]).toHaveScreenshot(`form-${pagePath.replace('/', '')}-${i}.png`, {
              threshold: 0.1,
            });
          }
        }

        if (inputs.length > 0 && inputs.length <= 10) {
          // Screenshot input group
          const inputContainer = page.locator('body');
          await expect(inputContainer).toHaveScreenshot(`inputs-${pagePath.replace('/', '')}.png`, {
            fullPage: false,
            threshold: 0.15,
          });
        }
      }

      console.log('✅ Form consistency tests passed');
    });

    test('should render error states consistently', async ({ page }) => {
      // Test 404 page visual consistency
      await page.goto('/non-existent-page');
      await waitForPageLoad(page);

      await expect(page).toHaveScreenshot('error-404-page.png', {
        fullPage: true,
        threshold: 0.1,
      });

      console.log('✅ Error page visual test passed');
    });
  });

  test.describe('Dark Mode and Theme Variations', () => {
    test('should handle high contrast mode', async ({ page }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);
      await waitForChartsToRender(page);

      // Apply high contrast styles
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              background-color: black !important;
              color: white !important;
              border: 1px solid white !important;
            }
            canvas {
              filter: invert(1) hue-rotate(180deg) !important;
            }
          }
        `
      });

      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('high-contrast-mode.png', {
        fullPage: true,
        threshold: 0.4,
      });

      console.log('✅ High contrast mode visual test passed');
    });

    test('should handle print styles', async ({ page }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);
      await waitForChartsToRender(page);

      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      await page.waitForTimeout(1000);

      await expect(page).toHaveScreenshot('print-view.png', {
        fullPage: true,
        threshold: 0.3,
      });

      console.log('✅ Print view visual test passed');
    });
  });

  test.describe('Animation and Transition Tests', () => {
    test('should handle loading states visually', async ({ page }) => {
      // Throttle network to catch loading states
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });

      await page.goto('/metrics');

      // Take screenshot during loading
      await page.waitForTimeout(500);
      await expect(page).toHaveScreenshot('loading-state.png', {
        threshold: 0.4,
      });

      // Wait for full load and take final screenshot
      await waitForPageLoad(page);
      await waitForChartsToRender(page);

      await expect(page).toHaveScreenshot('fully-loaded-state.png', {
        fullPage: true,
        threshold: 0.3,
      });

      console.log('✅ Loading state visual tests passed');
    });

    test('should handle hover states', async ({ page }) => {
      await page.goto('/metrics');
      await waitForPageLoad(page);

      // Test hover states on buttons
      const buttons = await page.locator('button').all();

      if (buttons.length > 0) {
        await buttons[0].hover();
        await page.waitForTimeout(300);

        await expect(buttons[0]).toHaveScreenshot('button-hover-state.png', {
          threshold: 0.2,
        });

        console.log('✅ Button hover state visual test passed');
      }

      // Test hover states on links
      const links = await page.locator('a').all();

      if (links.length > 0) {
        await links[0].hover();
        await page.waitForTimeout(300);

        await expect(links[0]).toHaveScreenshot('link-hover-state.png', {
          threshold: 0.2,
        });

        console.log('✅ Link hover state visual test passed');
      }
    });
  });
});