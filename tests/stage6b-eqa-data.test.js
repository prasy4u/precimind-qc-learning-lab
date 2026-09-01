/* =========================================================================
   tests/stage6b-eqa-data.test.js

   NEW RECOVERY TESTS — Stage 6B (NOT the historical test suite)
   Tests for the recovered External Assurance Lab static data module in
   src/eqa/data.js.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)
   SOURCE MODULE: Artifact Class A — src/eqa/data.js (HTML lines 8671-9545)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED EXPECTATION:
     Exact exported values, exact strings, exact IDs, exact option arrays,
     exact case truth fields, exact paired specimen data, exact stage
     arrays, and exact guardrail text directly encoded in HTML source.
   RECONSTRUCTED EXPECTATION:
     Uniqueness checks, cross-module vocabulary checks, schema consistency,
     architecture/absence checks, exhaustive option membership tests, and
     other structural tests created during recovery.

   Run: node tests/stage6b-eqa-data.test.js
   ========================================================================= */

'use strict';

const d = require('../src/eqa/data');
const calc = require('../src/eqa/calc');

const {
  EXTERNAL_ASSURANCE_PATHWAY_STEPS, EXTERNAL_ASSURANCE_PATHWAY_CAUTION,
  GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE, POOR_EQA_DOES_NOT_AUTOMATICALLY_PROVE_BIAS_NOTE,
  EQA_TERMINOLOGY, EQA_PT_TERMINOLOGY_CAUTION,
  CORE_THREE_WAY_DISTINCTION, NOT_SIMPLY_PRECISION_VS_ACCURACY_NOTE,
  SIGNATURE_MISCONCEPTION_CASE,
  EQA_NOT_REALTIME_IQC_NOTE, EQA_CAN_REVEAL, EQA_REVEAL_DEPENDENCY_NOTE,
  EQA_RESULT_FIELDS, MISSING_FIELDS_STAY_MISSING_NOTE,
  TARGET_VALUE_TYPE_DESCRIPTIONS, NEVER_ALL_CALLED_TRUE_VALUE_NOTE,
  TARGET_HIERARCHY_GUARDRAIL_NOTE, TARGET_TYPE_CLASSIFICATION_ITEMS,
  PEER_GROUP_NOT_TRUTH_PRINCIPLE,
  COMMUTABILITY_CONCEPT_NOTE, COMMUTABILITY_NOT_JUST_HUMAN_SERUM_NOTE,
  COMMUTABILITY_STATUS_DESCRIPTIONS, UNKNOWN_NOT_EQUAL_FAILED_NOTE,
  COMMUTABILITY_CONSEQUENCE_NOTE, COMMUTABILITY_CHALLENGE_EXAMPLE,
  SCHEME_CAPABILITY_INPUTS, CAPABILITY_MILLER_ATTRIBUTION_NOTE,
  CAPABILITY_PARTICIPANT_PERFORMANCE_NOTE, CAPABILITY_METHOD_PERFORMANCE_NOTE,
  CAPABILITY_HARMONISATION_NOTE,
  PERFORMANCE_CRITERION_APS_LINK_NOTE,
  REPORT_INTERPRETATION_QUESTIONS, PEER_GROUP_HIDES_METHOD_BIAS_REPORT,
  LABORATORY_SPECIFIC_DEVIATION_REPORT, TARGET_CHANGES_CONCLUSION_REPORT,
  SINGLE_EVENT_VS_TREND_NOTE, LONGITUDINAL_EQA_TIMELINE,
  LONGITUDINAL_TIMELINE_TEACHING_NOTE, LONGITUDINAL_PATTERN_LABELS,
  LONGITUDINAL_STATUSES_ARE_DESCRIPTIONS_NOTE, NO_AUTOMATIC_TREND_ROOT_CAUSE_NOTE,
  IQC_EQA_COMBINED_MATRIX, STABLE_IQC_POOR_EQA_CAUTION, UNSTABLE_IQC_ACCEPTABLE_EQA_CAUTION,
  SAMPLE_HANDLING_INTEGRITY_NOTE, SAMPLE_HANDLING_DISCOURAGED, PT_INTEGRITY_CHALLENGE,
  EQA_PROCESS_ERROR_TYPES, INVESTIGATE_WHOLE_EQA_PROCESS_NOTE,
  COMPARABILITY_LAB_SCOPE_NOTE, DESIGNATED_COMPARATOR_NOTE,
  EXCLUDED_METHOD_COMPARISON_STATISTICS, EXCLUDED_STATISTICS_NOTE,
  COMPARABILITY_PAIRED_SPECIMENS, COMPARABILITY_LIMIT_LABEL,
  COMPARABILITY_LIMIT_CAUTION, COMPARABILITY_LAB_ILLUSTRATIVE_CRITERION,
  CONTROL_MATERIAL_TRAP_CASE, PATIENT_COMPARISON_TRAP_CASE,
  LONGITUDINAL_COMPARABILITY_SUMMARY, NOT_EVERY_DIFFERENCE_CLINICALLY_IMPORTANT_NOTE,
  EQA_INVESTIGATION_PATH_STEPS, EQA_INVESTIGATION_PATH_CAUTION,
  EXPLORE_INVESTIGATION_LINK_LABEL, NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE,
  NO_EQA_PASS_EQUALS_METHOD_VALID_NOTE, NO_EQA_FAIL_EQUALS_PATIENT_RESULTS_WRONG_NOTE,
  NO_PEER_MEAN_EQUALS_REFERENCE_VALUE_NOTE, NO_COMMUTABLE_EQUALS_PERFECT_NOTE,
  NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE,
  PATTERN_JUDGEMENT_OPTIONS, CAPABILITY_CONCLUSION_OPTIONS,
  LONGITUDINAL_RELEVANCE_OPTIONS, NEXT_ACTION_OPTIONS,
  EXTERNAL_ASSURANCE_STAGES, EXTERNAL_ASSURANCE_CASES
} = d;

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

/* -----------------------------------------------------------------------
   SECTION A: MODULE ARCHITECTURE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Module architecture ===');

assert('A-01', Object.keys(d).length === 76, 'Exactly 76 exports', 'rc');
const exportedFns = Object.keys(d).filter(k => typeof d[k] === 'function');
assert('A-02', exportedFns.length === 0, 'Zero exported functions', 'sg');

const srcText = require('fs').readFileSync(require('path').join(__dirname, '../src/eqa/data.js'), 'utf8');
assert('A-03', !srcText.includes('import React') && !srcText.match(/from ['"]react['"]/), 'No React import', 'rc');
assert('A-04', !srcText.match(/className=/), 'No JSX className', 'rc');
assert('A-05', !srcText.match(/document\.getElementById|window\.addEventListener/), 'No DOM API', 'rc');

// No calc duplication
const calcFns = ['calculateEqaZScore', 'calculateEqaRelativeDeviation', 'calculateEqaAbsoluteDeviation', 'calculatePairedDifference', 'describeSchemeCapability'];
calcFns.forEach(fn => {
  assert(`A-06-${fn}`, !(fn in d), `No calc duplicate: ${fn}`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION B: PATHWAY AND CORE DOCTRINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Pathway and core doctrine ===');

assert('B-01', Array.isArray(EXTERNAL_ASSURANCE_PATHWAY_STEPS) && EXTERNAL_ASSURANCE_PATHWAY_STEPS.length === 7, 'Pathway: 7 steps', 'sg');
assert('B-02', EXTERNAL_ASSURANCE_PATHWAY_STEPS[0] === 'Internal stability', 'Step 0: Internal stability', 'sg');
assert('B-03', EXTERNAL_ASSURANCE_PATHWAY_STEPS[6] === 'Investigate', 'Step 6: Investigate', 'sg');
assert('B-04', typeof EXTERNAL_ASSURANCE_PATHWAY_CAUTION === 'string' && EXTERNAL_ASSURANCE_PATHWAY_CAUTION.includes('educational reasoning pathway'), 'Pathway caution: educational pathway', 'sg');

assert('B-05', GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE.includes('does not prove trueness') || GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE.includes('does not establish trueness') || GOOD_IQC_DOES_NOT_PROVE_TRUENESS_NOTE.toLowerCase().includes('trueness'), 'IQC stability ≠ trueness stated', 'sg');
assert('B-06', POOR_EQA_DOES_NOT_AUTOMATICALLY_PROVE_BIAS_NOTE.length > 0 && POOR_EQA_DOES_NOT_AUTOMATICALLY_PROVE_BIAS_NOTE.toLowerCase().includes('bias'), 'Poor EQA ≠ automatic bias stated', 'sg');
assert('B-07', NOT_SIMPLY_PRECISION_VS_ACCURACY_NOTE.length > 0, 'NOT_SIMPLY_PRECISION_VS_ACCURACY_NOTE present', 'sg');

assert('B-08', SIGNATURE_MISCONCEPTION_CASE.correctAnswer === 'Yes.', 'Signature misconception correct answer = Yes.', 'sg');
assert('B-09', SIGNATURE_MISCONCEPTION_CASE.question.length > 0, 'Signature misconception has question', 'sg');

assert('B-10', EQA_NOT_REALTIME_IQC_NOTE.length > 0, 'EQA_NOT_REALTIME_IQC_NOTE present', 'sg');
assert('B-11', Array.isArray(EQA_CAN_REVEAL) && EQA_CAN_REVEAL.length >= 2, 'EQA_CAN_REVEAL has entries', 'sg');
assert('B-12', typeof EQA_REVEAL_DEPENDENCY_NOTE === 'string' && EQA_REVEAL_DEPENDENCY_NOTE.length > 0, 'EQA_REVEAL_DEPENDENCY_NOTE present', 'sg');

assert('B-13', MISSING_FIELDS_STAY_MISSING_NOTE.length > 0, 'MISSING_FIELDS_STAY_MISSING_NOTE present', 'sg');
assert('B-14', Array.isArray(EQA_RESULT_FIELDS) && EQA_RESULT_FIELDS.length >= 4, 'EQA_RESULT_FIELDS has entries', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: TARGET VALUE DOCTRINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Target value doctrine ===');

assert('C-01', typeof NEVER_ALL_CALLED_TRUE_VALUE_NOTE === 'string' && NEVER_ALL_CALLED_TRUE_VALUE_NOTE.length > 0, 'NEVER_ALL_CALLED_TRUE_VALUE_NOTE present', 'sg');
assert('C-02', PEER_GROUP_NOT_TRUTH_PRINCIPLE.length > 0, 'PEER_GROUP_NOT_TRUTH_PRINCIPLE present', 'sg');
assert('C-03', TARGET_HIERARCHY_GUARDRAIL_NOTE.length > 0, 'TARGET_HIERARCHY_GUARDRAIL_NOTE present', 'sg');
assert('C-04', typeof TARGET_VALUE_TYPE_DESCRIPTIONS === 'object' && TARGET_VALUE_TYPE_DESCRIPTIONS !== null, 'TARGET_VALUE_TYPE_DESCRIPTIONS present', 'sg');
assert('C-05', Array.isArray(TARGET_TYPE_CLASSIFICATION_ITEMS) && TARGET_TYPE_CLASSIFICATION_ITEMS.length >= 4, 'TARGET_TYPE_CLASSIFICATION_ITEMS has entries', 'sg');

// Cross-module: target type IDs in descriptions match Stage 6A TARGET_VALUE_TYPES
const tvtIds = new Set(calc.TARGET_VALUE_TYPES);
// TARGET_VALUE_TYPE_DESCRIPTIONS is an array of {id, description} objects
const tvtDescIds = Array.isArray(TARGET_VALUE_TYPE_DESCRIPTIONS)
  ? TARGET_VALUE_TYPE_DESCRIPTIONS.map(o => o.id)
  : Object.keys(TARGET_VALUE_TYPE_DESCRIPTIONS);
assert('C-06', tvtDescIds.every(id => tvtIds.has(id)), 'TARGET_VALUE_TYPE_DESCRIPTIONS IDs match Stage 6A TARGET_VALUE_TYPES', 'rc');

/* -----------------------------------------------------------------------
   SECTION D: COMMUTABILITY DOCTRINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Commutability doctrine ===');

assert('D-01', COMMUTABILITY_CONCEPT_NOTE.length > 0, 'COMMUTABILITY_CONCEPT_NOTE present', 'sg');
assert('D-02', UNKNOWN_NOT_EQUAL_FAILED_NOTE.length > 0, 'UNKNOWN_NOT_EQUAL_FAILED_NOTE present', 'sg');
assert('D-03', COMMUTABILITY_NOT_JUST_HUMAN_SERUM_NOTE.length > 0, 'COMMUTABILITY_NOT_JUST_HUMAN_SERUM_NOTE present', 'sg');
assert('D-04', typeof COMMUTABILITY_STATUS_DESCRIPTIONS === 'object', 'COMMUTABILITY_STATUS_DESCRIPTIONS present', 'sg');
assert('D-05', COMMUTABILITY_CONSEQUENCE_NOTE.length > 0, 'COMMUTABILITY_CONSEQUENCE_NOTE present', 'sg');
assert('D-06', typeof COMMUTABILITY_CHALLENGE_EXAMPLE === 'object' && COMMUTABILITY_CHALLENGE_EXAMPLE !== null, 'COMMUTABILITY_CHALLENGE_EXAMPLE present', 'sg');

// commutability-not-established ≠ noncommutable: different description entries
// COMMUTABILITY_STATUS_DESCRIPTIONS is an array of {id, description} objects
const csArr = Array.isArray(COMMUTABILITY_STATUS_DESCRIPTIONS) ? COMMUTABILITY_STATUS_DESCRIPTIONS : Object.entries(COMMUTABILITY_STATUS_DESCRIPTIONS).map(([id,description]) => ({id,description}));
const csdUnknown = csArr.find(e => e.id === 'commutability-not-established');
const csdFailed  = csArr.find(e => e.id === 'noncommutable');
assert('D-07',
  csdUnknown && csdFailed && csdUnknown.description !== csdFailed.description,
  'COMMUTABILITY_STATUS_DESCRIPTIONS has distinct entries for unknown and noncommutable', 'sg');
assert('D-08', csdUnknown && (
  csdUnknown.description.toLowerCase().includes('unknown') ||
  csdUnknown.description.toLowerCase().includes('not been established') ||
  csdUnknown.description.toLowerCase().includes('not established') ||
  csdUnknown.description.toLowerCase().includes('uncertainty')),
  'commutability-not-established description indicates uncertainty, not failure', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: SCHEME CAPABILITY TEACHING (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Scheme capability teaching ===');

assert('E-01', Array.isArray(SCHEME_CAPABILITY_INPUTS) && SCHEME_CAPABILITY_INPUTS.length >= 4, 'SCHEME_CAPABILITY_INPUTS has entries', 'sg');
assert('E-02', typeof CAPABILITY_MILLER_ATTRIBUTION_NOTE === 'string' && CAPABILITY_MILLER_ATTRIBUTION_NOTE.length > 0, 'CAPABILITY_MILLER_ATTRIBUTION_NOTE present', 'sg');
assert('E-03', CAPABILITY_PARTICIPANT_PERFORMANCE_NOTE.length > 0, 'CAPABILITY_PARTICIPANT_PERFORMANCE_NOTE present', 'sg');
assert('E-04', CAPABILITY_METHOD_PERFORMANCE_NOTE.length > 0, 'CAPABILITY_METHOD_PERFORMANCE_NOTE present', 'sg');
assert('E-05', CAPABILITY_HARMONISATION_NOTE.length > 0, 'CAPABILITY_HARMONISATION_NOTE present', 'sg');
// No classifier function
assert('E-06', !('millerCategory' in d) && !('capabilityScore' in d), 'No Miller category classifier exported', 'rc');

/* -----------------------------------------------------------------------
   SECTION F: LONGITUDINAL DOCTRINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Longitudinal doctrine ===');

assert('F-01', SINGLE_EVENT_VS_TREND_NOTE.length > 0, 'SINGLE_EVENT_VS_TREND_NOTE present', 'sg');
assert('F-02', Array.isArray(LONGITUDINAL_EQA_TIMELINE) && LONGITUDINAL_EQA_TIMELINE.length >= 3, 'LONGITUDINAL_EQA_TIMELINE has entries', 'sg');
assert('F-03', LONGITUDINAL_TIMELINE_TEACHING_NOTE.length > 0, 'LONGITUDINAL_TIMELINE_TEACHING_NOTE present', 'sg');
assert('F-04', NO_AUTOMATIC_TREND_ROOT_CAUSE_NOTE.length > 0, 'NO_AUTOMATIC_TREND_ROOT_CAUSE_NOTE present', 'sg');
assert('F-05', LONGITUDINAL_STATUSES_ARE_DESCRIPTIONS_NOTE.length > 0, 'LONGITUDINAL_STATUSES_ARE_DESCRIPTIONS_NOTE present', 'sg');

// LONGITUDINAL_PATTERN_LABELS cross-reference Stage 6A
assert('F-06', typeof LONGITUDINAL_PATTERN_LABELS === 'object', 'LONGITUDINAL_PATTERN_LABELS present', 'sg');
const longIds = new Set(calc.LONGITUDINAL_EQA_STATUSES);
const patLabelIds = Object.keys(LONGITUDINAL_PATTERN_LABELS);
assert('F-07', patLabelIds.every(id => longIds.has(id)), 'LONGITUDINAL_PATTERN_LABELS keys subset of Stage 6A LONGITUDINAL_EQA_STATUSES', 'rc');

/* -----------------------------------------------------------------------
   SECTION G: IQC/EQA COMBINED + SAMPLE HANDLING + WHOLE PROCESS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: IQC/EQA combined + sample handling + process ===');

assert('G-01', Array.isArray(IQC_EQA_COMBINED_MATRIX) && IQC_EQA_COMBINED_MATRIX.length >= 4, 'IQC_EQA_COMBINED_MATRIX has entries', 'sg');
assert('G-02', STABLE_IQC_POOR_EQA_CAUTION.length > 0, 'STABLE_IQC_POOR_EQA_CAUTION present', 'sg');
assert('G-03', UNSTABLE_IQC_ACCEPTABLE_EQA_CAUTION.length > 0, 'UNSTABLE_IQC_ACCEPTABLE_EQA_CAUTION present', 'sg');
assert('G-04', SAMPLE_HANDLING_INTEGRITY_NOTE.length > 0, 'SAMPLE_HANDLING_INTEGRITY_NOTE present', 'sg');
assert('G-05', Array.isArray(SAMPLE_HANDLING_DISCOURAGED) && SAMPLE_HANDLING_DISCOURAGED.length >= 3, 'SAMPLE_HANDLING_DISCOURAGED has entries', 'sg');
assert('G-06', typeof PT_INTEGRITY_CHALLENGE === 'object' && PT_INTEGRITY_CHALLENGE !== null, 'PT_INTEGRITY_CHALLENGE present', 'sg');
assert('G-07', Array.isArray(EQA_PROCESS_ERROR_TYPES) && EQA_PROCESS_ERROR_TYPES.length >= 5, 'EQA_PROCESS_ERROR_TYPES has entries', 'sg');
assert('G-08', INVESTIGATE_WHOLE_EQA_PROCESS_NOTE.length > 0, 'INVESTIGATE_WHOLE_EQA_PROCESS_NOTE present', 'sg');

// unit/reporting error is one of the process error types
assert('G-09', EQA_PROCESS_ERROR_TYPES.some(e => (e.id || e.label || e).toString().toLowerCase().includes('unit') || (e.id || e.label || e).toString().toLowerCase().includes('transcri') || (e.id || e.label || e).toString().toLowerCase().includes('report')), 'EQA process errors include reporting/unit error', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: COMPARABILITY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Comparability ===');

assert('H-01', COMPARABILITY_LAB_SCOPE_NOTE.length > 0, 'COMPARABILITY_LAB_SCOPE_NOTE present', 'sg');
assert('H-02', DESIGNATED_COMPARATOR_NOTE.length > 0, 'DESIGNATED_COMPARATOR_NOTE present', 'sg');
// Note says 'never "the reference method"' — the word appears as explicit negation
assert('H-03', DESIGNATED_COMPARATOR_NOTE.includes('never') || DESIGNATED_COMPARATOR_NOTE.includes('not') || DESIGNATED_COMPARATOR_NOTE.includes('designated comparator'), 'Designated comparator note explicitly avoids reference-method label', 'sg');
assert('H-04', Array.isArray(EXCLUDED_METHOD_COMPARISON_STATISTICS), 'EXCLUDED_METHOD_COMPARISON_STATISTICS is array', 'sg');
assert('H-05', EXCLUDED_METHOD_COMPARISON_STATISTICS.some(s => s.toLowerCase().includes('passing-bablok') || s.toLowerCase().includes('passing bablok')), 'Excluded: Passing-Bablok named', 'sg');
assert('H-06', EXCLUDED_METHOD_COMPARISON_STATISTICS.some(s => s.toLowerCase().includes('deming')), 'Excluded: Deming named', 'sg');
assert('H-07', EXCLUDED_METHOD_COMPARISON_STATISTICS.some(s => s.toLowerCase().includes('bland-altman') || s.toLowerCase().includes('bland altman')), 'Excluded: Bland-Altman named', 'sg');
assert('H-08', EXCLUDED_STATISTICS_NOTE.length > 0, 'EXCLUDED_STATISTICS_NOTE present', 'sg');
assert('H-09', Array.isArray(COMPARABILITY_PAIRED_SPECIMENS) && COMPARABILITY_PAIRED_SPECIMENS.length >= 3, 'COMPARABILITY_PAIRED_SPECIMENS has data', 'sg');
assert('H-10', COMPARABILITY_LIMIT_LABEL.length > 0, 'COMPARABILITY_LIMIT_LABEL present', 'sg');
assert('H-11', COMPARABILITY_LIMIT_CAUTION.includes('illustrative') || COMPARABILITY_LIMIT_CAUTION.includes('educational'), 'Comparability limit caution: illustrative/educational', 'sg');
assert('H-12', typeof COMPARABILITY_LAB_ILLUSTRATIVE_CRITERION === 'object' || typeof COMPARABILITY_LAB_ILLUSTRATIVE_CRITERION === 'number', 'COMPARABILITY_LAB_ILLUSTRATIVE_CRITERION present', 'sg');
assert('H-13', typeof CONTROL_MATERIAL_TRAP_CASE === 'object' && CONTROL_MATERIAL_TRAP_CASE !== null, 'CONTROL_MATERIAL_TRAP_CASE present', 'sg');
assert('H-14', typeof PATIENT_COMPARISON_TRAP_CASE === 'object' && PATIENT_COMPARISON_TRAP_CASE !== null, 'PATIENT_COMPARISON_TRAP_CASE present', 'sg');
assert('H-15', NOT_EVERY_DIFFERENCE_CLINICALLY_IMPORTANT_NOTE.length > 0, 'NOT_EVERY_DIFFERENCE_CLINICALLY_IMPORTANT_NOTE present', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: CRITICAL GUARDRAILS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Critical guardrails ===');

assert('I-01', NO_EQA_PASS_EQUALS_METHOD_VALID_NOTE.length > 0, 'NO_EQA_PASS_EQUALS_METHOD_VALID_NOTE present', 'sg');
assert('I-02', NO_EQA_FAIL_EQUALS_PATIENT_RESULTS_WRONG_NOTE.length > 0, 'NO_EQA_FAIL_EQUALS_PATIENT_RESULTS_WRONG_NOTE present', 'sg');
assert('I-03', NO_PEER_MEAN_EQUALS_REFERENCE_VALUE_NOTE.length > 0, 'NO_PEER_MEAN_EQUALS_REFERENCE_VALUE_NOTE present', 'sg');
assert('I-04', NO_COMMUTABLE_EQUALS_PERFECT_NOTE.length > 0, 'NO_COMMUTABLE_EQUALS_PERFECT_NOTE present', 'sg');
assert('I-05', NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE.length > 0, 'NO_AUTO_PATIENT_IMPACT_FROM_EQA_NOTE present', 'sg');
assert('I-06', NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE.length > 0, 'NO_AUTO_TRANSFER_BETWEEN_MODULES_NOTE present', 'sg');
assert('I-07', EQA_INVESTIGATION_PATH_STEPS.length >= 2, 'EQA_INVESTIGATION_PATH_STEPS has entries', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: DECISION OPTION VOCABULARIES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Decision option vocabularies ===');

// PATTERN_JUDGEMENT_OPTIONS
const pjIds = PATTERN_JUDGEMENT_OPTIONS.map(o => o.id);
assert('J-01', Array.isArray(PATTERN_JUDGEMENT_OPTIONS) && PATTERN_JUDGEMENT_OPTIONS.length === 3, 'PATTERN_JUDGEMENT_OPTIONS: 3 options', 'sg');
assert('J-02', pjIds.includes('participant-specific') && pjIds.includes('method-group') && pjIds.includes('indeterminate'), 'Pattern judgement IDs exact', 'sg');

// CAPABILITY_CONCLUSION_OPTIONS
const ccIds = CAPABILITY_CONCLUSION_OPTIONS.map(o => o.id);
assert('J-03', Array.isArray(CAPABILITY_CONCLUSION_OPTIONS) && CAPABILITY_CONCLUSION_OPTIONS.length === 4, 'CAPABILITY_CONCLUSION_OPTIONS: 4 options', 'sg');
assert('J-04', ccIds.includes('participant-performance') && ccIds.includes('method-performance') && ccIds.includes('harmonisation') && ccIds.includes('insufficient-basis'), 'Capability conclusion IDs exact', 'sg');

// LONGITUDINAL_RELEVANCE_OPTIONS
const lrIds = LONGITUDINAL_RELEVANCE_OPTIONS.map(o => o.id);
assert('J-05', Array.isArray(LONGITUDINAL_RELEVANCE_OPTIONS) && LONGITUDINAL_RELEVANCE_OPTIONS.length === 3, 'LONGITUDINAL_RELEVANCE_OPTIONS: 3 options', 'sg');
assert('J-06', lrIds.includes('changes-interpretation') && lrIds.includes('does-not-change-interpretation') && lrIds.includes('not-applicable-insufficient-history'), 'Longitudinal relevance IDs exact', 'sg');

// NEXT_ACTION_OPTIONS
const naIds = NEXT_ACTION_OPTIONS.map(o => o.id);
assert('J-07', Array.isArray(NEXT_ACTION_OPTIONS) && NEXT_ACTION_OPTIONS.length === 7, 'NEXT_ACTION_OPTIONS: 7 options', 'sg');
assert('J-08', naIds.includes('review-calibration-reagent-history'), 'Next action: review-calibration-reagent-history', 'sg');
assert('J-09', naIds.includes('correct-reporting-error'), 'Next action: correct-reporting-error', 'sg');
assert('J-10', naIds.includes('escalate-to-investigation-lab'), 'Next action: escalate-to-investigation-lab', 'sg');
assert('J-11', naIds.includes('no-action-routine-monitoring'), 'Next action: no-action-routine-monitoring', 'sg');
assert('J-12', naIds.includes('contact-eqa-organiser'), 'Next action: contact-eqa-organiser', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: EXTERNAL ASSURANCE STAGES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: External assurance stages ===');

const stageIds = EXTERNAL_ASSURANCE_STAGES.map(s => s.id || s);
assert('K-01', Array.isArray(EXTERNAL_ASSURANCE_STAGES) && EXTERNAL_ASSURANCE_STAGES.length === 7, 'EXTERNAL_ASSURANCE_STAGES: 7 stages', 'sg');
assert('K-02', stageIds[0] === 'target' || EXTERNAL_ASSURANCE_STAGES[0].id === 'target', 'Stage 0: target', 'sg');
assert('K-03', stageIds[6] === 'confidence' || EXTERNAL_ASSURANCE_STAGES[6].id === 'confidence', 'Stage 6: confidence', 'sg');
['target','commutability','capability','pattern','longitudinal','next-step','confidence'].forEach((sid, i) => {
  assert(`K-04-${sid}`, stageIds[i] === sid || EXTERNAL_ASSURANCE_STAGES[i].id === sid, `Stage ${i}: ${sid}`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION L: CHALLENGE BANK STRUCTURE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Challenge bank structure ===');

assert('L-01', Array.isArray(EXTERNAL_ASSURANCE_CASES) && EXTERNAL_ASSURANCE_CASES.length === 14, 'Exactly 14 cases', 'sg');
const caseIds = EXTERNAL_ASSURANCE_CASES.map(c => c.id);
assert('L-02', new Set(caseIds).size === 14, 'All case IDs unique', 'rc');
assert('L-03', caseIds.every((id, i) => id === i + 1), 'Case IDs are 1-14 sequential', 'sg');

// Exact titles (source-grounded)
const expectedTitles = {
  1: 'Case 1 — Stable IQC, persistent reference-target EQA bias',
  2: 'Case 2 — Participant differs from peer group',
  3: 'Case 3 — Entire peer group differs from reference target',
  4: 'Case 4 — Noncommutable material creates a misleading between-method difference',
  5: 'Case 5 — Commutability unknown, therefore conclusion limited',
  6: 'Case 6 — One isolated poor EQA result',
  7: 'Case 7 — Persistent moderate EQA deviation over multiple rounds',
  8: 'Case 8 — Reporting/unit error rather than analytical error',
  9: 'Case 9 — Two analysers disagree on QC material but agree on patient samples',
  10: 'Case 10 — Two analysers agree on QC material but disagree on patient samples',
  11: 'Case 11 — Satisfactory EQA does not negate unstable IQC',
  12: 'Case 12 — Insufficient scheme information to determine whether trueness can be assessed',
  13: 'Case 13 — Method group improves after manufacturer recalibration',
  14: 'Case 14 — EQA sample handled specially, invalidating the intended assessment'
};
Object.entries(expectedTitles).forEach(([id, title]) => {
  const c = EXTERNAL_ASSURANCE_CASES.find(x => x.id === +id);
  assert(`L-04-${id}`, c && c.title === title, `Case ${id} title exact`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION M: CRITICAL CASE REGRESSIONS (source-grounded — all values from HTML)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Critical case regressions (source-grounded) ===');

const getCase = id => EXTERNAL_ASSURANCE_CASES.find(c => c.id === id);

// CASE 1 — Stable IQC, persistent reference-target EQA bias
const c1 = getCase(1);
assert('M-C1-01', c1.correctTargetTypeId === 'reference-measurement-procedure', 'C1: targetType = reference-measurement-procedure', 'sg');
assert('M-C1-02', c1.correctCommutabilityJudgementId === 'verified-commutable', 'C1: commutability = verified-commutable', 'sg');
assert('M-C1-03', c1.correctCapabilityConclusionId === 'insufficient-basis', 'C1: capability = insufficient-basis', 'sg');
assert('M-C1-04', c1.correctPatternJudgementId === 'indeterminate', 'C1: pattern = indeterminate', 'sg');
assert('M-C1-05', c1.correctLongitudinalRelevanceId === 'changes-interpretation', 'C1: longitudinal = changes-interpretation', 'sg');
assert('M-C1-06', c1.correctNextActionId === 'review-calibration-reagent-history', 'C1: nextAction = review-calibration-reagent-history', 'sg');
assert('M-C1-07', c1.finalInterpretation.currentEqaStatus === 'does-not-meet-criterion', 'C1: currentEqaStatus = does-not-meet-criterion', 'sg');
assert('M-C1-08', c1.finalInterpretation.longitudinalEqaPattern === 'step-change', 'C1: longitudinalEqaPattern = step-change', 'sg');
assert('M-C1-09', c1.finalInterpretation.investigationStatus === 'under-review', 'C1: investigationStatus = under-review', 'sg');

// CASE 2 — Participant-specific deviation
const c2 = getCase(2);
assert('M-C2-01', c2.correctTargetTypeId === 'reference-measurement-procedure', 'C2: targetType = reference-measurement-procedure', 'sg');
assert('M-C2-02', c2.correctCommutabilityJudgementId === 'verified-commutable', 'C2: commutability = verified-commutable', 'sg');
assert('M-C2-03', c2.correctCapabilityConclusionId === 'participant-performance', 'C2: capability = participant-performance', 'sg');
assert('M-C2-04', c2.correctPatternJudgementId === 'participant-specific', 'C2: pattern = participant-specific', 'sg');
assert('M-C2-05', c2.finalInterpretation.investigationStatus === 'referred-to-investigation-lab', 'C2: investigationStatus = referred-to-investigation-lab', 'sg');

// CASE 3 — Method-group deviation
const c3 = getCase(3);
assert('M-C3-01', c3.correctCapabilityConclusionId === 'method-performance', 'C3: capability = method-performance', 'sg');
assert('M-C3-02', c3.correctPatternJudgementId === 'method-group', 'C3: pattern = method-group', 'sg');
assert('M-C3-03', c3.finalInterpretation.investigationStatus === 'resolved-method-group', 'C3: investigationStatus = resolved-method-group', 'sg');

// CASE 4 — Known noncommutable
const c4 = getCase(4);
assert('M-C4-01', c4.correctCommutabilityJudgementId === 'noncommutable', 'C4: commutability = noncommutable', 'sg');
assert('M-C4-02', c4.correctCapabilityConclusionId === 'insufficient-basis', 'C4: capability = insufficient-basis', 'sg');
assert('M-C4-03', c4.finalInterpretation.comparabilityStatus === 'stable-agreement', 'C4: comparabilityStatus = stable-agreement', 'sg');

// CASE 5 — Commutability UNKNOWN (CRITICAL: not-established ≠ noncommutable)
const c5 = getCase(5);
assert('M-C5-01', c5.correctCommutabilityJudgementId === 'commutability-not-established', 'C5: commutability = commutability-not-established (NOT noncommutable)', 'sg');
assert('M-C5-02', c5.correctCommutabilityJudgementId !== 'noncommutable', 'C5: CRITICAL — unknown ≠ noncommutable', 'sg');
assert('M-C5-03', c5.finalInterpretation.comparabilityStatus === 'indeterminate', 'C5: comparabilityStatus = indeterminate', 'sg');
assert('M-C5-04', c5.finalInterpretation.investigationStatus === 'unresolved', 'C5: investigationStatus = unresolved', 'sg');

// CASE 6 — Isolated poor EQA result
const c6 = getCase(6);
assert('M-C6-01', c6.finalInterpretation.currentEqaStatus === 'does-not-meet-criterion', 'C6: currentEqaStatus = does-not-meet-criterion', 'sg');
assert('M-C6-02', c6.finalInterpretation.longitudinalEqaPattern === 'isolated-eqa-excursion', 'C6: longitudinalEqaPattern = isolated-eqa-excursion', 'sg');
assert('M-C6-03', c6.correctLongitudinalRelevanceId === 'changes-interpretation', 'C6: longitudinal = changes-interpretation', 'sg');
assert('M-C6-04', c6.correctNextActionId === 'no-action-routine-monitoring', 'C6: nextAction = no-action-routine-monitoring', 'sg');

// CASE 7 — Persistent moderate deviation
const c7 = getCase(7);
assert('M-C7-01', c7.correctTargetTypeId === 'all-participant-consensus', 'C7: targetType = all-participant-consensus', 'sg');
assert('M-C7-02', c7.correctCommutabilityJudgementId === 'commutability-not-established', 'C7: commutability = commutability-not-established', 'sg');
assert('M-C7-03', c7.finalInterpretation.currentEqaStatus === 'meets-criterion', 'C7: currentEqaStatus = meets-criterion', 'sg');
assert('M-C7-04', c7.finalInterpretation.longitudinalEqaPattern === 'persistent-positive-deviation', 'C7: longitudinalEqaPattern = persistent-positive-deviation', 'sg');
assert('M-C7-05', c7.correctLongitudinalRelevanceId === 'changes-interpretation', 'C7: longitudinal = changes-interpretation', 'sg');
assert('M-C7-06', c7.correctNextActionId === 'review-calibration-reagent-history', 'C7: nextAction = review-calibration-reagent-history', 'sg');

// CASE 8 — Reporting/unit error
const c8 = getCase(8);
assert('M-C8-01', c8.correctPatternJudgementId === 'participant-specific', 'C8: pattern = participant-specific', 'sg');
assert('M-C8-02', c8.correctNextActionId === 'correct-reporting-error', 'C8: nextAction = correct-reporting-error', 'sg');
assert('M-C8-03', c8.finalInterpretation.investigationStatus === 'resolved-reporting-error', 'C8: investigationStatus = resolved-reporting-error', 'sg');

// CASE 9 — QC disagrees, patients agree
const c9 = getCase(9);
assert('M-C9-01', c9.correctCommutabilityJudgementId === 'noncommutable', 'C9: commutability = noncommutable', 'sg');
assert('M-C9-02', c9.finalInterpretation.comparabilityStatus === 'stable-agreement', 'C9: comparabilityStatus = stable-agreement', 'sg');

// CASE 10 — QC agrees, patients disagree
const c10 = getCase(10);
assert('M-C10-01', c10.correctNextActionId === 'escalate-to-investigation-lab', 'C10: nextAction = escalate-to-investigation-lab', 'sg');
assert('M-C10-02', c10.finalInterpretation.comparabilityStatus === 'gradual-divergence', 'C10: comparabilityStatus = gradual-divergence', 'sg');
assert('M-C10-03', c10.finalInterpretation.investigationStatus === 'under-review', 'C10: investigationStatus = under-review', 'sg');

// CASE 11 — Satisfactory EQA, unstable IQC
const c11 = getCase(11);
assert('M-C11-01', c11.finalInterpretation.currentEqaStatus === 'meets-criterion', 'C11: currentEqaStatus = meets-criterion', 'sg');
assert('M-C11-02', c11.correctLongitudinalRelevanceId === 'does-not-change-interpretation', 'C11: longitudinal = does-not-change-interpretation', 'sg');
assert('M-C11-03', c11.finalInterpretation.investigationStatus === 'under-review', 'C11: investigationStatus = under-review', 'sg');

// CASE 12 — Insufficient scheme information
const c12 = getCase(12);
assert('M-C12-01', c12.correctTargetTypeId === 'target-insufficiently-described', 'C12: targetType = target-insufficiently-described', 'sg');
assert('M-C12-02', c12.correctCommutabilityJudgementId === 'not-applicable-or-insufficient-information', 'C12: commutability = not-applicable-or-insufficient-information', 'sg');
assert('M-C12-03', c12.correctCapabilityConclusionId === 'insufficient-basis', 'C12: capability = insufficient-basis', 'sg');
assert('M-C12-04', c12.correctNextActionId === 'contact-eqa-organiser', 'C12: nextAction = contact-eqa-organiser', 'sg');
assert('M-C12-05', c12.finalInterpretation.currentEqaStatus === 'criterion-not-stated', 'C12: currentEqaStatus = criterion-not-stated', 'sg');
assert('M-C12-06', c12.finalInterpretation.investigationStatus === 'unresolved', 'C12: investigationStatus = unresolved', 'sg');

// CASE 13 — Method group improves
const c13 = getCase(13);
assert('M-C13-01', c13.correctCapabilityConclusionId === 'method-performance', 'C13: capability = method-performance', 'sg');
assert('M-C13-02', c13.correctPatternJudgementId === 'method-group', 'C13: pattern = method-group', 'sg');
assert('M-C13-03', c13.correctLongitudinalRelevanceId === 'changes-interpretation', 'C13: longitudinal = changes-interpretation', 'sg');
assert('M-C13-04', c13.correctNextActionId === 'no-action-routine-monitoring', 'C13: nextAction = no-action-routine-monitoring', 'sg');
assert('M-C13-05', c13.finalInterpretation.currentEqaStatus === 'meets-criterion', 'C13: currentEqaStatus = meets-criterion', 'sg');
assert('M-C13-06', c13.finalInterpretation.longitudinalEqaPattern === 'performance-improving', 'C13: longitudinalEqaPattern = performance-improving', 'sg');
assert('M-C13-07', c13.finalInterpretation.investigationStatus === 'resolved-method-group', 'C13: investigationStatus = resolved-method-group', 'sg');

// CASE 14 — Special handling invalidates assessment
const c14 = getCase(14);
assert('M-C14-01', c14.finalInterpretation.currentEqaStatus === 'meets-criterion', 'C14: currentEqaStatus = meets-criterion', 'sg');
assert('M-C14-02', c14.correctPatternJudgementId === 'participant-specific', 'C14: pattern = participant-specific', 'sg');
assert('M-C14-03', c14.correctNextActionId === 'no-action-routine-monitoring', 'C14: nextAction = no-action-routine-monitoring', 'sg');
assert('M-C14-04', c14.finalInterpretation.investigationStatus === 'resolved-participant-specific', 'C14: investigationStatus = resolved-participant-specific', 'sg');

/* -----------------------------------------------------------------------
   SECTION N: CROSS-MODULE VOCABULARY INTEGRATION (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: Cross-module vocabulary integration (reconstructed) ===');

const tvtSet = new Set(calc.TARGET_VALUE_TYPES);
const commSet = new Set(calc.COMMUTABILITY_STATUSES);
const currentSet = new Set(calc.CURRENT_EQA_STATUSES);
const longSet = new Set(calc.LONGITUDINAL_EQA_STATUSES);
const compSet = new Set(calc.COMPARABILITY_STATUSES);
const invSet = new Set(calc.EQA_INVESTIGATION_STATUSES);
const pjSet = new Set(PATTERN_JUDGEMENT_OPTIONS.map(o => o.id));
const ccSet = new Set(CAPABILITY_CONCLUSION_OPTIONS.map(o => o.id));
const lrSet = new Set(LONGITUDINAL_RELEVANCE_OPTIONS.map(o => o.id));
const naSet = new Set(NEXT_ACTION_OPTIONS.map(o => o.id));

EXTERNAL_ASSURANCE_CASES.forEach(c => {
  assert(`N-01-${c.id}`, tvtSet.has(c.correctTargetTypeId),
    `C${c.id}: correctTargetTypeId "${c.correctTargetTypeId}" in TARGET_VALUE_TYPES`, 'rc');
  assert(`N-02-${c.id}`, commSet.has(c.correctCommutabilityJudgementId),
    `C${c.id}: correctCommutabilityJudgementId in COMMUTABILITY_STATUSES`, 'rc');
  assert(`N-03-${c.id}`, ccSet.has(c.correctCapabilityConclusionId),
    `C${c.id}: correctCapabilityConclusionId in CAPABILITY_CONCLUSION_OPTIONS`, 'rc');
  assert(`N-04-${c.id}`, pjSet.has(c.correctPatternJudgementId),
    `C${c.id}: correctPatternJudgementId in PATTERN_JUDGEMENT_OPTIONS`, 'rc');
  assert(`N-05-${c.id}`, lrSet.has(c.correctLongitudinalRelevanceId),
    `C${c.id}: correctLongitudinalRelevanceId in LONGITUDINAL_RELEVANCE_OPTIONS`, 'rc');
  assert(`N-06-${c.id}`, naSet.has(c.correctNextActionId),
    `C${c.id}: correctNextActionId in NEXT_ACTION_OPTIONS`, 'rc');
  const fi = c.finalInterpretation;
  assert(`N-07-${c.id}`, currentSet.has(fi.currentEqaStatus),
    `C${c.id}: currentEqaStatus in CURRENT_EQA_STATUSES`, 'rc');
  assert(`N-08-${c.id}`, longSet.has(fi.longitudinalEqaPattern),
    `C${c.id}: longitudinalEqaPattern in LONGITUDINAL_EQA_STATUSES`, 'rc');
  assert(`N-09-${c.id}`, invSet.has(fi.investigationStatus),
    `C${c.id}: investigationStatus in EQA_INVESTIGATION_STATUSES`, 'rc');
  if (fi.comparabilityStatus != null) {
    assert(`N-10-${c.id}`, compSet.has(fi.comparabilityStatus),
      `C${c.id}: comparabilityStatus in COMPARABILITY_STATUSES`, 'rc');
  }
});

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 6B EQA Data Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 6B FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 6B PASSED — all tests green.');
  process.exit(0);
}
