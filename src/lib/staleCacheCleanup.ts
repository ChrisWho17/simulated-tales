// ============================================================================
// Stale build cleanup
// ----------------------------------------------------------------------------
// Older published builds registered a service worker (/sw.js) that no longer
// ships with the app. Browsers keep that worker installed forever, so returning
// players kept being served the cached OLD bundle (stuck on an outdated version
// and missing new theme colors) even after a fresh deploy.
//
// This module unregisters any leftover worker, wipes the CacheStorage entries it
// created, and reloads exactly once so the live bundle is fetched fresh.
// ============================================================================

const RELOAD_FLAG = "app.staleCacheCleanupReloaded";

export async function purgeStaleServiceWorkers(): Promise<void> {
  if (typeof window === "undefined") return;

  let didPurge = false;

  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
        didPurge = true;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      for (const key of keys) {
        await caches.delete(key);
        didPurge = true;
      }
    }
  } catch {
    /* ignore */
  }

  if (!didPurge) return;

  // Only reload once per session so we can never loop.
  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === "1") return;
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    return;
  }

  window.location.reload();
}
