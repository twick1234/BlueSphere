import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🌊 BlueSphere Playwright Global Setup')

  // Verify dev server is running
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    // Wait for dev server to be ready
    await page.goto('http://localhost:4000', { waitUntil: 'networkidle' })
    console.log('✅ Dev server is ready')

    // Verify key pages load
    await page.goto('http://localhost:4000/metrics')
    await page.waitForSelector('h1:has-text("Platform Metrics Dashboard")', { timeout: 10000 })
    console.log('✅ Metrics dashboard is accessible')

    // Pre-warm the application
    await page.goto('http://localhost:4000/')
    await page.goto('http://localhost:4000/sharks')
    await page.goto('http://localhost:4000/map')
    console.log('✅ Application pre-warmed')

  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup