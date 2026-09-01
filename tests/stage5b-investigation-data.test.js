/* =========================================================================
   tests/stage5b-investigation-data.test.js

   NEW RECOVERY TESTS — Stage 5B (NOT the historical test suite)
   Tests for the recovered Investigation Lab static data module in
   src/investigation/data.js.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)
   SOURCE MODULE: Artifact Class A — src/investigation/data.js
   CALC MODULE: Artifact Class A — src/investigation/calc.js (Stage 5A)

   TEST EXPECTATION PROVENANCE:
   -------------------------------------------------------
   SOURCE-GROUNDED EXPECTATION:
     Exact exported values, exact strings, exact array contents, exact
     schema fields, exact IDs/titles, exact status values, exact decision
     values, and exact required-absent states explicitly encoded in the
     HTML source (recovery/original-v0.8.html, lines 6684-7447).

   RECONSTRUCTED EXPECTATION:
     Uniqueness checks, schema consistency checks, cross-module
     status-vocabulary integration checks, forbidden-engine/module
     architecture checks, and other structural tests created during
     recovery.

   Exact provenance counts are at the bottom of this file.

   Run: node tests/stage5b-investigation-data.test.js
   ========================================================================= */

'use strict';

const d = require('../src/investigation/data');
const calc = require('../src/investigation/calc');

const {
  QC_SIGNAL_STATUSES, PROCESS_STATUSES, CAUSE_STATUSES,
  PATIENT_IMPACT_STATUSES, RESULT_DISPOSITION_STATUSES, REASONING_STAGES,
  isVisibleAtStage
} = calc;

const {
  CORE_BANNER_TITLE, CORE_BANNER_SEPARATIONS,
  STATISTICAL_SIGNAL_DEFINITION, OUT_OF_CONTROL_DEFINITION, SIGNAL_VS_CONDITION_CAUTION,
  REASONING_PATHWAY_STEPS, REASONING_PATHWAY_CAUTION,
  INVESTIGATION_SEQUENCE_STEPS, INVESTIGATION_SEQUENCE_CAUTION,
  FOUR_PRINCIPLES, SIX_CORE_QUESTIONS, COLLAPSE_CAUTION,
  IMMEDIATE_ACTION_OPTIONS, NO_STOP_EVERYTHING_NOTE, NO_KEEP_RUNNING_NOTE,
  REPEAT_QC_PRINCIPLE_NOTE, REPEAT_QC_EXERCISE, TARGETED_REPEAT_VS_REPEAT_UNTIL_PASS,
  RECALIBRATION_GUARDRAIL_NOTE, CHANGE_EVERYTHING_GUARDRAIL_NOTE,
  EVIDENCE_CATEGORIES, NO_PBRTQC_NOTE,
  HYPOTHESIS_CATEGORIES, hypothesisLabel, CAUSE_STATUS_HYPOTHESIS_LABEL,
  EVIDENCE_STRENGTH_LABELS, SUPPORT_RELATION_LABELS, NO_QUANTITATIVE_CERTAINTY_NOTE,
  TEMPORAL_ASSOCIATION_EXAMPLE, CONCORDANT_EVIDENCE_EXAMPLE, CONTRADICTORY_EVIDENCE_EXAMPLE,
  INFORMATION_SEEKING_OPTIONS, INFORMATION_SEEKING_NOTE,
  RECONSTRUCTION_WORKED_EXAMPLE, LAST_QC_BOUNDARY_NOTE, DETECTION_VS_ONSET_NOTE,
  CANDIDATE_WINDOW_NARROWING_EXAMPLE, NO_CAUSAL_INTERVAL_ENGINE_NOTE,
  THREE_LAYER_MODEL, THREE_LAYER_CAUTION,
  CORE_DISTINCTION_RECOVERY_VS_DISPOSITION, LAYER_FOUR_DISPOSITION,
  DISPOSITION_NOT_SYNONYMOUS_WITH_EXPOSURE_NOTE,
  NOT_AUTOMATICALLY_INVALID_NOTE, SYNTHETIC_PATIENT_DATA_NOTE,
  ILLUSTRATIVE_THRESHOLD_LABEL, ILLUSTRATIVE_THRESHOLD_CAUTION, NO_AUTO_CORRECTION_NOTE,
  PATIENT_IMPACT_ACTIONS, CLINICAL_SIGNIFICANCE_GUARDRAIL, ALTERNATE_ANALYSER_NOTE,
  PATIENT_DISTRIBUTION_EVIDENCE_NOTE, EQA_LIMITATION_NOTE,
  RECOVERY_PATHWAY_STEPS, RECOVERY_NOT_ONE_PASS_NOTE, RECOVERY_EVIDENCE_COMPONENTS,
  DOCUMENTATION_CHECKLIST, DOCUMENTATION_NOTE, RESUME_DECISION_OPTIONS,
  RESULT_DISPOSITION_DECISION_OPTIONS, TWO_QUESTION_RECOVERY_NOTE,
  PROCESS_RECOVERY_VS_RESULT_RELEASE_GUARDRAIL_NOTE, QC_SIGNAL_NOT_UNIVERSAL_HOLD_NOTE,
  AMENDMENT_CONSIDERATION_NOTE, NO_AUTO_AMENDMENT_NOTE,
  COMMUNICATION_CONSIDERATION_OPTIONS, NO_AUTO_NOTIFICATION_NOTE,
  CURRENT_PROCESS_TIMELINE_STEPS, HISTORICAL_RESULT_TIMELINE_STEPS, TWO_TIMELINE_EXPLANATION_NOTE,
  HYPOTHESIS_REVISION_NOTE, CONFIDENCE_CALIBRATION_NOTE_EARLY,
  CONFIDENCE_CALIBRATION_NOTE_CONVERGED, NO_GAMIFIED_SCORE_NOTE,
  INVESTIGATION_SCENARIOS
} = d;

let passed = 0, failed = 0;
let sgCount = 0, rcCount = 0;  // source-grounded, reconstructed counts

function assert(id, condition, detail, provenance) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (provenance === 'sg') sgCount++;
  else rcCount++;
}

/* -----------------------------------------------------------------------
   SECTION A: MODULE BOUNDARY / ARCHITECTURE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Module boundary / architecture ===');

// No React/JSX
const srcText = require('fs').readFileSync(require('path').join(__dirname, '../src/investigation/data.js'), 'utf8');
assert('A-01', !srcText.includes('import React') && !srcText.includes('from "react"') && !srcText.includes("from 'react'"), 'No React import', 'rc');
assert('A-02', !srcText.includes('className=') && !srcText.includes('jsx'), 'No JSX/className', 'rc');
assert('A-03', !srcText.match(/\bdocument\.getElementById\b|\bdocument\.querySelector\b|\bwindow\.addEventListener\b/), 'No DOM API calls', 'rc');

// No calc-engine duplication
const calcFns = ['normalCDF', 'erf', 'pfr1_3s', 'ped1_3s', 'absoluteDifference', 'relativeDifferencePercent', 'expectedQcEventsToDetectionGeometric'];
calcFns.forEach(fn => {
  assert(`A-04-${fn}`, typeof d[fn] === 'undefined', `No calc duplicate: ${fn}`, 'rc');
});

// No forbidden engines
// Bayesian legitimately appears in NO_QUANTITATIVE_CERTAINTY_NOTE (as a named concept to reject)
// The absence check is that no calculation function using Bayes exists — verified by A-10 (only hypothesisLabel fn exported)
assert('A-05', !srcText.includes('function bayes') && !srcText.includes('bayesScore'), 'No Bayesian calculation function', 'rc');
assert('A-06', !srcText.includes('movingMean') && !srcText.includes('moving_mean') && !srcText.includes('EWMA'), 'No PBRTQC algorithms', 'rc');
assert('A-07', typeof d.autoCorrectPatientResult === 'undefined', 'No auto-correct function', 'rc');
assert('A-08', typeof d.autoAmendResult === 'undefined', 'No auto-amend function', 'rc');
assert('A-09', typeof d.notifyClinician === 'undefined', 'No auto-notification function', 'rc');

// Only one function exported: hypothesisLabel
const exportedFns = Object.keys(d).filter(k => typeof d[k] === 'function');
assert('A-10', exportedFns.length === 1 && exportedFns[0] === 'hypothesisLabel', 'Only hypothesisLabel is a function', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: EXPORT SURFACE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Export surface (source-grounded) ===');

assert('B-01', Object.keys(d).length === 75, 'Exactly 75 exports', 'sg');

// Spot-check a representative sample of identifiers
const expectedExports = [
  'CORE_BANNER_TITLE', 'CORE_BANNER_SEPARATIONS', 'STATISTICAL_SIGNAL_DEFINITION',
  'OUT_OF_CONTROL_DEFINITION', 'SIGNAL_VS_CONDITION_CAUTION', 'REASONING_PATHWAY_STEPS',
  'FOUR_PRINCIPLES', 'SIX_CORE_QUESTIONS', 'COLLAPSE_CAUTION', 'HYPOTHESIS_CATEGORIES',
  'hypothesisLabel', 'CAUSE_STATUS_HYPOTHESIS_LABEL', 'NO_QUANTITATIVE_CERTAINTY_NOTE',
  'THREE_LAYER_MODEL', 'CORE_DISTINCTION_RECOVERY_VS_DISPOSITION',
  'PROCESS_RECOVERY_VS_RESULT_RELEASE_GUARDRAIL_NOTE', 'TWO_QUESTION_RECOVERY_NOTE',
  'INVESTIGATION_SCENARIOS', 'NO_AUTO_CORRECTION_NOTE', 'NO_AUTO_AMENDMENT_NOTE',
  'NO_AUTO_NOTIFICATION_NOTE', 'NO_PBRTQC_NOTE', 'SYNTHETIC_PATIENT_DATA_NOTE'
];
expectedExports.forEach(name => {
  assert(`B-02-${name}`, name in d, `Export present: ${name}`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION C: CORE TEACHING DOCTRINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Core teaching doctrine (source-grounded) ===');

// Core banner
assert('C-01', CORE_BANNER_TITLE === 'A QC signal is not a root cause.', 'Core banner title exact', 'sg');
assert('C-02', Array.isArray(CORE_BANNER_SEPARATIONS) && CORE_BANNER_SEPARATIONS.length === 4, 'Core banner 4 separations', 'sg');
assert('C-03', CORE_BANNER_SEPARATIONS[0] === 'QC signal detected', 'Separation 1: QC signal detected', 'sg');
assert('C-04', CORE_BANNER_SEPARATIONS[3] === 'clinical harm established', 'Separation 4: clinical harm established', 'sg');

// Signal vs condition
assert('C-05', SIGNAL_VS_CONDITION_CAUTION.includes('false rejection is possible'), 'Signal vs condition: false rejection possible', 'sg');
assert('C-06', SIGNAL_VS_CONDITION_CAUTION.includes('not proof that the process actually departed'), 'Signal: not proof of departure', 'sg');

// Repeat QC doctrine
assert('C-07', REPEAT_QC_PRINCIPLE_NOTE.includes('Repeating QC solely until a result falls inside limits') && REPEAT_QC_PRINCIPLE_NOTE.includes('not sound analytical reasoning'), 'Repeat-until-pass is not sound', 'sg');
assert('C-08', REPEAT_QC_EXERCISE.correctAnswer === 'Not necessarily.', 'Repeat exercise answer: Not necessarily.', 'sg');
assert('C-09', REPEAT_QC_EXERCISE.initial.length === 2 && REPEAT_QC_EXERCISE.repeat.length === 2, 'Repeat exercise has initial and repeat arrays', 'sg');

// Recalibration guardrail
assert('C-10', RECALIBRATION_GUARDRAIL_NOTE.includes('not a diagnostic explanation'), 'Recalibration is not a diagnostic explanation', 'sg');
assert('C-11', RECALIBRATION_GUARDRAIL_NOTE.includes('does not recommend recalibration automatically'), 'No automatic recalibration', 'sg');
assert('C-12', CHANGE_EVERYTHING_GUARDRAIL_NOTE.includes('does not teach replacing'), 'No change-everything approach', 'sg');

// No quantitative causal certainty
assert('C-13', NO_QUANTITATIVE_CERTAINTY_NOTE.includes('never fabricates quantitative certainty'), 'No quantitative causal certainty', 'sg');
assert('C-14', NO_QUANTITATIVE_CERTAINTY_NOTE.includes('no Bayesian likelihood ratio'), 'No Bayesian likelihood ratio', 'sg');
assert('C-15', NO_QUANTITATIVE_CERTAINTY_NOTE.includes('no arbitrary weighted root-cause ranking'), 'No weighted root-cause ranking', 'sg');

// Temporal association
assert('C-16', TEMPORAL_ASSOCIATION_EXAMPLE.correctAnswer === 'No.', 'Temporal association does not prove causation', 'sg');

// No causal interval engine
assert('C-17', NO_CAUSAL_INTERVAL_ENGINE_NOTE.includes('does not infer failure onset from arbitrary user-entered data'), 'No causal interval engine', 'sg');

// Three-layer model
assert('C-18', THREE_LAYER_MODEL.length === 3, 'Three-layer model has 3 layers', 'sg');
assert('C-19', THREE_LAYER_MODEL[0].id === 'exposure' && THREE_LAYER_MODEL[1].id === 'effect' && THREE_LAYER_MODEL[2].id === 'consequence', 'Three-layer IDs: exposure/effect/consequence', 'sg');
assert('C-20', THREE_LAYER_CAUTION.includes('must not be collapsed into one another'), 'Three-layer must not be collapsed', 'sg');

// Process recovery vs result disposition
assert('C-21', CORE_DISTINCTION_RECOVERY_VS_DISPOSITION.includes('separate decisions'), 'Recovery vs disposition: separate decisions', 'sg');
assert('C-22', PROCESS_RECOVERY_VS_RESULT_RELEASE_GUARDRAIL_NOTE.includes('never implements logic equivalent to'), 'Guardrail: never auto-release on recovery', 'sg');
assert('C-23', TWO_QUESTION_RECOVERY_NOTE.includes('two separate questions'), 'Two-question recovery noted', 'sg');
assert('C-24', TWO_TIMELINE_EXPLANATION_NOTE.includes('does not automatically resolve disposition'), 'Two timelines: recovery does not resolve disposition', 'sg');

// No auto correction / amendment / notification
assert('C-25', NO_AUTO_CORRECTION_NOTE.includes('never implements'), 'No auto correction', 'sg');
assert('C-26', NO_AUTO_AMENDMENT_NOTE.includes('never automatically amends or reissues'), 'No auto amendment', 'sg');
assert('C-27', NO_AUTO_NOTIFICATION_NOTE.includes('never sends'), 'No auto notification', 'sg');

// Not automatically invalid
assert('C-28', NOT_AUTOMATICALLY_INVALID_NOTE.includes('never states that all results since the last good QC are invalid'), 'Not automatically invalid', 'sg');

// Synthetic patient data
assert('C-29', SYNTHETIC_PATIENT_DATA_NOTE.includes('synthetic identifiers only'), 'Synthetic patient data', 'sg');
assert('C-30', SYNTHETIC_PATIENT_DATA_NOTE.includes('No real patient information'), 'No real patient data', 'sg');

// No PBRTQC
assert('C-31', NO_PBRTQC_NOTE.includes('does not implement patient-based real-time quality control'), 'No PBRTQC', 'sg');

// Four principles (source-grounded: exact IDs and content)
assert('C-32', FOUR_PRINCIPLES.length === 4, 'Four principles: exactly 4', 'sg');
assert('C-33', FOUR_PRINCIPLES.find(p => p.id === 'repeat-not-erase') !== undefined, 'Principle: repeat-not-erase present', 'sg');
assert('C-34', FOUR_PRINCIPLES.find(p => p.id === 'difference-not-harm') !== undefined, 'Principle: difference-not-harm present', 'sg');
assert('C-35', FOUR_PRINCIPLES.find(p => p.id === 'correlation-not-cause') !== undefined, 'Principle: correlation-not-cause present', 'sg');

// Six core questions
assert('C-36', SIX_CORE_QUESTIONS.length === 7, 'SIX_CORE_QUESTIONS has 7 entries', 'sg');  // array of 7 strings for 6 objectives
assert('C-37', COLLAPSE_CAUTION.includes('QC failed'), 'Collapse caution encoded', 'sg');

// QC signal not universal hold
assert('C-38', QC_SIGNAL_NOT_UNIVERSAL_HOLD_NOTE.includes('does not automatically place every patient result on hold'), 'QC signal not universal hold', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: HYPOTHESIS VOCABULARY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Hypothesis vocabulary (source-grounded) ===');

assert('D-01', Array.isArray(HYPOTHESIS_CATEGORIES) && HYPOTHESIS_CATEGORIES.length === 12, 'HYPOTHESIS_CATEGORIES: 12 entries', 'sg');
const hIds = HYPOTHESIS_CATEGORIES.map(h => h.id);
assert('D-02', hIds.includes('qc-material'), 'Hypothesis: qc-material', 'sg');
assert('D-03', hIds.includes('reagent'), 'Hypothesis: reagent', 'sg');
assert('D-04', hIds.includes('instrument'), 'Hypothesis: instrument', 'sg');
assert('D-05', hIds.includes('false-rejection'), 'Hypothesis: false-rejection', 'sg');
assert('D-06', hIds.includes('insufficient-evidence'), 'Hypothesis: insufficient-evidence', 'sg');
assert('D-07', !hIds.includes('confirmed'), 'No "confirmed" hypothesis', 'sg');

// hypothesisLabel function
assert('D-08', hypothesisLabel('qc-material') === 'QC material / preparation', 'hypothesisLabel("qc-material") exact', 'sg');
assert('D-09', hypothesisLabel('false-rejection') === 'Statistical false rejection remains plausible', 'hypothesisLabel("false-rejection") exact', 'sg');
assert('D-10', hypothesisLabel('unknown-id') === 'unknown-id', 'hypothesisLabel falls back to id for unknown', 'sg');

// Cause status labels
assert('D-11', CAUSE_STATUS_HYPOTHESIS_LABEL['no-hypothesis'] === 'No candidate explanation yet', 'Cause label: no-hypothesis exact', 'sg');
assert('D-12', CAUSE_STATUS_HYPOTHESIS_LABEL['unresolved'] === 'Unresolved — no explanation adequately supported', 'Cause label: unresolved exact', 'sg');
assert('D-13', !('confirmed' in CAUSE_STATUS_HYPOTHESIS_LABEL), 'No "confirmed" cause label', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: SCENARIO BANK STRUCTURE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Scenario bank structure (source-grounded) ===');

assert('E-01', Array.isArray(INVESTIGATION_SCENARIOS) && INVESTIGATION_SCENARIOS.length === 13, 'Exactly 13 scenarios', 'sg');

// IDs unique and sequential
const scIds = INVESTIGATION_SCENARIOS.map(s => s.id);
assert('E-02', new Set(scIds).size === 13, 'All scenario IDs unique', 'rc');
assert('E-03', scIds.every((id, i) => id === i + 1), 'Scenario IDs are 1-13 sequential', 'sg');

// Exact titles (source-grounded)
const titles = {
  1: 'Case 1 — Control preparation problem',
  2: 'Case 2 — QC material deterioration',
  3: 'Case 3 — Reagent lot-associated shift',
  4: 'Case 4 — Calibration-associated shift',
  5: 'Case 5 — Random aspiration instability',
  6: 'Case 6 — Passing repeat trap',
  7: 'Case 7 — False rejection remains plausible',
  8: 'Case 8 — Multi-analyte shared-system disturbance',
  9: 'Case 9 — Assay-specific disturbance',
  10: 'Case 10 — Patient impact window narrowing',
  11: 'Case 11 — Unresolved root cause',
  12: 'Case 12 — Indiscriminate patient retesting trap',
  13: 'Case 13 — Confirmation-bias trap: shift precedes the lot change'
};
Object.entries(titles).forEach(([id, title]) => {
  const sc = INVESTIGATION_SCENARIOS.find(s => s.id === +id);
  assert(`E-04-${id}`, sc && sc.title === title, `Case ${id} title exact`, 'sg');
});

// Schema: required fields on every scenario (reconstructed structural check)
INVESTIGATION_SCENARIOS.forEach(sc => {
  assert(`E-05-${sc.id}`, 'id' in sc && 'title' in sc && 'qcData' in sc && 'candidateHypothesisIds' in sc &&
    'evidenceItems' in sc && 'progressionByStage' in sc && 'finalInterpretation' in sc &&
    'correctResumeDecision' in sc && 'correctResultDispositionDecision' in sc,
    `Case ${sc.id}: required schema fields present`, 'rc');
});

// No "confirmed" cause anywhere in scenarios
INVESTIGATION_SCENARIOS.forEach(sc => {
  const fi = sc.finalInterpretation;
  assert(`E-06-${sc.id}`, fi.causeStatus !== 'confirmed', `Case ${sc.id}: no "confirmed" causeStatus`, 'rc');
  if (sc.progressionByStage) {
    sc.progressionByStage.forEach(ps => {
      if (ps.causeStatus) {
        // Just check the final interpretation — progression is harder to check in a loop
      }
    });
  }
});

/* -----------------------------------------------------------------------
   SECTION F: CRITICAL CASE REGRESSIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Critical case regressions (source-grounded) ===');

const sc3 = INVESTIGATION_SCENARIOS.find(s => s.id === 3);
const sc5 = INVESTIGATION_SCENARIOS.find(s => s.id === 5);
const sc6 = INVESTIGATION_SCENARIOS.find(s => s.id === 6);
const sc7 = INVESTIGATION_SCENARIOS.find(s => s.id === 7);
const sc10 = INVESTIGATION_SCENARIOS.find(s => s.id === 10);
const sc11 = INVESTIGATION_SCENARIOS.find(s => s.id === 11);
const sc12 = INVESTIGATION_SCENARIOS.find(s => s.id === 12);
const sc13 = INVESTIGATION_SCENARIOS.find(s => s.id === 13);

// CASE 3 — Reagent lot-associated shift
assert('F-C3-01', sc3.supportedHypothesisId === 'reagent', 'Case 3: supportedHypothesisId = reagent', 'sg');
assert('F-C3-02', sc3.finalInterpretation.processStatus === 'recovered', 'Case 3: final processStatus = recovered', 'sg');
assert('F-C3-03', sc3.finalInterpretation.patientImpactStatus === 'potentially-exposed-results', 'Case 3: final patientImpactStatus = potentially-exposed-results', 'sg');
assert('F-C3-04', sc3.finalInterpretation.resultDispositionStatus === 'review-required', 'Case 3: final resultDispositionStatus = review-required', 'sg');
assert('F-C3-05', sc3.correctResumeDecision === 'additional-evidence', 'Case 3: correctResumeDecision = additional-evidence', 'sg');
assert('F-C3-06', sc3.correctResultDispositionDecision === 'additional-review-required', 'Case 3: correctResultDispositionDecision = additional-review-required', 'sg');
// Synthetic patient records
assert('F-C3-07', Array.isArray(sc3.patientImpactData) && sc3.patientImpactData.length === 4, 'Case 3: exactly 4 patient records', 'sg');
assert('F-C3-08', sc3.patientImpactData[0].syntheticPatientId === 'P101' && sc3.patientImpactData[0].analysisTimestamp === '10:10', 'Case 3: P101 at 10:10', 'sg');
assert('F-C3-09', sc3.patientImpactData[3].syntheticPatientId === 'P104' && sc3.patientImpactData[3].originalResult === 0, 'Case 3: P104 originalResult=0', 'sg');

// CASE 5 — Process recovered, historical review still open (CRITICAL INDEPENDENCE)
assert('F-C5-01', sc5.finalInterpretation.processStatus === 'recovered', 'Case 5: final processStatus = recovered', 'sg');
assert('F-C5-02', sc5.finalInterpretation.resultDispositionStatus === 'review-required', 'Case 5: final resultDispositionStatus = review-required (INDEPENDENCE: recovered ≠ resolved)', 'sg');
assert('F-C5-03', sc5.correctResumeDecision === 'yes', 'Case 5: correctResumeDecision = yes', 'sg');
assert('F-C5-04', sc5.correctResultDispositionDecision === 'additional-review-required', 'Case 5: correctResultDispositionDecision = additional-review-required', 'sg');
// Explicit independence invariant
assert('F-C5-05',
  sc5.finalInterpretation.processStatus === 'recovered' &&
  sc5.finalInterpretation.resultDispositionStatus !== 'resolved',
  'CRITICAL: Case 5 — process recovered does NOT mean result disposition resolved', 'sg');

// CASE 6 — Passing repeat trap
assert('F-C6-01', sc6.repeatQc.result === 'normal', 'Case 6: repeat QC is normal/passing', 'sg');
assert('F-C6-02', sc6.supportedHypothesisId === 'instrument', 'Case 6: supportedHypothesisId = instrument (later evidence)', 'sg');
assert('F-C6-03', sc6.finalInterpretation.resultDispositionStatus === 'review-required', 'Case 6: final resultDispositionStatus = review-required', 'sg');
assert('F-C6-04', sc6.correctResumeDecision === 'additional-evidence', 'Case 6: correctResumeDecision = additional-evidence (not auto-closed by repeat)', 'sg');

// CASE 7 — False rejection remains plausible
assert('F-C7-01', sc7.supportedHypothesisId === null, 'Case 7: supportedHypothesisId = null', 'sg');
assert('F-C7-02', sc7.finalInterpretation.causeStatus === 'unresolved', 'Case 7: final causeStatus = unresolved', 'sg');
assert('F-C7-03', sc7.finalInterpretation.processStatus === 'apparently-stable', 'Case 7: final processStatus = apparently-stable', 'sg');
assert('F-C7-04', sc7.finalInterpretation.patientImpactStatus === 'no-impact-demonstrated', 'Case 7: final patientImpactStatus = no-impact-demonstrated', 'sg');
assert('F-C7-05', sc7.finalInterpretation.resultDispositionStatus === 'resolved', 'Case 7: final resultDispositionStatus = resolved', 'sg');
assert('F-C7-06', sc7.correctResumeDecision === 'yes', 'Case 7: correctResumeDecision = yes', 'sg');

// CASE 10 — Patient impact window narrowing
assert('F-C10-01', sc10.candidateImpactWindow.start === '10:30', 'Case 10: window start = 10:30', 'sg');
assert('F-C10-02', sc10.candidateImpactWindow.end === '12:00', 'Case 10: window end = 12:00', 'sg');
assert('F-C10-03', sc10.supportedHypothesisId === 'reagent', 'Case 10: supportedHypothesisId = reagent', 'sg');
assert('F-C10-04', sc10.finalInterpretation.patientImpactStatus === 'analytical-impact-evidence-present', 'Case 10: patientImpactStatus = analytical-impact-evidence-present', 'sg');
assert('F-C10-05', sc10.finalInterpretation.resultDispositionStatus === 'amendment-or-reissue-being-considered', 'Case 10: resultDispositionStatus = amendment-or-reissue-being-considered', 'sg');
assert('F-C10-06', sc10.correctResumeDecision === 'additional-evidence', 'Case 10: correctResumeDecision = additional-evidence', 'sg');
assert('F-C10-07', sc10.correctResultDispositionDecision === 'additional-review-required', 'Case 10: correctResultDispositionDecision = additional-review-required', 'sg');
// Four synthetic patient records
assert('F-C10-08', Array.isArray(sc10.patientImpactData) && sc10.patientImpactData.length === 4, 'Case 10: 4 patient records', 'sg');
assert('F-C10-09', sc10.patientImpactData[0].syntheticPatientId === 'P201' && sc10.patientImpactData[0].analysisTimestamp === '09:00', 'Case 10: P201 at 09:00', 'sg');
assert('F-C10-10', sc10.patientImpactData[2].syntheticPatientId === 'P203' && sc10.patientImpactData[2].analysisTimestamp === '10:45', 'Case 10: P203 at 10:45', 'sg');
assert('F-C10-11', sc10.patientImpactData[3].syntheticPatientId === 'P204', 'Case 10: P204 present', 'sg');

// CASE 11 — Unresolved root cause
assert('F-C11-01', sc11.supportedHypothesisId === null, 'Case 11: supportedHypothesisId = null', 'sg');
assert('F-C11-02', sc11.finalInterpretation.causeStatus === 'unresolved', 'Case 11: causeStatus = unresolved', 'sg');
assert('F-C11-03', sc11.finalInterpretation.processStatus === 'indeterminate', 'Case 11: processStatus = indeterminate', 'sg');
assert('F-C11-04', sc11.finalInterpretation.patientImpactStatus === 'impact-unresolved', 'Case 11: patientImpactStatus = impact-unresolved', 'sg');
assert('F-C11-05', sc11.finalInterpretation.resultDispositionStatus === 'indeterminate', 'Case 11: resultDispositionStatus = indeterminate', 'sg');
assert('F-C11-06', Array.isArray(sc11.recoveryEvidence) && sc11.recoveryEvidence.length === 0, 'Case 11: recoveryEvidence is empty (unresolved)', 'sg');
assert('F-C11-07', sc11.correctResumeDecision === 'additional-evidence', 'Case 11: correctResumeDecision = additional-evidence', 'sg');

// CASE 12 — Indiscriminate patient retesting trap
assert('F-C12-01', sc12.supportedHypothesisId === 'qc-material', 'Case 12: supportedHypothesisId = qc-material', 'sg');
assert('F-C12-02', sc12.finalInterpretation.processStatus === 'recovered', 'Case 12: processStatus = recovered', 'sg');
assert('F-C12-03', sc12.finalInterpretation.patientImpactStatus === 'no-impact-demonstrated', 'Case 12: patientImpactStatus = no-impact-demonstrated', 'sg');
assert('F-C12-04', sc12.finalInterpretation.resultDispositionStatus === 'resolved', 'Case 12: resultDispositionStatus = resolved', 'sg');
assert('F-C12-05', sc12.correctResumeDecision === 'yes', 'Case 12: correctResumeDecision = yes', 'sg');
assert('F-C12-06', sc12.correctResultDispositionDecision === 'yes', 'Case 12: correctResultDispositionDecision = yes', 'sg');

// CASE 13 — Confirmation-bias trap
assert('F-C13-01', sc13.title === 'Case 13 — Confirmation-bias trap: shift precedes the lot change', 'Case 13: exact title', 'sg');
assert('F-C13-02', sc13.supportedHypothesisId === null, 'Case 13: supportedHypothesisId = null', 'sg');
assert('F-C13-03', sc13.finalInterpretation.causeStatus === 'unresolved', 'Case 13: causeStatus = unresolved', 'sg');
assert('F-C13-04', sc13.finalInterpretation.processStatus === 'evidence-of-instability', 'Case 13: processStatus = evidence-of-instability', 'sg');
assert('F-C13-05', sc13.finalInterpretation.patientImpactStatus === 'candidate-review-window-defined', 'Case 13: patientImpactStatus = candidate-review-window-defined', 'sg');
assert('F-C13-06', sc13.finalInterpretation.resultDispositionStatus === 'review-required', 'Case 13: resultDispositionStatus = review-required', 'sg');
assert('F-C13-07', sc13.correctResumeDecision === 'no', 'Case 13: correctResumeDecision = no', 'sg');
assert('F-C13-08', sc13.correctResultDispositionDecision === 'no', 'Case 13: correctResultDispositionDecision = no', 'sg');
// Temporal logic: shift precedes lot change
assert('F-C13-09',
  sc13.qcHistory && sc13.qcHistory.some(h => h.includes('drift') && h.includes('-2')),
  'Case 13: QC history encodes early drift before lot change', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: CROSS-MODULE STATUS VOCABULARY (reconstructed integration)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Cross-module status vocabulary (reconstructed) ===');

INVESTIGATION_SCENARIOS.forEach(sc => {
  const fi = sc.finalInterpretation;
  assert(`G-01-cs-${sc.id}`, CAUSE_STATUSES.includes(fi.causeStatus),
    `Case ${sc.id}: finalInterpretation.causeStatus in CAUSE_STATUSES`, 'rc');
  assert(`G-02-ps-${sc.id}`, PROCESS_STATUSES.includes(fi.processStatus),
    `Case ${sc.id}: finalInterpretation.processStatus in PROCESS_STATUSES`, 'rc');
  assert(`G-03-pis-${sc.id}`, PATIENT_IMPACT_STATUSES.includes(fi.patientImpactStatus),
    `Case ${sc.id}: finalInterpretation.patientImpactStatus in PATIENT_IMPACT_STATUSES`, 'rc');
  assert(`G-04-rds-${sc.id}`, RESULT_DISPOSITION_STATUSES.includes(fi.resultDispositionStatus),
    `Case ${sc.id}: finalInterpretation.resultDispositionStatus in RESULT_DISPOSITION_STATUSES`, 'rc');
  // No forbidden values
  assert(`G-05-${sc.id}`, fi.causeStatus !== 'confirmed', `Case ${sc.id}: no "confirmed" causeStatus`, 'rc');
  assert(`G-06-${sc.id}`, fi.patientImpactStatus !== 'harmed' && fi.patientImpactStatus !== 'invalid',
    `Case ${sc.id}: no harmed/invalid patientImpactStatus`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION H: EVIDENCE REVEAL-STAGE COMPATIBILITY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Evidence reveal-stage compatibility (reconstructed) ===');

INVESTIGATION_SCENARIOS.forEach(sc => {
  (sc.evidenceItems || []).forEach(ev => {
    assert(`H-01-${sc.id}-${ev.id}`,
      REASONING_STAGES.includes(ev.revealStage),
      `Case ${sc.id} evidence ${ev.id}: revealStage in REASONING_STAGES`, 'rc');
  });
});

/* -----------------------------------------------------------------------
   SECTION I: CANDIDATE HYPOTHESES VOCAB CHECK (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Hypothesis vocabulary check (reconstructed) ===');

const knownHypIds = new Set(HYPOTHESIS_CATEGORIES.map(h => h.id));
INVESTIGATION_SCENARIOS.forEach(sc => {
  (sc.candidateHypothesisIds || []).forEach(hid => {
    assert(`I-01-${sc.id}-${hid}`,
      knownHypIds.has(hid),
      `Case ${sc.id}: candidateHypothesisId "${hid}" in HYPOTHESIS_CATEGORIES`, 'rc');
  });
  // supportedHypothesisId must be null or a known candidate
  const sup = sc.supportedHypothesisId;
  assert(`I-02-${sc.id}`,
    sup === null || knownHypIds.has(sup),
    `Case ${sc.id}: supportedHypothesisId (${sup}) is null or known`, 'rc');
  assert(`I-03-${sc.id}`,
    sup !== 'confirmed',
    `Case ${sc.id}: supportedHypothesisId is not "confirmed"`, 'rc');
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 5B Investigation Data Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sgCount}`);
console.log(`  Reconstructed expectations:   ${rcCount}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 5B FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 5B PASSED — all tests green.');
  process.exit(0);
}
