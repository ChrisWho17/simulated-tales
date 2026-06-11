import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPwa, PWA_SYNC_FLUSH_EVENT } from "./pwa/registerSW";
import { BackgroundSyncManager } from "./services/backgroundSyncManager";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker after the app boots. Wrapper handles dev/preview/iframe refusal.
registerPwa();

// When the SW signals (via Background Sync API) that connectivity is back,
// drain the offline save queue without waiting for the user.
window.addEventListener(PWA_SYNC_FLUSH_EVENT, () => {
  BackgroundSyncManager.forceSyncNow().catch(() => {});
});


