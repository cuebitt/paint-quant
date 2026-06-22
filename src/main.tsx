// prismarine-nbt references the global `Buffer` in production builds, but
// vite-plugin-node-polyfills injects it via transformIndexHtml which may not
// run before bundled modules execute. Setting it here ensures it's available.
import { Buffer } from "buffer";
(window as any).Buffer = Buffer;

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.tailwind.css";
import App from "@/App";
import { ThemeProvider } from "@/components/ThemeProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
);
