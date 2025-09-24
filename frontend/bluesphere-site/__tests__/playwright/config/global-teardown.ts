import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🌊 BlueSphere Playwright Global Teardown')
  // Any cleanup needed after all tests run
}

export default globalTeardown