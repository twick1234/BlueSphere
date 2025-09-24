/**
 * Marine Researcher Workflow Testing
 * Tests complete user journeys for marine research scientists
 */

import { test, expect } from '@playwright/test';
import { MarineResearcherPage } from '../utils/page-objects/marine-researcher-page.js';
import { DataExportHelper } from '../utils/data-export-helper.js';

test.describe('Marine Researcher Complete Workflows', () => {
  let researcherPage;
  let dataExportHelper;

  test.beforeEach(async ({ page }) => {
    researcherPage = new MarineResearcherPage(page);
    dataExportHelper = new DataExportHelper(page);
    await researcherPage.navigateToHome();
  });

  test.describe('Data Discovery and Analysis Workflow', () => {
    test('should complete full research data discovery journey', async ({ page }) => {
      // Step 1: Navigate to home and assess platform capabilities
      await researcherPage.verifyPlatformOverview();

      // Step 2: Navigate to ocean data dashboard
      await researcherPage.navigateToDataDashboard();
      await expect(page.locator('[data-testid="ocean-metrics-dashboard"]')).toBeVisible();

      // Step 3: Filter data by research parameters
      await researcherPage.setDateRange('2024-01-01', '2024-12-31');
      await researcherPage.selectRegion('Pacific Ocean');
      await researcherPage.selectDataTypes(['temperature', 'ph_levels', 'oxygen']);

      // Verify filtered data loads correctly
      await expect(page.locator('[data-testid="data-visualization"]')).toBeVisible();
      await expect(page.locator('[data-testid="data-points-count"]')).toContainText(/\d+/);

      // Step 4: Analyze data visualizations
      await researcherPage.interactWithTimeSeriesChart();
      await researcherPage.analyzeSpatialDistribution();

      // Step 5: Compare with historical data
      await researcherPage.enableHistoricalComparison();
      await researcherPage.verifyTrendAnalysis();

      // Verify researcher can access detailed metadata
      await page.locator('[data-testid="metadata-panel"]').click();
      await expect(page.locator('[data-testid="data-source-info"]')).toBeVisible();
      await expect(page.locator('[data-testid="measurement-accuracy"]')).toBeVisible();
    });

    test('should handle complex multi-parameter research queries', async ({ page }) => {
      await researcherPage.navigateToAdvancedSearch();

      // Build complex research query
      await researcherPage.addParameterFilter('temperature', '>', 15);
      await researcherPage.addParameterFilter('ph', '<', 8.0);
      await researcherPage.addGeographicBounds(-150, -120, 25, 45); // California coast
      await researcherPage.addTemporalFilter('summer_months', ['06', '07', '08']);

      // Execute search and verify results
      await researcherPage.executeSearch();
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();

      // Verify search results match criteria
      const results = await researcherPage.getSearchResults();
      expect(results.length).toBeGreaterThan(0);

      // Save search for future reference
      await researcherPage.saveSearchQuery('California Summer Ocean Chemistry 2024');
      await expect(page.locator('[data-testid="saved-search-confirmation"]')).toBeVisible();
    });
  });

  test.describe('Shark Tracking Research Workflow', () => {
    test('should analyze shark movement patterns for research', async ({ page }) => {
      // Navigate to shark tracking interface
      await page.goto('/sharks');
      await expect(page.locator('h1')).toContainText('Global Shark Tracking');

      // Wait for shark data to load
      await expect(page.locator('[data-testid="sharks-grid"], .sharks-grid')).toBeVisible({ timeout: 10000 });

      // Switch to map view for spatial analysis
      await page.click('[aria-controls="map-panel"]');
      await expect(page.locator('[data-testid="shark-map"], .map-container')).toBeVisible();

      // Select a specific shark for detailed analysis
      const firstSharkCard = page.locator('.shark-card').first();
      await firstSharkCard.waitFor({ state: 'visible' });
      await firstSharkCard.click();

      // Verify shark profile opens with research data
      await expect(page.locator('[data-testid="shark-profile"], .shark-profile')).toBeVisible();

      // Analyze migration patterns
      await page.locator('[data-testid="migration-analysis"], button:has-text("Migration")').click();
      await expect(page.locator('[data-testid="migration-route"], .migration-route')).toBeVisible();

      // Export tracking data for research
      await page.locator('[data-testid="export-data"], button:has-text("Export")').click();
      await dataExportHelper.selectExportFormat('csv');
      await dataExportHelper.configureExportParameters({
        includePositions: true,
        includeEnvironmentalData: true,
        dateRange: 'last_6_months'
      });

      // Verify download initiates
      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="confirm-export"], button:has-text("Download")').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/shark.*\.csv/);
    });

    test('should correlate shark behavior with environmental conditions', async ({ page }) => {
      await page.goto('/sharks');

      // Enable environmental data overlay
      await page.locator('[data-testid="layer-controls"], .layer-controls').waitFor({ state: 'visible' });
      await page.check('input[name="temperature-layer"]');
      await page.check('input[name="current-layer"]');

      // Select multiple sharks for comparative analysis
      await page.locator('.shark-card').nth(0).click();
      await page.keyboard.press('Control');
      await page.locator('.shark-card').nth(1).click();
      await page.keyboard.press('Escape'); // Release Ctrl

      // Open comparative analysis tool
      await page.locator('[data-testid="compare-sharks"]').click();
      await expect(page.locator('[data-testid="comparison-view"]')).toBeVisible();

      // Analyze environmental correlations
      await page.selectOption('[data-testid="correlation-parameter"]', 'temperature');
      await page.locator('[data-testid="run-correlation"]').click();

      // Verify correlation results
      await expect(page.locator('[data-testid="correlation-coefficient"]')).toBeVisible();
      await expect(page.locator('[data-testid="significance-test"]')).toBeVisible();
    });
  });

  test.describe('Alert Subscription and Monitoring Workflow', () => {
    test('should set up research-specific alert monitoring', async ({ page }) => {
      // Navigate to alerts dashboard
      await page.goto('/alerts');
      await expect(page.locator('h1')).toContainText(/Alert|Monitor/);

      // View active marine alerts
      await expect(page.locator('[data-testid="active-alerts"]')).toBeVisible();

      // Set up custom research alert
      await page.locator('[data-testid="create-alert"], button:has-text("Create Alert")').click();

      // Configure research-specific parameters
      await page.fill('[data-testid="alert-name"]', 'Pacific Marine Heatwave Research');
      await page.selectOption('[data-testid="alert-type"]', 'marine_heatwave');

      // Set geographic area of interest
      await page.locator('[data-testid="map-selector"]').click();
      // Simulate drawing a research area (Pacific Northwest)
      await page.mouse.move(100, 100);
      await page.mouse.down();
      await page.mouse.move(300, 300);
      await page.mouse.up();

      // Set alert thresholds for research criteria
      await page.fill('[data-testid="temperature-threshold"]', '2.5');
      await page.fill('[data-testid="duration-threshold"]', '5');

      // Configure notification preferences
      await page.check('[data-testid="email-notifications"]');
      await page.fill('[data-testid="notification-email"]', 'researcher@oceanlab.org');

      // Save alert configuration
      await page.locator('[data-testid="save-alert"]').click();
      await expect(page.locator('[data-testid="alert-confirmation"]')).toBeVisible();
    });

    test('should process and analyze alert history', async ({ page }) => {
      await page.goto('/alerts');

      // Navigate to alert history
      await page.locator('[data-testid="alert-history"], .tab:has-text("History")').click();
      await expect(page.locator('[data-testid="alert-timeline"]')).toBeVisible();

      // Filter alerts by type for research analysis
      await page.selectOption('[data-testid="alert-type-filter"]', 'marine_heatwave');
      await page.fill('[data-testid="date-from"]', '2024-01-01');
      await page.fill('[data-testid="date-to"]', '2024-12-31');

      // Apply filters and analyze trends
      await page.locator('[data-testid="apply-filters"]').click();
      await expect(page.locator('[data-testid="filtered-alerts"]')).toBeVisible();

      // Generate trend analysis
      await page.locator('[data-testid="trend-analysis"]').click();
      await expect(page.locator('[data-testid="trend-chart"]')).toBeVisible();

      // Export alert data for research
      await page.locator('[data-testid="export-alerts"]').click();
      await dataExportHelper.selectExportFormat('json');

      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="confirm-export"]').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/alerts.*\.json/);
    });
  });

  test.describe('Conservation Research Workflow', () => {
    test('should access and analyze conservation impact data', async ({ page }) => {
      // Navigate to conservation dashboard
      await page.goto('/conservation');
      await expect(page.locator('h1')).toContainText(/Conservation/);

      // Explore conservation metrics
      await expect(page.locator('[data-testid="conservation-metrics"]')).toBeVisible();

      // Analyze marine protected area effectiveness
      await page.locator('[data-testid="mpa-analysis"]').click();
      await expect(page.locator('[data-testid="mpa-effectiveness-chart"]')).toBeVisible();

      // Compare protected vs unprotected areas
      await page.locator('[data-testid="area-comparison"]').click();
      await expect(page.locator('[data-testid="comparison-results"]')).toBeVisible();

      // Access species conservation status
      await page.locator('[data-testid="species-status"]').click();
      await expect(page.locator('[data-testid="species-list"]')).toBeVisible();

      // Filter by conservation concern level
      await page.selectOption('[data-testid="concern-level"]', 'endangered');
      await expect(page.locator('[data-testid="endangered-species"]')).toBeVisible();

      // Generate conservation report
      await page.locator('[data-testid="generate-report"]').click();
      await page.fill('[data-testid="report-title"]', 'Pacific Marine Conservation Status 2024');
      await page.check('[data-testid="include-statistics"]');
      await page.check('[data-testid="include-recommendations"]');

      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="download-report"]').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/conservation.*report.*\.pdf/);
    });
  });

  test.describe('Data Integration and Export Workflow', () => {
    test('should integrate multiple data sources for comprehensive analysis', async ({ page }) => {
      // Start with ocean data
      await page.goto('/');
      await researcherPage.navigateToDataDashboard();

      // Add environmental layers
      await page.locator('[data-testid="add-layer"]').click();
      await page.check('input[value="temperature"]');
      await page.check('input[value="currents"]');
      await page.check('input[value="chlorophyll"]');

      // Overlay shark tracking data
      await page.locator('[data-testid="overlay-sharks"]').click();
      await expect(page.locator('[data-testid="integrated-view"]')).toBeVisible();

      // Add alert zones
      await page.locator('[data-testid="overlay-alerts"]').click();

      // Configure temporal synchronization
      await page.locator('[data-testid="time-sync"]').click();
      await page.fill('[data-testid="sync-start-date"]', '2024-06-01');
      await page.fill('[data-testid="sync-end-date"]', '2024-08-31');

      // Generate integrated dataset
      await page.locator('[data-testid="create-dataset"]').click();
      await page.fill('[data-testid="dataset-name"]', 'Pacific Summer Research Dataset 2024');

      // Export comprehensive dataset
      await dataExportHelper.selectExportFormat('netcdf');
      await dataExportHelper.configureExportParameters({
        includeMetadata: true,
        compressionLevel: 'medium',
        spatialResolution: '1km'
      });

      const downloadPromise = page.waitForEvent('download');
      await page.locator('[data-testid="export-dataset"]').click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/dataset.*\.nc/);
    });

    test('should handle large dataset operations efficiently', async ({ page }) => {
      await researcherPage.navigateToDataDashboard();

      // Request large dataset
      await page.locator('[data-testid="bulk-data-request"]').click();
      await page.selectOption('[data-testid="data-scope"]', 'global');
      await page.fill('[data-testid="start-date"]', '2020-01-01');
      await page.fill('[data-testid="end-date"]', '2024-12-31');

      // Verify system handles request appropriately
      await page.locator('[data-testid="submit-request"]').click();

      // Should show progress indicator for large requests
      await expect(page.locator('[data-testid="processing-indicator"]')).toBeVisible();

      // Or suggest chunked download approach
      const chunkingOption = page.locator('[data-testid="chunk-download"]');
      if (await chunkingOption.isVisible()) {
        await chunkingOption.click();
        await expect(page.locator('[data-testid="chunk-configuration"]')).toBeVisible();
      }
    });
  });

  test.describe('Collaborative Research Features', () => {
    test('should share research findings with collaborators', async ({ page }) => {
      await researcherPage.navigateToDataDashboard();

      // Create a research view
      await researcherPage.createCustomView('Pacific Acidification Study');

      // Generate shareable link
      await page.locator('[data-testid="share-view"]').click();
      await expect(page.locator('[data-testid="share-dialog"]')).toBeVisible();

      // Configure sharing permissions
      await page.check('[data-testid="allow-comments"]');
      await page.check('[data-testid="allow-data-download"]');
      await page.fill('[data-testid="expiry-date"]', '2025-12-31');

      // Generate and copy link
      await page.locator('[data-testid="generate-link"]').click();
      await expect(page.locator('[data-testid="shareable-link"]')).toBeVisible();

      const shareLink = await page.locator('[data-testid="shareable-link"]').textContent();
      expect(shareLink).toMatch(/https?:\/\/.*\/shared\/[a-zA-Z0-9]+/);
    });

    test('should collaborate on data annotation and notes', async ({ page }) => {
      await page.goto('/sharks');

      // Select a shark for collaborative annotation
      await page.locator('.shark-card').first().click();

      // Add research notes
      await page.locator('[data-testid="add-note"]').click();
      await page.fill('[data-testid="note-content"]', 'Observed unusual migration pattern - requires further investigation');
      await page.selectOption('[data-testid="note-category"]', 'behavioral_observation');

      // Tag collaborators
      await page.fill('[data-testid="tag-collaborators"]', '@marine_bio_lab @shark_research_team');

      // Save collaborative note
      await page.locator('[data-testid="save-note"]').click();
      await expect(page.locator('[data-testid="note-confirmation"]')).toBeVisible();
    });
  });
});