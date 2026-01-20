/**
 * Playwright Configuration for E2E Testing
 * 
 * This configuration sets up end-to-end testing for the Chrome extension.
 * It includes:
 * - Chrome browser with extension loading support
 * - YouTube test scenarios
 * - Screenshot and video recording on failure
 * 
 * @author YouTube Subtitle Enhancer Team
 * @since 0.1.0
 */

import { defineConfig, devices } from '@playwright/test';
import { resolve } from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: false, // Extension tests should run sequentially
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: 1, // Chrome extension tests work better with single worker
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
    
    /* Timeout for each test */
    actionTimeout: 10000,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        
        // Path to the built extension
        // NOTE: You must run `pnpm run build` before running E2E tests
        // We will use the .output/chrome-mv3 directory
        headless: false, // Extensions require non-headless mode
        
        // Chrome args for extension loading
        launchOptions: {
          args: [
            `--disable-extensions-except=${resolve(__dirname, '.output/chrome-mv3')}`,
            `--load-extension=${resolve(__dirname, '.output/chrome-mv3')}`,
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ],
        },
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
