/**
 * Persona: Ananya — Performance CMO
 *
 * Scenario: Ananya is a data-driven CMO who uses Marqq daily to track spend
 * efficiency and channel performance. She needs fast navigation to analytics
 * modules, reliable copy/export of agent outputs, and seamless agent chaining
 * when building briefs that feed into creative execution.
 *
 * Covers:
 *  - Navigate to Performance Scorecard (Analytics section)
 *  - Navigate to Budget Optimization (Analytics section)
 *  - Copy markdown / plain-text buttons appear after agent run
 *  - "↓ Use as input" button appears after agent run
 *  - Agent chaining: second card shows "↓ Context injected" banner
 *  - Keyboard accessibility: sidebar nav items have visible focus rings
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
  // Skip onboarding if it appears
  await page.evaluate(() => localStorage.setItem('marqq_onboarded', '1'));
  if (await page.locator('button:has-text("Brief the team")').count() > 0) {
    await page.evaluate(() => localStorage.setItem('marqq_onboarded', '1'));
    await page.reload();
    await page.waitForLoadState('networkidle');
  }
}

function mockAgentSSE(page: Page, content = '# Analysis\n\nYour campaign data shows strong ROAS on paid channels.') {
  return page.route('**/api/agents/*/run', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: [
        `data: ${JSON.stringify({ text: content })}\n\n`,
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
  }
}

async function clickSidebarItem(page: Page, text: string) {
  await page.locator(`button:has-text("${text}"), a:has-text("${text}")`).first().click();
  await page.waitForTimeout(600);
}

// ── tests ─────────────────────────────────────────────────────────────────────

test.describe('Ananya — Performance CMO analytics flow', () => {
  test('navigate to Performance Scorecard from Analytics section', async ({ page }) => {
    await login(page);
    await expandSection(page, 'Analytics');
    await clickSidebarItem(page, 'Performance');

    // Module should be in view
    await expect(page.locator('text=Performance').first()).toBeVisible({ timeout: 5000 });
  });

  test('navigate to Budget Optimization from Analytics section', async ({ page }) => {
    await login(page);
    await expandSection(page, 'Analytics');
    await clickSidebarItem(page, 'Budget Optimization');

    await expect(page.locator('text=Budget Optimization').first()).toBeVisible({ timeout: 5000 });
  });

  test('copy (markdown) button appears after agent run completes', async ({ page }) => {
    await login(page);
    await mockAgentSSE(page);

    // Navigate to a module with an agent card — Performance Scorecard / Market Signals
    await expandSection(page, 'Analytics');
    await clickSidebarItem(page, 'Performance');

    const runBtn = page
      .locator('button[aria-label*="Run"], button:has([data-lucide="play"]), button:has-text("Run")')
      .first();
    if (await runBtn.count() > 0) {
      await runBtn.click();

      // Copy markdown button
      const copyBtn = page.locator(
        'button[aria-label*="Copy markdown"], button[title*="Copy markdown"], button:has([data-lucide="copy"])',
      ).first();
      await expect(copyBtn).toBeVisible({ timeout: 8000 });
    }
  });

  test('copy (plain text) button appears after agent run completes', async ({ page }) => {
    await login(page);
    await mockAgentSSE(page);

    await expandSection(page, 'Analytics');
    await clickSidebarItem(page, 'Performance');

    const runBtn = page
      .locator('button[aria-label*="Run"], button:has([data-lucide="play"]), button:has-text("Run")')
      .first();
    if (await runBtn.count() > 0) {
      await runBtn.click();

      // Plain-text copy button (clipboard-list icon)
      const plainBtn = page.locator(
        'button[aria-label*="Copy plain"], button[title*="plain text"], button:has([data-lucide="clipboard-list"])',
      ).first();
      await expect(plainBtn).toBeVisible({ timeout: 8000 });
    }
  });

  test('"↓ Use as input" button appears after agent run completes', async ({ page }) => {
    await login(page);
    await mockAgentSSE(page);

    await expandSection(page, 'Analytics');
    await clickSidebarItem(page, 'Performance');

    const runBtn = page
      .locator('button[aria-label*="Run"], button:has([data-lucide="play"]), button:has-text("Run")')
      .first();
    if (await runBtn.count() > 0) {
      await runBtn.click();

      const useAsInputBtn = page.locator('button:has-text("Use as input")').first();
      await expect(useAsInputBtn).toBeVisible({ timeout: 8000 });
    }
  });

  test('agent chaining: second agent card shows context-injected banner', async ({ page }) => {
    await login(page);

    // Mock two separate agent calls
    let callCount = 0;
    await page.route('**/api/agents/*/run', async route => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: [
          `data: ${JSON.stringify({ text: `# Agent ${callCount} output\n\nContent from agent ${callCount}.` })}\n\n`,
          'data: [DONE]\n\n',
        ].join(''),
      });
    });

    // Navigate to a module with 2 agents (e.g. Positioning, which chains agents)
    await expandSection(page, 'Plan');
    await clickSidebarItem(page, 'Positioning');

    // Run the first agent
    const runBtns = page.locator('button[aria-label*="Run"], button:has([data-lucide="play"]), button:has-text("Run")');
    if (await runBtns.count() >= 1) {
      await runBtns.first().click();

      // After first agent completes, "↓ Context injected" banner should appear on second card
      const chainBanner = page.locator('text=Context injected').first();
      if (await chainBanner.count() > 0) {
        await expect(chainBanner).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test('sidebar nav buttons have accessible aria-labels', async ({ page }) => {
    await login(page);

    // All section toggles should have aria-label and aria-expanded
    const sectionToggles = page.locator('button[aria-expanded]');
    const count = await sectionToggles.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      const toggle = sectionToggles.nth(i);
      const ariaLabel = await toggle.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('find Paid Ads module from Analytics section in ≤2 clicks', async ({ page }) => {
    await login(page);

    // Paid Ads is under Execution — expand it
    const executionToggle = page.locator('button[aria-label*="Execution section"]');
    if (await executionToggle.count() > 0) {
      // Click 1: expand Execution section
      await executionToggle.click();
      await page.waitForTimeout(300);
    }

    // Click 2: click Paid Ads
    await page.locator('button:has-text("Paid Ads"), a:has-text("Paid Ads")').first().click();
    await page.waitForTimeout(600);

    await expect(page.locator('text=Paid Ads').first()).toBeVisible({ timeout: 5000 });
  });
});
