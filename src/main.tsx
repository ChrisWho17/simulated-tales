import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { APP_TITLE } from "./lib/product";
import { purgeStaleServiceWorkers } from "./lib/staleCacheCleanup";
import "./index.css";

document.title = APP_TITLE;

// Clear leftover service workers / caches from older published builds so
// players always load the current version instead of a cached old bundle.
void purgeStaleServiceWorkers();

createRoot(document.getElementById("root")!).render(<App />);

