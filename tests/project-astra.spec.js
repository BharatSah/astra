import { test, expect } from '@playwright/test';

const testEmail = process.env.ASTRA_TEST_EMAIL;
const testPassword = process.env.ASTRA_TEST_PASSWORD;

async function login(page) {
  if (!testEmail || !testPassword) {
    test.skip(true, 'Set ASTRA_TEST_EMAIL and ASTRA_TEST_PASSWORD to run authenticated tests.');
  }
  await page.goto('/');
  await page.fill('input[type="email"]', testEmail);
  await page.fill('input[type="password"]', testPassword);
  await page.click('button:has-text("Sign In")');
  await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
}

test.describe('Astra - E2E UI & Flow Suite', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should verify brand logo and sidebar branding elements', async ({ page }) => {
    const branding = page.locator('span', { hasText: 'Astra' });
    await expect(branding.first()).toBeVisible();
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();
  });

  test('should navigate to Password Vault and show passkey unlock gate', async ({ page }) => {
    await page.click('button:has-text("Password Vault")');
    await expect(page.locator('h1', { hasText: 'Password' })).toBeVisible();
    await expect(page.locator('button:has-text("Create Passkey & Unlock")')).toBeVisible();
    await expect(page.locator('input[placeholder="Search platform, username..."]')).toBeHidden();
  });

  test('should navigate to System Settings and add a new service', async ({ page }) => {
    await page.click('button:has-text("System Settings")');
    await page.click('button:has-text("Add Service")');
    await expect(page.locator('h2', { hasText: 'Add New Service' })).toBeVisible();

    await page.fill('input[placeholder="e.g. Premium Cloud Hosting"]', 'E2E Premium Support');
    await page.fill('textarea[placeholder="Service particulars, pricing, or details..."]', 'E2E Testing service description');
    await page.click('button:has-text("Create Service")');

    await expect(page.locator('text=E2E Premium Support')).toBeVisible();
  });

  test('should navigate to Expiry Control and add a new customer expiry entry', async ({ page }) => {
    await page.click('button:has-text("Expiry Control")');
    await expect(page.locator('h1', { hasText: 'Expiry' })).toBeVisible();

    await page.click('button:has-text("Add Customer")');
    await page.fill('input[placeholder="e.g. Acme Corp"]', 'John E2E Doe');
    await page.fill('input[placeholder="admin@acme.com"]', 'john.e2e@example.com');
    await page.fill('input[placeholder="+1 (555) 000-0000"]', '+977-9800000000');
    await page.selectOption('select', { index: 1 });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);
    await page.fill('input[type="number"]', '7');
    await page.fill('textarea[placeholder="Any extra details about this client or contract..."]', 'Test customer note');
    await page.click('button:has-text("Save Customer")');

    await expect(page.locator('text=John E2E Doe')).toBeVisible();
  });

  test('should navigate to Billing Reminders and add a new payment reminder', async ({ page }) => {
    await page.click('button:has-text("Billing Reminders")');
    await expect(page.locator('h1', { hasText: 'Billing Reminders' })).toBeVisible();

    await page.click('button:has-text("Add Reminder")');
    await page.fill('input[placeholder="e.g. Acme Corp"]', 'Jane E2E Doe');
    await page.locator('select').first().selectOption({ index: 1 });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);
    await page.fill('input[placeholder="0.00"]', '750.50');
    await page.locator('select').nth(1).selectOption('USD');
    await page.click('button:has-text("Save Reminder")');

    await expect(page.locator('text=Jane E2E Doe')).toBeVisible();
  });
});

test.describe('Authentication', () => {
  test('should login and logout with Supabase credentials', async ({ page }) => {
    if (!testEmail || !testPassword) {
      test.skip(true, 'Set ASTRA_TEST_EMAIL and ASTRA_TEST_PASSWORD.');
    }
    await page.goto('/');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button:has-text("Sign In")');
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();

    await page.click('button:has-text("System Settings")');
    await page.click('button:has-text("User Profile")');
    await page.click('button[title="Logout"]');
    await expect(page.locator('text=Sign In')).toBeVisible();
  });
});
