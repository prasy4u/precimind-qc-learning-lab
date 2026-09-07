/* =========================================================================
   v09/app/morning-qc/states.js

   Morning QC Room — Stage 12A Foundation
   PROVENANCE: V09_NEW

   Defines every enumerated state space used by the Morning QC Room engine:
   simulation phases, service state, patient-impact state, hypothesis
   evidence state, and action categories. These are simulation states, not
   necessarily visible UI tabs (Stage 12A spec Section 5) — the engine
   permits non-linear inspection while enforcing safe transition rules
   (Section 5) via the transition tables defined in engine.js.

   No scientific formulas live here. This file is pure enumeration and
   transition-legality data.
   ========================================================================= */

/* -----------------------------------------------------------------------
   SIMULATION PHASES (Section 5)

   These represent the learner's REASONING PROGRESS through a case, not a
   forced linear UI wizard. Multiple phases may be "active" conceptually
   (e.g. a learner can return to EVIDENCE_SELECTION after INTERVENTION if
   verification reveals new information), but the engine tracks a single
   "current phase" pointer for scoring/debrief purposes, updated by
   deriveCurrentPhase() in engine.js based on the action history — NOT by
   the learner directly picking a phase.
   ----------------------------------------------------------------------- */
export const SIMULATION_PHASES = [
  'BRIEFING',
  'SCAN',
  'SIGNAL_RECOGNITION',
  'IMMEDIATE_CONTAINMENT',
  'CHARACTERISATION',
  'HYPOTHESIS_GENERATION',
  'EVIDENCE_SELECTION',
  'INVESTIGATION',
  'INTERVENTION',
  'VERIFICATION',
  'PATIENT_IMPACT_REVIEW',
  'RESUME_OR_HOLD',
  'DOCUMENTATION',
  'DEBRIEF',
];

/* Phases that legitimately permit returning to an earlier phase (the
   simulation is NOT a simplistic forward-only wizard). For example,
   VERIFICATION failing should be able to return the learner to
   INVESTIGATION or HYPOTHESIS_GENERATION rather than forcing progress. */
export const PHASE_ALLOWS_RETURN_TO = {
  BRIEFING: [],
  SCAN: ['BRIEFING'],
  SIGNAL_RECOGNITION: ['SCAN', 'BRIEFING'],
  IMMEDIATE_CONTAINMENT: ['SIGNAL_RECOGNITION', 'SCAN'],
  CHARACTERISATION: ['IMMEDIATE_CONTAINMENT', 'SIGNAL_RECOGNITION', 'SCAN'],
  HYPOTHESIS_GENERATION: ['CHARACTERISATION', 'SIGNAL_RECOGNITION'],
  EVIDENCE_SELECTION: ['HYPOTHESIS_GENERATION', 'CHARACTERISATION'],
  INVESTIGATION: ['EVIDENCE_SELECTION', 'HYPOTHESIS_GENERATION'],
  INTERVENTION: ['INVESTIGATION', 'EVIDENCE_SELECTION'],
  VERIFICATION: ['INTERVENTION'],
  PATIENT_IMPACT_REVIEW: ['VERIFICATION', 'CHARACTERISATION', 'INVESTIGATION'],
  RESUME_OR_HOLD: ['VERIFICATION', 'PATIENT_IMPACT_REVIEW'],
  DOCUMENTATION: ['RESUME_OR_HOLD', 'PATIENT_IMPACT_REVIEW'],
  DEBRIEF: ['DOCUMENTATION'],
};

/* -----------------------------------------------------------------------
   SERVICE STATE (Section 21)
   ----------------------------------------------------------------------- */
export const SERVICE_STATES = [
  'RUNNING',
  'UNDER_REVIEW',
  'HELD',
  'LIMITED_RELEASE',
  'READY_FOR_VERIFICATION',
  'RESUMED',
  'ESCALATED',
];

/* Explicit, testable legal transitions. The engine must reject any
   transition not listed here (Section 21: "prevent impossible or unsafe
   state transitions"). */
export const SERVICE_STATE_TRANSITIONS = {
  RUNNING: ['UNDER_REVIEW', 'HELD'],
  UNDER_REVIEW: ['HELD', 'LIMITED_RELEASE', 'RUNNING'],
  HELD: ['UNDER_REVIEW', 'READY_FOR_VERIFICATION', 'ESCALATED'],
  LIMITED_RELEASE: ['HELD', 'READY_FOR_VERIFICATION', 'ESCALATED'],
  READY_FOR_VERIFICATION: ['RESUMED', 'HELD', 'ESCALATED'],
  RESUMED: ['UNDER_REVIEW', 'ESCALATED'],
  ESCALATED: ['HELD', 'UNDER_REVIEW'],
};

/* -----------------------------------------------------------------------
   PATIENT-IMPACT STATE (Section 22)
   ----------------------------------------------------------------------- */
export const PATIENT_IMPACT_STATES = [
  'NOT_INDICATED',
  'INDICATED',
  'PENDING',
  'COMPLETED_NO_AFFECTED_RESULTS',
  'AFFECTED_RESULT_SET_IDENTIFIED',
  'ESCALATION_REQUIRED',
];

export const PATIENT_IMPACT_TRANSITIONS = {
  NOT_INDICATED: ['INDICATED'],
  INDICATED: ['PENDING'],
  PENDING: ['COMPLETED_NO_AFFECTED_RESULTS', 'AFFECTED_RESULT_SET_IDENTIFIED'],
  COMPLETED_NO_AFFECTED_RESULTS: [],
  AFFECTED_RESULT_SET_IDENTIFIED: ['ESCALATION_REQUIRED'],
  ESCALATION_REQUIRED: [],
};

/* -----------------------------------------------------------------------
   HYPOTHESIS EVIDENCE STATE (Section 15)

   Explicitly NOT a boolean TRUE/FALSE — a hypothesis moves through a
   graded evidence state as the learner gathers information. "Established"
   requires a case-defined verification criterion to have been met; it is
   not equivalent to "most-supported" (Section 15: "Do not equate
   most-supported hypothesis with proven root cause").
   ----------------------------------------------------------------------- */
export const HYPOTHESIS_EVIDENCE_STATES = [
  'NOT_CONSIDERED',
  'PLAUSIBLE',
  'SUPPORTED',
  'WEAKENED',
  'CONTRADICTED',
  'ESTABLISHED',
];

export const HYPOTHESIS_STATE_TRANSITIONS = {
  NOT_CONSIDERED: ['PLAUSIBLE'],
  // PLAUSIBLE -> ESTABLISHED is legal: sufficiently decisive evidence can
  // establish a hypothesis directly without a separate "merely supported"
  // intermediate step (the engine's REQUEST_EVIDENCE handler only takes
  // this path when the evidence item is itself marked `decisive: true`).
  PLAUSIBLE: ['SUPPORTED', 'WEAKENED', 'CONTRADICTED', 'ESTABLISHED'],
  SUPPORTED: ['ESTABLISHED', 'WEAKENED', 'CONTRADICTED'],
  WEAKENED: ['SUPPORTED', 'CONTRADICTED', 'PLAUSIBLE'],
  CONTRADICTED: [],
  ESTABLISHED: [],
};

/* -----------------------------------------------------------------------
   ACTION CATEGORIES (Section 13)

   Each action has a declared category used by the engine and scoring
   model to determine what kind of consequence, if any, it produces.
   "INSPECT_*" actions are informational (Section 14: "some appropriate
   actions are informational only") and do not by themselves change
   service/patient-impact state.
   ----------------------------------------------------------------------- */
export const ACTION_TYPES = [
  'INSPECT_PANEL',
  'ACKNOWLEDGE_SIGNAL',
  'HOLD_RESULTS',
  'CONTINUE_ANALYSIS',
  'REPEAT_QC',
  'REPEAT_CALIBRATION',
  'INSPECT_REAGENT',
  'INSPECT_MAINTENANCE',
  'CHECK_EQA',
  'CHECK_PBRTQC',
  'CHECK_PATIENT_DISTRIBUTION',
  'FORM_HYPOTHESIS',
  'REQUEST_EVIDENCE',
  'APPLY_INTERVENTION',
  'VERIFY_RECOVERY',
  'REVIEW_PATIENT_IMPACT',
  'RESUME_SERVICE',
  'ESCALATE',
  'DOCUMENT',
  'RECORD_CONFIDENCE',
];

/* Which action types are purely informational (no state-machine
   consequence beyond marking evidence/panels inspected) vs. which are
   state-changing (affect service state, patient-impact state, or
   hypothesis states). Used by engine.js to decide whether a given action
   requires a "reason"/target payload and whether it can trigger a
   SAFETY_CRITICAL classification (Section 20). */
export const INFORMATIONAL_ACTION_TYPES = new Set([
  'INSPECT_PANEL', 'INSPECT_REAGENT', 'INSPECT_MAINTENANCE',
  'CHECK_EQA', 'CHECK_PBRTQC', 'CHECK_PATIENT_DISTRIBUTION',
]);

export const SAFETY_CRITICAL_ACTION_TYPES = new Set([
  'RESUME_SERVICE', 'HOLD_RESULTS', 'APPLY_INTERVENTION', 'ESCALATE',
]);

/* -----------------------------------------------------------------------
   SEVERITY MODEL (Section 20)

   A structured severity model for engine-detected unsafe actions, so
   scoring never applies "arbitrary punitive" penalties (Section 20) —
   each severity level has an explicit, documented meaning.
   ----------------------------------------------------------------------- */
export const SEVERITY_LEVELS = [
  'INFORMATIONAL',    // e.g. inspecting an unnecessary panel — no safety concern
  'INEFFICIENT',      // safe but wastes time/resources (e.g. redundant repeat testing)
  'UNSUPPORTED',      // a conclusion/action reached without adequate evidence
  'UNSAFE',           // e.g. premature service resumption without verification
  'CRITICAL_UNSAFE',  // e.g. releasing patient results known to be affected without review
];

/* -----------------------------------------------------------------------
   CONFIDENCE SCALE (Section 18)
   ----------------------------------------------------------------------- */
export const CONFIDENCE_LEVELS = ['LOW', 'MODERATE', 'HIGH'];

/* -----------------------------------------------------------------------
   DECISION CATEGORIES (Section 17)

   Used to tag learner decisions distinctly, so a correct decision in one
   category (e.g. containment) is never conflated with correctness in
   another (e.g. disposition) — Section 17: "a correct early containment
   decision must not imply that the learner knows the root cause."
   ----------------------------------------------------------------------- */
export const DECISION_CATEGORIES = [
  'OBSERVATION',
  'INTERPRETATION',
  'CONTAINMENT',
  'INVESTIGATION',
  'INTERVENTION',
  'VERIFICATION',
  'PATIENT_IMPACT_REVIEW',
  'DISPOSITION',
];

/* -----------------------------------------------------------------------
   SCORING DIMENSIONS (Section 19)
   ----------------------------------------------------------------------- */
export const SCORING_DIMENSIONS = [
  'SIGNAL_RECOGNITION',
  'STATISTICAL_INTERPRETATION',
  'ANALYTICAL_REASONING',
  'RULE_INTERPRETATION',
  'RISK_REASONING',
  'INVESTIGATION_STRATEGY',
  'EVIDENCE_SELECTION',
  'PATIENT_IMPACT_REASONING',
  'DECISION_APPROPRIATENESS',
  'VERIFICATION_QUALITY',
  'DOCUMENTATION_GOVERNANCE',
  'METACOGNITIVE_CALIBRATION',
];
