/**
 * vite.standalone.config.ts — Vite config for the standalone static build.
 *
 * This config:
 * 1. Aliases @/lib/trpc and @/_core/hooks/useAuth to their standalone mocks.
 * 2. Outputs to dist/standalone (separate from the server build at dist/public).
 * 3. Uses hash routing so the single HTML file works without a server.
 *
 * Build command: vite build --config vite.standalone.config.ts
 * Script alias: pnpm build:standalone:static
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "import.meta.env.VITE_STANDALONE": JSON.stringify("true"),
  },
  resolve: {
    alias: {
      // Swap real tRPC client for the mock — must come before the "@" alias
      "@/lib/trpc": path.resolve(import.meta.dirname, "client/src/lib/trpc.standalone.ts"),
      // Swap real useAuth for the mock
      "@/_core/hooks/useAuth": path.resolve(
        import.meta.dirname,
        "client/src/_core/hooks/useAuth.standalone.ts"
      ),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/standalone"),
    emptyOutDir: true,
    assetsDir: "assets",
    rollupOptions: {
      output: {
        entryFileNames: "assets/app.[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash][extname]",
      },
    },
  },
});
