import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Stage 12B — Isolated Morning QC Room Development Build.
//
// Builds ONLY the development entry (morning-qc-dev.html, mounting
// DevLauncher via dev-entry.jsx) into its OWN, separate output
// directory (dist-morning-qc-dev/) — completely isolated from the
// frozen dist-vite/ (Stage 11C2 active app) and dist-vite-bridge/
// (Stage 11C1 bridge), neither of which this config touches or
// references. Production navigation (app/ui/app-shell.jsx, the 14
// primary destinations) is entirely unaffected: this config's root is
// the repository root (v09/), not app/, and its only entry point is
// morning-qc-dev.html, never index.html.
export default defineConfig({
  root: resolve(__dirname),
  base: "./",
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist-morning-qc-dev"),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "morning-qc-dev.html"),
    },
  },
});
