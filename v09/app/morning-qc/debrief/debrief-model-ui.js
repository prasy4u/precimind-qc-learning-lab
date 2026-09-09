/* =========================================================================
   v09/app/morning-qc/debrief/debrief-model-ui.js

   Morning QC Room — Stage 12C Debrief Presentation Model
   PROVENANCE: V09_NEW

   Pure display-label lookups — no scoring/rating logic. Every rating,
   category, and quadrant name here is copied VERBATIM from Stage 12A's
   own vocabulary (SCORING_DIMENSIONS, RATINGS, classifyCalibrationCategory
   category names) and only mapped to learner-facing text.
   ========================================================================= */

export const DIMENSION_LABELS = {
  SIGNAL_RECOGNITION: 'Signal Recognition',
  STATISTICAL_INTERPRETATION: 'Statistical Interpretation',
  ANALYTICAL_REASONING: 'Analytical Reasoning',
  RULE_INTERPRETATION: 'QC Rule Interpretation',
  RISK_REASONING: 'Risk / Immediate Containment',
  INVESTIGATION_STRATEGY: 'Investigation Strategy',
  EVIDENCE_SELECTION: 'Evidence Selection',
  PATIENT_IMPACT_REASONING: 'Patient-Impact Reasoning',
  DECISION_APPROPRIATENESS: 'Decision Appropriateness',
  VERIFICATION_QUALITY: 'Verification / Recovery',
  DOCUMENTATION_GOVERNANCE: 'Documentation Quality',
  METACOGNITIVE_CALIBRATION: 'Metacognitive Calibration',
};

// Exact Stage 12A rating bands (scoring-model.js's RATINGS) — never
// invented pseudo-precision. Order matches Stage 12A's own ordering.
export const RATING_LABELS = {
  NEEDS_IMPROVEMENT: 'Needs Attention',
  DEVELOPING: 'Developing',
  PROFICIENT: 'Proficient',
  STRONG: 'Strong',
};
export const RATING_ORDER = ['NEEDS_IMPROVEMENT', 'DEVELOPING', 'PROFICIENT', 'STRONG'];

export const QUADRANT_LABELS = {
  CORRECT_SUPPORTED: 'Strong decision — correct outcome, well-supported reasoning',
  CORRECT_UNSUPPORTED: 'Right answer reached prematurely — correct outcome, but reasoning wasn\u2019t yet supported by evidence',
  INCORRECT_SUPPORTED: 'Coherent reasoning, incorrect outcome — worth reviewing where the logic diverged from what was appropriate',
  INCORRECT_UNSUPPORTED: 'Both the outcome and the reasoning behind it need review',
};

export const CALIBRATION_CATEGORY_LABELS = {
  CORRECT_CALIBRATED: 'Well calibrated',
  CORRECT_UNDERCONFIDENT: 'Underconfident despite strong reasoning',
  CORRECT_MODERATE: 'Appropriately measured',
  INCORRECT_OVERCONFIDENT: 'Overconfident and incorrect',
  INCORRECT_APPROPRIATELY_UNCERTAIN: 'Appropriately cautious',
  INCORRECT_MODERATE: 'Moderate confidence, incorrect outcome',
  // FINAL CALIBRATION + PRODUCTION-ROUTING ACCEPTANCE closure: the
  // evidence-aware categories, only reachable via
  // classifyDecisionCalibration() (never the legacy
  // classifyCalibrationCategory(), which cannot distinguish these).
  OVERCONFIDENT_WITH_INSUFFICIENT_EVIDENCE: 'Overconfident relative to the evidence available at the time',
  APPROPRIATELY_CAUTIOUS: 'Appropriately cautious — the outcome was correct, but the reasoning was not yet fully supported',
};

export const PATIENT_IMPACT_STATUS_LABELS = {
  NOT_INDICATED: 'Not indicated',
  INDICATED: 'Indicated',
  PENDING: 'Pending review',
  COMPLETED_NO_AFFECTED_RESULTS: 'Reviewed — no affected results identified',
  AFFECTED_RESULT_SET_IDENTIFIED: 'Affected result set identified',
  ESCALATION_REQUIRED: 'Escalation required',
};

export function dimensionLabel(dim) { return DIMENSION_LABELS[dim] || dim; }
export function ratingLabel(rating) { return rating ? (RATING_LABELS[rating] || rating) : 'Not yet assessable'; }
export function quadrantLabel(q) { return QUADRANT_LABELS[q] || q; }
export function calibrationCategoryLabel(c) { return CALIBRATION_CATEGORY_LABELS[c] || c; }
export function patientImpactStatusLabel(s) { return s ? (PATIENT_IMPACT_STATUS_LABELS[s] || s) : 'Not yet indicated'; }
