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

    plugins: [
      {
        name: "fix-wasm-mime",
        enforce: "post",
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.endsWith(".wasm")) {
              res.setHeader("Content-Type", "application/wasm");
              res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
              res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            }
            next();
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url?.endsWith(".wasm")) {
              res.setHeader("Content-Type", "application/wasm");
              res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
              res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
            }
            next();
          });
        },
      },
    ],
  },
});
