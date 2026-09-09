import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Stage 12C — Production-Integrated Build (Morning QC Room controlled
// integration).
//
// Builds the SAME app/** entry (app/main.jsx -> app/ui/app-shell.jsx)
// used by the Stage 11C2 active app, now including the Morning QC Room
// capstone integration (Section 24-25), into a SEPARATE output directory
// (dist-vite-production/) — deliberately NOT overwriting dist-vite/,
// which remains the frozen Stage 11C2 reference build with its own
// accepted tree hash (4614aca9...). This preserves that frozen
// invariant exactly while still providing a genuine, deterministic,
// buildable artifact reflecting the current, Morning-QC-integrated
// production source.
export default defineConfig({
  root: resolve(__dirname, "app"),
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "dist-vite-production"),
    emptyOutDir: true,
  },
});
