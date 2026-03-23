import { expect, test } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test('login and complete the onboarding flow', async ({ page }) => {
    await page.goto('/');

    // Clear onboarded state to force onboarding screen
    await page.evaluate(() => localStorage.removeItem('marqq_onboarded'));

    const emailLocator = page.locator('#email');
    const hasLogin = await emailLocator.count() > 0;

    if (hasLogin) {
      await emailLocator.first().fill('yogsbags@gmail.com');
      await page.locator('#password').first().fill('Acc1234$&');
      await Promise.all([
        page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 }),
        page.locator('button[type="submit"]:has-text("Sign In")').click(),
      ]);
    }

    // Ensure onboarding runs from scratch
    await page.evaluate(() => localStorage.removeItem('marqq_onboarded'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Welcome screen
    await expect(page.locator('text=Your AI team')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'test-results/onboarding-start.png' });

    // Start form
    await page.locator('button:has-text("Brief the team")').click();

    // Step 01 — Your Company
    await expect(page.locator('text=Your Company')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('e.g. PL Capital').fill('Playwright Test Co');
    await page.getByPlaceholder('e.g. plcapital.in').fill('playwrighttest.example.com');
    await page.locator('button:has-text("Continue")').click();

    // Step 02 — Your Market
    await expect(page.locator('text=Your Market')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('e.g. WealthTech, India').fill('B2B SaaS Testing');
    await page.getByPlaceholder(/Ideal Customer Profile/).fill('QA Engineers, 25–40, Tier 1 cities');
    await page.locator('button:has-text("Continue")').click();

    // Step 03 — Your Competition
    await expect(page.locator('text=Your Competition')).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder(/skip if pre-launch/).fill('Manual Testing Teams');
    await page.locator('button:has-text("Continue")').click();

    await page.screenshot({ path: 'test-results/onboarding-form-filled.png' });

    // Activate Team
    await page.locator('button:has-text("Activate Team")').click();

    // Activation → Done
    await expect(page.locator('text=Briefing your agents')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Team is operational.')).toBeVisible({ timeout: 15000 });
  });
});
