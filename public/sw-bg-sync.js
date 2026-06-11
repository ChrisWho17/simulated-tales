// Imported into the generated service worker via Workbox `importScripts`.
// Adds Background Sync API support: when the browser fires a registered sync
// tag (after connectivity returns, even with the tab closed), broadcast a
// message to all clients so the in-page BackgroundSyncManager flushes its
// queued save operations.
//
// Tag conventions:
//   - 'untold-flush-saves'  : flush pending save/delete operations
//
// This file is intentionally minimal and dependency-free.

/* eslint-disable no-undef */
const SYNC_TAG = 'untold-flush-saves';

self.addEventListener('sync', (event) => {
  if (event.tag !== SYNC_TAG) return;
  event.waitUntil(notifyClientsToFlush());
});

// Periodic sync (Chrome-only, requires permission). Best-effort.
self.addEventListener('periodicsync', (event) => {
  if (event.tag !== SYNC_TAG) return;
  event.waitUntil(notifyClientsToFlush());
});

async function notifyClientsToFlush() {
  const allClients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });

  // Prefer a focused/visible client first.
  const ordered = [...allClients].sort((a, b) => {
    const av = a.visibilityState === 'visible' ? 0 : 1;
    const bv = b.visibilityState === 'visible' ? 0 : 1;
    return av - bv;
  });

  for (const client of ordered) {
    try {
      client.postMessage({ type: 'PWA_SYNC_FLUSH', tag: SYNC_TAG, at: Date.now() });
    } catch {
      /* ignore */
    }
  }
}
