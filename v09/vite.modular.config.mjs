import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Stage 11C2 — Final Active Modular Vite Configuration.
// Builds the true ES-module application (v09/app/**, 34 genuinely migrated
// modules + one authored entry point) into a SEPARATE output directory
// (dist-vite/), leaving the frozen Stage 11C1 bridge build
// (dist-vite-bridge/) completely untouched as the accepted behavioral
// reference for this stage's equivalence testing.
export default defineConfig({
  root: resolve(__dirname, "app"),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist-vite"),
    emptyOutDir: true,
  },
});
