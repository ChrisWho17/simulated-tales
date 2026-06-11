import { test, expect } from '@playwright/test';

test.describe('Hotfix history dialog', () => {
  test('envelope opens latest hotfixes and full history is ordered origin → now', async ({ page }) => {
    await page.goto('/');

    // Top-right envelope trigger should be visible on the main menu.
    const envelope = page.getByTestId('hotfixes-trigger');
    await expect(envelope).toBeVisible({ timeout: 15_000 });

    // Count badge should reflect the latest patch's fixes (>=1 for current alpha).
    const countBadge = page.getByTestId('hotfixes-count-badge');
    await expect(countBadge).toBeVisible();
    const count = Number((await countBadge.textContent())?.trim() ?? '0');
    expect(count).toBeGreaterThan(0);

    // Open the popover, then drill into full history.
    await envelope.click();
    const popover = page.getByTestId('hotfixes-popover');
    await expect(popover).toBeVisible();

    await page.getByTestId('hotfixes-history-trigger').click();

    const dialog = page.getByTestId('hotfixes-history-dialog');
    await expect(dialog).toBeVisible();

    const list = page.getByTestId('hotfixes-history-list');
    // Collect rendered version order from data-testid="history-entry-<version>"
    const versions = await list
      .locator('[data-testid^="history-entry-"]')
      .evaluateAll((nodes) =>
        nodes.map((n) =>
          (n.getAttribute('data-testid') ?? '').replace('history-entry-', ''),
        ),
      );

    // Must contain the origin alpha and current version, both Alpha-tagged.
    expect(versions).toContain('0.1.0');
    expect(versions.length).toBeGreaterThanOrEqual(2);

    // Ordered chronologically: origin (0.1.0) → now, every patch included.
    const expected = [...versions].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
    expect(versions).toEqual(expected);
    expect(versions[0]).toBe('0.1.0');
    expect(versions[versions.length - 1]).toBe(expected[expected.length - 1]);
  });
});
