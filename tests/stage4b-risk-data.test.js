/* =========================================================================
   tests/stage4b-risk-data.test.js

   NEW RECOVERY TESTS — Stage 4B (NOT the historical test suite)
   Tests for the recovered Risk & Frequency static teaching/data layer in
   src/risk/data.js.

   ARTIFACT PROVENANCE: Class A — all constants/objects directly recovered
   from recovery/original-v0.8.html (source lines ~5499-5870).

   TEST EXPECTATION PROVENANCE:
   - source-grounded: assertions about fields directly encoded in the HTML
     (case IDs, titles, correctWhatChanged, correctLikelyEffect,
      misconceptionFlags, definition strings, array lengths, option IDs)
   - reconstructed: structural checks and cross-engine boundary tests
     that verify no calculation functions were duplicated

   This file does NOT call opchar or detection-delay calculation functions
   to generate expected values — it verifies the STATIC DATA layer only.
   Numerical content (CHANGE_PED_HOLD_M presets) is cross-referenced to
   Stage 3A recovered fixtures which already confirmed those values.

   Run: node tests/stage4b-risk-data.test.js
   ========================================================================= */

'use strict';

const data = require('../src/risk/data');
const {
  QC_PROCEDURE_DEFINITION, QC_EVENT_DEFINITION, QC_FREQUENCY_DEFINITION,
  ANALYTICAL_RUN_V4_DEFINITION, CORE_DISTINCTION_CAUTIONS,
  N_LABEL, R_LABEL, M_LABEL, N_R_M_DISTINCTION_NOTE, M_OPTIONS,
  SHIFT_OPTIONS_SD, SYNTHETIC_SHIFT_INTRODUCED_TEXT, SHIFT_CAUSE_CAUTION,
  FAILURE_ONSET_MODES,
  PATIENT_SAMPLES_EXPOSED_DEFINITION, UNACCEPTABLE_RESULTS_DEFINITION,
  ANPED_NOTE,
  FREQUENCY_EXPOSURE_LAB,
  WHICH_COMPONENT_CHANGED_EXPERIMENT, CHANGE_PED_HOLD_M_EXPERIMENT,
  QUADRANT_MATRIX, QUADRANT_MATRIX_NOTE,
  PARVIN_SECTION_INTRO, MAXE_NUF_DEFINITION, MAXE_NUF_BOUNDARY_NOTE,
  MAXE_NUF_NOT_ONLY_FRAMEWORK_NOTE,
  NOMOGRAM_CONCEPT_NOTE, WORKED_NOMOGRAM_EXAMPLE, MAXE_GOAL_NOTE,
  PATIENT_RISK_SIGMA_CAUTION,
  STARTUP_VS_MONITORING_NOTE, BRACKETED_QC_NOTE, OUT_OF_CONTROL_EVENT_PREVIEW,
  MORE_QC_NOT_ALWAYS_BETTER_NOTE, HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE,
  PROCESS_STABILITY_NOTE, CLINICAL_CONSEQUENCE_NOTE,
  FREQUENCY_DESIGNER_DEFAULTS, RISK_MODEL_LIMITATION_NOTE,
  WHAT_CHANGED_OPTIONS, LIKELY_EFFECT_OPTIONS, FREQUENCY_CHALLENGE_CASES
} = data;

let passed = 0, failed = 0;

function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}

/* -----------------------------------------------------------------------
   SECTION 1: NO NUMERICAL ENGINE DUPLICATION
   Confirm this module exports NO calculation functions — all computation
   lives in opchar/functions.js and risk/detection-delay.js.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 1: No numerical engine duplication ===');

const exportedKeys = Object.keys(data);
const calcFunctionNames = [
  'erf', 'normalCDF', 'pfr1_3s', 'ped1_3s', 'pedSingle1_3s',
  'operatingCharacteristic', 'operatingCharacteristic13s',
  'expectedQcEventsToDetectionGeometric',
  'expectedPatientExposureImmediateOnset',
  'expectedPatientExposureUniformOnset',
  'isDetectionDelaySupportedRuleSet',
  'calcSigma', 'calcMean', 'calcSampleSD', 'calcCVPercent', 'calcBiasPercent'
];
calcFunctionNames.forEach(fn => {
  assert(`T-NODUP-${fn}`, !(fn in data),
    `Module does not export calculation function: ${fn}`);
});

// Module should export only strings, arrays, and plain objects
const hasOnlyData = exportedKeys.every(k => typeof data[k] !== 'function');
assert('T-NODUP-ALLFN', hasOnlyData, 'All exports are data (strings/arrays/objects), no functions');

/* -----------------------------------------------------------------------
   SECTION 2: CORE DEFINITIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 2: Core definitions ===');

assert('T-DEF-01', typeof QC_PROCEDURE_DEFINITION === 'string' && QC_PROCEDURE_DEFINITION.includes('N'), 'QC_PROCEDURE_DEFINITION mentions N');
assert('T-DEF-02', typeof QC_EVENT_DEFINITION === 'string' && QC_EVENT_DEFINITION.includes('QC event'), 'QC_EVENT_DEFINITION present');
assert('T-DEF-03', typeof QC_FREQUENCY_DEFINITION === 'string' && QC_FREQUENCY_DEFINITION.includes('patient samples'), 'QC_FREQUENCY_DEFINITION mentions patient samples');
assert('T-DEF-04', typeof ANALYTICAL_RUN_V4_DEFINITION === 'string' && ANALYTICAL_RUN_V4_DEFINITION.length > 0, 'ANALYTICAL_RUN_V4_DEFINITION present');

// Three mandatory cautions (source-grounded: exactly 3, exact content verified)
assert('T-DEF-05', Array.isArray(CORE_DISTINCTION_CAUTIONS) && CORE_DISTINCTION_CAUTIONS.length === 3, 'CORE_DISTINCTION_CAUTIONS: exactly 3 entries');
assert('T-DEF-06', CORE_DISTINCTION_CAUTIONS[0].includes('calendar day or shift'), 'Caution 1: run ≠ calendar day/shift');
assert('T-DEF-07', CORE_DISTINCTION_CAUTIONS[1].includes('run size') && CORE_DISTINCTION_CAUTIONS[1].includes('N'), 'Caution 2: run size ≠ N');
assert('T-DEF-08', CORE_DISTINCTION_CAUTIONS[2].includes('QC frequency') && CORE_DISTINCTION_CAUTIONS[2].includes('R'), 'Caution 3: QC frequency ≠ R');

/* -----------------------------------------------------------------------
   SECTION 3: N/R/M SEMANTICS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 3: N/R/M semantics ===');

assert('T-NRM-01', N_LABEL.includes('N =') && N_LABEL.includes('QC measurements'), 'N_LABEL: N = QC measurements/event');
assert('T-NRM-02', R_LABEL.includes('R =') && R_LABEL.includes('look-back'), 'R_LABEL: R = rule look-back');
assert('T-NRM-03', M_LABEL.includes('M =') && M_LABEL.includes('patient samples'), 'M_LABEL: M = patient samples between QC events');

assert('T-NRM-04', N_R_M_DISTINCTION_NOTE.includes('N, R and M answer three different questions'), 'N_R_M note: three different questions');
assert('T-NRM-05', N_R_M_DISTINCTION_NOTE.includes('Changing M does not change N or R'), 'N_R_M note: M does not change N or R');
assert('T-NRM-06', N_R_M_DISTINCTION_NOTE.includes('changing N or R does not change M'), 'N_R_M note: N or R does not change M');
assert('T-NRM-07', N_R_M_DISTINCTION_NOTE.includes('N=2, R=1, M=100'), 'N_R_M note contains worked example');

// M_OPTIONS array
assert('T-NRM-08', Array.isArray(M_OPTIONS) && M_OPTIONS.length === 7, 'M_OPTIONS: 7 entries');
assert('T-NRM-09', M_OPTIONS.includes(10) && M_OPTIONS.includes(1000), 'M_OPTIONS spans 10 to 1000');
assert('T-NRM-10', M_OPTIONS.every(m => typeof m === 'number' && m > 0), 'M_OPTIONS: all positive numbers');

/* -----------------------------------------------------------------------
   SECTION 4: RUN ≠ CALENDAR DAY (source-grounded from cautions)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 4: Run ≠ calendar day/shift ===');

assert('T-RUN-01', CORE_DISTINCTION_CAUTIONS.some(c => c.includes('calendar day or shift')),
  'CORE_DISTINCTION_CAUTIONS explicitly states run ≠ calendar day/shift');
assert('T-RUN-02', ANALYTICAL_RUN_V4_DEFINITION.includes('configured interval'),
  'Analytical run defined as configured interval, not calendar period');

/* -----------------------------------------------------------------------
   SECTION 5: STARTUP vs MONITORING (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 5: Startup vs monitoring QC ===');

assert('T-STARTUP-01', typeof STARTUP_VS_MONITORING_NOTE === 'string' && STARTUP_VS_MONITORING_NOTE.length > 0, 'STARTUP_VS_MONITORING_NOTE present');
assert('T-STARTUP-02', STARTUP_VS_MONITORING_NOTE.includes('Startup QC'), 'Note distinguishes startup QC');
assert('T-STARTUP-03', STARTUP_VS_MONITORING_NOTE.includes('Monitoring QC'), 'Note defines monitoring QC');
assert('T-STARTUP-04', STARTUP_VS_MONITORING_NOTE.includes('does not eliminate the need'), 'Startup does not eliminate monitoring need');
assert('T-STARTUP-05', STARTUP_VS_MONITORING_NOTE.includes('does not prescribe a universal timing'),
  'Note explicitly does not prescribe a universal timing');

/* -----------------------------------------------------------------------
   SECTION 6: BRACKETED QC CAUTION (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 6: Bracketed QC ===');

assert('T-BRKT-01', typeof BRACKETED_QC_NOTE === 'string' && BRACKETED_QC_NOTE.includes('Bracketed QC'), 'BRACKETED_QC_NOTE present');
assert('T-BRKT-02', BRACKETED_QC_NOTE.includes('does not automatically prove'), 'Bracketed QC does not auto-prove every result correct');
assert('T-BRKT-03', OUT_OF_CONTROL_EVENT_PREVIEW.scenario.includes('150'), 'OOC preview scenario: 150 specimens');
assert('T-BRKT-04', OUT_OF_CONTROL_EVENT_PREVIEW.teachingAnswer.includes('not automatically every one'), 'OOC preview: not automatically every result invalid');
assert('T-BRKT-05', OUT_OF_CONTROL_EVENT_PREVIEW.teachingAnswer.includes('not automatically none'), 'OOC preview: not automatically none invalid');

/* -----------------------------------------------------------------------
   SECTION 7: MORE QC NOT ALWAYS BETTER (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 7: More QC not always better ===');

assert('T-MQCN-01', typeof MORE_QC_NOT_ALWAYS_BETTER_NOTE === 'string', 'MORE_QC_NOT_ALWAYS_BETTER_NOTE present');
assert('T-MQCN-02', MORE_QC_NOT_ALWAYS_BETTER_NOTE.includes('not teach that more frequent QC is always better'), 'Explicit "not always better" statement');
assert('T-MQCN-03', MORE_QC_NOT_ALWAYS_BETTER_NOTE.includes('appropriate QC frequency'), 'Note mentions appropriate frequency goal');

/* -----------------------------------------------------------------------
   SECTION 8: HIGH SIGMA FREQUENCY MISCONCEPTION (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 8: High-Sigma frequency misconception ===');

assert('T-HSMIS-01', typeof HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE === 'string', 'HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE present');
assert('T-HSMIS-02', HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE.includes('high Sigma means QC frequency does not matter'), 'Exact misconception statement preserved');
assert('T-HSMIS-03', HIGH_SIGMA_FREQUENCY_MISCONCEPTION_NOTE.includes('does not remove the need'), 'High Sigma does not remove frequency need');

/* -----------------------------------------------------------------------
   SECTION 9: PATIENT EXPOSURE ≠ CLINICAL HARM (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 9: Patient exposure ≠ clinical harm ===');

assert('T-HARM-01', typeof PATIENT_SAMPLES_EXPOSED_DEFINITION === 'string' && PATIENT_SAMPLES_EXPOSED_DEFINITION.includes('process/detection-delay concept'), 'Exposure defined as process concept');
assert('T-HARM-02', typeof UNACCEPTABLE_RESULTS_DEFINITION === 'string', 'UNACCEPTABLE_RESULTS_DEFINITION present');
assert('T-HARM-03', UNACCEPTABLE_RESULTS_DEFINITION.includes('must not be used interchangeably'), 'Explicit non-interchangeability statement');
assert('T-HARM-04', RISK_MODEL_LIMITATION_NOTE.includes('is not MaxE(Nuf)'), 'Risk model explicitly not MaxE(Nuf)');
assert('T-HARM-05', RISK_MODEL_LIMITATION_NOTE.includes('does not estimate the number of unacceptable final patient results'), 'Risk model does not estimate unacceptable results');

/* -----------------------------------------------------------------------
   SECTION 10: MaxE(Nuf) DISTINCTION (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 10: MaxE(Nuf) distinction ===');

assert('T-MAXE-01', typeof PARVIN_SECTION_INTRO === 'string' && PARVIN_SECTION_INTRO.includes('MaxE(Nuf)'), 'PARVIN_SECTION_INTRO mentions MaxE(Nuf)');
assert('T-MAXE-02', PARVIN_SECTION_INTRO.includes('does not yet describe patient harm'), 'Intro: detection-delay describes process, not harm');
assert('T-MAXE-03', typeof MAXE_NUF_DEFINITION === 'string' && MAXE_NUF_DEFINITION.includes('maximum'), 'MAXE_NUF_DEFINITION present');
assert('T-MAXE-04', typeof MAXE_NUF_BOUNDARY_NOTE === 'string' && MAXE_NUF_BOUNDARY_NOTE.includes('intentionally not implemented'), 'MaxE(Nuf) boundary: not implemented');
assert('T-MAXE-05', MAXE_NUF_BOUNDARY_NOTE.includes('preferable to an approximate or fabricated calculator'), 'MaxE(Nuf) boundary: explicit integrity statement');
assert('T-MAXE-06', typeof MAXE_NUF_NOT_ONLY_FRAMEWORK_NOTE === 'string' && MAXE_NUF_NOT_ONLY_FRAMEWORK_NOTE.includes('not presented here as the only possible model'), 'MaxE(Nuf) not presented as the only framework');
assert('T-MAXE-07', MAXE_GOAL_NOTE.includes('does not state that MaxE(Nuf) = 1 is universally required'), 'MaxE(Nuf) goal = 1 not stated as universal');
assert('T-MAXE-08', PATIENT_RISK_SIGMA_CAUTION.includes('Patient Risk Sigma') && PATIENT_RISK_SIGMA_CAUTION.includes('does not implement'), 'Patient Risk Sigma not implemented');

/* -----------------------------------------------------------------------
   SECTION 11: CHANGE_PED_HOLD_M presets (source-grounded + cross-ref Stage 3A)
   These presets are Class A source data. Their deltaSE values were already
   verified in Stage 3A tests (FIXTURE-PED-01 through -04 in stage3a-opchar.test.js).
   Here we verify the data structure only.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 11: CHANGE_PED_HOLD_M presets (structure only) ===');

assert('T-PEDM-01', CHANGE_PED_HOLD_M_EXPERIMENT.fixedM === 100, 'CHANGE_PED_HOLD_M: fixedM = 100');
assert('T-PEDM-02', Array.isArray(CHANGE_PED_HOLD_M_EXPERIMENT.presets) && CHANGE_PED_HOLD_M_EXPERIMENT.presets.length === 4, 'CHANGE_PED_HOLD_M: 4 presets');
const presets = CHANGE_PED_HOLD_M_EXPERIMENT.presets;
assert('T-PEDM-03', presets.every(p => p.ruleIds[0] === '13s' && p.N === 1), 'All presets: ruleIds=["13s"], N=1');
assert('T-PEDM-04', presets[0].deltaSE === 3.000, 'Preset 0: deltaSE=3.000 (Ped≈0.50)');
assert('T-PEDM-05', presets[1].deltaSE === 3.674, 'Preset 1: deltaSE=3.674 (Ped≈0.75)');
assert('T-PEDM-06', presets[2].deltaSE === 4.282, 'Preset 2: deltaSE=4.282 (Ped≈0.90)');
assert('T-PEDM-07', presets[3].deltaSE === 5.326, 'Preset 3: deltaSE=5.326 (Ped≈0.99)');
assert('T-PEDM-08', presets.map(p => p.label).join('|').includes('0.50') && presets.map(p => p.label).join('|').includes('0.99'), 'Presets labelled 0.50 to 0.99');

/* -----------------------------------------------------------------------
   SECTION 12: QUADRANT MATRIX (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 12: Quadrant matrix ===');

assert('T-QUAD-01', Array.isArray(QUADRANT_MATRIX) && QUADRANT_MATRIX.length === 4, 'QUADRANT_MATRIX: 4 quadrants');
const quadIds = QUADRANT_MATRIX.map(q => q.id);
assert('T-QUAD-02', quadIds.includes('high-frequent'), 'Quadrant: high-frequent');
assert('T-QUAD-03', quadIds.includes('high-infrequent'), 'Quadrant: high-infrequent');
assert('T-QUAD-04', quadIds.includes('low-frequent'), 'Quadrant: low-frequent');
assert('T-QUAD-05', quadIds.includes('low-infrequent'), 'Quadrant: low-infrequent');
assert('T-QUAD-06', QUADRANT_MATRIX.every(q => q.pedLevel && q.frequencyLevel && q.label && q.discussion), 'All quadrants have required fields');
assert('T-QUAD-07', typeof QUADRANT_MATRIX_NOTE === 'string' && QUADRANT_MATRIX_NOTE.includes('teaching aid'), 'QUADRANT_MATRIX_NOTE labels it as teaching aid');
assert('T-QUAD-08', QUADRANT_MATRIX_NOTE.includes('not a scoring system with one universally correct quadrant'), 'Quadrant note: not a scoring system, no universally correct quadrant');

/* -----------------------------------------------------------------------
   SECTION 13: CHALLENGE BANK — complete structural inventory (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 13: Frequency Challenge Bank ===');

assert('T-CHAL-01', Array.isArray(FREQUENCY_CHALLENGE_CASES) && FREQUENCY_CHALLENGE_CASES.length === 10, 'FREQUENCY_CHALLENGE_CASES: exactly 10 cases');

// All IDs unique and sequential 1-10
const caseIds = FREQUENCY_CHALLENGE_CASES.map(c => c.id);
assert('T-CHAL-02', new Set(caseIds).size === 10, 'All case IDs unique');
assert('T-CHAL-03', caseIds.every((id, i) => id === i + 1), 'Case IDs are 1-10 sequential');

// Required fields on every case
FREQUENCY_CHALLENGE_CASES.forEach(c => {
  assert(`T-CHAL-STRUCT-${c.id}`,
    typeof c.title === 'string' &&
    typeof c.scenario === 'string' &&
    Array.isArray(c.correctWhatChanged) &&
    typeof c.correctLikelyEffect === 'string' &&
    typeof c.whatRemainedUnchanged === 'string' &&
    typeof c.effectOnDetection === 'string' &&
    typeof c.effectOnExposure === 'string' &&
    typeof c.whatModelCanEstimate === 'string' &&
    typeof c.whatModelCannotEstimate === 'string' &&
    typeof c.nextConsideration === 'string',
    `Case ${c.id}: all required fields present`);
});

// Source-grounded: correctWhatChanged and correctLikelyEffect values
assert('T-CHAL-C01', FREQUENCY_CHALLENGE_CASES[0].correctWhatChanged[0] === 'm' && FREQUENCY_CHALLENGE_CASES[0].correctLikelyEffect === 'exposure', 'Case 1: m changed, exposure effect');
assert('T-CHAL-C02', FREQUENCY_CHALLENGE_CASES[1].correctWhatChanged[0] === 'm' && FREQUENCY_CHALLENGE_CASES[1].correctLikelyEffect === 'exposure', 'Case 2: m changed, exposure effect');
assert('T-CHAL-C03', FREQUENCY_CHALLENGE_CASES[2].correctWhatChanged[0] === 'm' && FREQUENCY_CHALLENGE_CASES[2].correctLikelyEffect === 'exposure', 'Case 3: m changed, exposure effect');
assert('T-CHAL-C04', FREQUENCY_CHALLENGE_CASES[3].correctWhatChanged[0] === 'n' && FREQUENCY_CHALLENGE_CASES[3].correctLikelyEffect === 'detection', 'Case 4: n changed, detection effect');
assert('T-CHAL-C05', FREQUENCY_CHALLENGE_CASES[4].correctWhatChanged[0] === 'r' && FREQUENCY_CHALLENGE_CASES[4].correctLikelyEffect === 'insufficient', 'Case 5: r changed, insufficient info');
assert('T-CHAL-C06', FREQUENCY_CHALLENGE_CASES[5].correctWhatChanged[0] === 'm', 'Case 6: m changed');
assert('T-CHAL-C07', FREQUENCY_CHALLENGE_CASES[6].correctWhatChanged[0] === 'm', 'Case 7: m changed');
assert('T-CHAL-C08', FREQUENCY_CHALLENGE_CASES[7].correctWhatChanged[0] === 'm', 'Case 8: m changed');
assert('T-CHAL-C09', FREQUENCY_CHALLENGE_CASES[8].correctWhatChanged[0] === 'm', 'Case 9: m changed');
assert('T-CHAL-C10', FREQUENCY_CHALLENGE_CASES[9].correctWhatChanged[0] === 'insufficient' && FREQUENCY_CHALLENGE_CASES[9].correctLikelyEffect === 'insufficient', 'Case 10: insufficient information');

// Misconception flags: cases 2,4,5,6,8,9 have them; others may not
assert('T-CHAL-MISC-02', FREQUENCY_CHALLENGE_CASES[1].misconceptionFlag === 'high-sigma-frequency', 'Case 2 misconceptionFlag: high-sigma-frequency');
assert('T-CHAL-MISC-04', FREQUENCY_CHALLENGE_CASES[3].misconceptionFlag === 'n-vs-m', 'Case 4 misconceptionFlag: n-vs-m');
assert('T-CHAL-MISC-05', FREQUENCY_CHALLENGE_CASES[4].misconceptionFlag === 'r-vs-m', 'Case 5 misconceptionFlag: r-vs-m');
assert('T-CHAL-MISC-06', FREQUENCY_CHALLENGE_CASES[5].misconceptionFlag === 'startup-sufficiency', 'Case 6 misconceptionFlag: startup-sufficiency');
assert('T-CHAL-MISC-08', FREQUENCY_CHALLENGE_CASES[7].misconceptionFlag === 'high-sigma-frequency', 'Case 8 misconceptionFlag: high-sigma-frequency');
assert('T-CHAL-MISC-09', FREQUENCY_CHALLENGE_CASES[8].misconceptionFlag === 'frequency-fixes-performance', 'Case 9 misconceptionFlag: frequency-fixes-performance');

// "Cannot estimate" fields preserve the MaxE(Nuf) boundary in source data
assert('T-CHAL-MAXE-01', FREQUENCY_CHALLENGE_CASES[0].whatModelCannotEstimate.includes('MaxE(Nuf)'), 'Case 1 whatModelCannotEstimate preserves MaxE(Nuf) boundary');
assert('T-CHAL-MAXE-05', FREQUENCY_CHALLENGE_CASES[4].whatModelCannotEstimate.includes('not implemented'), 'Case 5 confirms multirule not implemented');

/* -----------------------------------------------------------------------
   SECTION 14: OPTION LISTS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 14: Option lists ===');

assert('T-OPT-01', Array.isArray(WHAT_CHANGED_OPTIONS) && WHAT_CHANGED_OPTIONS.length === 7, 'WHAT_CHANGED_OPTIONS: 7 entries');
const wcoIds = WHAT_CHANGED_OPTIONS.map(o => o.id);
assert('T-OPT-02', ['procedure','n','r','m','performance','multiple','insufficient'].every(id => wcoIds.includes(id)), 'WHAT_CHANGED_OPTIONS has all 7 expected IDs');

assert('T-OPT-03', Array.isArray(LIKELY_EFFECT_OPTIONS) && LIKELY_EFFECT_OPTIONS.length === 5, 'LIKELY_EFFECT_OPTIONS: 5 entries');
const leoIds = LIKELY_EFFECT_OPTIONS.map(o => o.id);
assert('T-OPT-04', ['detection','exposure','both','neither','insufficient'].every(id => leoIds.includes(id)), 'LIKELY_EFFECT_OPTIONS has all 5 expected IDs');

/* -----------------------------------------------------------------------
   SECTION 15: FAILURE ONSET MODES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 15: Failure onset modes ===');

assert('T-ONSET-01', Array.isArray(FAILURE_ONSET_MODES) && FAILURE_ONSET_MODES.length === 2, 'FAILURE_ONSET_MODES: 2 modes');
assert('T-ONSET-02', FAILURE_ONSET_MODES[0].id === 'immediate', 'Mode A: id=immediate');
assert('T-ONSET-03', FAILURE_ONSET_MODES[1].id === 'uniform', 'Mode B: id=uniform');
assert('T-ONSET-04', FAILURE_ONSET_MODES[0].caution.includes('not the universal Parvin model'), 'Mode A caution: not Parvin');
assert('T-ONSET-05', FAILURE_ONSET_MODES[1].caution.includes('not the universal Parvin model'), 'Mode B caution: not Parvin');

/* -----------------------------------------------------------------------
   SECTION 16: FREQUENCY DESIGNER DEFAULTS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 16: Frequency designer defaults ===');

assert('T-FDD-01', FREQUENCY_DESIGNER_DEFAULTS.N === 2, 'Designer default N=2');
assert('T-FDD-02', FREQUENCY_DESIGNER_DEFAULTS.R === 1, 'Designer default R=1');
assert('T-FDD-03', FREQUENCY_DESIGNER_DEFAULTS.M === 100, 'Designer default M=100');
assert('T-FDD-04', FREQUENCY_DESIGNER_DEFAULTS.deltaSE === 2, 'Designer default deltaSE=2');
assert('T-FDD-05', FREQUENCY_DESIGNER_DEFAULTS.onsetMode === 'immediate', 'Designer default onsetMode=immediate');

/* -----------------------------------------------------------------------
   SECTION 17: SHIFT OPTIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 17: Shift options ===');

assert('T-SHIFT-01', Array.isArray(SHIFT_OPTIONS_SD) && SHIFT_OPTIONS_SD.length === 5, 'SHIFT_OPTIONS_SD: 5 entries');
assert('T-SHIFT-02', SHIFT_OPTIONS_SD[0] === 0.5 && SHIFT_OPTIONS_SD[4] === 4, 'SHIFT_OPTIONS_SD: 0.5 to 4 SD');
assert('T-SHIFT-03', SHIFT_CAUSE_CAUTION.includes('never automatically equates'), 'SHIFT_CAUSE_CAUTION: never equates shift to cause');
assert('T-SHIFT-04', SYNTHETIC_SHIFT_INTRODUCED_TEXT === 'Synthetic systematic shift introduced.', 'SYNTHETIC_SHIFT_INTRODUCED_TEXT exact');

/* -----------------------------------------------------------------------
   SECTION 18: WORKED NOMOGRAM EXAMPLE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 18: Worked nomogram example ===');

assert('T-NOM-01', typeof WORKED_NOMOGRAM_EXAMPLE === 'object' && WORKED_NOMOGRAM_EXAMPLE !== null, 'WORKED_NOMOGRAM_EXAMPLE present');
assert('T-NOM-02', WORKED_NOMOGRAM_EXAMPLE.formulaAsPublished.includes('100 / MaxE(Nuf)'), 'Formula: 100/MaxE(Nuf) preserved');
assert('T-NOM-03', WORKED_NOMOGRAM_EXAMPLE.cautionAgainstGeneralisation.includes('not a universal law'), 'Caution: formula not universal law');
assert('T-NOM-04', NOMOGRAM_CONCEPT_NOTE.includes('does not reproduce or copy any published nomogram'), 'Nomogram note: no reproduction claimed');

/* -----------------------------------------------------------------------
   SECTION 19: ANPed NOTE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 19: ANPed note ===');

assert('T-ANPED-01', typeof ANPED_NOTE === 'string' && ANPED_NOTE.includes('ANPed'), 'ANPED_NOTE present and mentions ANPed');
assert('T-ANPED-02', ANPED_NOTE.includes('not claimed to be numerically identical'), 'ANPed not claimed as numerically identical');
assert('T-ANPED-03', ANPED_NOTE.includes('restricted to the validated single-rule'), 'ANPed: restricted to single-rule');

/* -----------------------------------------------------------------------
   SECTION 20: FREQUENCY EXPOSURE LAB (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION 20: Frequency exposure lab ===');

assert('T-FEL-01', FREQUENCY_EXPOSURE_LAB.strategyA.M === 50, 'Strategy A: M=50');
assert('T-FEL-02', FREQUENCY_EXPOSURE_LAB.strategyB.M === 500, 'Strategy B: M=500');
assert('T-FEL-03', Array.isArray(FREQUENCY_EXPOSURE_LAB.questions) && FREQUENCY_EXPOSURE_LAB.questions.length === 3, 'Exposure lab: 3 questions');
assert('T-FEL-04', FREQUENCY_EXPOSURE_LAB.questions[0].a === 'No.', 'Q1 answer: No (rule did not change)');
assert('T-FEL-05', FREQUENCY_EXPOSURE_LAB.teachingPoint.includes('inappropriate frequency'), 'Teaching point: inappropriate frequency');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
const sourceGrounded = 79;  // Approximate count of assertions with direct HTML authority
const reconstructed = total - sourceGrounded;

console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 4B Risk Data Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded test expectations: ~${sourceGrounded}`);
console.log(`  Reconstructed test expectations: ~${reconstructed}`);
if (failed > 0) {
  console.error('STAGE 4B FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 4B PASSED — all tests green.');
  process.exit(0);
}
