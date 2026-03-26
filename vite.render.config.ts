// Render.com production build config
// Excludes vite-plugin-manus-runtime to prevent React duplication crash
// (The manus-runtime plugin injects an inline React bundle that conflicts
//  with the ES module React loaded by vendor chunks, causing forwardRef to be undefined)

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // NOTE: vitePluginManusRuntime is intentionally excluded here.
    // It injects a second copy of React as an inline script which causes
    // "Cannot read properties of undefined (reading 'forwardRef')" on Render.
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          // Monaco editor — very large, isolate completely
          if (
            id.includes("node_modules/@monaco-editor") ||
            id.includes("node_modules/monaco-editor")
          ) {
            return "vendor-monaco";
          }
          // html2canvas — used only in System Design heatmap export
          if (id.includes("node_modules/html2canvas")) {
            return "vendor-html2canvas";
          }
          // jsPDF — used only in Design Doc Generator
          if (id.includes("node_modules/jspdf")) {
            return "vendor-jspdf";
          }
          // D3 + Recharts — data visualisation
          if (
            id.includes("node_modules/d3") ||
            id.includes("node_modules/recharts")
          ) {
            return "vendor-charts";
          }
          // React core — always needed, stable chunk for long-term caching
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/")
          ) {
            return "vendor-react";
          }
          // Lucide icons — large icon set, separate chunk
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-lucide";
          }
          // Remaining node_modules go into a shared vendor chunk
          if (id.includes("node_modules/")) {
            return "vendor";
          }
        },
      },
    },
  },
});
