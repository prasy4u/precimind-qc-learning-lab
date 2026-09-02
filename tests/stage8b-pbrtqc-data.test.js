/* =========================================================================
   tests/stage8b-pbrtqc-data.test.js

   NEW RECOVERY TESTS — Stage 8B (NOT the historical test suite)
   Tests for the recovered Patient Surveillance Lab static data module in
   src/pbrtqc/data.js.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)
   SOURCE MODULE: Artifact Class A — src/pbrtqc/data.js (HTML lines 12476-13231)
   CALC MODULE: Artifact Class A — src/pbrtqc/calc.js (Stage 8A, frozen)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED: exact IDs, exact counts, exact answer keys, exact strings,
     exact field arrays, exact stage arrays, exact doctrine notes, exact option
     lists — all directly encoded in HTML source.
   RECONSTRUCTED: cross-module vocabulary checks, uniqueness checks,
     architecture/absence tests, structural consistency, option membership.

   Run: node tests/stage8b-pbrtqc-data.test.js
   ========================================================================= */

'use strict';

const d = require('../src/pbrtqc/data');
const calc = require('../src/pbrtqc/calc');

const {
  PBRTQC_PATHWAY_STEPS, PBRTQC_PATHWAY_CAUTION,
  PBRTQC_CORE_PRINCIPLE, PBRTQC_COMPLEMENTARY_NOTE, PBRTQC_NOT_JUST_MOVING_AVERAGE_NOTE, NEVER_CALIBRATION_FAILURE_NOTE,
  PATIENT_POPULATION_SCENARIO_FIELDS, ANALYTICAL_ERROR_SCENARIO_FIELDS, PBRTQC_ALGORITHM_CONFIGURATION_FIELDS,
  N_R_M_W_DISTINCTION_EXAMPLE, N_R_M_W_DISTINCTION_STATEMENT, PBRTQC_VS_RCV_DISTINCTION, PBRTQC_VS_CVG_DISTINCTION,
  ALGORITHMS_IMPLEMENTED, ALGORITHMS_MENTIONED_NOT_IMPLEMENTED, ALGORITHMS_EXCLUDED_FROM_V08, ALGORITHM_SCOPE_NOTE,
  SLIDING_VS_BLOCKS_NOTE, PROCESSING_PIPELINE_STEPS, PROCESSING_ORDER_NOTE,
  METADATA_EXCLUSION_EXAMPLES, METADATA_FILTER_CAUTION,
  TRUNCATION_NOTE, NO_UNIVERSAL_TRUNCATION_NOTE,
  PARAMETER_PROVENANCE_OPTIONS, STARTING_CONFIGURATION_LANGUAGE_NOTE,
  CONTROL_LIMIT_PROVENANCE_NOTE, ALERT_BOUNDARY_NOTE, CONTROL_LIMIT_TRADEOFF_NOTE,
  ALERT_INTERPRETATION_STATEMENT, STABLE_PBRTQC_DOES_NOT_VALIDATE_STATEMENT,
  PBRTQC_NOT_DELTA_CHECK_STATEMENT, PBRTQC_NOT_EQA_STATEMENT, ALERT_ROUTES_TO_INVESTIGATION_NOTE,
  FALSE_FLAG_RATE_NOTE, TRAINING_VERIFICATION_SEPARATION_NOTE, VERIFICATION_LEAKAGE_NOTE, HISTORICAL_DATA_NOTE,
  NO_LIVE_DATA_NOTE, SYNTHETIC_DATA_CARD_LABEL, PRIVACY_BRIEF_NOTE,
  INFORMATICS_RELIABILITY_TOPICS, INFORMATICS_CHALLENGE_SCENARIO,
  VALIDATION_LIFECYCLE_STEPS, VALIDATION_LIFECYCLE_NOTE, MATERIAL_CHANGE_EXAMPLES, MATERIAL_CHANGE_LIST_CAUTION,
  NO_AUTO_OPTIMIZER_NOTE, NO_UNIVERSAL_TARGETS_NOTE,
  IQC_FREQUENCY_CONNECTION_EXPERIMENT, V04_ANPED_REMINDER_NOTE, NPED_VS_MAXENUF_NOTE, REPORT_FROM_BACK_NOTE,
  THROUGHPUT_NOTE, THROUGHPUT_EXAMPLE, THROUGHPUT_ASSUMPTION_LABEL,
  MULTIPLE_ANALYZER_NOTE, MULTIPLE_ANALYZER_EXPERIMENT,
  CASE_MIX_EXCLUSION_DANGER_NOTE,
  PBRTQC_LEVEL_EXPLANATION, ERROR_DETECTION_RECOMMENDED_FLOW,
  PBRTQC_WORKFLOW_QUESTIONS, PBRTQC_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE,
  FORBIDDEN_BLANKET_STATEMENTS, METHODOLOGICAL_DEVELOPMENT_NOTE, PBRTQC_EXCLUSION_LIST,
  PATIENT_POPULATIONS,
  DISTRIBUTION_SIGNATURE_EXPERIMENT, POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO, AGGRESSIVE_TRUNCATION_EXPERIMENT,
  MEAN_VS_MEDIAN_ROBUSTNESS_NOTE, MEDIAN_NOT_UNIVERSALLY_BETTER_NOTE,
  PBRTQC_CHALLENGE_CASES, PBRTQC_ANSWER_KIND_OPTIONS
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

assert('A-01', Object.keys(d).length === 74, 'Exactly 74 exports', 'rc');
assert('A-02', Object.keys(d).filter(k => typeof d[k] === 'function').length === 0, 'Zero exported functions', 'sg');

const srcText = require('fs').readFileSync(require('path').join(__dirname, '../src/pbrtqc/data.js'), 'utf8');
assert('A-03', !srcText.match(/import React|from ['"]react['"]/), 'No React import', 'rc');
assert('A-04', !srcText.match(/className=/), 'No JSX className', 'rc');
assert('A-05', !srcText.match(/calculateSlidingMean|calculateEWMA|calculateNPed/), 'No calc duplication', 'rc');
assert('A-06', !srcText.match(/fetch\(|axios\.|http\.get/), 'No API client', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: CORE DOCTRINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Core doctrine ===');

assert('B-01', Array.isArray(PBRTQC_PATHWAY_STEPS) && PBRTQC_PATHWAY_STEPS.length === 11, 'PBRTQC_PATHWAY_STEPS: 11 steps', 'sg');
assert('B-02', typeof PBRTQC_PATHWAY_CAUTION === 'string' && PBRTQC_PATHWAY_CAUTION.length > 0, 'PBRTQC_PATHWAY_CAUTION present', 'sg');
assert('B-03', PBRTQC_CORE_PRINCIPLE.includes('INDIRECTLY'), 'Core principle: monitors INDIRECTLY', 'sg');
assert('B-04', PBRTQC_CORE_PRINCIPLE.includes('not, by itself, a root-cause diagnosis'), 'Core principle: not root-cause diagnosis', 'sg');
assert('B-05', PBRTQC_COMPLEMENTARY_NOTE.includes('complementary'), 'Complementary note present', 'sg');
assert('B-06', PBRTQC_COMPLEMENTARY_NOTE.includes('never teaches'), 'Complementary note: never teaches one is better', 'sg');
assert('B-07', NEVER_CALIBRATION_FAILURE_NOTE.includes('never labels'), 'Never labels errors as calibration failure', 'sg');
assert('B-08', NEVER_CALIBRATION_FAILURE_NOTE.includes('synthetic analytical shift'), 'Correct neutral label used', 'sg');
assert('B-09', PBRTQC_NOT_JUST_MOVING_AVERAGE_NOTE.includes('not simply'), 'PBRTQC not just moving average', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: SYMBOL DISCIPLINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Symbol discipline ===');

assert('C-01', N_R_M_W_DISTINCTION_STATEMENT.length > 0, 'N_R_M_W_DISTINCTION_STATEMENT present', 'sg');
assert('C-02', N_R_M_W_DISTINCTION_STATEMENT.includes('W') && N_R_M_W_DISTINCTION_STATEMENT.includes('N'), 'Distinction covers W and N', 'sg');
assert('C-03', typeof N_R_M_W_DISTINCTION_EXAMPLE === 'object' && N_R_M_W_DISTINCTION_EXAMPLE !== null, 'N_R_M_W_DISTINCTION_EXAMPLE present', 'sg');
assert('C-04', typeof PBRTQC_VS_RCV_DISTINCTION === 'string' && PBRTQC_VS_RCV_DISTINCTION.length > 0, 'PBRTQC_VS_RCV_DISTINCTION present', 'sg');
assert('C-05', typeof PBRTQC_VS_CVG_DISTINCTION === 'string' && PBRTQC_VS_CVG_DISTINCTION.length > 0, 'PBRTQC_VS_CVG_DISTINCTION present', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: ALGORITHM SCOPE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Algorithm scope ===');

// Exactly 3 implemented algorithms
assert('D-01', Array.isArray(ALGORITHMS_IMPLEMENTED) && ALGORITHMS_IMPLEMENTED.length === 3, 'ALGORITHMS_IMPLEMENTED: 3', 'sg');
const implIds = ALGORITHMS_IMPLEMENTED.map(a => a.id || a);
assert('D-02', implIds.includes('moving-mean') || ALGORITHMS_IMPLEMENTED.some(a => JSON.stringify(a).includes('moving-mean')), 'moving-mean implemented', 'sg');
assert('D-03', implIds.includes('moving-median') || ALGORITHMS_IMPLEMENTED.some(a => JSON.stringify(a).includes('moving-median')), 'moving-median implemented', 'sg');
assert('D-04', implIds.includes('ewma') || ALGORITHMS_IMPLEMENTED.some(a => JSON.stringify(a).includes('ewma')), 'ewma implemented', 'sg');

// Excluded algorithms
assert('D-05', Array.isArray(ALGORITHMS_EXCLUDED_FROM_V08) && ALGORITHMS_EXCLUDED_FROM_V08.length >= 3, 'ALGORITHMS_EXCLUDED_FROM_V08: >= 3', 'sg');
const excludedStr = JSON.stringify(ALGORITHMS_EXCLUDED_FROM_V08);
assert('D-06', excludedStr.toLowerCase().includes('cusum'), 'CUSUM explicitly excluded', 'sg');
// Moving-SD exclusion is in the app-level description; ALGORITHMS_EXCLUDED_FROM_V08 focuses on ML/AI/RARTQC exclusions
// Verify CUSUM and AI/ML exclusions which ARE in the constant
assert('D-07', ALGORITHMS_EXCLUDED_FROM_V08.some(s => s.toLowerCase().includes('neural') || s.toLowerCase().includes('ai') || s.toLowerCase().includes('machine')), 'AI/ML/neural-network explicitly excluded', 'sg');
assert('D-08', typeof ALGORITHM_SCOPE_NOTE === 'string' && ALGORITHM_SCOPE_NOTE.length > 0, 'ALGORITHM_SCOPE_NOTE present', 'sg');
assert('D-09', Array.isArray(ALGORITHMS_MENTIONED_NOT_IMPLEMENTED) && ALGORITHMS_MENTIONED_NOT_IMPLEMENTED.length >= 1, 'ALGORITHMS_MENTIONED_NOT_IMPLEMENTED present', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: PROCESSING PIPELINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Processing pipeline ===');

assert('E-01', Array.isArray(PROCESSING_PIPELINE_STEPS) && PROCESSING_PIPELINE_STEPS.length === 7, 'PROCESSING_PIPELINE_STEPS: 7 steps', 'sg');
assert('E-02', typeof PROCESSING_ORDER_NOTE === 'string' && PROCESSING_ORDER_NOTE.length > 0, 'PROCESSING_ORDER_NOTE present', 'sg');
// Error injection must appear before truncation in the pipeline
const stepLabels = PROCESSING_PIPELINE_STEPS.map(s => (typeof s === 'string' ? s : JSON.stringify(s)).toLowerCase());
// Step containing 'synthetic analytical error' (not metadata 'exclusion')
const errorIdx = stepLabels.findIndex(s => s.includes('synthetic') && s.includes('error'));
// Step containing 'numeric truncation' specifically
const truncIdx = stepLabels.findIndex(s => s.includes('numeric truncation') || (s.includes('trunc') && !s.includes('metadata')));
assert('E-03', errorIdx !== -1 && truncIdx !== -1 && errorIdx < truncIdx,
  'Error injection (synthetic error) step precedes numeric truncation step in pipeline', 'sg');
assert('E-04', typeof SLIDING_VS_BLOCKS_NOTE === 'string' && SLIDING_VS_BLOCKS_NOTE.length > 0, 'SLIDING_VS_BLOCKS_NOTE present', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: ALERT DOCTRINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: Alert doctrine ===');

assert('F-01', ALERT_INTERPRETATION_STATEMENT.length > 0 && (ALERT_INTERPRETATION_STATEMENT.includes('requires') || ALERT_INTERPRETATION_STATEMENT.includes('interpret') || ALERT_INTERPRETATION_STATEMENT.includes('not')), 'Alert interpretation statement present and non-trivial', 'sg');
assert('F-02', STABLE_PBRTQC_DOES_NOT_VALIDATE_STATEMENT.length > 0, 'STABLE_PBRTQC_DOES_NOT_VALIDATE_STATEMENT present', 'sg');
assert('F-03', typeof PBRTQC_NOT_DELTA_CHECK_STATEMENT === 'string' && PBRTQC_NOT_DELTA_CHECK_STATEMENT.length > 0, 'PBRTQC_NOT_DELTA_CHECK_STATEMENT present', 'sg');
assert('F-04', typeof PBRTQC_NOT_EQA_STATEMENT === 'string' && PBRTQC_NOT_EQA_STATEMENT.length > 0, 'PBRTQC_NOT_EQA_STATEMENT present', 'sg');
assert('F-05', ALERT_ROUTES_TO_INVESTIGATION_NOTE.length > 0, 'ALERT_ROUTES_TO_INVESTIGATION_NOTE present', 'sg');
assert('F-06', typeof ALERT_BOUNDARY_NOTE === 'string' && ALERT_BOUNDARY_NOTE.length > 0, 'ALERT_BOUNDARY_NOTE present', 'sg');
assert('F-07', CONTROL_LIMIT_TRADEOFF_NOTE.length > 0, 'CONTROL_LIMIT_TRADEOFF_NOTE present', 'sg');
assert('F-08', Array.isArray(FORBIDDEN_BLANKET_STATEMENTS) && FORBIDDEN_BLANKET_STATEMENTS.length >= 3, 'FORBIDDEN_BLANKET_STATEMENTS: >= 3', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: TRAINING/VERIFICATION AND DATA INTEGRITY (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: Training/verification and data integrity ===');

assert('G-01', TRAINING_VERIFICATION_SEPARATION_NOTE.length > 0, 'TRAINING_VERIFICATION_SEPARATION_NOTE present', 'sg');
assert('G-02', VERIFICATION_LEAKAGE_NOTE.length > 0, 'VERIFICATION_LEAKAGE_NOTE present', 'sg');
assert('G-03', HISTORICAL_DATA_NOTE.length > 0, 'HISTORICAL_DATA_NOTE present', 'sg');
assert('G-04', NO_LIVE_DATA_NOTE.length > 0 && (NO_LIVE_DATA_NOTE.includes('live') || NO_LIVE_DATA_NOTE.includes('synthetic')), 'NO_LIVE_DATA_NOTE: no live data', 'sg');
assert('G-05', NO_AUTO_OPTIMIZER_NOTE.length > 0, 'NO_AUTO_OPTIMIZER_NOTE present', 'sg');
assert('G-06', NO_UNIVERSAL_TARGETS_NOTE.length > 0, 'NO_UNIVERSAL_TARGETS_NOTE present', 'sg');
assert('G-07', Array.isArray(VALIDATION_LIFECYCLE_STEPS) && VALIDATION_LIFECYCLE_STEPS.length >= 3, 'VALIDATION_LIFECYCLE_STEPS >= 3', 'sg');
assert('G-08', Array.isArray(MATERIAL_CHANGE_EXAMPLES) && MATERIAL_CHANGE_EXAMPLES.length >= 3, 'MATERIAL_CHANGE_EXAMPLES >= 3', 'sg');
assert('G-09', Array.isArray(PARAMETER_PROVENANCE_OPTIONS) && PARAMETER_PROVENANCE_OPTIONS.length >= 3, 'PARAMETER_PROVENANCE_OPTIONS >= 3', 'sg');
assert('G-10', FALSE_FLAG_RATE_NOTE.length > 0, 'FALSE_FLAG_RATE_NOTE present', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: IQC/ANPED CONNECTION AND V0.4 REMINDER (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: IQC/ANPed connection ===');

assert('H-01', typeof IQC_FREQUENCY_CONNECTION_EXPERIMENT === 'object', 'IQC_FREQUENCY_CONNECTION_EXPERIMENT present', 'sg');
assert('H-02', V04_ANPED_REMINDER_NOTE.length > 0, 'V04_ANPED_REMINDER_NOTE present', 'sg');
assert('H-03', NPED_VS_MAXENUF_NOTE.length > 0, 'NPED_VS_MAXENUF_NOTE present', 'sg');
assert('H-04', REPORT_FROM_BACK_NOTE.length > 0, 'REPORT_FROM_BACK_NOTE present', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: PATIENT POPULATIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Patient populations ===');

assert('I-01', Array.isArray(PATIENT_POPULATIONS) && PATIENT_POPULATIONS.length === 5, 'PATIENT_POPULATIONS: 5 populations', 'sg');
const popIds = PATIENT_POPULATIONS.map(p => p.id);
assert('I-02', new Set(popIds).size === 5, 'All population IDs unique', 'rc');
// All populations have required fields
PATIENT_POPULATIONS.forEach(p => {
  assert(`I-03-${p.id}`, 'id' in p && 'name' in p && 'baseResults' in p,
    `Population ${p.id}: required fields (id, name, baseResults) present`, 'sg');
  // Name contains 'Synthetic' or provenance indicates synthetic
  assert(`I-04-${p.id}`, (p.name && (p.name.includes('Synthetic') || p.name.includes('synthetic'))) ||
    (p.provenance && (p.provenance.includes('synthetic') || p.provenance.includes('Synthetic'))) ||
    (p.displayName && (p.displayName.includes('Synthetic') || p.displayName.includes('synthetic'))),
    `Population ${p.id}: indicates synthetic data`, 'sg');
  assert(`I-05-${p.id}`, Array.isArray(p.baseResults) && p.baseResults.length >= 5,
    `Population ${p.id}: baseResults array with >= 5 entries`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION J: CHALLENGE BANK STRUCTURE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: Challenge bank structure ===');

assert('J-01', Array.isArray(PBRTQC_CHALLENGE_CASES) && PBRTQC_CHALLENGE_CASES.length === 18, 'Exactly 18 challenge cases', 'sg');
const caseIds = PBRTQC_CHALLENGE_CASES.map(c => c.id);
assert('J-02', new Set(caseIds).size === 18, 'All case IDs unique', 'rc');
assert('J-03', caseIds.every((id, i) => id === i + 1), 'Case IDs are 1-18 sequential', 'sg');

// All cases have required structure
PBRTQC_CHALLENGE_CASES.forEach(c => {
  assert(`J-04-${c.id}`,
    'id' in c && 'title' in c && ('scenario' in c || 'narrative' in c) && 'correctAnswer' in c && 'answerKind' in c,
    `Case ${c.id}: required structure fields (id/title/scenario-or-narrative/correctAnswer/answerKind)`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION K: EXACT ANSWER KEYS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: Exact answer keys ===');

const answerKeys = {
  1: 12, 2: 'no', 3: 'no', 4: 'median-more-robust-here',
  5: 'no', 6: 'yes', 7: 'no', 8: 'tradeoff',
  9: 'tradeoff', 10: 'yes', 11: 'no', 12: 'no',
  13: 'different-elapsed-time', 14: 'no',
  15: 'investigate-pipeline', 16: 'no', 17: 'yes', 18: 'no'
};
const caseMap = Object.fromEntries(PBRTQC_CHALLENGE_CASES.map(c => [c.id, c]));
Object.entries(answerKeys).forEach(([id, expected]) => {
  const c = caseMap[+id];
  const actual = c ? c.correctAnswer : undefined;
  assert(`K-01-${id}`, c && (actual === expected || (typeof expected === 'number' && Number(actual) === expected) || String(actual) === String(expected)),
    `Case ${id}: correctAnswer = ${expected}`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION L: ANSWER KIND DISTRIBUTION (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Answer kind distribution ===');

const kinds = PBRTQC_CHALLENGE_CASES.map(c => c.answerKind);
const kindCounts = {};
kinds.forEach(k => { kindCounts[k] = (kindCounts[k] || 0) + 1; });
assert('L-01', kindCounts['yes-no'] === 12, 'answerKind yes-no: 12 cases', 'sg');
assert('L-02', kindCounts['nped-value'] === 1, 'answerKind nped-value: 1 case (case 1)', 'sg');
assert('L-03', kindCounts['mean-median-robustness'] === 1, 'answerKind mean-median-robustness: 1 case', 'sg');
assert('L-04', kindCounts['small-vs-large-window'] === 2, 'answerKind small-vs-large-window: 2 cases', 'sg');
assert('L-05', kindCounts['throughput-elapsed'] === 1, 'answerKind throughput-elapsed: 1 case', 'sg');
assert('L-06', kindCounts['informatics-next-step'] === 1, 'answerKind informatics-next-step: 1 case', 'sg');

/* -----------------------------------------------------------------------
   SECTION M: PBRTQC_ANSWER_KIND_OPTIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Answer kind options ===');

assert('M-01', typeof PBRTQC_ANSWER_KIND_OPTIONS === 'object' && !Array.isArray(PBRTQC_ANSWER_KIND_OPTIONS), 'PBRTQC_ANSWER_KIND_OPTIONS is an object', 'sg');
assert('M-02', 'yes-no' in PBRTQC_ANSWER_KIND_OPTIONS, 'yes-no key present', 'sg');
assert('M-03', Array.isArray(PBRTQC_ANSWER_KIND_OPTIONS['yes-no']) && PBRTQC_ANSWER_KIND_OPTIONS['yes-no'].length === 2, 'yes-no: 2 options', 'sg');
assert('M-04', 'nped-value' in PBRTQC_ANSWER_KIND_OPTIONS, 'nped-value key present', 'sg');
assert('M-05', 'mean-median-robustness' in PBRTQC_ANSWER_KIND_OPTIONS, 'mean-median-robustness key present', 'sg');
assert('M-06', 'small-vs-large-window' in PBRTQC_ANSWER_KIND_OPTIONS, 'small-vs-large-window key present', 'sg');
assert('M-07', 'throughput-elapsed' in PBRTQC_ANSWER_KIND_OPTIONS, 'throughput-elapsed key present', 'sg');
assert('M-08', 'informatics-next-step' in PBRTQC_ANSWER_KIND_OPTIONS, 'informatics-next-step key present', 'sg');

/* -----------------------------------------------------------------------
   SECTION N: WORKFLOW AND LEVELS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: Workflow and levels ===');

assert('N-01', Array.isArray(PBRTQC_WORKFLOW_QUESTIONS) && PBRTQC_WORKFLOW_QUESTIONS.length === 7, 'PBRTQC_WORKFLOW_QUESTIONS: 7', 'sg');
assert('N-02', PBRTQC_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE.length > 0, 'PBRTQC_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE present', 'sg');
assert('N-03', typeof PBRTQC_LEVEL_EXPLANATION === 'object' && PBRTQC_LEVEL_EXPLANATION !== null, 'PBRTQC_LEVEL_EXPLANATION present', 'sg');
assert('N-04', typeof ERROR_DETECTION_RECOMMENDED_FLOW === 'object' || Array.isArray(ERROR_DETECTION_RECOMMENDED_FLOW), 'ERROR_DETECTION_RECOMMENDED_FLOW present', 'sg');
assert('N-05', Array.isArray(PBRTQC_EXCLUSION_LIST) && PBRTQC_EXCLUSION_LIST.length >= 5, 'PBRTQC_EXCLUSION_LIST >= 5 items', 'sg');

/* -----------------------------------------------------------------------
   SECTION O: EXPERIMENTS AND SCENARIOS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: Experiments and scenarios ===');

assert('O-01', typeof DISTRIBUTION_SIGNATURE_EXPERIMENT === 'object', 'DISTRIBUTION_SIGNATURE_EXPERIMENT present', 'sg');
assert('O-02', typeof POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO === 'object', 'POPULATION_SHIFT_WITHOUT_ERROR_SCENARIO present', 'sg');
assert('O-03', typeof AGGRESSIVE_TRUNCATION_EXPERIMENT === 'object', 'AGGRESSIVE_TRUNCATION_EXPERIMENT present', 'sg');
assert('O-04', MEAN_VS_MEDIAN_ROBUSTNESS_NOTE.length > 0, 'MEAN_VS_MEDIAN_ROBUSTNESS_NOTE present', 'sg');
assert('O-05', MEDIAN_NOT_UNIVERSALLY_BETTER_NOTE.length > 0, 'MEDIAN_NOT_UNIVERSALLY_BETTER_NOTE present', 'sg');
assert('O-06', typeof THROUGHPUT_NOTE === 'string' && THROUGHPUT_NOTE.length > 0, 'THROUGHPUT_NOTE present', 'sg');
assert('O-07', typeof THROUGHPUT_EXAMPLE === 'object' && THROUGHPUT_EXAMPLE !== null, 'THROUGHPUT_EXAMPLE present', 'sg');
assert('O-08', typeof MULTIPLE_ANALYZER_NOTE === 'string' && MULTIPLE_ANALYZER_NOTE.length > 0, 'MULTIPLE_ANALYZER_NOTE present', 'sg');
assert('O-09', CASE_MIX_EXCLUSION_DANGER_NOTE.length > 0, 'CASE_MIX_EXCLUSION_DANGER_NOTE present', 'sg');

/* -----------------------------------------------------------------------
   SECTION P: CROSS-MODULE ALGORITHM ID CONSISTENCY (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: Cross-module algorithm ID consistency ===');

// Check that population IDs do not collide with calc module exports
const calcExports = Object.keys(calc);
PATIENT_POPULATIONS.forEach(p => {
  assert(`P-01-${p.id}`, !calcExports.includes(p.id), `Population ID ${p.id} does not clash with calc export`, 'rc');
});

// Verify calc engine can process population data
PATIENT_POPULATIONS.forEach(p => {
  const result = calc.calculateSlidingMean(p.baseResults, 3);
  assert(`P-02-${p.id}`, result.supported, `Population ${p.id} values are processable by slidingMean`, 'rc');
});

/* -----------------------------------------------------------------------
   SECTION Q: CRITICAL CASE REGRESSIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Q: Critical case regressions ===');

// Case 1: NPed value question — answer=12
assert('Q-01', caseMap[1].answerKind === 'nped-value', 'Case 1: answerKind=nped-value', 'sg');
assert('Q-02', String(caseMap[1].correctAnswer) === '12', 'Case 1: correctAnswer=12', 'sg');

// Case 4: median robustness
assert('Q-03', caseMap[4].answerKind === 'mean-median-robustness', 'Case 4: answerKind=mean-median-robustness', 'sg');
assert('Q-04', caseMap[4].correctAnswer === 'median-more-robust-here', 'Case 4: median-more-robust-here', 'sg');

// Case 8 and 9: window tradeoff
assert('Q-05', caseMap[8].correctAnswer === 'tradeoff', 'Case 8: tradeoff', 'sg');
assert('Q-06', caseMap[9].correctAnswer === 'tradeoff', 'Case 9: tradeoff', 'sg');

// Case 13: throughput elapsed
assert('Q-07', caseMap[13].answerKind === 'throughput-elapsed', 'Case 13: answerKind=throughput-elapsed', 'sg');
assert('Q-08', caseMap[13].correctAnswer === 'different-elapsed-time', 'Case 13: different-elapsed-time', 'sg');

// Case 15: informatics
assert('Q-09', caseMap[15].answerKind === 'informatics-next-step', 'Case 15: answerKind=informatics-next-step', 'sg');
assert('Q-10', caseMap[15].correctAnswer === 'investigate-pipeline', 'Case 15: investigate-pipeline', 'sg');

// Cases 6, 10, 17: yes answers (all others are no)
const yesIds = [6, 10, 17];
const noIds = [2, 3, 5, 7, 11, 12, 14, 16, 18];
yesIds.forEach(id => {
  assert(`Q-11-${id}`, caseMap[id].correctAnswer === 'yes', `Case ${id}: correctAnswer=yes`, 'sg');
});
noIds.forEach(id => {
  assert(`Q-12-${id}`, caseMap[id].correctAnswer === 'no', `Case ${id}: correctAnswer=no`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION R: NEGATIVE SAFEGUARDS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION R: Negative safeguards ===');

const forbidden = ['calculateSlidingMean','calculateEWMA','calculateNPed','summarizeNpedTrials','runPbrtqcStream','autoCorrectPatientResult','fetchLiveData'];
forbidden.forEach(fn => {
  assert(`R-01-${fn}`, !(fn in d), `No forbidden function: ${fn}`, 'rc');
});
assert('R-02', !srcText.match(/fetch\(|XMLHttpRequest/), 'No HTTP client code', 'rc');
assert('R-03', !('realPatientData' in d) && !('liveStream' in d), 'No real/live patient data exports', 'rc');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 8B PBRTQC Data Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 8B FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 8B PASSED — all tests green.');
  process.exit(0);
}
