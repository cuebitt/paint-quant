import { render } from "preact";
import "./index.tailwind.css";
import App from "@/App";
import { ThemeProvider } from "@/components/ThemeProvider";

if (import.meta.env.DEV) {
  void import("preact-devtools");
}

render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <App />
  </ThemeProvider>,
  document.getElementById("root")!,
);
