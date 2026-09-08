/* =========================================================================
   v09/dev/morning-qc-dev-entry.jsx

   Morning QC Room — Stage 12B Development Browser Entry
   PROVENANCE: V09_NEW

   Section 4 (corrective closure): a real, mountable entry point for the
   DevLauncher, used ONLY by the isolated v09/morning-qc-dev.html +
   v09/vite.morning-qc.config.mjs build. NEVER imported by
   v09/app/ui/app-shell.jsx or any production entry — production
   navigation remains unchanged at 14 destinations.

   RELOCATED FROM v09/app/morning-qc/ui/dev-entry.jsx during this
   corrective closure: Stage 11C2's frozen governance test enforces
   EXACTLY ONE createRoot() call across the entire v09/app/** tree (the
   "single active React root" architecture doctrine) — a second
   createRoot() anywhere under app/**, even in an isolated dev-only file,
   trips that check. Living under v09/dev/ (outside app/**) instead
   preserves Stage 11C2's invariant untouched while keeping this file's
   own isolation from production navigation (Section 2/43) exactly as
   before — dev-launcher.jsx and morning-qc-room.jsx, which this imports,
   remain under app/morning-qc/ui/ unchanged; only the createRoot() call
   site itself needed to move.
   ========================================================================= */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { DevLauncher } from '../app/morning-qc/ui/dev-launcher.jsx';
import { pilot1ReagentLotShift, pilot2PbrtqcPopulationShift, pilot3RcvPatientImpact } from '../app/morning-qc/cases/index.js';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <DevLauncher cases={[pilot1ReagentLotShift, pilot2PbrtqcPopulationShift, pilot3RcvPatientImpact]} />
);
