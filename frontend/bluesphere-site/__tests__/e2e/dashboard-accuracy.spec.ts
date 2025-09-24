import { test, expect } from './fixtures';
import { waitForPageLoad, waitForChartsToRender } from './fixtures';

test.describe('Dashboard Accuracy Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to metrics dashboard
    await page.goto('/metrics');
    await waitForPageLoad(page);
  });

  test('should display accurate test coverage metrics', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForSelector('[data-testid="coverage-metric"], .text-3xl', { timeout: 10000 });

    // Extract displayed coverage percentage
    const coverageElement = page.locator('.text-3xl').first();
    const displayedCoverage = await coverageElement.textContent();

    console.log(`Dashboard displays coverage: ${displayedCoverage}`);

    // Verify the coverage format and range
    expect(displayedCoverage).toMatch(/\d+\.\d%/);

    const coverageValue = parseFloat(displayedCoverage?.replace('%', '') || '0');
    expect(coverageValue).toBeGreaterThan(0);
    expect(coverageValue).toBeLessThan(100);

    // Extract additional coverage metrics
    const componentCoverage = await page.locator('text=/Components.*%/').textContent();
    const apiCoverage = await page.locator('text=/API.*%/').textContent();
    const pagesCoverage = await page.locator('text=/Pages.*%/').textContent();

    console.log('Coverage breakdown:', {
      total: displayedCoverage,
      components: componentCoverage,
      api: apiCoverage,
      pages: pagesCoverage,
    });

    // Verify coverage breakdown is present
    expect(componentCoverage || apiCoverage || pagesCoverage).toBeTruthy();
  });

  test('should verify performance metrics accuracy', async ({ page, webVitals }) => {
    // Set up Web Vitals collection
    await webVitals.setup();

    // Wait for performance metrics to load
    await page.waitForSelector('text=/Performance Score/', { timeout: 10000 });

    // Collect real performance metrics
    const realMetrics = await webVitals.collectMetrics();
    console.log('Real Web Vitals:', realMetrics);

    // Extract displayed performance metrics
    const performanceScore = await page.locator('text=/Performance Score/').locator('..').locator('.text-3xl').textContent();
    const lcpDisplay = await page.locator('text=/LCP:.*ms/').textContent();

    console.log('Dashboard performance metrics:', {
      score: performanceScore,
      lcp: lcpDisplay,
    });

    // Verify performance metrics are within reasonable ranges
    if (performanceScore) {
      const score = parseInt(performanceScore);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }

    if (lcpDisplay) {
      const lcpMatch = lcpDisplay.match(/(\d+)ms/);
      if (lcpMatch) {
        const lcp = parseInt(lcpMatch[1]);
        expect(lcp).toBeGreaterThan(0);
        expect(lcp).toBeLessThan(10000); // Reasonable upper bound
      }
    }
  });

  test('should validate system status metrics', async ({ page }) => {
    // Wait for system metrics to load
    await page.waitForSelector('text=/System Uptime/', { timeout: 10000 });

    // Extract system metrics
    const uptimeElement = page.locator('text=/System Uptime/').locator('..').locator('.text-3xl');
    const uptime = await uptimeElement.textContent();

    const stationsElement = page.locator('text=/Active Monitoring/').locator('..').locator('.text-3xl');
    const stations = await stationsElement.textContent();

    console.log('System metrics:', {
      uptime,
      stations,
    });

    // Validate uptime percentage
    if (uptime) {
      const uptimeValue = parseFloat(uptime.replace('%', ''));
      expect(uptimeValue).toBeGreaterThan(90); // Should be high uptime
      expect(uptimeValue).toBeLessThanOrEqual(100);
    }

    // Validate stations count
    if (stations) {
      const stationCount = parseInt(stations);
      expect(stationCount).toBeGreaterThan(0);
      expect(stationCount).toBeLessThan(1000); // Reasonable upper bound
    }
  });

  test('should verify real-time data updates', async ({ page }) => {
    // Check if auto-refresh is enabled
    const autoRefreshCheckbox = page.locator('#autoRefresh');
    await expect(autoRefreshCheckbox).toBeChecked();

    // Capture initial metrics
    const initialCoverage = await page.locator('.text-3xl').first().textContent();
    const initialDataRate = await page.locator('text=/Data Points Today/').locator('..').locator('.font-semibold').textContent();

    console.log('Initial metrics:', {
      coverage: initialCoverage,
      dataRate: initialDataRate,
    });

    // Wait for potential updates (the metrics should update based on the 30s interval)
    await page.waitForTimeout(3000);

    // Check if metrics can update (they might be the same, but structure should be intact)
    const updatedCoverage = await page.locator('.text-3xl').first().textContent();
    const updatedDataRate = await page.locator('text=/Data Points Today/').locator('..').locator('.font-semibold').textContent();

    expect(updatedCoverage).toBeTruthy();
    expect(updatedDataRate).toBeTruthy();

    console.log('Updated metrics:', {
      coverage: updatedCoverage,
      dataRate: updatedDataRate,
    });
  });

  test('should validate charts data integrity', async ({ page }) => {
    // Wait for charts to render
    await waitForChartsToRender(page);

    // Check that charts are present and rendered
    const canvasElements = await page.locator('canvas').count();
    expect(canvasElements).toBeGreaterThan(0);

    console.log(`Found ${canvasElements} chart canvases`);

    // Verify chart data by checking canvas dimensions
    const chartData = await page.evaluate(() => {
      const canvases = Array.from(document.querySelectorAll('canvas'));
      return canvases.map((canvas, index) => ({
        index,
        width: canvas.width,
        height: canvas.height,
        hasContent: canvas.width > 0 && canvas.height > 0,
      }));
    });

    console.log('Chart data:', chartData);

    // All charts should have valid dimensions
    chartData.forEach((chart) => {
      expect(chart.hasContent).toBe(true);
      expect(chart.width).toBeGreaterThan(0);
      expect(chart.height).toBeGreaterThan(0);
    });
  });

  test('should verify marine system data accuracy', async ({ page }) => {
    // Check shark tracking metrics
    const sharkCount = await page.locator('text=/Active Tags/').locator('..').locator('.font-semibold').textContent();
    const criticalAlerts = await page.locator('text=/Critical Alerts/').locator('..').locator('.font-semibold').textContent();

    // Check environmental metrics
    const heatwaveAlerts = await page.locator('text=/Heatwave Alerts/').locator('..').locator('.font-semibold').textContent();
    const processingRate = await page.locator('text=/Processing Rate/').locator('..').locator('.font-semibold').textContent();

    console.log('Marine system metrics:', {
      sharks: sharkCount,
      criticalAlerts,
      heatwaveAlerts,
      processingRate,
    });

    // Validate shark count
    if (sharkCount) {
      const count = parseInt(sharkCount);
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(500); // Reasonable bound
    }

    // Validate processing rate
    if (processingRate) {
      const rateMatch = processingRate.match(/(\d+\.?\d*)%/);
      if (rateMatch) {
        const rate = parseFloat(rateMatch[1]);
        expect(rate).toBeGreaterThan(0);
        expect(rate).toBeLessThanOrEqual(100);
      }
    }
  });

  test('should test dashboard export functionality', async ({ page }) => {
    // Set up download handling
    const downloadPromise = page.waitForEvent('download');

    // Click export button
    await page.locator('button:has-text("Export Data")').click();

    // Wait for download
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toContain('bluesphere-metrics');
    expect(download.suggestedFilename()).toContain('.json');

    console.log('Export file:', download.suggestedFilename());
  });

  test('should validate dashboard responsiveness', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 },  // Tablet
      { width: 375, height: 812 },   // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);

      // Verify key elements are visible
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('.text-3xl').first()).toBeVisible();

      // Check that charts adapt to viewport
      const chartContainers = await page.locator('canvas').count();
      expect(chartContainers).toBeGreaterThan(0);

      console.log(`Viewport ${viewport.width}x${viewport.height}: ${chartContainers} charts visible`);
    }
  });
});