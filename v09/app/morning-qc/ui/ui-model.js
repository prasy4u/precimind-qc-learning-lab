/* =========================================================================
   v09/app/morning-qc/ui/ui-model.js

   Morning QC Room — Stage 12B Presentation Model
   PROVENANCE: V09_NEW

   Pure, side-effect-free display helpers: labels, icons, and grouping for
   engine enums. Contains NO scientific or simulation logic — every value
   here is a presentation-only mapping from an engine-defined enum (panel
   type, service state, action type, patient-impact state) to
   learner-facing text. Never maps severity/outcomeAppropriate/
   reasoningSupported to any display treatment (Section 31: no
   green-means-correct / red-means-wrong during active reasoning).
   ========================================================================= */

export const PANEL_TYPE_LABELS = {
  QC_HISTORY: 'QC History',
  LJ_CHART: 'Levey-Jennings Chart',
  ANALYZER_STATUS: 'Analyzer Status',
  REAGENT_LOT: 'Reagent Lot',
  CALIBRATION: 'Calibration',
  MAINTENANCE: 'Maintenance Log',
  EQA: 'External Quality Assurance',
  PATIENT_RESULT_DISTRIBUTION: 'Patient Result Distribution',
  PBRTQC: 'Patient-Based Real-Time QC',
  PREVIOUS_UNRESOLVED_EVENTS: 'Prior Unresolved Events',
  APS_TEA: 'Analytical Performance Spec',
  SIGMA: 'Sigma Metric',
  QC_STRATEGY_FREQUENCY: 'QC Strategy',
  PATIENT_RISK_CONTEXT: 'Patient / Specimen Context',
};

export const SERVICE_STATE_LABELS = {
  RUNNING: 'Running',
  UNDER_REVIEW: 'Under Review',
  HELD: 'Held',
  LIMITED_RELEASE: 'Limited Release',
  READY_FOR_VERIFICATION: 'Ready for Verification',
  RESUMED: 'Resumed',
  ESCALATED: 'Escalated',
};

// Neutral, non-evaluative tones only — never a correctness signal.
export const SERVICE_STATE_TONE = {
  RUNNING: 'neutral',
  UNDER_REVIEW: 'attention',
  HELD: 'attention',
  LIMITED_RELEASE: 'attention',
  READY_FOR_VERIFICATION: 'attention',
  RESUMED: 'neutral',
  ESCALATED: 'attention',
};

export const PATIENT_IMPACT_LABELS = {
  NOT_INDICATED: 'Not yet indicated',
  INDICATED: 'Review indicated',
  PENDING: 'Review pending',
  COMPLETED_NO_AFFECTED_RESULTS: 'Reviewed — no affected results identified',
  AFFECTED_RESULT_SET_IDENTIFIED: 'Affected result set identified',
  ESCALATION_REQUIRED: 'Escalation required',
};

export const ACTION_TYPE_LABELS = {
  ACKNOWLEDGE_SIGNAL: 'Acknowledge signal',
  INSPECT_PANEL: 'Inspect panel',
  INSPECT_REAGENT: 'Inspect reagent',
  INSPECT_MAINTENANCE: 'Inspect maintenance log',
  CHECK_EQA: 'Check EQA',
  CHECK_PBRTQC: 'Check PBRTQC',
  CHECK_PATIENT_DISTRIBUTION: 'Check patient distribution',
  HOLD_RESULTS: 'Hold results',
  CONTINUE_ANALYSIS: 'Continue analysis',
  REPEAT_QC: 'Repeat QC',
  REPEAT_CALIBRATION: 'Repeat calibration',
  FORM_HYPOTHESIS: 'Form hypothesis',
  REQUEST_EVIDENCE: 'Request evidence',
  APPLY_INTERVENTION: 'Apply intervention',
  VERIFY_RECOVERY: 'Verify recovery',
  REVIEW_PATIENT_IMPACT: 'Review patient impact',
  RESUME_SERVICE: 'Resume service',
  ESCALATE: 'Escalate',
  DOCUMENT: 'Document',
  RECORD_CONFIDENCE: 'Record confidence',
};

// Action groups for the action dock (Section 16) — purely organizational.
export const ACTION_GROUPS = [
  { id: 'signal', label: 'Signal / Immediate Action', actionTypes: ['ACKNOWLEDGE_SIGNAL', 'HOLD_RESULTS', 'CONTINUE_ANALYSIS', 'ESCALATE'] },
  { id: 'investigation', label: 'Investigation', actionTypes: ['REPEAT_QC', 'REPEAT_CALIBRATION', 'REQUEST_EVIDENCE'] },
  { id: 'reasoning', label: 'Reasoning', actionTypes: ['FORM_HYPOTHESIS'] },
  { id: 'intervention', label: 'Intervention / Verification', actionTypes: ['APPLY_INTERVENTION', 'VERIFY_RECOVERY', 'REVIEW_PATIENT_IMPACT', 'RESUME_SERVICE'] },
  { id: 'documentation', label: 'Documentation', actionTypes: ['DOCUMENT'] },
];

export const CONFIDENCE_LEVELS = ['LOW', 'MODERATE', 'HIGH'];

export function panelTypeLabel(type) {
  return PANEL_TYPE_LABELS[type] || type;
}
export function serviceStateLabel(state) {
  return SERVICE_STATE_LABELS[state] || state;
}
export function patientImpactLabel(state) {
  return PATIENT_IMPACT_LABELS[state] || state;
}
export function actionTypeLabel(type) {
  return ACTION_TYPE_LABELS[type] || type;
}
