// Guarded service worker registration. Single entry point for the whole app.
// Follows Lovable PWA rules: never register in dev or preview/iframe contexts,
// supports a ?sw=off kill switch, and surfaces updates via a custom event.

const SW_URL = "/sw.js";
const UPDATE_EVENT = "pwa:update-available";
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

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
  if (new URLSearchParams(window.location.search).has("sw") &&
      new URLSearchParams(window.location.search).get("sw") === "off") return true;
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
  // If a worker is already waiting at boot, surface immediately.
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

    // Reload exactly once when the new SW takes control.
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    // Periodic check while the tab is open.
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

export const PWA_UPDATE_EVENT = UPDATE_EVENT;
