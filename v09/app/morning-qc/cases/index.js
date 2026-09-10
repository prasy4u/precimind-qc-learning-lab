/* =========================================================================
   v09/app/morning-qc/cases/index.js

   Morning QC Room — Case Registry
   PROVENANCE: V09_NEW
   Stage 12D: expanded from 3 to 12 production cases.
   ========================================================================= */
export { pilot1ReagentLotShift } from './pilot-1-reagent-lot-shift.js';
export { pilot2PbrtqcPopulationShift } from './pilot-2-pbrtqc-population-shift.js';
export { pilot3RcvPatientImpact } from './pilot-3-rcv-patient-impact.js';
export { case04IsolatedExcursion } from './case-04-isolated-excursion.js';
export { case05IncreasedImprecision } from './case-05-increased-imprecision.js';
export { case06CalibrationShift } from './case-06-calibration-shift.js';
export { case07NoPatientImpact } from './case-07-no-patient-impact.js';
export { case08EqaDiscordance } from './case-08-eqa-discordance.js';
export { case09SeekMoreEvidence } from './case-09-seek-more-evidence.js';
export { case10PrematureReleaseTrap } from './case-10-premature-release-trap.js';
export { case11ConcurrentTriage } from './case-11-concurrent-triage.js';
export { case12MaintenanceCoincidence } from './case-12-maintenance-coincidence.js';

import { pilot1ReagentLotShift } from './pilot-1-reagent-lot-shift.js';
import { pilot2PbrtqcPopulationShift } from './pilot-2-pbrtqc-population-shift.js';
import { pilot3RcvPatientImpact } from './pilot-3-rcv-patient-impact.js';
import { case04IsolatedExcursion } from './case-04-isolated-excursion.js';
import { case05IncreasedImprecision } from './case-05-increased-imprecision.js';
import { case06CalibrationShift } from './case-06-calibration-shift.js';
import { case07NoPatientImpact } from './case-07-no-patient-impact.js';
import { case08EqaDiscordance } from './case-08-eqa-discordance.js';
import { case09SeekMoreEvidence } from './case-09-seek-more-evidence.js';
import { case10PrematureReleaseTrap } from './case-10-premature-release-trap.js';
import { case11ConcurrentTriage } from './case-11-concurrent-triage.js';
import { case12MaintenanceCoincidence } from './case-12-maintenance-coincidence.js';

// Ordered array of all production cases — the single source of truth
// for "the case bank" consumed by the case-bank UI, adaptive
// sequencing, and case-bank tests. No case-ID branching anywhere
// downstream — every consumer iterates this list generically.
export const ALL_CASES = [
  pilot1ReagentLotShift,
  pilot2PbrtqcPopulationShift,
  pilot3RcvPatientImpact,
  case04IsolatedExcursion,
  case05IncreasedImprecision,
  case06CalibrationShift,
  case07NoPatientImpact,
  case08EqaDiscordance,
  case09SeekMoreEvidence,
  case10PrematureReleaseTrap,
  case11ConcurrentTriage,
  case12MaintenanceCoincidence,
];
