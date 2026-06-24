import { defineConfig, lazyPlugins } from "vite-plus";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  base: "/paintcraft/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: "preact/compat",
      "react-dom": "preact/compat",
      "react-dom/client": "preact/compat/client",
      "react/jsx-runtime": "preact/jsx-runtime",
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
  plugins: lazyPlugins(() => [preact(), tailwindcss()]),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string | string[]) {
          if (id.includes("node_modules/preact/compat")) return "preact-compat";
        },
      },
    },
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
