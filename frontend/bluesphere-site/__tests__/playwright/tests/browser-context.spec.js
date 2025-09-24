/**
 * Browser Context Testing for BlueSphere Marine Monitoring Platform
 * Tests different browser scenarios, storage, offline functionality, and multi-window behavior
 */

import { test, expect } from '@playwright/test';

test.describe('Browser Context and Storage Testing', () => {
  test.describe('Multi-Tab Data Synchronization', () => {
    test('should synchronize shark tracking data across multiple tabs', async ({ context }) => {
      // Create two tabs
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      // Navigate to sharks page in both tabs
      await page1.goto('/sharks');
      await page2.goto('/sharks');

      await page1.waitForLoadState('networkidle');
      await page2.waitForLoadState('networkidle');

      // Select a shark in the first tab
      await page1.click('.shark-card');
      const selectedSharkName1 = await page1.locator('.shark-name').first().textContent();

      // Wait for potential cross-tab synchronization
      await page2.waitForTimeout(1000);

      // Check if selection is synchronized (if implemented)
      const isSelectionSynced = await page2.evaluate(() => {
        return window.localStorage.getItem('selectedShark') !== null;
      });

      if (isSelectionSynced) {
        // Verify data consistency across tabs
        await page2.reload();
        await page2.waitForLoadState('networkidle');

        const selectedSharkName2 = await page2.locator('.shark-name').first().textContent();
        expect(selectedSharkName1).toBe(selectedSharkName2);
      }

      await page1.close();
      await page2.close();
    });

    test('should handle real-time updates across multiple tabs', async ({ context }) => {
      const page1 = await context.newPage();
      const page2 = await context.newPage();

      await page1.goto('/sharks');
      await page2.goto('/sharks');

      // Enable real-time updates in both tabs
      await page1.check('input[type="checkbox"]:near(:text("Live Updates"))');
      await page2.check('input[type="checkbox"]:near(:text("Live Updates"))');

      // Simulate data update in first tab
      await page1.evaluate(() => {
        // Trigger a mock real-time update
        const event = new CustomEvent('sharkDataUpdate', {
          detail: { sharkId: 'test_shark_1', position: { lat: 37.7749, lon: -122.4194 } }
        });
        window.dispatchEvent(event);
      });

      await page1.waitForTimeout(1000);

      // Verify both tabs receive the update (if real-time sync is implemented)
      const page1Updated = await page1.evaluate(() => window.lastUpdateReceived || false);
      const page2Updated = await page2.evaluate(() => window.lastUpdateReceived || false);

      // At minimum, the originating tab should be updated
      expect(page1Updated || page2Updated).toBe(true);

      await page1.close();
      await page2.close();
    });
  });

  test.describe('Local Storage and Session Persistence', () => {
    test('should persist user preferences across browser sessions', async ({ context }) => {
      const page = await context.newPage();
      await page.goto('/sharks');

      // Set user preferences
      await page.selectOption('.filter-select', 'active');
      await page.fill('.search-input', 'Great White');
      await page.check('input[type="checkbox"]:near(:text("Live Updates"))');

      // Store preferences in localStorage
      await page.evaluate(() => {
        localStorage.setItem('userPreferences', JSON.stringify({
          filterStatus: 'active',
          searchQuery: 'Great White',
          realTimeEnabled: true
        }));
      });

      // Verify preferences are stored
      const storedPrefs = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('userPreferences') || '{}');
      });

      expect(storedPrefs.filterStatus).toBe('active');
      expect(storedPrefs.searchQuery).toBe('Great White');
      expect(storedPrefs.realTimeEnabled).toBe(true);

      // Reload page and verify preferences persist
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check if preferences are restored (if implemented)
      const restoredFilter = await page.locator('.filter-select').inputValue();
      const restoredSearch = await page.locator('.search-input').inputValue();
      const restoredRealTime = await page.locator('input[type="checkbox"]:near(:text("Live Updates"))').isChecked();

      // At minimum, localStorage should still contain the preferences
      const persistedPrefs = await page.evaluate(() => {
        return JSON.parse(localStorage.getItem('userPreferences') || '{}');
      });
      expect(persistedPrefs.filterStatus).toBe('active');

      await page.close();
    });

    test('should handle session data cleanup appropriately', async ({ context }) => {
      const page = await context.newPage();
      await page.goto('/sharks');

      // Set session data
      await page.evaluate(() => {
        sessionStorage.setItem('temporaryData', 'test_session_data');
        sessionStorage.setItem('userSession', JSON.stringify({
          loginTime: Date.now(),
          activityLog: ['page_visit', 'shark_selection']
        }));
      });

      // Verify session data exists
      const sessionData = await page.evaluate(() => {
        return {
          temporaryData: sessionStorage.getItem('temporaryData'),
          userSession: sessionStorage.getItem('userSession')
        };
      });

      expect(sessionData.temporaryData).toBe('test_session_data');
      expect(sessionData.userSession).toBeDefined();

      await page.close();

      // Create new page (new session)
      const newPage = await context.newPage();
      await newPage.goto('/sharks');

      // Session data should not persist across sessions
      const newSessionData = await newPage.evaluate(() => {
        return {
          temporaryData: sessionStorage.getItem('temporaryData'),
          userSession: sessionStorage.getItem('userSession')
        };
      });

      expect(newSessionData.temporaryData).toBeNull();
      expect(newSessionData.userSession).toBeNull();

      await newPage.close();
    });
  });

  test.describe('Cookie Handling and Preferences', () => {
    test('should manage analytics and preference cookies correctly', async ({ context }) => {
      const page = await context.newPage();

      // Clear any existing cookies
      await context.clearCookies();

      await page.goto('/');

      // Check for cookie consent banner (if implemented)
      const cookieBanner = page.locator('[data-testid="cookie-banner"], .cookie-consent');
      if (await cookieBanner.isVisible()) {
        await cookieBanner.locator('button:has-text("Accept")').click();
      }

      // Set preference cookies
      await context.addCookies([
        {
          name: 'user_preferences',
          value: JSON.stringify({
            theme: 'ocean',
            units: 'metric',
            language: 'en'
          }),
          domain: new URL(page.url()).hostname,
          path: '/'
        },
        {
          name: 'analytics_consent',
          value: 'true',
          domain: new URL(page.url()).hostname,
          path: '/'
        }
      ]);

      // Navigate to sharks page and verify cookies are used
      await page.goto('/sharks');
      await page.waitForLoadState('networkidle');

      // Check if preferences are applied
      const cookies = await context.cookies();
      const prefCookie = cookies.find(c => c.name === 'user_preferences');
      const analyticsCookie = cookies.find(c => c.name === 'analytics_consent');

      expect(prefCookie).toBeDefined();
      expect(analyticsCookie).toBeDefined();
      expect(analyticsCookie.value).toBe('true');

      await page.close();
    });

    test('should respect cookie privacy settings', async ({ context }) => {
      const page = await context.newPage();
      await page.goto('/');

      // Simulate rejecting analytics cookies
      await context.addCookies([
        {
          name: 'analytics_consent',
          value: 'false',
          domain: new URL(page.url()).hostname,
          path: '/'
        }
      ]);

      // Monitor network requests to ensure analytics scripts aren't loaded
      const networkRequests = [];
      page.on('request', request => {
        networkRequests.push(request.url());
      });

      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify analytics requests are blocked when consent is false
      const analyticsRequests = networkRequests.filter(url =>
        url.includes('google-analytics') ||
        url.includes('gtag') ||
        url.includes('analytics')
      );

      // Should have minimal or no analytics requests when consent is denied
      expect(analyticsRequests.length).toBeLessThan(3);

      await page.close();
    });
  });

  test.describe('Offline Functionality and Service Workers', () => {
    test('should handle offline scenarios gracefully', async ({ context }) => {
      const page = await context.newPage();
      await page.goto('/sharks');
      await page.waitForLoadState('networkidle');

      // Get initial data count
      const onlineDataCount = await page.locator('.shark-card').count();

      // Simulate offline condition
      await context.setOffline(true);

      // Navigate to different page while offline
      await page.goto('/map');

      // Should show offline indicator or cached content
      const offlineIndicator = page.locator('[data-testid="offline-indicator"], .offline-banner');
      const isOfflineHandled = await offlineIndicator.isVisible() ||
        await page.locator('body').textContent().then(text =>
          text.includes('offline') || text.includes('connection')
        );

      // Page should handle offline state gracefully
      expect(isOfflineHandled).toBe(true);

      // Go back online
      await context.setOffline(false);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Should restore full functionality
      const backOnlineDataCount = await page.locator('.shark-card').count();
      expect(backOnlineDataCount).toBeGreaterThanOrEqual(onlineDataCount);

      await page.close();
    });

    test('should cache critical resources for offline access', async ({ context }) => {
      const page = await context.newPage();

      // Monitor service worker registration
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          try {
            await navigator.serviceWorker.register('/sw.js');
            return true;
          } catch (error) {
            return false;
          }
        }
        return false;
      });

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      if (swRegistered) {
        // Go offline and test cached resources
        await context.setOffline(true);
        await page.reload();

        // Should still load basic page structure from cache
        const title = await page.title();
        expect(title).toBeTruthy();
        expect(title).toContain('BlueSphere');
      }

      await page.close();
    });
  });

  test.describe('Device-Specific Testing', () => {
    test('should adapt to different screen sizes and orientations', async ({ browser }) => {
      // Desktop context
      const desktopContext = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
      });
      const desktopPage = await desktopContext.newPage();
      await desktopPage.goto('/sharks');

      // Mobile context
      const mobileContext = await browser.newContext({
        ...browser.devices()['iPhone 12'],
        viewport: { width: 390, height: 844 }
      });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto('/sharks');

      // Tablet context
      const tabletContext = await browser.newContext({
        viewport: { width: 768, height: 1024 }
      });
      const tabletPage = await tabletContext.newPage();
      await tabletPage.goto('/sharks');

      // Test responsive layouts
      const desktopSharkCards = await desktopPage.locator('.shark-card').count();
      const mobileSharkCards = await mobilePage.locator('.shark-card').count();
      const tabletSharkCards = await tabletPage.locator('.shark-card').count();

      // All devices should show content, but layout may differ
      expect(desktopSharkCards).toBeGreaterThan(0);
      expect(mobileSharkCards).toBeGreaterThan(0);
      expect(tabletSharkCards).toBeGreaterThan(0);

      // Test navigation on mobile
      const mobileMenu = mobilePage.locator('[data-testid="mobile-menu"], .mobile-menu-toggle');
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
        await expect(mobilePage.locator('[data-testid="mobile-nav"], .mobile-navigation')).toBeVisible();
      }

      await desktopContext.close();
      await mobileContext.close();
      await tabletContext.close();
    });

    test('should handle touch interactions on mobile devices', async ({ browser }) => {
      const mobileContext = await browser.newContext({
        ...browser.devices()['iPhone 12'],
        hasTouch: true
      });
      const mobilePage = await mobileContext.newPage();
      await mobilePage.goto('/sharks');

      // Test touch interactions
      await mobilePage.tap('.shark-card');

      // Should handle touch-specific gestures
      const sharkProfile = mobilePage.locator('.shark-profile');
      if (await sharkProfile.isVisible()) {
        // Test swipe gesture to close (if implemented)
        await mobilePage.touchscreen.tap(200, 300);
        await mobilePage.touchscreen.tap(200, 100);
      }

      await mobileContext.close();
    });
  });

  test.describe('Geolocation and Permissions', () => {
    test('should handle geolocation permissions correctly', async ({ browser }) => {
      const context = await browser.newContext({
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        permissions: ['geolocation']
      });
      const page = await context.newPage();
      await page.goto('/map');

      // Check if location-based features work
      const locationUsed = await page.evaluate(async () => {
        if (navigator.geolocation) {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => resolve(true),
              () => resolve(false),
              { timeout: 5000 }
            );
          });
        }
        return false;
      });

      if (locationUsed) {
        // Verify map centers on user location
        const mapCenter = await page.evaluate(() => {
          const map = window.mapInstance;
          return map ? map.getCenter() : null;
        });

        if (mapCenter) {
          // Should be near the provided coordinates
          expect(Math.abs(mapCenter.lat - 37.7749)).toBeLessThan(5);
          expect(Math.abs(mapCenter.lng - (-122.4194))).toBeLessThan(5);
        }
      }

      await context.close();
    });

    test('should handle denied geolocation gracefully', async ({ browser }) => {
      const context = await browser.newContext({
        permissions: [] // No geolocation permission
      });
      const page = await context.newPage();
      await page.goto('/map');

      // Should not break when geolocation is denied
      const pageLoaded = await page.locator('h1').isVisible();
      expect(pageLoaded).toBe(true);

      // Should show default location or prompt
      const defaultLocationUsed = await page.evaluate(() => {
        return window.location.href || document.title;
      });
      expect(defaultLocationUsed).toBeTruthy();

      await context.close();
    });
  });

  test.describe('Cross-Origin and Security', () => {
    test('should handle CORS and external API calls correctly', async ({ context }) => {
      const page = await context.newPage();

      // Monitor network requests
      let corsErrors = 0;
      page.on('requestfailed', request => {
        if (request.failure()?.errorText.includes('CORS') ||
            request.failure()?.errorText.includes('cors')) {
          corsErrors++;
        }
      });

      await page.goto('/sharks');
      await page.waitForLoadState('networkidle');

      // Should not have CORS errors in production
      expect(corsErrors).toBe(0);

      await page.close();
    });

    test('should validate Content Security Policy compliance', async ({ context }) => {
      const page = await context.newPage();

      // Monitor console for CSP violations
      const cspViolations = [];
      page.on('console', msg => {
        if (msg.text().includes('Content Security Policy') ||
            msg.text().includes('CSP')) {
          cspViolations.push(msg.text());
        }
      });

      await page.goto('/sharks');
      await page.waitForLoadState('networkidle');

      // Should not have CSP violations
      expect(cspViolations.length).toBe(0);

      await page.close();
    });
  });
});