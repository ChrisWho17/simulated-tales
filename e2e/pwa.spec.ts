import { test, expect } from '@playwright/test';

// End-to-end coverage for the PWA flow. Drives the /debug/pwa page so we
// exercise the same hooks used in production: install-flag persistence,
// the simulated update event, background-sync queue flush, and online/offline
// transitions. Playwright can simulate offline at the context level which is
// exactly what we need to prove the queue survives connectivity loss.
//
// Run with:  bun run build && bunx playwright test

test.describe('PWA install + update + offline sync', () => {
  test('manifest + icons are reachable (installability surface)', async ({ page, baseURL }) => {
    await page.goto('/');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref, 'index.html links a manifest').toBeTruthy();
    const manifestUrl = new URL(manifestHref!, baseURL).toString();
    const res = await page.request.get(manifestUrl);
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.icons?.length).toBeGreaterThan(0);
    expect(manifest.display).toBe('standalone');
  });

  test('install-flag persists across reloads', async ({ page }) => {
    await page.goto('/debug/pwa');
    await page.getByRole('button', { name: /1\. persist installed flag/i }).click();
    await expect(page.getByText(/PASS/).first()).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: /3\. verify after reload/i }).click();
    await expect(page.getByText(/Flag still present/i)).toBeVisible();
  });

  test('simulated SW update fires the refresh prompt', async ({ page }) => {
    await page.goto('/debug/pwa');
    await page.getByRole('button', { name: /simulate update available/i }).click();
    // The PwaUpdatePrompt toast renders a "Refresh" affordance when the
    // pwa:update-available event fires.
    await expect(page.getByRole('button', { name: /refresh/i })).toBeVisible({ timeout: 5_000 });
  });

  test('queue survives going offline and drains when back online', async ({ page, context }) => {
    await page.goto('/debug/pwa');
    // Clear queue first so we start from a known state.
    // (No dedicated button — we just rely on the dedup behaviour.)
    await context.setOffline(true);
    await page.getByRole('button', { name: /queue offline save probe/i }).click();
    // The probe row should report a non-zero queue size.
    await expect(page.getByText(/Queue size now: [1-9]/)).toBeVisible();

    // Reload while offline: queue must persist in IndexedDB.
    await page.reload();
    const pendingText = await page.getByText(/Pending sync ops:/).first().innerText();
    expect(pendingText).not.toMatch(/Pending sync ops:\s*0/);

    // Come back online and trigger a flush — duplicates would inflate the
    // counter, missing events would skip the flush. We assert the queue
    // drains to zero exactly once.
    await context.setOffline(false);
    await page.getByRole('button', { name: /force flush queue/i }).click();
    await expect(page.getByText(/Pending sync ops:\s*0/)).toBeVisible({ timeout: 15_000 });
  });

  test('export queue button downloads a parseable JSON with queued items while offline', async ({
    page,
    context,
  }) => {
    await page.goto('/debug/pwa');

    // Queue at least one operation while offline so the export has something to include.
    await context.setOffline(true);
    await page.getByRole('button', { name: /queue offline save probe/i }).click();
    await expect(page.getByText(/Queue size now: [1-9]/)).toBeVisible();

    // Trigger the export and capture the download.
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /export queue \+ merge timeline/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^untold-queue-\d+\.json$/);

    const path = await download.path();
    expect(path, 'download saved to disk').toBeTruthy();

    const fs = await import('node:fs/promises');
    const raw = await fs.readFile(path!, 'utf8');

    // Must parse as JSON and carry the documented top-level fields.
    let payload: any;
    expect(() => {
      payload = JSON.parse(raw);
    }).not.toThrow();

    expect(payload).toMatchObject({
      exportedAt: expect.any(String),
      pwa: expect.any(Object),
      backgroundSync: expect.any(Object),
      queueStats: expect.any(Object),
      operations: expect.any(Array),
    });

    // The whole point: while offline the queue is non-empty and each op has a seq.
    expect(payload.operations.length).toBeGreaterThan(0);
    for (const op of payload.operations) {
      expect(typeof op.seq).toBe('number');
    }

    await context.setOffline(false);
  });
});
