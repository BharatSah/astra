import { test, expect } from '@playwright/test';

test.describe('Astra - E2E UI & Flow Suite', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app root page with test query parameter for local sandbox fallback
    await page.goto('/?test=true');
  });

  test('should verify brand logo and sidebar branding elements', async ({ page }) => {
    // Check if the logo branding "Astra" is present
    const branding = page.locator('span', { hasText: 'Astra' });
    await expect(branding.first()).toBeVisible();
    
    // Verify Dashboard heading exists
    const heading = page.locator('h1', { hasText: 'Dashboard' });
    await expect(heading).toBeVisible();
  });

  test('should navigate to Password Vault and show passkey unlock gate', async ({ page }) => {
    // The vault is now passkey-protected (WebAuthn), which cannot be driven
    // in a headless test browser. Verify the locked vault UI renders and the
    // unlock affordance is present instead of the old passphrase input.
    await page.click('button:has-text("Password Vault")');
    await expect(page.locator('h1', { hasText: 'Password' })).toBeVisible();
    await expect(page.locator('button:has-text("Create Passkey & Unlock")')).toBeVisible();
    await expect(page.locator('input[placeholder="Search platform, username..."]')).toBeHidden();
  });

  test('should navigate to System Settings and add a new service', async ({ page }) => {
    // 1. Navigate to System Settings
    await page.click('button:has-text("System Settings")');
    // Open the Add Service modal
    await page.click('button:has-text("Add Service")');
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
    await page.fill('input[placeholder="e.g. Acme Corp"]', 'John E2E Doe');
    await page.fill('input[placeholder="admin@acme.com"]', 'john.e2e@example.com');
    await page.fill('input[placeholder="+1 (555) 000-0000"]', '+977-9800000000');
    
    // Service dropdown choice
    await page.selectOption('select', { index: 1 });
    
    // Expiry date (set to 5 days in the future to trigger "Expiring Soon")
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);
    
    // Notification threshold
    await page.fill('input[type="number"]', '7');
    await page.fill('textarea[placeholder="Any extra details about this client or contract..."]', 'Test customer note');
    
    // Click submit
    await page.click('button:has-text("Save Customer")');
    
    // Verify customer is in the list
    await expect(page.locator('text=John E2E Doe')).toBeVisible();
  });

  test('should navigate to Billing Reminders and add a new payment reminder', async ({ page }) => {
    // 1. Navigate to Billing Reminders
    await page.click('button:has-text("Billing Reminders")');
    await expect(page.locator('h1', { hasText: 'Billing Reminders' })).toBeVisible();

    // 2. Add payment reminder
    await page.click('button:has-text("Add Reminder")');
    
    // Fill in modal details
    await page.fill('input[placeholder="e.g. Acme Corp"]', 'Jane E2E Doe');
    await page.locator('select').first().selectOption({ index: 1 });
    
    // Due date (set to 4 days in future)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 4);
    const dateStr = futureDate.toISOString().split('T')[0];
    await page.fill('input[type="date"]', dateStr);
    
    // Amount and currency
    await page.fill('input[placeholder="0.00"]', '750.50');
    await page.locator('select').nth(1).selectOption('USD');
    
    // Save reminder
    await page.click('button:has-text("Save Reminder")');
    
    // Verify reminder is in the list
    await expect(page.locator('text=Jane E2E Doe')).toBeVisible();
  });

  test('should verify login with default credentials, edit profile, and logout', async ({ page }) => {
    // 1. Navigate without test query parameter to show Login page
    await page.goto('/');
    await expect(page.locator('text=Astra')).toBeVisible();
    await expect(page.locator('text=Sign In')).toBeVisible();

    // 2. Fill login details and login
    await page.fill('input[type="email"]', 'bharat.shah@mithilacoders.com');
    await page.fill('input[type="password"]', 'bharat123');
    await page.click('button:has-text("Sign In")');

    // 3. Confirm logged in by looking for dashboard
    await expect(page.locator('h1', { hasText: 'Dashboard' })).toBeVisible();

    // 4. Confirm sidebar user details
    await expect(page.locator('text=bharat.shah').first()).toBeVisible();
    await expect(page.locator('text=bharat.shah@mithilacoders.com')).toBeVisible();

    // 5. Navigate to settings -> User Profile and edit the display name
    await page.click('button:has-text("System Settings")');
    await page.click('button:has-text("User Profile")');
    await page.click('button:has-text("Edit Profile")');

    const nameInput = page.locator('input[placeholder="Your name"]');
    await nameInput.fill('bharat.new');
    await page.click('button:has-text("Save")');

    // Verify it changed in sidebar footer
    await expect(page.locator('text=bharat.new').first()).toBeVisible();

    // 6. Sign out from the profile screen
    await page.click('button:has-text("Sign Out")');

    // Confirms back on login screen
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

});
