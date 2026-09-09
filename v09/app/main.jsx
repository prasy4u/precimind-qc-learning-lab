/* =========================================================================
   v09/app/main.jsx

   Stage 11C2 — Single Authored Application Entry Point

   This is the SOLE active application startup entry. It contains the
   exactly ONE createRoot(...).render(<App />) call in the entire active
   v09/app/** tree (see v09/tests/stage11c2-esm-single-root.test.js for the
   governance check that verifies this).

   The historical 19 ReactDOM.createRoot(rootEl).render(<App />) calls that
   existed in the frozen legacy src/ui/app-shell.jsx (and, unchanged, still
   exist there and in the Stage 11C1 bridge as historical/reference
   evidence) have been removed from the active migrated app-shell.jsx.
   Root creation now happens exactly once, here.
   ========================================================================= */

import { createRoot } from "react-dom/client";
import { App } from "./ui/app-shell.jsx";
import "./ui/original-v0.8.css";
// Stage 12C controlled production integration (Section 24-25): Morning
// QC Room's own stylesheets, loaded globally alongside the existing v0.9
// token sheet. Narrow, additive-only change to this file — no new
// createRoot() call is introduced (Stage 11C2's single-active-root
// invariant, verified by tests/stage11c2-esm-single-root.test.js,
// remains satisfied).
import "./morning-qc/ui/morning-qc-room.css";
import "./morning-qc/debrief/morning-qc-debrief.css";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error(
    "main.jsx: expected DOM element with id=\"root\" was not found. " +
    "The active application cannot mount without it."
  );
}

createRoot(rootEl).render(<App />);
