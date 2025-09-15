import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: new URL("./src/lib", import.meta.url).pathname,
    },
  },
  build: {
    lib: {
      entry: new URL("./src/lib/index.ts", import.meta.url).pathname,
      name: "HtmlMarkdownEditor",
      fileName: (format) => (format === "es" ? "index.js" : "index.cjs"),
    },
    rollupOptions: {
      external: ["svelte"],
      output: {
        globals: {
          svelte: "Svelte",
        },
      },
    },
  },
  test: {
    include: ["src/**/*.{test,spec}.{js,ts}"],
    environment: "jsdom",
    setupFiles: ["src/test-setup.ts"],
    globals: true,
    alias: {
      $lib: new URL("./src/lib", import.meta.url).pathname,
    },
  },
});
