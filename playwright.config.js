import { defineConfig, devices } from '@playwright/test';

const supabaseConfigured =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  Boolean(process.env.VITE_SUPABASE_ANON_KEY) &&
  process.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
  process.env.VITE_SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  grepInvert: supabaseConfigured ? undefined : /.*/,
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
  webServer: supabaseConfigured
    ? {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      }
    : undefined,
});
