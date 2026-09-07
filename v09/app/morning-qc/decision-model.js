/* =========================================================================
   v09/app/morning-qc/decision-model.js

   Morning QC Room — Stage 12A Decision Model
   PROVENANCE: V09_NEW
   Revised during the Stage 12A independent-audit corrective closure.

   Section 17: decision categories must remain separate — a correct
   containment decision must not imply the learner knows the root cause;
   a correct intervention without adequate evidence is still poor
   reasoning; a correct final answer reached through unsafe reasoning
   should not receive full competency credit. This module classifies each
   action-history entry into its decision category and evaluates
   "outcome correctness" and "reasoning quality" as two SEPARATE axes.

   CORRECTIVE-CLOSURE CHANGE: outcomeAppropriate is no longer derived from
   severity ("anything except CRITICAL_UNSAFE"). engine.js now attaches a
   genuine `outcomeAppropriate` boolean to every action-history entry —
   sourced directly from the case-authored decision option when the
   action executed one (action.decisionId/optionId), or from a narrow
   action-type-specific default otherwise (e.g. inspecting an IRRELEVANT
   panel is outcome-inappropriate; inspecting a RELEVANT one is
   outcome-appropriate). This module now simply READS that field rather
   than inferring it from severity — severity and outcomeAppropriate are
   independently sourced from the start.
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
  DOCUMENT: 'DISPOSITION',
};

export function classifyDecision(actionType) {
  const category = ACTION_TYPE_TO_DECISION_CATEGORY[actionType] || null;
  if (category && !DECISION_CATEGORIES.includes(category)) {
    throw new Error(`Internal error: mapped category "${category}" is not a recognized DECISION_CATEGORY`);
  }
  return category;
}

/**
 * Stage 12A FINAL closure: for a case-authored decision (the action-
 * history entry carries a decisionCategory recorded directly by
 * engine.js from the executed decisionOpportunity), that ENGINE-RECORDED
 * category is authoritative — it survives into scoring without being
 * re-derived. For non-case-authored actions (no matching decision was
 * executed), category still falls back to the action-type mapping below.
 */
export function evaluateDecision(historyEntry) {
  const category = historyEntry.decisionCategory || classifyDecision(historyEntry.type);
  const severity = historyEntry.resultingSeverity;
  const reasoningSupported = !(severity === 'UNSUPPORTED' || severity === 'UNSAFE' || severity === 'CRITICAL_UNSAFE');
  const outcomeAppropriate = historyEntry.outcomeAppropriate !== undefined ? historyEntry.outcomeAppropriate : true;
  return {
    category,
    decisionId: historyEntry.decisionId || null,
    optionId: historyEntry.optionId || null,
    actionType: historyEntry.type,
    outcomeAppropriate,
    reasoningSupported,
    fullCreditEligible: outcomeAppropriate && reasoningSupported,
  };
}

export function summarizeDecisions(actionHistory) {
  return (actionHistory || []).map(evaluateDecision).filter(d => d.category !== null);
}
