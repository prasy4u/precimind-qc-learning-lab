import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Stage 11C1 Vite Bridge configuration.
// Builds the generated bridge entry (app-bridge/bridge-entry.generated.jsx)
// into a SEPARATE output directory (dist-vite-bridge/), leaving the frozen
// Stage 11B compatibility artifact (dist/precimind-v0.9-compat.html)
// completely untouched.
export default defineConfig({
  root: __dirname,
  plugins: [react()],
  build: {
    outDir: "dist-vite-bridge",
    emptyOutDir: true,
  },
});
