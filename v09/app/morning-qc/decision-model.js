/* =========================================================================
   v09/app/morning-qc/decision-model.js

   Morning QC Room — Stage 12A Decision Model
   PROVENANCE: V09_NEW

   Section 17: decision categories must remain separate — a correct
   containment decision must not imply the learner knows the root cause;
   a correct intervention without adequate evidence is still poor
   reasoning; a correct final answer reached through unsafe reasoning
   should not receive full competency credit. This module classifies each
   action-history entry into its decision category and evaluates
   "outcome correctness" and "reasoning quality" as two SEPARATE axes,
   rather than one conflated pass/fail.
   ========================================================================= */

import { DECISION_CATEGORIES } from './states.js';

const ACTION_TYPE_TO_DECISION_CATEGORY = {
  ACKNOWLEDGE_SIGNAL: 'OBSERVATION',
  INSPECT_PANEL: 'OBSERVATION',
  INSPECT_REAGENT: 'OBSERVATION',
  INSPECT_MAINTENANCE: 'OBSERVATION',
  CHECK_EQA: 'OBSERVATION',
  CHECK_PBRTQC: 'OBSERVATION',
  CHECK_PATIENT_DISTRIBUTION: 'OBSERVATION',
  FORM_HYPOTHESIS: 'INTERPRETATION',
  HOLD_RESULTS: 'CONTAINMENT',
  CONTINUE_ANALYSIS: 'CONTAINMENT',
  REPEAT_QC: 'INVESTIGATION',
  REPEAT_CALIBRATION: 'INVESTIGATION',
  REQUEST_EVIDENCE: 'INVESTIGATION',
  APPLY_INTERVENTION: 'INTERVENTION',
  VERIFY_RECOVERY: 'VERIFICATION',
  REVIEW_PATIENT_IMPACT: 'PATIENT_IMPACT_REVIEW',
  RESUME_SERVICE: 'DISPOSITION',
  ESCALATE: 'DISPOSITION',
};

export function classifyDecision(actionType) {
  const category = ACTION_TYPE_TO_DECISION_CATEGORY[actionType] || null;
  if (category && !DECISION_CATEGORIES.includes(category)) {
    throw new Error(`Internal error: mapped category "${category}" is not a recognized DECISION_CATEGORY`);
  }
  return category;
}

/**
 * Evaluates a single action-history entry along two SEPARATE axes:
 *   - outcomeAppropriate: did this action move the case toward a defensible resolution?
 *   - reasoningSupported: was this action backed by adequate evidence/state at the time?
 * These are deliberately NOT collapsed into one score (Section 17).
 */
export function evaluateDecision(historyEntry) {
  const category = classifyDecision(historyEntry.type);
  const severity = historyEntry.resultingSeverity;
  const reasoningSupported = !(severity === 'UNSUPPORTED' || severity === 'UNSAFE' || severity === 'CRITICAL_UNSAFE');
  const outcomeAppropriate = severity !== 'CRITICAL_UNSAFE';
  return {
    category,
    outcomeAppropriate,
    reasoningSupported,
    // A decision can be outcome-appropriate (e.g. eventually resumed service)
    // while reasoning-unsupported (e.g. resumed without verification that
    // happened to not matter in this particular case) — the two axes are
    // reported independently so scoring/debrief never conflates them.
    fullCreditEligible: outcomeAppropriate && reasoningSupported,
  };
}

export function summarizeDecisions(actionHistory) {
  return (actionHistory || []).map(evaluateDecision).filter(d => d.category !== null);
}
