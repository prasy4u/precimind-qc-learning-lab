/* =========================================================================
   v09/app/morning-qc/analytics/analytics-types.js

   Morning QC Room — Stage 12D Analytics Event Schema (versioned)
   PROVENANCE: V09_NEW

   Section 40-42: a documented, versioned analytics event schema. Every
   event type declares required fields, optional fields, and (implicitly)
   prohibited hidden fields — no groundTruth, no raw case object, no
   personal identifiers, ever.
   ========================================================================= */
export const ANALYTICS_SCHEMA_VERSION = '1.0.0';

export const EVENT_TYPES = [
  'CASE_STARTED', 'PANEL_INSPECTED', 'EVIDENCE_OBTAINED', 'DECISION_EXECUTED',
  'CONFIDENCE_RECORDED', 'VERIFICATION_ATTEMPTED', 'CASE_COMPLETED',
  'DEBRIEF_VIEWED', 'CASE_RECOMMENDED', 'CASE_SELECTED',
];

// Required/optional fields per event type. `caseFamily`/`difficulty` are
// safe, learner-facing metadata (never groundTruth); `decisionEventId`
// and `quadrant`/`category` are the same safe axes already exposed
// through the debrief projection — never a raw internal object.
export const EVENT_FIELD_SCHEMA = {
  CASE_STARTED: { required: ['caseId', 'timestamp'], optional: ['caseFamily', 'difficulty'], prohibited: ['groundTruth', 'learnerName', 'learnerId'] },
  PANEL_INSPECTED: { required: ['caseId', 'panelId', 'timestamp'], optional: [], prohibited: ['groundTruth'] },
  EVIDENCE_OBTAINED: { required: ['caseId', 'evidenceId', 'timestamp'], optional: [], prohibited: ['groundTruth'] },
  DECISION_EXECUTED: { required: ['caseId', 'decisionEventId', 'decisionId', 'quadrant', 'timestamp'], optional: [], prohibited: ['groundTruth', 'consequenceSummary'] },
  CONFIDENCE_RECORDED: { required: ['caseId', 'decisionEventId', 'confidence', 'category', 'timestamp'], optional: [], prohibited: ['groundTruth'] },
  VERIFICATION_ATTEMPTED: { required: ['caseId', 'wasSuccessful', 'timestamp'], optional: [], prohibited: ['groundTruth'] },
  CASE_COMPLETED: { required: ['caseId', 'finalServiceState', 'timestamp'], optional: ['competencyProfile'], prohibited: ['groundTruth'] },
  DEBRIEF_VIEWED: { required: ['caseId', 'timestamp'], optional: [], prohibited: ['groundTruth'] },
  CASE_RECOMMENDED: { required: ['caseId', 'reason', 'timestamp'], optional: [], prohibited: ['groundTruth'] },
  CASE_SELECTED: { required: ['caseId', 'wasRecommended', 'timestamp'], optional: [], prohibited: ['groundTruth'] },
};
