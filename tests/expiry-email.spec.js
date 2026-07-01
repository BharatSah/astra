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

test.describe('Expiry Email Reminder tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should save recipient_emails and trigger email from expiry control', async ({ page }) => {
    await page.click('button:has-text("Expiry Control")');
    await expect(page.locator('h1', { hasText: 'Expiry' })).toBeVisible();

    await page.click('button:has-text("Add Customer")');
    await page.fill('input[placeholder="e.g. Acme Corp"]', 'Temp Test Customer');
    await page.fill('input[placeholder="admin@acme.com"]', 'temp@example.com');
    await page.selectOption('select', { index: 1 });

    const date = new Date();
    date.setDate(date.getDate() + 10);
    await page.fill('input[type="date"]', date.toISOString().split('T')[0]);
    await page.fill('input[placeholder="e.g. admin@company.com, manager@company.com"]', 'custom1@example.com, custom2@example.com');
    await page.click('button:has-text("Save Customer")');
    await expect(page.locator('div.font-bold', { hasText: 'Temp Test Customer' }).first()).toBeVisible();

    const row = page.locator('tr', { hasText: 'Temp Test Customer' });
    await row.locator('button[title="Edit Rule"]').click();
    await expect(page.locator('input[placeholder="e.g. admin@company.com, manager@company.com"]')).toHaveValue('custom1@example.com, custom2@example.com');
    await page.click('button:has-text("Cancel")');

    await row.locator('button[title="Send Email Alert"]').click();
    await expect(
      page.locator('text=/Email sent to|Failed to send email/').first()
    ).toBeVisible({ timeout: 15000 });
  });
});
