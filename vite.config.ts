import { defineConfig } from "vite-plus";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  base: "/paintcraft/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    sortTailwindcss: {
      stylesheet: "./src/index.tailwind.css",
      functions: ["clsx", "cn"],
      preserveWhitespace: true,
    },
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
    plugins: ["oxc", "typescript", "unicorn", "react"],
    categories: {
      correctness: "warn",
    },
    env: {
      builtin: true,
      browser: true,
    },
    ignorePatterns: ["dist"],
  },
  plugins: [react(), tailwindcss(), visualizer({ open: true })],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/pica")) return "pica";
          if (id.includes("node_modules/image-q")) return "image-q";
        },
      },
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
