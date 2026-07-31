// ============================================================================
// Stale build cleanup
// ----------------------------------------------------------------------------
// Older published builds registered an app service worker that no longer ships
// with the app. Browsers keep that worker installed, so returning players kept
// being served a cached OLD bundle (stuck on an outdated version and missing
// the new theme colors) even after a fresh deploy.
//
// A kill-switch worker is served at the old paths (public/sw.js and
// public/service-worker.js). This helper additionally unregisters any leftover
// app worker in the current tab and reloads once so the live bundle is fetched.
// Messaging workers (Firebase / OneSignal) are deliberately left alone.
// ============================================================================

const RELOAD_FLAG = "app.staleCacheCleanupReloaded";
const APP_SW_PATHS = ["/sw.js", "/service-worker.js"];

function isAppServiceWorker(reg: ServiceWorkerRegistration): boolean {
  const url = reg.active?.scriptURL || reg.waiting?.scriptURL || reg.installing?.scriptURL || "";
  return APP_SW_PATHS.some((path) => url.endsWith(path));
}

export async function purgeStaleServiceWorkers(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  let didPurge = false;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      if (!isAppServiceWorker(reg)) continue;
      await reg.unregister();
      didPurge = true;
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
