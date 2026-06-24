import { render } from "preact";
import "./index.tailwind.css";
import App from "@/App";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

if (import.meta.env.DEV) {
  void import("preact-devtools");
}

render(
  <ErrorBoundary>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </ErrorBoundary>,
  document.getElementById("root")!,
);
