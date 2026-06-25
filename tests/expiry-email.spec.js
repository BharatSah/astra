import { test, expect } from '@playwright/test';

test.describe('Expiry Email Reminder tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?test=true');
  });

  test('should send expiry reminder mail manually and verify in Email Logs', async ({ page }) => {
    // 1. Navigate to Expiry Control
    await page.click('button:has-text("Expiry Control")');
    await expect(page.locator('h1', { hasText: 'Expiry' })).toBeVisible();

    // 2. Click Mail button for Aiden Vance
    await expect(page.locator('text=Aiden Vance')).toBeVisible();
    
    const row = page.locator('tr', { hasText: 'Aiden Vance' });
    const mailButton = row.locator('button[title="Send Email Alert"]');
    await mailButton.click();

    // 3. Verify specific toast notification
    await expect(page.locator('text=SMTP Alert dispatched to aiden@example.com!').first()).toBeVisible();
    await expect(page.locator('text=SMTP Alert dispatched to admin@astra.com!').first()).toBeVisible();

    // 4. Navigate to Email Logs
    await page.click('button:has-text("Email Logs")');
    await expect(page.locator('h1', { hasText: 'Send History' })).toBeVisible();

    // 5. Verify the log entries exist
    await expect(page.locator('tr', { hasText: 'aiden@example.com' }).first()).toBeVisible();
    await expect(page.locator('tr', { hasText: 'admin@astra.com' }).first()).toBeVisible();
  });

  test('should save recipient_emails and trigger email correctly', async ({ page }) => {
    // 1. Navigate to Expiry Control
    await page.click('button:has-text("Expiry Control")');
    await expect(page.locator('h1', { hasText: 'Expiry' })).toBeVisible();

    // 2. Add customer with specific custom recipient emails
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

    // 3. Verify it saved correctly by opening edit modal
    const row = page.locator('tr', { hasText: 'Temp Test Customer' });
    await row.locator('button[title="Edit Rule"]').click();
    await expect(page.locator('input[placeholder="e.g. admin@company.com, manager@company.com"]')).toHaveValue('custom1@example.com, custom2@example.com');
    await page.click('button:has-text("Cancel")');

    // 4. Click Mail button for Temp Test Customer
    await row.locator('button[title="Send Email Alert"]').click();

    // 5. Verify toast notifications for custom emails
    await expect(page.locator('text=SMTP Alert dispatched to custom1@example.com!').first()).toBeVisible();
    await expect(page.locator('text=SMTP Alert dispatched to custom2@example.com!').first()).toBeVisible();
  });
});
