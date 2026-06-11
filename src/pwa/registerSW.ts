// Guarded service worker registration. Single entry point for the whole app.
// Follows Lovable PWA rules: never register in dev or preview/iframe contexts,
// supports a ?sw=off kill switch, surfaces updates via a custom event, and
// bridges Background Sync messages back to the BackgroundSyncManager.

const SW_URL = "/sw.js";
const UPDATE_EVENT = "pwa:update-available";
const ACTIVATED_EVENT = "pwa:activated";
const SYNC_FLUSH_EVENT = "pwa:sync-flush";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly
const LAST_UPDATE_KEY = "pwa.lastUpdateAppliedAt";
const UPDATE_DISMISSED_KEY = "pwa.updateDismissed";
const SYNC_TAG = "untold-flush-saves";

type UpdateDetail = {
  registration: ServiceWorkerRegistration;
  waiting: ServiceWorker;
};

function isPreviewHost(hostname: string): boolean {
  if (hostname.startsWith("id-preview--") || hostname.startsWith("preview--")) return true;
  if (hostname === "lovableproject.com" || hostname.endsWith(".lovableproject.com")) return true;
  if (hostname === "lovableproject-dev.com" || hostname.endsWith(".lovableproject-dev.com")) return true;
  if (hostname === "beta.lovable.dev" || hostname.endsWith(".beta.lovable.dev")) return true;
  return false;
}

function shouldRefuse(): boolean {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  if (isPreviewHost(window.location.hostname)) return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get("sw") === "off") return true;
  return false;
}

async function unregisterMatching(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const scriptURL = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (scriptURL.endsWith("/sw.js") || scriptURL.endsWith("/service-worker.js")) {
        await r.unregister();
      }
    }
  } catch {
    /* ignore */
  }
}

function emitUpdate(detail: UpdateDetail): void {
  window.dispatchEvent(new CustomEvent<UpdateDetail>(UPDATE_EVENT, { detail }));
}

function trackUpdates(reg: ServiceWorkerRegistration): void {
  if (reg.waiting && navigator.serviceWorker.controller) {
    emitUpdate({ registration: reg, waiting: reg.waiting });
  }
  reg.addEventListener("updatefound", () => {
    const installing = reg.installing;
    if (!installing) return;
    installing.addEventListener("statechange", () => {
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        emitUpdate({ registration: reg, waiting: installing });
      }
    });
  });
}

function wireSwMessages(): void {
  navigator.serviceWorker.addEventListener("message", (event) => {
    const data = event.data as { type?: string } | undefined;
    if (!data?.type) return;
    if (data.type === "PWA_SYNC_FLUSH") {
      window.dispatchEvent(new CustomEvent(SYNC_FLUSH_EVENT, { detail: data }));
    }
  });
}

export async function registerPwa(): Promise<void> {
  if (shouldRefuse()) {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      await unregisterMatching();
    }
    return;
  }

  try {
    const reg = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    trackUpdates(reg);
    wireSwMessages();

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      try {
        localStorage.setItem(LAST_UPDATE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      // Soft activation: let listeners (WhatsNew modal, patch notes badge)
      // refresh themselves in-place. They decide whether a full reload is
      // necessary — we no longer force window.location.reload() so users
      // mid-session don't lose unsaved work.
      window.dispatchEvent(new Event(ACTIVATED_EVENT));
    });

    setInterval(() => {
      reg.update().catch(() => {});
    }, CHECK_INTERVAL_MS);
  } catch (err) {
    console.warn("[PWA] SW registration failed", err);
  }
}

export async function activatePendingUpdate(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration();
  const waiting = reg?.waiting;
  if (!waiting) {
    window.location.reload();
    return;
  }
  waiting.postMessage({ type: "SKIP_WAITING" });
}

/**
 * Request a Background Sync. The browser will fire the `sync` event in the
 * service worker once connectivity returns, even if the page is closed.
 * Falls back silently on platforms without Background Sync (Safari/Firefox).
 */
export async function requestBackgroundSync(): Promise<boolean> {
  try {
    if (!("serviceWorker" in navigator)) return false;
    const reg = (await navigator.serviceWorker.ready) as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    if (!reg?.sync?.register) return false;
    await reg.sync.register(SYNC_TAG);
    return true;
  } catch {
    return false;
  }
}

export function getLastUpdateAppliedAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_UPDATE_KEY);
    return raw ? Number(raw) || null : null;
  } catch {
    return null;
  }
}

export async function checkForUpdateNow(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return false;
    await reg.update();
    return Boolean(reg.waiting || reg.installing);
  } catch {
    return false;
  }
}

/** Debug-only: fires the same custom event the real update flow uses. */
export function simulateUpdateAvailable(): void {
  window.dispatchEvent(
    new CustomEvent(UPDATE_EVENT, {
      detail: { simulated: true, at: Date.now() },
    }),
  );
}

export const PWA_UPDATE_EVENT = UPDATE_EVENT;
export const PWA_ACTIVATED_EVENT = ACTIVATED_EVENT;
export const PWA_SYNC_FLUSH_EVENT = SYNC_FLUSH_EVENT;
export const PWA_SYNC_TAG = SYNC_TAG;
