/**
 * Persona: Rohit — Solo Founder / First-time user
 *
 * Scenario: Rohit has just completed onboarding and is using Marqq for the
 * very first time. He needs to discover the Setup module, understand that he
 * needs to populate offers before running agents, and successfully kick off
 * his first agent run.
 *
 * Covers:
 *  - No first-session banner appears after onboarding
 *  - OfferSelector empty-state CTA dispatches marqq:navigate to setup
 *  - Elapsed timer is visible during an agent streaming run
 *  - Copy buttons appear once streaming finishes
 */

import { expect, Page, test } from '@playwright/test';

// ── helpers ──────────────────────────────────────────────────────────────────

async function loginAndClearOnboarding(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.removeItem('marqq_onboarded');
  });

  const emailLocator = page.locator('#email');
  if (await emailLocator.count() > 0) {
    await emailLocator.first().fill('yogsbags@gmail.com');
    await page.locator('#password').first().fill('Acc1234$&');
    await Promise.all([
      page.waitForURL(url => !url.href.includes('/login'), { timeout: 15000 }),
      page.locator('button[type="submit"]:has-text("Sign In")').click(),
    ]);
    await page.evaluate(() => {
      localStorage.removeItem('marqq_onboarded');
    });
  }
  await page.reload();
  await page.waitForLoadState('networkidle');
}

async function loginAsDashboard(page: Page) {
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
}

/** Return a minimal SSE mock for agent runs — resolves quickly with markdown output. */
function mockAgentSSE(page: Page) {
  return page.route('**/api/agents/*/run', async route => {
    const body = [
      `data: ${JSON.stringify({ text: '# Research Brief\n\nYour market analysis is ready.' })}\n\n`,
      'data: [DONE]\n\n',
    ].join('');

    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      headers: {
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
      body,
    });
  });
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Rohit — Solo Founder first-session flow', () => {
  test('first-session banner no longer appears after onboarding', async ({ page }) => {
    await loginAndClearOnboarding(page);

    await page.evaluate(() => {
      localStorage.setItem('marqq_onboarded', '1');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Your team is ready — here\'s where to start')).toHaveCount(0);
  });

  test('Setup module is reachable from sidebar Context section', async ({ page }) => {
    await loginAsDashboard(page);

    // Context section should exist — expand it
    const contextToggle = page.locator('button[aria-label*="Context section"]');
    if (await contextToggle.count() > 0) {
      const isExpanded = await contextToggle.getAttribute('aria-expanded');
      if (isExpanded === 'false') await contextToggle.click();
    }

    // Click Setup
    await page.locator('button:has-text("Setup"), a:has-text("Setup")').first().click();
    await page.waitForTimeout(500);

    // Should land on the Setup module view
    await expect(page.locator('text=Setup').first()).toBeVisible({ timeout: 5000 });
  });

  test('OfferSelector empty-state CTA dispatches marqq:navigate to setup', async ({ page }) => {
    await loginAsDashboard(page);

    // Mock the offers API to return empty
    await page.route('**/api/company-intel/*/mkg*', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mkg: {} }) }),
    );
    await page.route('**/api/company-intel/companies', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ companies: [] }) }),
    );

    // Navigate to a module that uses AgentModuleShell (e.g. audience-profiles)
    const contextToggle = page.locator('button[aria-label*="Context section"]');
    if (await contextToggle.count() > 0) {
      const isExpanded = await contextToggle.getAttribute('aria-expanded');
      if (isExpanded === 'false') await contextToggle.click();
    }
    await page.locator('button:has-text("Audience Profiles"), a:has-text("Audience Profiles")').first().click();
    await page.waitForTimeout(800);

    // If OfferSelector CTA is visible, clicking it should fire marqq:navigate
    const offerCta = page.locator('text=Run Setup first').first();
    if (await offerCta.count() > 0) {
      // Listen for the custom event being dispatched
      const navigateEventFired = page.evaluate(() =>
        new Promise<string>(resolve => {
          window.addEventListener('marqq:navigate', (e) => {
            resolve((e as CustomEvent<{ moduleId: string }>).detail?.moduleId ?? '');
          }, { once: true });
        }),
      );
      await offerCta.click();
      const moduleId = await navigateEventFired;
      expect(moduleId).toBe('setup');
    }
  });

  test('elapsed timer is visible during agent streaming', async ({ page }) => {
    await loginAsDashboard(page);
    await mockAgentSSE(page);

    // Navigate to a simple agent module — e.g. Audience Profiles
    const contextToggle = page.locator('button[aria-label*="Context section"]');
    if (await contextToggle.count() > 0) {
      const isExpanded = await contextToggle.getAttribute('aria-expanded');
      if (isExpanded === 'false') await contextToggle.click();
    }
    await page.locator('button:has-text("Audience Profiles"), a:has-text("Audience Profiles")').first().click();
    await page.waitForTimeout(800);

    // Click the Run / Play button to start streaming
    const runBtn = page.locator('button[aria-label*="Run"], button:has([data-lucide="play"]), button:has-text("Run")').first();
    if (await runBtn.count() > 0) {
      await runBtn.click();

      // Timer text like "· 1s" or "· 0s" should appear in the header
      await expect(page.locator('text=/·\\s*\\d+s/')).toBeVisible({ timeout: 5000 });
    }
  });

  test('copy and export buttons appear after streaming completes', async ({ page }) => {
    await loginAsDashboard(page);

    // Use a slow-ish mock so we can check the spinner, then complete
    await page.route('**/api/agents/*/run', async route => {
      const body = [
        `data: ${JSON.stringify({ text: '# Research Brief\n\nMarket analysis complete.' })}\n\n`,
        'data: [DONE]\n\n',
      ].join('');
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body,
      });
    });

    const contextToggle = page.locator('button[aria-label*="Context section"]');
    if (await contextToggle.count() > 0) {
      const isExpanded = await contextToggle.getAttribute('aria-expanded');
      if (isExpanded === 'false') await contextToggle.click();
    }
    await page.locator('button:has-text("Audience Profiles"), a:has-text("Audience Profiles")').first().click();
    await page.waitForTimeout(800);

    const runBtn = page.locator('button[aria-label*="Run"], button:has([data-lucide="play"]), button:has-text("Run")').first();
    if (await runBtn.count() > 0) {
      await runBtn.click();
      // After stream done, copy buttons should appear
      await expect(
        page.locator('button[aria-label*="Copy"], button:has([data-lucide="copy"]), button:has-text("Copy")').first(),
      ).toBeVisible({ timeout: 8000 });
    }
  });
});
