import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      VITE_FORCE_LOCAL_AUTH: 'true',
      VITE_SUPABASE_URL: 'YOUR_SUPABASE_URL',
      VITE_SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
    }
  },
});
