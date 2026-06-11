import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerPwa } from "./pwa/registerSW";

createRoot(document.getElementById("root")!).render(<App />);

// Register service worker after the app boots. Wrapper handles dev/preview/iframe refusal.
registerPwa();

