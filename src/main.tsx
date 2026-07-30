import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { APP_TITLE } from "./lib/product";
import "./index.css";

document.title = APP_TITLE;

createRoot(document.getElementById("root")!).render(<App />);
