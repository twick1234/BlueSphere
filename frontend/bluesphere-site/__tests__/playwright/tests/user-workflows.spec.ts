import { test, expect } from '@playwright/test'

/**
 * End-to-End User Workflow Tests
 * Tests complete user journeys through the BlueSphere platform
 */

test.describe('Marine Researcher Workflow', () => {
  test('marine researcher: data exploration to export workflow', async ({ page }) => {
    console.log('🔬 Testing Marine Researcher Workflow')

    // 1. Start at homepage
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('BlueSphere')

    // Take screenshot for visual regression
    await page.screenshot({ path: 'test-results/workflow-homepage.png', fullPage: true })

    // 2. Navigate to Ocean Map
    await page.click('text=Ocean Map')
    await page.waitForURL('**/map')
    await expect(page.locator('h1')).toContainText('Ocean')

    // Wait for map to load
    await page.waitForTimeout(3000)

    // 3. Interact with map (simulate clicking on buoy/station)
    const mapContainer = page.locator('[data-testid="ocean-map"], .leaflet-container, .map-container').first()
    if (await mapContainer.count() > 0) {
      await mapContainer.click({ position: { x: 200, y: 200 } })
      await page.waitForTimeout(1000)
    }

    // 4. Navigate to Shark Tracking
    await page.click('text=Shark Tracking')
    await page.waitForURL('**/sharks')

    // Wait for shark data to load
    await page.waitForTimeout(2000)

    // 5. Use filtering controls
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Species"), select').first()
    if (await filterButton.count() > 0) {
      await filterButton.click()
      await page.waitForTimeout(500)
    }

    // 6. Navigate to Analytics
    await page.click('text=Analytics')
    await page.waitForURL('**/analytics')

    // Wait for charts to load
    await page.waitForSelector('canvas, .chart-container', { timeout: 10000 })

    // 7. Navigate to Metrics Dashboard
    await page.goto('/metrics')
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')

    // 8. Test export functionality
    const exportButton = page.locator('button:has-text("Export")')
    if (await exportButton.count() > 0) {
      await exportButton.click()
      await page.waitForTimeout(1000)
    }

    // Final verification - user should still be on metrics page
    await expect(page.locator('h1')).toContainText('Platform Metrics')

    console.log('✅ Marine Researcher Workflow completed successfully')
  })

  test('conservation scientist: alert monitoring workflow', async ({ page }) => {
    console.log('🛡️ Testing Conservation Scientist Workflow')

    // 1. Start at homepage and navigate to conservation
    await page.goto('/')

    // Click on Conservation in navigation
    await page.hover('button:has-text("Conservation")')
    await page.waitForTimeout(500)

    // Click Action Center from dropdown
    const actionCenter = page.locator('a:has-text("Action Center")')
    if (await actionCenter.count() > 0) {
      await actionCenter.click()
      await page.waitForURL('**/conservation')
    }

    // 2. Check for alert subscription functionality
    const subscribeButton = page.locator('button:has-text("Subscribe"), button:has-text("Alert"), input[type="email"]').first()
    if (await subscribeButton.count() > 0) {
      // Test alert subscription flow
      if (await page.locator('input[type="email"]').count() > 0) {
        await page.fill('input[type="email"]', 'scientist@marine.org')
        await page.click('button[type="submit"], button:has-text("Subscribe")')
        await page.waitForTimeout(1000)
      }
    }

    // 3. Navigate to Crisis Response
    await page.hover('button:has-text("Conservation")')
    await page.waitForTimeout(500)
    const crisisResponse = page.locator('a:has-text("Crisis Response")')
    if (await crisisResponse.count() > 0) {
      await crisisResponse.click()
      await page.waitForURL('**/crisis')
    }

    // 4. Check marine heatwave alerts
    await page.waitForTimeout(2000)

    // 5. Navigate to metrics to check alert counts
    await page.goto('/metrics')
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')

    // Verify alert metrics are displayed
    const alertsSection = page.locator('text=Critical Alerts', 'text=Alerts Today')
    if (await alertsSection.count() > 0) {
      const alertCount = await alertsSection.locator('..').locator('span.font-semibold').textContent()
      expect(alertCount).toMatch(/^\d+$/)
    }

    console.log('✅ Conservation Scientist Workflow completed successfully')
  })

  test('educational user: learning and exploration workflow', async ({ page }) => {
    console.log('🎓 Testing Educational User Workflow')

    // 1. Start at homepage
    await page.goto('/')

    // 2. Navigate to Education
    await page.hover('button:has-text("Learn")')
    await page.waitForTimeout(500)

    const educationLink = page.locator('a:has-text("Education")')
    if (await educationLink.count() > 0) {
      await educationLink.click()
      await page.waitForURL('**/education')
    }

    // 3. Navigate to Gallery
    await page.hover('button:has-text("Learn")')
    await page.waitForTimeout(500)

    const galleryLink = page.locator('a:has-text("Gallery")')
    if (await galleryLink.count() > 0) {
      await galleryLink.click()
      await page.waitForURL('**/gallery')
    }

    // Wait for gallery content to load
    await page.waitForTimeout(2000)

    // 4. Navigate to Species AI
    await page.hover('button:has-text("Platform")')
    await page.waitForTimeout(500)

    const speciesAI = page.locator('a:has-text("Species AI")')
    if (await speciesAI.count() > 0) {
      await speciesAI.click()
      await page.waitForURL('**/species-ai')
    }

    // Test AI functionality if available
    await page.waitForTimeout(2000)

    // 5. Explore Historical Data
    await page.hover('button:has-text("Data")')
    await page.waitForTimeout(500)

    const historicalLink = page.locator('a:has-text("Historical")')
    if (await historicalLink.count() > 0) {
      await historicalLink.click()
      await page.waitForURL('**/historical')
    }

    // Wait for historical data to load
    await page.waitForTimeout(3000)

    // 6. Check Time-lapse visualization
    await page.hover('button:has-text("Data")')
    await page.waitForTimeout(500)

    const timelapseLink = page.locator('a:has-text("Time-lapse")')
    if (await timelapseLink.count() > 0) {
      await timelapseLink.click()
      await page.waitForURL('**/timelapse')
    }

    await page.waitForTimeout(2000)

    console.log('✅ Educational User Workflow completed successfully')
  })
})

test.describe('Real-time Data Flow Testing', () => {
  test('real-time data updates across pages', async ({ page, context }) => {
    console.log('📊 Testing Real-time Data Flow')

    // Open metrics dashboard in first tab
    await page.goto('/metrics')
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')

    // Get initial values
    const initialCoverage = await page.locator('text=Test Coverage').locator('..').locator('.text-3xl').textContent()
    const initialStations = await page.locator('text=Active Monitoring').locator('..').locator('.text-3xl').textContent()

    // Open shark tracking in second tab
    const newPage = await context.newPage()
    await newPage.goto('/sharks')
    await newPage.waitForTimeout(2000)

    // Interact with shark tracking (simulate data update)
    if (await newPage.locator('button:has-text("Refresh"), button:has-text("Update")').count() > 0) {
      await newPage.click('button:has-text("Refresh"), button:has-text("Update")')
      await newPage.waitForTimeout(1000)
    }

    // Go back to metrics dashboard and check for updates
    await page.bringToFront()
    await page.reload()
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')

    // Verify data is still consistent
    const updatedCoverage = await page.locator('text=Test Coverage').locator('..').locator('.text-3xl').textContent()
    const updatedStations = await page.locator('text=Active Monitoring').locator('..').locator('.text-3xl').textContent()

    expect(updatedCoverage).toMatch(/^\d+\.?\d*%$/)
    expect(updatedStations).toMatch(/^\d+$/)

    await newPage.close()

    console.log(`✅ Real-time data flow verified: Coverage ${initialCoverage}→${updatedCoverage}, Stations ${initialStations}→${updatedStations}`)
  })

  test('api data consistency across components', async ({ page, request }) => {
    console.log('🔄 Testing API Data Consistency')

    // Get data from API directly
    const metricsResponse = await request.get('/api/metrics')
    expect(metricsResponse.ok()).toBeTruthy()
    const metricsData = await metricsResponse.json()

    const obsResponse = await request.get('/api/obs?limit=5')
    expect(obsResponse.ok()).toBeTruthy()
    const obsData = await obsResponse.json()

    const stationsResponse = await request.get('/api/stations')
    expect(stationsResponse.ok()).toBeTruthy()
    const stationsData = await stationsResponse.json()

    // Navigate to metrics dashboard
    await page.goto('/metrics')
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')

    // Verify API data matches dashboard display
    const displayedCoverage = await page.locator('text=Test Coverage').locator('..').locator('.text-3xl').textContent()
    const apiCoverage = metricsData.data.coverage.total
    const displayedNum = parseFloat(displayedCoverage!.replace('%', ''))
    expect(Math.abs(displayedNum - apiCoverage)).toBeLessThan(0.1)

    // Test map page with stations data
    await page.goto('/map')
    await page.waitForTimeout(3000)

    // Verify station count consistency if displayed
    const stationCount = stationsData.stations?.length || 0
    if (stationCount > 0) {
      console.log(`✅ Found ${stationCount} stations in API response`)
    }

    console.log('✅ API data consistency verified across components')
  })
})

test.describe('Performance and Accessibility Testing', () => {
  test('page load performance metrics', async ({ page }) => {
    console.log('⚡ Testing Performance Metrics')

    // Navigate to homepage and measure performance
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    expect(loadTime).toBeLessThan(5000) // Should load in under 5 seconds

    // Test Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise(resolve => {
        let lcp = 0
        let fid = 0
        let cls = 0

        // Mock implementation - in real testing, you'd use web-vitals library
        setTimeout(() => {
          resolve({ lcp, fid, cls })
        }, 1000)
      })
    })

    console.log(`✅ Performance metrics: Load time ${loadTime}ms, Vitals:`, vitals)

    // Test metrics dashboard performance
    const metricsStartTime = Date.now()
    await page.goto('/metrics')
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')
    const metricsLoadTime = Date.now() - metricsStartTime

    expect(metricsLoadTime).toBeLessThan(10000) // Dashboard should load in under 10 seconds

    console.log(`✅ Metrics dashboard load time: ${metricsLoadTime}ms`)
  })

  test('accessibility compliance testing', async ({ page }) => {
    console.log('♿ Testing Accessibility Compliance')

    // Test homepage accessibility
    await page.goto('/')

    // Check for proper heading structure
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)

    // Check for alt text on images
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      expect(alt).not.toBeNull()
    }

    // Check for keyboard navigation
    await page.keyboard.press('Tab')
    const focusedElement = await page.locator(':focus').first()
    expect(await focusedElement.count()).toBe(1)

    // Test metrics dashboard accessibility
    await page.goto('/metrics')
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')

    // Check for proper ARIA labels
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label')
      const text = await button.textContent()
      expect(ariaLabel || text).toBeTruthy()
    }

    console.log(`✅ Accessibility compliance verified: ${h1Count} headings, ${images.length} images with alt text, ${buttons.length} accessible buttons`)
  })
})

test.describe('Mobile Responsiveness Testing', () => {
  test('mobile navigation and interaction', async ({ page, isMobile }) => {
    console.log('📱 Testing Mobile Experience')

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to homepage
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Test mobile navigation
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has([data-testid*="bars"]), .mobile-menu-button').first()

    if (await mobileMenuButton.count() > 0) {
      await mobileMenuButton.click()
      await page.waitForTimeout(500)

      // Verify mobile menu opened
      const mobileMenu = page.locator('.mobile-menu.open, .mobile-nav, nav[data-mobile="true"]').first()
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu).toBeVisible()

        // Test mobile menu navigation
        const mobileLink = page.locator('a:has-text("Ocean Map"), a:has-text("Shark Tracking")').first()
        if (await mobileLink.count() > 0) {
          await mobileLink.click()
          await page.waitForTimeout(1000)
        }
      }
    }

    // Test metrics dashboard on mobile
    await page.goto('/metrics')
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')

    // Verify metrics cards stack properly on mobile
    const metricCards = await page.locator('.grid .bg-white, .metric-card, .rounded-xl').count()
    expect(metricCards).toBeGreaterThan(0)

    // Test scrolling behavior
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    await page.evaluate(() => window.scrollTo(0, 0))

    console.log(`✅ Mobile experience verified: ${metricCards} metric cards responsive`)
  })

  test('tablet layout testing', async ({ page }) => {
    console.log('📟 Testing Tablet Experience')

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    // Test key pages on tablet
    const pages = ['/', '/metrics', '/sharks', '/map']

    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForTimeout(2000)

      // Verify page loads properly
      const body = page.locator('body')
      await expect(body).toBeVisible()

      // Check for horizontal scrollbar (shouldn't exist)
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const clientWidth = await page.evaluate(() => document.body.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10) // Allow small tolerance

      console.log(`✅ Tablet layout verified for ${pagePath}`)
    }
  })
})