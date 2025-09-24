import { test as base, expect, Page } from '@playwright/test';
import { WebVitals } from './web-vitals';
import { AccessibilityHelper } from './accessibility';

// Define custom fixtures
export type TestFixtures = {
  webVitals: WebVitals;
  accessibility: AccessibilityHelper;
};

// Extend the base test with custom fixtures
export const test = base.extend<TestFixtures>({
  webVitals: async ({ page }, use) => {
    const webVitals = new WebVitals(page);
    await use(webVitals);
  },

  accessibility: async ({ page }, use) => {
    const accessibility = new AccessibilityHelper(page);
    await use(accessibility);
  },
});

export { expect };

// Helper function to wait for page to be fully loaded with all resources
export async function waitForPageLoad(page: Page) {
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.waitForLoadState('domcontentloaded'),
    page.waitForFunction(() => document.readyState === 'complete'),
  ]);
}

// Helper function to wait for React components to be hydrated
export async function waitForReactHydration(page: Page) {
  await page.waitForFunction(() => {
    // Check if React has hydrated by looking for React dev tools
    return window.React !== undefined ||
           document.querySelector('[data-reactroot]') !== null ||
           document.querySelector('#__next') !== null;
  });
}

// Helper function to wait for charts to be rendered
export async function waitForChartsToRender(page: Page) {
  await page.waitForSelector('canvas', { timeout: 10000 });
  await page.waitForFunction(() => {
    const canvases = document.querySelectorAll('canvas');
    return Array.from(canvases).every(canvas => {
      const ctx = canvas.getContext('2d');
      return ctx && canvas.width > 0 && canvas.height > 0;
    });
  });
}

// Helper function to wait for Leaflet map to be ready
export async function waitForMapToLoad(page: Page) {
  await page.waitForSelector('.leaflet-container', { timeout: 15000 });
  await page.waitForFunction(() => {
    return window.L !== undefined && document.querySelector('.leaflet-map-pane') !== null;
  });
}