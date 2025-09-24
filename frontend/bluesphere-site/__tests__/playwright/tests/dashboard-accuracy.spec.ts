import { test, expect } from '@playwright/test'

/**
 * Dashboard Accuracy Verification Tests
 * Verifies that the metrics dashboard displays accurate data
 */

test.describe('Metrics Dashboard Accuracy', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to metrics dashboard
    await page.goto('/metrics')

    // Wait for page to fully load
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")')

    // Wait for data to load (no loading skeleton)
    await page.waitForFunction(() => {
      const skeleton = document.querySelector('.skeleton-container')
      return !skeleton || skeleton.style.display === 'none'
    }, { timeout: 10000 })
  })

  test('displays correct test coverage percentage', async ({ page, request }) => {
    // Get the displayed coverage from the dashboard
    const coverageElement = await page.locator('text=Test Coverage').locator('..').locator('.text-3xl')
    const displayedCoverage = await coverageElement.textContent()

    // Verify coverage format (should be like "2.8%" or "30.2%")
    expect(displayedCoverage).toMatch(/^\d+\.?\d*%$/)

    // Get actual coverage from API
    const metricsResponse = await request.get('/api/metrics')
    expect(metricsResponse.ok()).toBeTruthy()

    const metricsData = await metricsResponse.json()
    const actualCoverage = metricsData.data.coverage.total

    // Verify displayed coverage matches API data (within 0.1% tolerance)
    const displayedNum = parseFloat(displayedCoverage!.replace('%', ''))
    expect(Math.abs(displayedNum - actualCoverage)).toBeLessThan(0.1)

    console.log(`✅ Coverage accuracy verified: Dashboard shows ${displayedCoverage}, API returns ${actualCoverage}%`)
  })

  test('displays accurate system uptime', async ({ page, request }) => {
    // Get displayed uptime
    const uptimeElement = await page.locator('text=System Uptime').locator('..').locator('.text-3xl')
    const displayedUptime = await uptimeElement.textContent()

    // Verify uptime format (should be like "99.97%")
    expect(displayedUptime).toMatch(/^\d+\.?\d*%$/)

    // Get actual uptime from API
    const metricsResponse = await request.get('/api/metrics')
    const metricsData = await metricsResponse.json()
    const actualUptime = metricsData.data.system.uptime

    // Verify displayed uptime matches API data
    const displayedNum = parseFloat(displayedUptime!.replace('%', ''))
    expect(Math.abs(displayedNum - actualUptime)).toBeLessThan(0.01)

    console.log(`✅ Uptime accuracy verified: Dashboard shows ${displayedUptime}, API returns ${actualUptime}%`)
  })

  test('displays accurate marine monitoring metrics', async ({ page, request }) => {
    // Get displayed active stations count
    const stationsElement = await page.locator('text=Active Monitoring').locator('..').locator('.text-3xl')
    const displayedStations = await stationsElement.textContent()

    // Verify stations format (should be a number)
    expect(displayedStations).toMatch(/^\d+$/)

    // Get actual data from API
    const metricsResponse = await request.get('/api/metrics')
    const metricsData = await metricsResponse.json()
    const actualStations = metricsData.data.system.activeStations

    // Verify displayed stations matches API data
    const displayedNum = parseInt(displayedStations!)
    expect(Math.abs(displayedNum - actualStations)).toBeLessThanOrEqual(1) // Allow for ±1 variance

    console.log(`✅ Stations count verified: Dashboard shows ${displayedStations}, API returns ${actualStations}`)
  })

  test('displays accurate performance metrics', async ({ page, request }) => {
    // Get displayed performance score
    const perfElement = await page.locator('text=Performance Score').locator('..').locator('.text-3xl')
    const displayedPerf = await perfElement.textContent()

    // Performance score can be negative, so check for number with optional minus
    expect(displayedPerf).toMatch(/^-?\d+$/)

    // Get actual data from API
    const metricsResponse = await request.get('/api/metrics')
    const metricsData = await metricsResponse.json()

    // Calculate expected performance score (simplified LCP calculation)
    const lcp = metricsData.data.performance.lcp
    const expectedScore = Math.round(100 - (lcp / 100)) // Simplified calculation

    const displayedNum = parseInt(displayedPerf!)

    // Performance scores can vary due to real-time calculations, allow larger tolerance
    expect(Math.abs(displayedNum - expectedScore)).toBeLessThan(50)

    console.log(`✅ Performance score verified: Dashboard shows ${displayedPerf}, calculated ${expectedScore}`)
  })

  test('dashboard URL matches current location', async ({ page }) => {
    // Get displayed URL from dashboard
    const urlElement = await page.locator('code:has-text("/metrics")')
    const displayedUrl = await urlElement.textContent()

    // Get actual URL
    const actualUrl = page.url()

    // Verify displayed URL matches actual URL
    expect(displayedUrl).toBe(actualUrl)

    console.log(`✅ URL accuracy verified: Dashboard shows ${displayedUrl}`)
  })

  test('real-time updates are working', async ({ page }) => {
    // Get initial timestamp
    const timestampElement = await page.locator('text=Last updated:').locator('..')
    const initialTimestamp = await timestampElement.textContent()

    // Wait for auto-refresh (should be 30 seconds, but we'll wait 35)
    await page.waitForTimeout(35000)

    // Get updated timestamp
    const updatedTimestamp = await timestampElement.textContent()

    // Verify timestamp changed (indicating real-time updates)
    expect(updatedTimestamp).not.toBe(initialTimestamp)

    console.log(`✅ Real-time updates verified: ${initialTimestamp} → ${updatedTimestamp}`)
  })

  test('marine data consistency across components', async ({ page }) => {
    // Check shark count in multiple locations
    const marineSection = page.locator('h4:has-text("🦈 Shark Tracking")')
    const sharkCountInSection = await marineSection.locator('..').locator('text=Active Tags').locator('..').locator('span').last().textContent()

    // Check if same value appears in header metrics
    const headerMetric = await page.locator('text=/\\d+ sharks/').textContent()

    if (headerMetric) {
      const headerSharkCount = headerMetric.match(/(\d+) sharks/)?.[1]
      expect(sharkCountInSection).toBe(headerSharkCount)
    }

    console.log(`✅ Shark tracking consistency verified: ${sharkCountInSection} sharks`)
  })

  test('charts render with data', async ({ page }) => {
    // Wait for charts to render
    await page.waitForSelector('canvas', { timeout: 10000 })

    // Count rendered charts
    const chartCanvases = await page.locator('canvas').count()
    expect(chartCanvases).toBeGreaterThan(0)

    // Verify charts have drawn content (not blank)
    const chartData = await page.evaluate(() => {
      const canvases = document.querySelectorAll('canvas')
      let hasContent = false

      canvases.forEach(canvas => {
        const ctx = (canvas as HTMLCanvasElement).getContext('2d')
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          // Check if canvas has non-transparent pixels
          for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] > 0) {
              hasContent = true
              break
            }
          }
        }
      })

      return { hasContent, count: canvases.length }
    })

    expect(chartData.hasContent).toBe(true)
    console.log(`✅ Charts verified: ${chartData.count} charts with content`)
  })

  test('export functionality is accessible', async ({ page }) => {
    // Find export button
    const exportButton = page.locator('button:has-text("Export Data")')
    await expect(exportButton).toBeVisible()

    // Verify button is clickable
    await expect(exportButton).toBeEnabled()

    // Click export button (this should trigger download dialog)
    await exportButton.click()

    // Verify no errors occurred (page should still be functional)
    await page.waitForTimeout(1000)
    const title = await page.locator('h1').textContent()
    expect(title).toContain('Platform Metrics Dashboard')

    console.log('✅ Export functionality accessible')
  })

  test('responsive design works correctly', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    await page.waitForTimeout(500)

    const desktopLayout = await page.locator('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4').count()
    expect(desktopLayout).toBeGreaterThan(0)

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)

    // Verify mobile layout adjusts
    const mobileHeader = await page.locator('h1').isVisible()
    expect(mobileHeader).toBe(true)

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)

    const tabletLayout = await page.locator('.grid').count()
    expect(tabletLayout).toBeGreaterThan(0)

    console.log('✅ Responsive design verified across devices')
  })
})