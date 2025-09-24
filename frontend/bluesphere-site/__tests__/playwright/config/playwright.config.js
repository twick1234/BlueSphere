/**
 * Advanced Playwright Configuration for BlueSphere Marine Monitoring Platform
 * Maximizes code coverage through comprehensive testing strategies
 */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Environment configuration
const baseURL = process.env.BASE_URL || 'http://localhost:4000';
const CI = !!process.env.CI;
const WORKERS = CI ? 1 : Math.max(2, Math.floor(require('os').cpus().length / 2));

export default defineConfig({
  // Test directory configuration
  testDir: '../tests',
  outputDir: '../test-results',

  // Global timeout settings
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions
    // Visual comparison threshold
    threshold: 0.2,
    toHaveScreenshot: { threshold: 0.2, mode: 'ci' }
  },

  // Fail fast in CI, but continue locally for debugging
  fullyParallel: !CI,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: WORKERS,

  // Advanced reporting configuration
  reporter: [
    // Always show progress
    ['line'],
    // Detailed HTML report with screenshots
    ['html', {
      outputFolder: '../reports/html',
      open: CI ? 'never' : 'on-failure'
    }],
    // JUnit for CI integration
    ...(CI ? [['junit', { outputFile: '../reports/junit.xml' }]] : []),
    // JSON for data analysis
    ['json', { outputFile: '../reports/test-results.json' }],
    // Custom coverage reporter
    ['../utils/coverage-reporter.js']
  ],

  // Global test configuration
  use: {
    // Base URL for all tests
    baseURL,

    // Browser context options
    contextOptions: {
      // Ignore HTTPS errors for development
      ignoreHTTPSErrors: true,
      // Set viewport for consistent testing
      viewport: { width: 1280, height: 720 },
      // Record traces on failure
      trace: 'retain-on-failure',
      // Take screenshots on failure
      screenshot: 'only-on-failure',
      // Record video on failure
      video: 'retain-on-failure'
    },

    // Network configuration
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,

    // Locale and timezone for consistent results
    locale: 'en-US',
    timezoneId: 'UTC',

    // Store authentication state
    storageState: '../fixtures/auth-state.json'
  },

  // Advanced project configurations for maximum coverage
  projects: [
    // Setup project for authentication and data preparation
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      teardown: 'cleanup',
    },

    // Cleanup project
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.js/,
    },

    // Desktop browsers - Chrome/Chromium
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools Protocol for performance monitoring
        launchOptions: {
          args: [
            '--enable-features=NetworkService,NetworkServiceLogging',
            '--force-device-scale-factor=1',
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--no-sandbox'
          ]
        }
      },
      dependencies: ['setup'],
    },

    // Firefox for cross-browser compatibility
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Firefox-specific configurations
        launchOptions: {
          firefoxUserPrefs: {
            'geo.enabled': true,
            'geo.provider.network.url': 'data:application/json,{"location": {"lat": 37.7749, "lng": -122.4194}, "accuracy": 100.0}',
          }
        }
      },
      dependencies: ['setup'],
    },

    // Safari for WebKit testing
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    // Mobile testing - essential for marine field work
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
        // Mobile-specific settings for marine monitoring
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        permissions: ['geolocation', 'camera', 'microphone']
      },
      dependencies: ['setup'],
    },

    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
        geolocation: { latitude: 37.7749, longitude: -122.4194 },
        permissions: ['geolocation', 'camera']
      },
      dependencies: ['setup'],
    },

    // Tablet testing for field research
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro'],
        geolocation: { latitude: 37.7749, longitude: -122.4194 }
      },
      dependencies: ['setup'],
    },

    // API testing project - direct endpoint testing
    {
      name: 'api-tests',
      testMatch: /.*\.api\.spec\.js/,
      use: {
        // No browser needed for API tests
        baseURL,
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    },

    // Performance testing project
    {
      name: 'performance',
      testMatch: /.*\.performance\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        // Performance-specific settings
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--enable-memory-info',
            '--js-flags=--expose-gc'
          ]
        }
      },
      dependencies: ['setup'],
    },

    // Visual regression testing
    {
      name: 'visual',
      testMatch: /.*\.visual\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        // Consistent visual testing
        viewport: { width: 1280, height: 720 },
        deviceScaleFactor: 1,
        // Disable animations for consistent screenshots
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=TranslateUI']
        }
      },
      dependencies: ['setup'],
    },

    // Accessibility testing
    {
      name: 'accessibility',
      testMatch: /.*\.a11y\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        // Enable accessibility features
        launchOptions: {
          args: [
            '--force-prefers-reduced-motion',
            '--enable-accessibility-tab-switching'
          ]
        }
      },
      dependencies: ['setup'],
    },

    // Network conditions testing
    {
      name: 'slow-network',
      testMatch: /.*\.network\.spec\.js/,
      use: {
        ...devices['Desktop Chrome'],
        // Simulate slow 3G for field conditions
        contextOptions: {
          offline: false,
          // Simulate slow marine research vessel connection
          extraHTTPHeaders: {
            'Connection': 'keep-alive'
          }
        }
      },
      dependencies: ['setup'],
    }
  ],

  // Web server configuration for local testing
  webServer: {
    command: 'npm run dev',
    port: 4000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120 * 1000, // 2 minutes to start
    env: {
      NODE_ENV: 'test',
      // Mock external API endpoints for testing
      MOCK_EXTERNAL_APIS: 'true',
      // Enable performance monitoring
      ENABLE_PERFORMANCE_MONITORING: 'true'
    }
  },

  // Global setup and teardown
  globalSetup: require.resolve('../utils/global-setup.js'),
  globalTeardown: require.resolve('../utils/global-teardown.js'),
});