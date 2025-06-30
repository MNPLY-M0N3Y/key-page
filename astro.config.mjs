// astro.config.mjs
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  integrations: [react(), tailwind()],
  vite: {
    // Handle WASM files
    assetsInclude: ["**/*.wasm"],

    // Configure WASM loading
    optimizeDeps: {
      exclude: ["pkg"],
    },

    // Allow file system access for development
    server: {
      fs: {
        allow: [".."],
      },
    },

    // Handle ES modules properly
    define: {
      global: "globalThis",
    },
  },
});
