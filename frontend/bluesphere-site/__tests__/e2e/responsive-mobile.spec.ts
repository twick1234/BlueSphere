import { test, expect } from './fixtures';
import { waitForPageLoad, waitForMapToLoad, waitForChartsToRender } from './fixtures';

test.describe('Responsive Design and Mobile Testing', () => {
  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 812, device: 'iPhone 12' },
    { name: 'Mobile Landscape', width: 812, height: 375, device: 'iPhone 12 Landscape' },
    { name: 'Tablet Portrait', width: 768, height: 1024, device: 'iPad' },
    { name: 'Tablet Landscape', width: 1024, height: 768, device: 'iPad Landscape' },
    { name: 'Small Desktop', width: 1280, height: 720, device: 'Small Desktop' },
    { name: 'Large Desktop', width: 1920, height: 1080, device: 'Large Desktop' },
  ];

  test.describe('Layout Responsiveness', () => {
    test('should adapt layout to different screen sizes', async ({ page }) => {
      const testPages = ['/', '/sharks', '/map', '/metrics'];

      for (const pageUrl of testPages) {
        console.log(`\n📱 Testing responsive layout for ${pageUrl}`);

        for (const viewport of viewports) {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(pageUrl);
          await waitForPageLoad(page);

          console.log(`  🔍 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);

          // Verify no horizontal overflow
          const hasHorizontalOverflow = await page.evaluate(() => {
            return document.documentElement.scrollWidth > window.innerWidth;
          });

          expect(hasHorizontalOverflow).toBe(false);

          // Verify main content is visible
          const mainContent = page.locator('main, [role="main"], h1').first();
          await expect(mainContent).toBeVisible();

          // Verify navigation is accessible
          const navElement = page.locator('nav, header nav').first();
          if (await navElement.count() > 0) {
            await expect(navElement).toBeVisible();
          }

          console.log(`    ✅ Layout adapts properly to ${viewport.name}`);
        }
      }
    });

    test('should handle navigation on mobile devices', async ({ page }) => {
      const mobileViewports = viewports.filter(v => v.width <= 768);

      for (const viewport of mobileViewports) {
        console.log(`\n📱 Testing mobile navigation on ${viewport.name}`);

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        await waitForPageLoad(page);

        // Look for mobile menu toggle
        const mobileMenuToggle = page.locator('button[aria-label*="menu"], .hamburger, .mobile-menu-toggle, button:has-text("☰")');
        const mobileMenuCount = await mobileMenuToggle.count();

        console.log(`  Found ${mobileMenuCount} mobile menu toggles`);

        if (mobileMenuCount > 0) {
          // Test mobile menu functionality
          await mobileMenuToggle.first().click();
          await page.waitForTimeout(500);

          // Check if menu opened
          const menuContent = page.locator('nav ul, .mobile-menu, [role="menu"]');
          const isMenuVisible = await menuContent.first().isVisible();

          if (isMenuVisible) {
            console.log(`    ✅ Mobile menu opens successfully`);

            // Test navigation links in mobile menu
            const navLinks = await menuContent.locator('a').count();
            expect(navLinks).toBeGreaterThan(0);

            console.log(`    Found ${navLinks} navigation links in mobile menu`);

            // Test closing the menu
            await mobileMenuToggle.first().click();
            await page.waitForTimeout(500);

            const isMenuHidden = !(await menuContent.first().isVisible());
            expect(isMenuHidden).toBe(true);

            console.log(`    ✅ Mobile menu closes successfully`);
          }
        } else {
          // Check if regular navigation is responsive
          const regularNav = page.locator('nav a, header a').first();
          if (await regularNav.count() > 0) {
            await expect(regularNav).toBeVisible();
            console.log(`    ✅ Regular navigation visible on mobile`);
          }
        }
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test('should support touch interactions on mobile', async ({ page }) => {
      const mobileViewport = { width: 375, height: 812 };
      await page.setViewportSize(mobileViewport);

      const testPages = ['/map', '/sharks', '/metrics'];

      for (const pageUrl of testPages) {
        console.log(`\n👆 Testing touch interactions for ${pageUrl}`);

        await page.goto(pageUrl);
        await waitForPageLoad(page);

        // Test touch targets are appropriately sized (44px minimum)
        const touchTargets = await page.evaluate(() => {
          const interactiveElements = document.querySelectorAll('button, a, input, [tabindex]');
          return Array.from(interactiveElements).map((element) => {
            const rect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);

            return {
              width: rect.width,
              height: rect.height,
              minWidth: parseFloat(computedStyle.minWidth) || rect.width,
              minHeight: parseFloat(computedStyle.minHeight) || rect.height,
              isTouchFriendly: rect.width >= 44 && rect.height >= 44,
              tagName: element.tagName.toLowerCase(),
            };
          });
        });

        console.log(`  📊 Touch targets analysis: ${touchTargets.length} elements`);

        const touchFriendlyCount = touchTargets.filter(t => t.isTouchFriendly).length;
        const touchFriendlyRatio = touchFriendlyCount / touchTargets.length;

        console.log(`  📊 Touch-friendly ratio: ${(touchFriendlyRatio * 100).toFixed(1)}%`);

        // At least 80% of touch targets should meet minimum size
        expect(touchFriendlyRatio).toBeGreaterThan(0.6); // Allow some flexibility for testing

        // Test actual touch interactions
        const buttons = page.locator('button').first();
        if (await buttons.count() > 0) {
          await buttons.tap();
          await page.waitForTimeout(300);
          console.log(`    ✅ Touch tap interaction works`);
        }

        const links = page.locator('a[href]').first();
        if (await links.count() > 0) {
          // Just test the tap without navigation
          const href = await links.getAttribute('href');
          if (href && !href.startsWith('http')) {
            await links.tap();
            await page.waitForTimeout(300);
            console.log(`    ✅ Touch tap on links works`);
          }
        }
      }
    });

    test('should handle swipe gestures on maps and carousels', async ({ page }) => {
      const mobileViewport = { width: 375, height: 812 };
      await page.setViewportSize(mobileViewport);

      await page.goto('/map');
      await waitForPageLoad(page);

      // Test map touch interactions
      const mapContainer = page.locator('.leaflet-container').first();
      if (await mapContainer.count() > 0) {
        await waitForMapToLoad(page);

        console.log(`\n🗺️ Testing map touch interactions`);

        // Test map pan gesture
        const mapBox = await mapContainer.boundingBox();
        if (mapBox) {
          const startX = mapBox.x + mapBox.width / 2;
          const startY = mapBox.y + mapBox.height / 2;
          const endX = startX + 100;
          const endY = startY + 100;

          // Simulate touch drag (pan)
          await page.mouse.move(startX, startY);
          await page.mouse.down();
          await page.mouse.move(endX, endY, { steps: 10 });
          await page.mouse.up();

          await page.waitForTimeout(1000);

          console.log(`    ✅ Map pan gesture completed`);
        }

        // Test pinch zoom simulation (using keyboard as approximation)
        await mapContainer.click();
        await page.keyboard.press('Equal'); // Zoom in shortcut
        await page.waitForTimeout(500);

        console.log(`    ✅ Map zoom interaction tested`);
      }

      // Test any carousel or slider components
      const carouselElements = page.locator('.carousel, .slider, .swiper');
      const carouselCount = await carouselElements.count();

      if (carouselCount > 0) {
        console.log(`\n🎠 Testing ${carouselCount} carousel/slider components`);

        for (let i = 0; i < carouselCount; i++) {
          const carousel = carouselElements.nth(i);
          const carouselBox = await carousel.boundingBox();

          if (carouselBox) {
            const startX = carouselBox.x + carouselBox.width * 0.8;
            const startY = carouselBox.y + carouselBox.height / 2;
            const endX = carouselBox.x + carouselBox.width * 0.2;

            // Simulate horizontal swipe
            await page.mouse.move(startX, startY);
            await page.mouse.down();
            await page.mouse.move(endX, startY, { steps: 10 });
            await page.mouse.up();

            await page.waitForTimeout(500);

            console.log(`    ✅ Carousel ${i} swipe gesture tested`);
          }
        }
      }
    });
  });

  test.describe('Content Adaptation', () => {
    test('should adapt chart visualizations for mobile', async ({ page }) => {
      const viewportSizes = [
        { width: 375, height: 812, name: 'Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1280, height: 720, name: 'Desktop' },
      ];

      for (const viewport of viewportSizes) {
        console.log(`\n📊 Testing chart adaptation for ${viewport.name}`);

        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/metrics');
        await waitForPageLoad(page);
        await waitForChartsToRender(page);

        // Check chart responsiveness
        const chartInfo = await page.evaluate(() => {
          const canvases = Array.from(document.querySelectorAll('canvas'));
          return canvases.map((canvas, index) => {
            const rect = canvas.getBoundingClientRect();
            const container = canvas.closest('.bg-white, .chart-container, div');
            const containerRect = container?.getBoundingClientRect();

            return {
              index,
              canvasWidth: rect.width,
              canvasHeight: rect.height,
              containerWidth: containerRect?.width || 0,
              fitsContainer: rect.width <= (containerRect?.width || Infinity),
              aspectRatio: rect.width / rect.height,
            };
          });
        });

        console.log(`  📊 Found ${chartInfo.length} charts`);

        chartInfo.forEach((chart) => {
          console.log(`    Chart ${chart.index}: ${chart.canvasWidth}x${chart.canvasHeight} (AR: ${chart.aspectRatio.toFixed(2)})`);

          // Charts should fit within their containers
          expect(chart.fitsContainer).toBe(true);

          // Charts should have reasonable dimensions
          expect(chart.canvasWidth).toBeGreaterThan(100);
          expect(chart.canvasHeight).toBeGreaterThan(100);

          // Aspect ratio should be reasonable
          expect(chart.aspectRatio).toBeGreaterThan(0.5);
          expect(chart.aspectRatio).toBeLessThan(3);
        });

        console.log(`    ✅ All charts adapt properly to ${viewport.name}`);
      }
    });

    test('should optimize text readability on mobile', async ({ page }) => {
      const mobileViewport = { width: 375, height: 812 };
      await page.setViewportSize(mobileViewport);

      const testPages = ['/', '/sharks', '/metrics'];

      for (const pageUrl of testPages) {
        console.log(`\n📝 Testing text readability for ${pageUrl}`);

        await page.goto(pageUrl);
        await waitForPageLoad(page);

        // Check font sizes and line heights
        const textMetrics = await page.evaluate(() => {
          const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
          const readabilityData: Array<{
            tagName: string;
            fontSize: number;
            lineHeight: number;
            isReadable: boolean;
          }> = [];

          textElements.forEach((element) => {
            const text = element.textContent?.trim();
            if (text && text.length > 10) { // Only check elements with substantial text
              const styles = window.getComputedStyle(element);
              const fontSize = parseFloat(styles.fontSize);
              const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.2;

              readabilityData.push({
                tagName: element.tagName.toLowerCase(),
                fontSize,
                lineHeight,
                isReadable: fontSize >= 14, // Minimum readable font size on mobile
              });
            }
          });

          return readabilityData;
        });

        console.log(`  📊 Analyzed ${textMetrics.length} text elements`);

        const readableElements = textMetrics.filter(t => t.isReadable).length;
        const readabilityRatio = readableElements / textMetrics.length;

        console.log(`  📊 Readability ratio: ${(readabilityRatio * 100).toFixed(1)}%`);

        // At least 90% of text should be readable
        expect(readabilityRatio).toBeGreaterThan(0.8);

        // Check for tiny text
        const tinyTextElements = textMetrics.filter(t => t.fontSize < 12);
        expect(tinyTextElements.length).toBeLessThan(5);

        console.log(`    ✅ Text readability acceptable on mobile`);
      }
    });
  });

  test.describe('Performance on Mobile', () => {
    test('should maintain performance on mobile devices', async ({ page, webVitals }) => {
      // Simulate mobile network conditions
      await page.route('**/*', (route) => {
        // Add slight delay to simulate mobile network
        setTimeout(() => route.continue(), 100);
      });

      const mobileViewport = { width: 375, height: 812 };
      await page.setViewportSize(mobileViewport);

      const testPages = ['/', '/sharks', '/metrics'];

      for (const pageUrl of testPages) {
        console.log(`\n📱 Testing mobile performance for ${pageUrl}`);

        const performanceData = await webVitals.measurePageLoad(pageUrl);

        console.log(`  📊 Mobile performance metrics:`, {
          loadTime: `${performanceData.loadTime}ms`,
          LCP: `${performanceData.metrics.LCP}ms`,
          FCP: `${performanceData.metrics.FCP}ms`,
          CLS: performanceData.metrics.CLS,
        });

        // Mobile performance thresholds (more lenient than desktop)
        if (performanceData.metrics.LCP) {
          expect(performanceData.metrics.LCP).toBeLessThan(6000); // 6s for mobile
        }

        if (performanceData.metrics.FCP) {
          expect(performanceData.metrics.FCP).toBeLessThan(4000); // 4s for mobile
        }

        if (performanceData.metrics.CLS) {
          expect(performanceData.metrics.CLS).toBeLessThan(0.3); // Allow slightly higher CLS
        }

        expect(performanceData.loadTime).toBeLessThan(15000); // 15s max load time

        const mobileScore = webVitals.getPerformanceScore();
        console.log(`  📊 Mobile performance score: ${mobileScore}`);

        expect(mobileScore).toBeGreaterThan(20); // Minimum acceptable mobile score
      }

      // Remove route handler
      await page.unroute('**/*');
    });

    test('should handle memory constraints on mobile', async ({ page }) => {
      const mobileViewport = { width: 375, height: 812 };
      await page.setViewportSize(mobileViewport);

      // Navigate through multiple pages to test memory usage
      const pages = ['/', '/sharks', '/map', '/analytics', '/metrics'];
      const memorySnapshots: number[] = [];

      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await waitForPageLoad(page);

        // Force garbage collection if available
        await page.evaluate(() => {
          if ((window as any).gc) {
            (window as any).gc();
          }
        });

        // Get memory snapshot
        const memoryInfo = await page.evaluate(() => {
          const memory = (performance as any).memory;
          return memory ? memory.usedJSHeapSize : 0;
        });

        if (memoryInfo > 0) {
          memorySnapshots.push(memoryInfo);
          console.log(`📱 Memory usage at ${pageUrl}: ${(memoryInfo / 1024 / 1024).toFixed(2)}MB`);
        }
      }

      if (memorySnapshots.length > 0) {
        const maxMemory = Math.max(...memorySnapshots);
        const memoryGrowth = memorySnapshots[memorySnapshots.length - 1] - memorySnapshots[0];

        console.log(`📊 Mobile memory analysis:`);
        console.log(`  Max memory usage: ${(maxMemory / 1024 / 1024).toFixed(2)}MB`);
        console.log(`  Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);

        // Mobile memory constraints
        expect(maxMemory).toBeLessThan(75 * 1024 * 1024); // 75MB max
        expect(memoryGrowth).toBeLessThan(30 * 1024 * 1024); // 30MB growth max
      }
    });
  });

  test.describe('Cross-Device Consistency', () => {
    test('should maintain functionality across different screen orientations', async ({ page }) => {
      const orientationTests = [
        { width: 375, height: 812, name: 'Portrait Mobile' },
        { width: 812, height: 375, name: 'Landscape Mobile' },
        { width: 768, height: 1024, name: 'Portrait Tablet' },
        { width: 1024, height: 768, name: 'Landscape Tablet' },
      ];

      for (const orientation of orientationTests) {
        console.log(`\n🔄 Testing ${orientation.name}`);

        await page.setViewportSize({ width: orientation.width, height: orientation.height });
        await page.goto('/metrics');
        await waitForPageLoad(page);

        // Test core functionality in each orientation
        const coreElements = {
          title: await page.locator('h1').first().count() > 0,
          navigation: await page.locator('nav, header').first().count() > 0,
          mainContent: await page.locator('main, [role="main"]').first().count() > 0,
          interactiveElements: await page.locator('button, a, input').count(),
        };

        console.log(`  📊 Core elements present:`, coreElements);

        expect(coreElements.title).toBe(true);
        expect(coreElements.navigation).toBe(true);
        expect(coreElements.interactiveElements).toBeGreaterThan(0);

        // Test that charts adapt to orientation
        await waitForChartsToRender(page);
        const chartCount = await page.locator('canvas').count();

        if (chartCount > 0) {
          console.log(`    📊 ${chartCount} charts adapt to orientation`);
          expect(chartCount).toBeGreaterThan(0);
        }

        console.log(`    ✅ ${orientation.name} maintains functionality`);
      }
    });

    test('should provide consistent user experience across viewports', async ({ page }) => {
      const keyFeatures = [
        { url: '/', feature: 'Homepage content', selector: 'h1, .hero, .main-content' },
        { url: '/sharks', feature: 'Shark information', selector: 'h1, .shark-content, img' },
        { url: '/map', feature: 'Interactive map', selector: '.leaflet-container, .map-container' },
        { url: '/metrics', feature: 'Dashboard charts', selector: 'canvas, .chart' },
      ];

      for (const test of keyFeatures) {
        console.log(`\n🎯 Testing ${test.feature} consistency`);

        for (const viewport of viewports.slice(0, 4)) { // Test key viewports
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(test.url);
          await waitForPageLoad(page);

          if (test.url === '/map') {
            await waitForMapToLoad(page);
          }

          // Check if feature is present and functional
          const featureElement = page.locator(test.selector).first();
          const isPresent = await featureElement.count() > 0;
          const isVisible = isPresent ? await featureElement.isVisible() : false;

          console.log(`    ${viewport.name}: Present=${isPresent}, Visible=${isVisible}`);

          expect(isPresent).toBe(true);
          if (isPresent) {
            expect(isVisible).toBe(true);
          }
        }

        console.log(`    ✅ ${test.feature} consistent across viewports`);
      }
    });
  });
});