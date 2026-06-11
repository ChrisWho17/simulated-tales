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

    // Ordered: newest major.minor group first; within each group the major
    // (x.y.0) comes first, then its patches ascending (x.y.1, x.y.2 ...).
    const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0);
    const expected = [...versions].sort((a, b) => {
      const [aM, aN, aP] = parse(a);
      const [bM, bN, bP] = parse(b);
      if (aM !== bM) return bM - aM;
      if (aN !== bN) return bN - aN;
      return aP - bP;
    });
    expect(versions).toEqual(expected);
    expect(versions[0]).toBe(expected[0]);
  });
});
