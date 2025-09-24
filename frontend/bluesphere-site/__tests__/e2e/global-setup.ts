import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Launch browser and create a new page for warm-up
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Warm up the application by visiting the main pages
  try {
    console.log('🚀 Warming up BlueSphere application...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Pre-warm key pages for faster test execution
    const pagesToWarmUp = ['/sharks', '/map', '/analytics', '/metrics'];
    for (const url of pagesToWarmUp) {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
    }

    console.log('✅ Application warm-up completed');
  } catch (error) {
    console.error('❌ Error during application warm-up:', error);
  }

  await browser.close();
}

export default globalSetup;