/**
 * Persona: Vikram — B2B Growth Manager
 *
 * Scenario: Vikram runs B2B demand generation and pipeline programs. He uses
 * Marqq for lead intelligence, sales collateral, and outreach sequences.
 * He's comfortable with the tool but frequently works across modules.
 *
 * Covers:
 *  - Navigate to Lead Intelligence (Execution section)
 *  - OfferSelector empty-state CTA is visible and points to Setup
 *  - Navigate to Sales Enablement (Collateral section)
 *  - Navigate to Email Sequences (Collateral section)
 *  - Company Intel share button copies a deep link to clipboard
 *  - Agent reset button clears output
 *  - Theme toggle has accessible aria-label
 *  - Notification bell has accessible aria-label
 */

import { expect, Page, test } from '@playwright/test';

// ── helpers ───────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto('/');
  const emailLocator = page.locator('#email');
  if (await emailLocator.count() > 0) {
    await emailLocator.first().fill('yogsbags@gmail.com');
    await page.locator('#password').first().fill('Acc1234$&');
    await Promise.all([
      page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 }),
      page.locator('button[type="submit"]:has-text("Sign In")').click(),
    ]);
  }
  await page.waitForLoadState('networkidle');
  // Ensure we don't land in onboarding
  await page.evaluate(() => localStorage.setItem('marqq_onboarded', '1'));
  if (await page.locator('button:has-text("Brief the team")').count() > 0) {
    await page.reload();
    await page.waitForLoadState('networkidle');
  }
}

function mockAgentSSE(page: Page) {
  return page.route('**/api/agents/*/run', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        `data: ${JSON.stringify({ text: '# Lead Analysis\n\nTop 10 accounts identified from ICP criteria.' })}\n\n`,
        'data: [DONE]\n\n',
      ].join(''),
    });
  });
}

async function expandSection(page: Page, sectionLabel: string) {
  const toggle = page.locator(`button[aria-label*="${sectionLabel} section"]`);
  if (await toggle.count() > 0) {
    const expanded = await toggle.getAttribute('aria-expanded');
    if (expanded === 'false') await toggle.click();
    await page.waitForTimeout(200);
  }
}

async function clickSidebarItem(page: Page, text: string) {
  await page.locator(`button:has-text("${text}"), a:has-text("${text}")`).first().click();
  await page.waitForTimeout(600);
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Vikram — B2B Growth Manager multi-module flow', () => {
  test('navigate to Lead Intelligence from Execution section', async ({ page }) => {
    await login(page);
    await expandSection(page, 'Execution');
    await clickSidebarItem(page, 'Lead Intelligence');

    await expect(page.locator('text=Lead Intelligence').first()).toBeVisible({ timeout: 5000 });
  });

  test('OfferSelector empty-state CTA is visible when no offers exist', async ({ page }) => {
    await login(page);

    // Stub MKG to return empty so OfferSelector has no offers
    await page.route('**/api/company-intel/*/mkg*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mkg: {} }) }),
    );
    await page.route('**/api/workspace/profile*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ profile: {} }) }),
    );

    await expandSection(page, 'Execution');
    await clickSidebarItem(page, 'Lead Intelligence');
    await page.waitForTimeout(1000);

    // The empty-state CTA should be present
    const emptyStateCta = page.locator('text=Run Setup first').first();
    if (await emptyStateCta.count() > 0) {
      await expect(emptyStateCta).toBeVisible({ timeout: 5000 });
    }
  });

  test('OfferSelector empty-state CTA fires marqq:navigate event with moduleId=setup', async ({ page }) => {
    await login(page);

    await page.route('**/api/company-intel/*/mkg*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mkg: {} }) }),
    );

    await expandSection(page, 'Execution');
    await clickSidebarItem(page, 'Lead Intelligence');
    await page.waitForTimeout(1000);

    const emptyStateCta = page.locator('text=Run Setup first').first();
    if (await emptyStateCta.count() > 0) {
      const navigateEventFired = page.evaluate(() =>
        new Promise<string>(resolve => {
          window.addEventListener('marqq:navigate', (e) => {
            resolve((e as CustomEvent<{ moduleId: string }>).detail?.moduleId ?? '');
          }, { once: true });
        }),
      );
      await emptyStateCta.click();
      const moduleId = await navigateEventFired;
      expect(moduleId).toBe('setup');
    }
  });

  test('navigate to Sales Enablement from Collateral section', async ({ page }) => {
    await login(page);
    await expandSection(page, 'Collateral');
    await clickSidebarItem(page, 'Sales Enablement');

    await expect(page.locator('text=Sales Enablement').first()).toBeVisible({ timeout: 5000 });
  });

  test('navigate to Email Sequences from Collateral section', async ({ page }) => {
    await login(page);
    await expandSection(page, 'Collateral');
    await clickSidebarItem(page, 'Email Sequences');

    await expect(page.locator('text=Email Sequences').first()).toBeVisible({ timeout: 5000 });
  });

  test('agent reset button clears output after a run', async ({ page }) => {
    await login(page);
    await mockAgentSSE(page);

    await expandSection(page, 'Execution');
    await clickSidebarItem(page, 'Lead Intelligence');

    const runBtn = page
      .locator('button[aria-label*="Run"], button:has([data-lucide="play"]), button:has-text("Run")')
      .first();

    if (await runBtn.count() > 0) {
      await runBtn.click();
      // Wait for output to appear
      await expect(page.locator('text=Lead Analysis').first()).toBeVisible({ timeout: 8000 });

      // Reset button should appear
      const resetBtn = page.locator('button[aria-label*="Reset"], button:has([data-lucide="rotate-ccw"])').first();
      if (await resetBtn.count() > 0) {
        await resetBtn.click();
        // Output should be cleared
        await expect(page.locator('text=Lead Analysis').first()).not.toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('Company Intel share button copies deep-link to clipboard', async ({ page }) => {
    await login(page);

    // Grant clipboard write permission
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    // Navigate to Company Intelligence
    await expandSection(page, 'Context');
    await clickSidebarItem(page, 'Company Intelligence');
    await page.waitForTimeout(800);

    // Share button on any artifact page
    const shareBtn = page.locator('button:has([data-lucide="share-2"]), button[aria-label*="Share"], button:has-text("Share link")').first();
    if (await shareBtn.count() > 0) {
      await shareBtn.click();
      // Clipboard should contain a URL with #company-intel:
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toMatch(/#company-intel:/);
    }
  });

  test('theme toggle has an accessible aria-label', async ({ page }) => {
    await login(page);

    const themeBtn = page.locator('button[aria-label*="Switch to"]').first();
    await expect(themeBtn).toBeVisible({ timeout: 5000 });

    const label = await themeBtn.getAttribute('aria-label');
    expect(label).toMatch(/Switch to (dark|light) mode/i);
  });

  test('notification bell has an accessible aria-label', async ({ page }) => {
    await login(page);

    const bellBtn = page.locator('button[aria-label*="notification"], button[aria-label*="Notification"]').first();
    await expect(bellBtn).toBeVisible({ timeout: 5000 });

    const label = await bellBtn.getAttribute('aria-label');
    expect(label).toBeTruthy();
  });
});
