import { test, expect } from '@playwright/test';

test.describe('Project Astra - E2E UI & Flow Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app root page with test query parameter for local sandbox fallback
    await page.goto('/?test=true');
  });

  test('should verify brand logo and sidebar branding elements', async ({ page }) => {
    // Check if the logo branding "Project Astra" is present
    const branding = page.locator('span', { hasText: 'Project Astra' });
    await expect(branding.first()).toBeVisible();
    
    // Verify Dashboard heading exists
    const heading = page.locator('h1', { hasText: 'Dashboard' });
    await expect(heading).toBeVisible();
  });

  test('should navigate to Password Vault, search credentials, and create a new entry', async ({ page }) => {
    // 1. Navigate to Password Vault
    await page.click('button:has-text("Password Vault")');
    await expect(page.locator('h1', { hasText: 'Password' })).toBeVisible();

    // 2. Test search feature
    const searchInput = page.locator('input[placeholder="Search platform, username, or URL..."]');
    await searchInput.fill('Vercel');
    // Vercel Console card should be visible, GitHub should not
    await expect(page.locator('text=Vercel Console')).toBeVisible();
    await expect(page.locator('text=GitHub')).not.toBeVisible();

    // Clear search
    await searchInput.fill('');

    // 3. Add new credentials
    await page.click('button:has-text("Add Password")');
    
    // Check modal header
    await expect(page.locator('text=Add New Password')).toBeVisible();
    
    // Fill in values
    await page.fill('input[placeholder="e.g. Google, AWS, GitHub"]', 'Slack Admin');
    await page.fill('input[placeholder="e.g. https://github.com"]', 'https://slack.com');
    await page.fill('input[placeholder="e.g. admin@company.com"]', 'slack-astra-admin');
    await page.fill('input[placeholder="Secure alphanumeric password"]', 'AstraSlack123!');
    
    // Submit form
    await page.click('button:has-text("Store Password")');
    
    // Check if Slack Admin exists in list now
    await expect(page.locator('text=Slack Admin')).toBeVisible();
  });

  test('should navigate to System Settings and add a new service', async ({ page }) => {
    // 1. Navigate to System Settings
    await page.click('button:has-text("System Settings")');
    await expect(page.locator('h2', { hasText: 'Add New Service' })).toBeVisible();

    // 2. Add a new service
    await page.fill('input[placeholder="e.g. Premium Cloud Hosting"]', 'E2E Premium Support');
    await page.fill('textarea[placeholder="Service particulars, pricing, or details..."]', 'E2E Testing service description');
    await page.click('button:has-text("Create Service")');

    // 3. Verify service is added in the services list
    await expect(page.locator('text=E2E Premium Support')).toBeVisible();
  });

  test('should navigate to Expiry Control and add a new customer expiry entry', async ({ page }) => {
    // 1. Navigate to Expiry Control
    await page.click('button:has-text("Expiry Control")');
    await expect(page.locator('h1', { hasText: 'Expiry' })).toBeVisible();

    // 2. Add customer expiry
    await page.click('button:has-text("Add Customer")');
    
    // Fill in modal details
    await page.fill('input[placeholder="e.g. Aiden Vance"]', 'John E2E Doe');
    await page.fill('input[placeholder="e.g. client@domain.com"]', 'john.e2e@example.com');
    await page.fill('input[placeholder="e.g. +1 555-0199"]', '+977-9800000000');
    
    // Service dropdown choice
    await page.selectOption('select', { index: 1 });
    
    // Expiry date (set to 5 days in the future to trigger "Expiring Soon")
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);
    
    // Notification threshold
    await page.fill('input[type="number"]', '7');
    await page.fill('textarea[placeholder="Enter subscription rules, domain provider details or other remarks..."]', 'Test customer note');
    
    // Click submit
    await page.click('button:has-text("Schedule Rule")');
    
    // Verify customer is in the list
    await expect(page.locator('text=John E2E Doe')).toBeVisible();
  });

  test('should navigate to Billing Reminders and add a new payment reminder', async ({ page }) => {
    // 1. Navigate to Billing Reminders
    await page.click('button:has-text("Billing Reminders")');
    await expect(page.locator('h1', { hasText: 'Payment' })).toBeVisible();

    // 2. Add payment reminder
    await page.click('button:has-text("Add Reminder")');
    
    // Fill in modal details
    await page.fill('input[placeholder="e.g. Aiden Vance"]', 'Jane E2E Doe');
    await page.selectOption('select', { index: 1 });
    
    // Due date (set to 4 days in future)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);
    
    // Amount and currency
    await page.fill('input[placeholder="e.g. 1500.00"]', '750.50');
    await page.click('button:has-text("USD")');
    
    // Save reminder
    await page.click('button:has-text("Schedule Reminder")');
    
    // Verify reminder is in the list
    await expect(page.locator('text=Jane E2E Doe')).toBeVisible();
  });

});
