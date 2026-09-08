/* =========================================================================
   v09/app/morning-qc/case-schema.js

   Morning QC Room — Stage 12A Case Contract
   PROVENANCE: V09_NEW

   Defines the formal, machine-readable structure every Morning QC case
   must satisfy (Stage 12A Section 9). This module exposes the REQUIRED
   FIELD LISTS consumed by case-validator.js — it does not itself validate;
   validation logic lives in case-validator.js so the "what shape is
   required" (this file) and "how do we check it" (validator) concerns
   stay separate and independently testable.
   ========================================================================= */

/* -----------------------------------------------------------------------
   IDENTITY
   ----------------------------------------------------------------------- */
export const IDENTITY_REQUIRED_FIELDS = [
  'id',                 // string, globally unique
  'title',              // string
  'caseFamily',         // string, references a family in the case-family catalogue
  'version',            // string, e.g. "1.0.0"
  'difficulty',         // one of CASE_DIFFICULTY_LEVELS (below) — NOT the same axis as learner level
  'intendedLearnerLevel', // array of: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  'competencyMapping',  // array of strings, e.g. ["QC-04", "QC-07"] referencing QC-01..QC-12
];

export const CASE_DIFFICULTY_LEVELS = [
  'LEVEL_1_CLEAR_SIGNAL',
  'LEVEL_2_COMPETING_EXPLANATION',
  'LEVEL_3_MULTIPLE_SIGNALS_INCOMPLETE_EVIDENCE',
  'LEVEL_4_ANALYTICAL_PLUS_RISK_TRADEOFF',
  'LEVEL_5_COMPLEX_GOVERNANCE_LONGITUDINAL',
];

export const LEARNER_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

/* -----------------------------------------------------------------------
   LABORATORY CONTEXT
   ----------------------------------------------------------------------- */
export const LAB_CONTEXT_REQUIRED_FIELDS = [
  'analyte',             // string
  'analyticalMethod',    // string
  'qcMaterials',         // array of { levelId, levelName, targetValue, targetSD }
  'qcStrategy',          // string description of the case's authored QC procedure
  'apsSource',           // string, e.g. "Milan Model 2 — biological variation" | "manufacturer" | "regulatory"
  // Optional-but-typed context, present only when the case genuinely uses them:
  // 'sigmaContext', 'patientRiskContext', 'analyzerContext', 'reagentContext',
  // 'calibrationContext', 'maintenanceContext'
];

/* -----------------------------------------------------------------------
   TIMELINE / EVENTS
   ----------------------------------------------------------------------- */
export const EVENT_TYPES = [
  'QC_OBSERVATION',
  'ANALYZER_MESSAGE',
  'MAINTENANCE',
  'CALIBRATION',
  'REAGENT_LOT_CHANGE',
  'ENVIRONMENTAL',
  'EQA_INFORMATION',
  'PBRTQC_EVENT',
  'PATIENT_RESULT_SIGNAL',
  'OPERATOR_ACTION',
];

export const EVENT_REQUIRED_FIELDS = [
  'id',            // string, unique within case
  'type',          // one of EVENT_TYPES
  'timestamp',     // number (relative minutes from case start) — deterministic, not wall-clock
  'description',   // string
  'panelId',       // string — which information panel this event is associated with (may be null)
];

/* -----------------------------------------------------------------------
   INFORMATION PANELS (Section 9 + Section 6)
   ----------------------------------------------------------------------- */
export const PANEL_TYPES = [
  'QC_HISTORY', 'LJ_CHART', 'ANALYZER_STATUS', 'REAGENT_LOT', 'CALIBRATION',
  'MAINTENANCE', 'EQA', 'PATIENT_RESULT_DISTRIBUTION', 'PBRTQC',
  'PREVIOUS_UNRESOLVED_EVENTS', 'APS_TEA', 'SIGMA', 'QC_STRATEGY_FREQUENCY',
  'PATIENT_RISK_CONTEXT',
];

export const PANEL_REQUIRED_FIELDS = [
  'id',                  // string, unique within case
  'type',                // one of PANEL_TYPES
  'availableFromPhase',  // one of SIMULATION_PHASES (states.js) — when this panel becomes visible
  'relevance',           // 'RELEVANT' | 'IRRELEVANT' | 'CONDITIONALLY_RELEVANT'
  'costTimeMinutes',     // number >= 0 — inspecting this panel consumes case-clock time
  'mayBeMisleading',     // boolean — true if legitimate-but-misleading (Section 9)
  'provenance',          // string — where this information "comes from" in the case narrative
  'content',             // case-specific payload (free-form; validated structurally, not semantically).
                         // `content.note` is the full authored text and MAY legitimately embed
                         // author/debrief-level interpretation (e.g. explaining to a reviewer
                         // WHY a panel is included). Stage 12B's semantic leakage review (see
                         // V09_STAGE12B_REPORT.md) found this can leak the learner-facing
                         // conclusion the learner is meant to reach themselves. An OPTIONAL
                         // `content.learnerNote` (string) may additionally be authored as the
                         // purely-factual, non-interpretive projection actually shown to the
                         // learner during active play; `content.note` remains authoritative for
                         // audit/debrief purposes and is never removed. When absent, the UI falls
                         // back to `content.note` unchanged (fully backward-compatible).
];

/* -----------------------------------------------------------------------
   GROUND TRUTH (Section 9 — never automatically revealed to the learner
   during the case; only exposed via debrief-model.js after DOCUMENTATION)
   ----------------------------------------------------------------------- */
export const GROUND_TRUTH_REQUIRED_FIELDS = [
  'observedSignal',         // string — what the learner should be able to observe
  'disturbanceEstablished', // boolean — whether a genuine ANALYTICAL disturbance exists at all
  'disturbanceDescription', // string | null
  'rootCauseEstablished',   // boolean — whether an ANALYTICAL root cause is established.
                            // Stage 12A corrective closure: this field means EXCLUSIVELY an
                            // analytical root cause. It must be false whenever
                            // disturbanceEstablished is false (see case-validator.js) — a
                            // case may still explain the observed SIGNAL without any
                            // analytical disturbance (see signalExplanationEstablished
                            // below), but that is never called a "root cause."
  'rootCauseDescription',   // string | null — MUST be null if rootCauseEstablished is false
  'signalExplanationEstablished', // boolean — whether a non-disturbance explanation for the
                            // observed signal is established (e.g. population case-mix
                            // shift, a statistically significant serial change under RCV
                            // assumptions). Independent of rootCauseEstablished — a case can
                            // have signalExplanationEstablished=true and rootCauseEstablished
                            // =false simultaneously (this is the correct, intended
                            // combination for case families K and M).
  'signalExplanationDescription', // string | null — MUST be null if signalExplanationEstablished is false
  'patientImpactStatus',    // one of PATIENT_IMPACT_STATES (states.js)
  'appropriateDisposition', // string — the case-author's intended correct final disposition
  'evidenceForHypotheses',  // array of { hypothesisId, supports: boolean, weight: 'DECISIVE'|'SUPPORTIVE'|'WEAK' }
];

/* -----------------------------------------------------------------------
   DECISION OPPORTUNITIES
   ----------------------------------------------------------------------- */
export const DECISION_OPPORTUNITY_REQUIRED_FIELDS = [
  'id',              // string
  'category',        // one of DECISION_CATEGORIES (states.js)
  'availableFromPhase', // one of SIMULATION_PHASES
  'options',         // array of { id, label, consequenceSummary, severity (one of SEVERITY_LEVELS),
                     //            outcomeAppropriate (boolean) }
];

// Stage 12A corrective closure: each decision option must declare BOTH
// severity (reasoning-quality/safety axis) AND outcomeAppropriate
// (correctness-of-outcome axis, per the case's ground truth) as
// independent, explicitly-authored fields — NOT one derived from the
// other. This is what makes the two-axis decision model genuinely
// case-authored rather than inferred from severity alone.
//
// Stage 12A FINAL closure addition: each option must also declare
// `actionType` — the SPECIFIC action type that legitimately executes it.
// This binds decision identity to a real, matching action (engine.js
// rejects any attempt to execute a decisionId/optionId via a
// non-matching action.type), so case decision identity can never be
// attached arbitrarily to an unrelated action.
// Stage 12A FINAL EVIDENCE/REASONING closure: each option must also
// declare `requiredEvidenceIdsForSupportedReasoning` — the evidence
// genuinely needed before THIS SPECIFIC conclusion is adequately
// evidence-supported. This is deliberately SEPARATE from the owning
// decision's `availableFromPhase` (which only gates WHEN the decision
// may be attempted, not whether the reasoning behind a given answer is
// supported). An option with no genuine evidence prerequisite uses an
// empty array — the field itself is always required, but a populated
// list is not.
export const DECISION_OPTION_REQUIRED_FIELDS = [
  'id', 'label', 'consequenceSummary', 'severity', 'outcomeAppropriate', 'actionType',
  'requiredEvidenceIdsForSupportedReasoning',
];

/* -----------------------------------------------------------------------
   VERIFICATION CRITERIA
   ----------------------------------------------------------------------- */
export const VERIFICATION_CRITERIA_REQUIRED_FIELDS = [
  'requiredEvidenceIds',  // array of evidence IDs that must be inspected/obtained
  'minimumConfirmationDescription', // string — what "enough" verification looks like for this case
];

/* -----------------------------------------------------------------------
   PATIENT-IMPACT CRITERIA (Stage 12A corrective closure)

   Mirrors verificationCriteria's pattern: a case must declare which
   evidence is required before a TERMINAL patient-impact state
   (COMPLETED_NO_AFFECTED_RESULTS or AFFECTED_RESULT_SET_IDENTIFIED) may
   be reached. This prevents a learner from declaring an affected-result
   set (or its absence) merely by selecting the next enum value with no
   supporting evidence — the QC-disturbance-≠-patient-impact doctrine
   must be evidence-backed, not just modeled as reachable states.
   ----------------------------------------------------------------------- */
export const PATIENT_IMPACT_CRITERIA_REQUIRED_FIELDS = [
  'requiredEvidenceIdsForTerminalState', // array of evidence IDs required before reaching
                                          // COMPLETED_NO_AFFECTED_RESULTS or AFFECTED_RESULT_SET_IDENTIFIED
  'minimumConfirmationDescription',      // string — what "enough" patient-impact evidence looks like
];

/* -----------------------------------------------------------------------
   DEBRIEF EVIDENCE
   ----------------------------------------------------------------------- */
export const DEBRIEF_EVIDENCE_REQUIRED_FIELDS = [
  'strongPathDescription',   // string
  'weakPathDescriptions',    // array of { description, whyWeaker }
  'commonMisconceptions',    // array of strings
];

/* -----------------------------------------------------------------------
   HYPOTHESES
   ----------------------------------------------------------------------- */
export const HYPOTHESIS_REQUIRED_FIELDS = [
  'id',            // string, unique within case
  'label',         // string
  'plausibleFromStart', // boolean
];

/* -----------------------------------------------------------------------
   EVIDENCE ITEMS (Section 16)
   ----------------------------------------------------------------------- */
export const EVIDENCE_REQUIRED_FIELDS = [
  'id',                     // string, unique within case
  'source',                 // string (free-text, human-readable — NOT used for machine gating)
  'sourcePanelId',          // string (panel id) | null — Stage 12A final-closure addition.
                            // If non-null, the referenced panel must exist, be legitimately
                            // available, AND have actually been inspected before this evidence
                            // can be obtained. Use null for evidence generated by a separate
                            // action/calculation (e.g. a repeat-test result, an RCV
                            // calculation) rather than directly read off an inspectable panel.
  'timestamp',              // number, relative minutes
  'observedValueOrFinding',  // string
  'interpretationLimits',    // string — what this evidence does NOT prove
  'supportsHypothesisIds',   // array of hypothesis IDs
  'weakensHypothesisIds',    // array of hypothesis IDs
  'decisive',                // boolean
  'relevant',                // boolean
  'availableOnlyAfterActionType', // one of ACTION_TYPES (states.js) | null — for
                            // action-GENERATED evidence (e.g. a repeat test). Independent
                            // of, and in addition to, sourcePanelId: both may apply.
];

/* -----------------------------------------------------------------------
   TOP-LEVEL CASE SHAPE
   ----------------------------------------------------------------------- */
export const CASE_TOP_LEVEL_REQUIRED_FIELDS = [
  'identity', 'labContext', 'timeline', 'panels', 'groundTruth',
  'decisionOpportunities', 'verificationCriteria', 'patientImpactCriteria',
  'debriefEvidence', 'hypotheses', 'evidence', 'provenance',
];

/* -----------------------------------------------------------------------
   PROVENANCE (Stage 12A Section 32 — every new artifact must declare
   its v0.9 development provenance class, and cases must additionally
   identify the scientific modules/doctrine they depend on.)
   ----------------------------------------------------------------------- */
export const V09_PROVENANCE_CLASSES = ['V09_NEW', 'V09_MODIFIED', 'V09_TEST'];

export const CASE_PROVENANCE_REQUIRED_FIELDS = [
  'provenanceClass',        // one of V09_PROVENANCE_CLASSES
  'scientificDependencies', // array of strings, e.g. ["app/rules/engine.js:detectR4s", "app/pbrtqc/calc.js:calculateNPed"]
];
