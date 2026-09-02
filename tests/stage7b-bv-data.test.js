/* =========================================================================
   tests/stage7b-bv-data.test.js

   NEW RECOVERY TESTS — Stage 7B (NOT the historical test suite)
   Tests for the recovered BV & RCV static data module in src/bv/data.js.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)
   SOURCE MODULE: Artifact Class A — src/bv/data.js (HTML lines 10734-11301)
   CROSS-LAYER ENGINE: src/bv/calc.js (Stage 7A, frozen)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED: exact IDs, exact counts, exact answer keys, exact
     strings, exact field names/order, exact source values and nulls,
     exact distribution tags — all directly encoded in HTML source.
   RECONSTRUCTED: cross-layer numerical consistency checks using Stage 7A
     calc engine; uniqueness/architecture checks; absence tests.

   CROSS-LAYER HARD-CODED REFERENCE VALUES (independently verified):
     Classical RCV(CVA=2, CVI=6, z=1.96) = 17.53077294359835 %
     Classical RCV(CVA=6, CVI=6, z=1.96) = 23.52 %
     Classical RCV(CVA=3, CVI=6, z=1.96) = 18.59419264179007 %
     Classical RCV(CVA=5, CVI=6, z=1.96) = 21.64890759368703 %
     Classical RCV(CVA=1, CVI=6, z=1.96) = 16.860557523403546 %
     LN RCV increase(CVA=2, CVI=6, z=1.96) = 19.14044252346827 %
     II(CVI=6, CVG=6) = 1.0
     II(CVI=6, CVG=12) = 0.5
     II(CVI=6, CVG=24) = 0.25

   Run: node tests/stage7b-bv-data.test.js
   ========================================================================= */

'use strict';

const d = require('../src/bv/data');
const calc = require('../src/bv/calc');

const {
  BV_PATHWAY_STEPS, BV_PATHWAY_CAUTION, MANDATORY_LESSONS,
  BV_SYMBOL_GLOSSARY, BV_SYMBOL_DISCIPLINE_NOTE,
  COMPONENT_QUESTION_PANEL, CVG_NOT_IN_RCV_STATEMENT,
  CVG_SIGNATURE_EXPERIMENT, BV_ESTIMATE_FIELDS,
  BV_MISSING_FIELDS_STAY_MISSING_NOTE, BV_ESTIMATES_NOT_CONSTANTS_NOTE,
  EFLM_BV_DATABASE_REFERENCE, BIVAC_QUALITY_ITEMS, BIVAC_TEACHING_NOTE,
  BIVAC_MISCONCEPTION_EXERCISE, TRANSPORTABILITY_HEALTHY_POPULATION_GUARDRAIL,
  TRANSPORTABILITY_TIME_SCALE_GUARDRAIL, BIOLOGICAL_RHYTHMS_NOTE,
  II_HEURISTIC_CAUTION, RI_VS_RCV_SIGNATURE_CASES, APS_VS_RCV_DISTINCTION_PANEL,
  CVA_SUBSTITUTION_TRAP_CASE, RCV_NOT_DIAGNOSTIC_CUTOFF_STATEMENT,
  PREANALYTICAL_TRAP_SCENARIO, DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO,
  SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO,
  BV_DATASET, PROVENANCE_CARD_FIELDS, BV_LEVEL_EXPLANATION,
  SERIAL_RESULT_CHALLENGE_CASES, BV_WORKFLOW_QUESTIONS,
  BV_REASONING_DIMENSIONS, BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE
} = d;

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const near = (a, b, tol = 0.00001) =>
  typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol;

/* -----------------------------------------------------------------------
   SECTION A: MODULE ARCHITECTURE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Module architecture ===');

assert('A-01', Object.keys(d).length === 33, 'Exactly 33 exports', 'rc');
assert('A-02', Object.keys(d).filter(k => typeof d[k] === 'function').length === 0, 'Zero exported functions', 'sg');

const srcText = require('fs').readFileSync(require('path').join(__dirname, '../src/bv/data.js'), 'utf8');
assert('A-03', !srcText.match(/import React|from ['"]react['"]/), 'No React import', 'rc');
assert('A-04', !srcText.match(/className=/), 'No JSX className', 'rc');
assert('A-05', !srcText.match(/calculateClassicalRcv|calculateLognormalRcv|calculateIndexOfIndividuality/), 'No formula duplication from calc module', 'rc');
assert('A-06', !srcText.match(/fetch\(|axios\.|http\.get|database\.query/), 'No API/database client', 'rc');
assert('A-07', !('scoreBivac' in d) && !('calculateBivac' in d), 'No BIVAC scoring engine', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: PATHWAY AND LESSONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Pathway and lessons ===');

assert('B-01', Array.isArray(BV_PATHWAY_STEPS) && BV_PATHWAY_STEPS.length === 8, 'BV_PATHWAY_STEPS: 8 steps', 'sg');
assert('B-02', BV_PATHWAY_STEPS[0].toLowerCase().includes('understand') || BV_PATHWAY_STEPS[0].includes('variation') || BV_PATHWAY_STEPS[0].includes('Understand'), 'Step 0: Understand variation', 'sg');
assert('B-03', BV_PATHWAY_STEPS[7].toLowerCase().includes('limit'), 'Step 7: State limitations', 'sg');
assert('B-04', typeof BV_PATHWAY_CAUTION === 'string' && BV_PATHWAY_CAUTION.length > 0, 'BV_PATHWAY_CAUTION present', 'sg');
assert('B-05', Array.isArray(MANDATORY_LESSONS) && MANDATORY_LESSONS.length === 2, 'MANDATORY_LESSONS: 2 items', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: SYMBOL DISCIPLINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Symbol discipline ===');

assert('C-01', Array.isArray(BV_SYMBOL_GLOSSARY) && BV_SYMBOL_GLOSSARY.length === 3, 'BV_SYMBOL_GLOSSARY: 3 entries', 'sg');
assert('C-02', BV_SYMBOL_GLOSSARY[0].symbol === 'CVA', 'Glossary[0].symbol: CVA', 'sg');
assert('C-03', BV_SYMBOL_GLOSSARY[1].symbol === 'CVI', 'Glossary[1].symbol: CVI', 'sg');
assert('C-04', BV_SYMBOL_GLOSSARY[2].symbol === 'CVG', 'Glossary[2].symbol: CVG', 'sg');
assert('C-05', typeof BV_SYMBOL_DISCIPLINE_NOTE === 'string' && BV_SYMBOL_DISCIPLINE_NOTE.length > 0, 'BV_SYMBOL_DISCIPLINE_NOTE present', 'sg');
assert('C-06', Array.isArray(COMPONENT_QUESTION_PANEL) && COMPONENT_QUESTION_PANEL.length === 3, 'COMPONENT_QUESTION_PANEL: 3 entries', 'sg');
assert('C-07', typeof CVG_NOT_IN_RCV_STATEMENT === 'string' && CVG_NOT_IN_RCV_STATEMENT.length > 0, 'CVG_NOT_IN_RCV_STATEMENT present', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: CVG SIGNATURE EXPERIMENT (source-grounded + reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: CVG signature experiment ===');

assert('D-01', CVG_SIGNATURE_EXPERIMENT.fixedCva === 2, 'CVG_SIGNATURE_EXPERIMENT.fixedCva = 2', 'sg');
assert('D-02', CVG_SIGNATURE_EXPERIMENT.fixedCvi === 6, 'CVG_SIGNATURE_EXPERIMENT.fixedCvi = 6', 'sg');
assert('D-03', JSON.stringify(CVG_SIGNATURE_EXPERIMENT.cvgSteps) === JSON.stringify([6, 12, 24]), 'cvgSteps = [6, 12, 24]', 'sg');

// Cross-layer: authored II values confirmed using Stage 7A engine
// Hard-coded: II(6,6)=1.0, II(6,12)=0.5, II(6,24)=0.25
const ii_66 = calc.calculateIndexOfIndividuality(6, 6);
const ii_612 = calc.calculateIndexOfIndividuality(6, 12);
const ii_624 = calc.calculateIndexOfIndividuality(6, 24);
assert('D-04', near(ii_66.value, 1.0), 'II(CVI=6,CVG=6) = 1.0 [hard-coded: 6/6]', 'rc');
assert('D-05', near(ii_612.value, 0.5), 'II(CVI=6,CVG=12) = 0.5 [hard-coded: 6/12]', 'rc');
assert('D-06', near(ii_624.value, 0.25), 'II(CVI=6,CVG=24) = 0.25 [hard-coded: 6/24]', 'rc');

// Cross-layer: classical RCV unchanged regardless of CVG (no CVG parameter)
// Hard-coded: classical RCV(2,6,bi) = 17.53077294359835
const RCV_2_6 = 17.53077294359835;
const rcv_a = calc.calculateClassicalRcv(2, 6, 'bidirectional-95');
const rcv_b = calc.calculateClassicalRcv(2, 6, 'bidirectional-95'); // same, no CVG
assert('D-07', near(rcv_a.value, RCV_2_6) && near(rcv_b.value, RCV_2_6), 'Classical RCV(2,6) = 17.53077294359835 unchanged regardless of CVG', 'rc');
assert('D-08', !('cvg' in (rcv_a.inputs || {})), 'Classical RCV has no CVG input field', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: BV ESTIMATE MODEL (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: BV estimate model ===');

assert('E-01', Array.isArray(BV_ESTIMATE_FIELDS) && BV_ESTIMATE_FIELDS.length === 18, 'BV_ESTIMATE_FIELDS: 18 fields', 'sg');
const fieldIds = BV_ESTIMATE_FIELDS.map(f => f.field || f.id || f);
const expectedFields = ['id','measurand','matrix','population','healthStatus','samplingInterval',
  'studyTimeScale','cvi','cviCI','cvg','cvgCI','sourceType','sourceCitation',
  'bivacStatus','metaAnalysisStatus','databaseSnapshotDate','notes','transportabilityCautions'];
expectedFields.forEach((fid, i) => {
  assert(`E-02-${fid}`, fieldIds[i] === fid, `BV_ESTIMATE_FIELDS[${i}]: ${fid}`, 'sg');
});
assert('E-03', BV_MISSING_FIELDS_STAY_MISSING_NOTE.length > 0, 'BV_MISSING_FIELDS_STAY_MISSING_NOTE present', 'sg');
assert('E-04', BV_ESTIMATES_NOT_CONSTANTS_NOTE.length > 0, 'BV_ESTIMATES_NOT_CONSTANTS_NOTE present', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: EFLM REFERENCE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: EFLM database reference ===');

assert('F-01', typeof EFLM_BV_DATABASE_REFERENCE === 'object' && EFLM_BV_DATABASE_REFERENCE !== null, 'EFLM_BV_DATABASE_REFERENCE present', 'sg');
assert('F-02', typeof EFLM_BV_DATABASE_REFERENCE.link === 'string' && EFLM_BV_DATABASE_REFERENCE.link.length > 0, 'EFLM_BV_DATABASE_REFERENCE has link', 'sg');
// No live query
assert('F-03', !srcText.includes('fetch(EFLM') && !srcText.includes('axios.get(EFLM'), 'No live EFLM database query', 'rc');
assert('F-04', BV_ESTIMATES_NOT_CONSTANTS_NOTE.includes('snapshot') || BV_ESTIMATES_NOT_CONSTANTS_NOTE.includes('deterministic') || BV_ESTIMATES_NOT_CONSTANTS_NOTE.includes('authored'), 'Data is deterministic authored content', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: BIVAC (source-grounded + reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: BIVAC ===');

assert('G-01', Array.isArray(BIVAC_QUALITY_ITEMS) && BIVAC_QUALITY_ITEMS.length === 14, 'BIVAC_QUALITY_ITEMS: 14 items', 'sg');
assert('G-02', typeof BIVAC_TEACHING_NOTE === 'string' && BIVAC_TEACHING_NOTE.length > 0, 'BIVAC_TEACHING_NOTE present', 'sg');
assert('G-03', typeof BIVAC_MISCONCEPTION_EXERCISE === 'object', 'BIVAC_MISCONCEPTION_EXERCISE present', 'sg');
// Misconception: smaller CVI ≠ more reliable
assert('G-04', BIVAC_MISCONCEPTION_EXERCISE.correctAnswer === false || BIVAC_MISCONCEPTION_EXERCISE.correctAnswer === 'no' || (BIVAC_MISCONCEPTION_EXERCISE.correctAnswer && BIVAC_MISCONCEPTION_EXERCISE.correctAnswer.toString().toLowerCase().includes('no')), 'BIVAC misconception: smaller CVI ≠ more reliable', 'sg');
// No BIVAC scoring
assert('G-05', typeof d.scoreBivac === 'undefined' && typeof d.calculateBivacGrade === 'undefined', 'No BIVAC scoring function', 'rc');

/* -----------------------------------------------------------------------
   SECTION H: TRANSPORTABILITY DOCTRINE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: Transportability doctrine ===');

assert('H-01', TRANSPORTABILITY_HEALTHY_POPULATION_GUARDRAIL.length > 0, 'TRANSPORTABILITY_HEALTHY_POPULATION_GUARDRAIL present', 'sg');
assert('H-02', TRANSPORTABILITY_TIME_SCALE_GUARDRAIL.length > 0, 'TRANSPORTABILITY_TIME_SCALE_GUARDRAIL present', 'sg');
assert('H-03', typeof BIOLOGICAL_RHYTHMS_NOTE === 'string' && BIOLOGICAL_RHYTHMS_NOTE.length > 0, 'BIOLOGICAL_RHYTHMS_NOTE present', 'sg');
assert('H-04', typeof DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO === 'object', 'DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO present', 'sg');
assert('H-05', typeof SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO === 'object', 'SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO present', 'sg');
assert('H-06', typeof PREANALYTICAL_TRAP_SCENARIO === 'object', 'PREANALYTICAL_TRAP_SCENARIO present', 'sg');
assert('H-07', II_HEURISTIC_CAUTION.length > 0, 'II_HEURISTIC_CAUTION present', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: RI-VS-RCV (source-grounded + reconstructed cross-layer)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: RI vs RCV ===');

assert('I-01', typeof RI_VS_RCV_SIGNATURE_CASES === 'object' && 'caseA' in RI_VS_RCV_SIGNATURE_CASES && 'caseB' in RI_VS_RCV_SIGNATURE_CASES, 'RI_VS_RCV_SIGNATURE_CASES has caseA and caseB', 'sg');

const riCase_A = RI_VS_RCV_SIGNATURE_CASES.caseA;
const riCase_B = RI_VS_RCV_SIGNATURE_CASES.caseB;

// Case A: 80→100 inside RI, change=25%, exceeds RCV
assert('I-02', riCase_A.previousResult === 80 && riCase_A.currentResult === 100, 'Case A: previousResult=80, currentResult=100', 'sg');
assert('I-03', RI_VS_RCV_SIGNATURE_CASES.referenceInterval.low === 70 && RI_VS_RCV_SIGNATURE_CASES.referenceInterval.high === 110, 'RI = 70-110', 'sg');

// Cross-layer: relative change = (100-80)/80*100 = 25%
const relA = calc.calculateSerialRelativeChange(riCase_A.previousResult, riCase_A.currentResult);
assert('I-04', relA.supported && near(relA.value, 25.0), 'Case A: relative change = 25.0% [hard-coded: 20/80*100]', 'rc');

// Classical RCV(2,6,bi) = 17.53077294359835; 25% > 17.53% → exceeds
const excA = calc.evaluateClassicalRcvExceedance(riCase_A.previousResult, riCase_A.currentResult, RI_VS_RCV_SIGNATURE_CASES.cva, RI_VS_RCV_SIGNATURE_CASES.cvi, RI_VS_RCV_SIGNATURE_CASES.zConventionId);
assert('I-05', excA.supported && excA.exceeds === true, 'Case A: 25% change > RCV 17.53% → exceeds', 'rc');

// Case B: 112→114 outside RI, change≈1.79%, does NOT exceed RCV
assert('I-06', riCase_B.previousResult === 112 && riCase_B.currentResult === 114, 'Case B: previousResult=112, currentResult=114', 'sg');
assert('I-07', RI_VS_RCV_SIGNATURE_CASES.referenceInterval.low === 70 && RI_VS_RCV_SIGNATURE_CASES.referenceInterval.high === 110, 'Case B: RI = 70-110 (same interval)', 'sg');

const relB = calc.calculateSerialRelativeChange(riCase_B.previousResult, riCase_B.currentResult);
assert('I-08', relB.supported && near(relB.value, 100*(114-112)/112, 0.001), 'Case B: relative change ≈ 1.786% [hard-coded: 2/112*100]', 'rc');

const excB = calc.evaluateClassicalRcvExceedance(riCase_B.previousResult, riCase_B.currentResult, RI_VS_RCV_SIGNATURE_CASES.cva, RI_VS_RCV_SIGNATURE_CASES.cvi, RI_VS_RCV_SIGNATURE_CASES.zConventionId);
assert('I-09', excB.supported && excB.exceeds === false, 'Case B: 1.79% change < RCV 17.53% → does not exceed', 'rc');

// RI and RCV statuses are independent
assert('I-10', excA.exceeds === true, 'Case A: both inside RI yet exceeds RCV (independence confirmed)', 'rc');
assert('I-11', excB.exceeds === false, 'Case B: both outside RI yet does not exceed RCV (independence confirmed)', 'rc');

/* -----------------------------------------------------------------------
   SECTION J: APS-VS-RCV (source-grounded + reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: APS vs RCV ===');

assert('J-01', typeof APS_VS_RCV_DISTINCTION_PANEL === 'object' && APS_VS_RCV_DISTINCTION_PANEL !== null, 'APS_VS_RCV_DISTINCTION_PANEL present', 'sg');
assert('J-02', typeof CVA_SUBSTITUTION_TRAP_CASE === 'object' && CVA_SUBSTITUTION_TRAP_CASE !== null, 'CVA_SUBSTITUTION_TRAP_CASE present', 'sg');
assert('J-03', CVA_SUBSTITUTION_TRAP_CASE.cvi === 6, 'CVA trap: cvi=6', 'sg');
assert('J-04', CVA_SUBSTITUTION_TRAP_CASE.desirableApsCva === 3, 'CVA trap: desirableApsCva=3', 'sg');
assert('J-05', CVA_SUBSTITUTION_TRAP_CASE.actualLabCva === 5, 'CVA trap: actualLabCva=5', 'sg');
assert('J-06', typeof RCV_NOT_DIAGNOSTIC_CUTOFF_STATEMENT === 'string' && RCV_NOT_DIAGNOSTIC_CUTOFF_STATEMENT.length > 0, 'RCV_NOT_DIAGNOSTIC_CUTOFF_STATEMENT present', 'sg');

// Cross-layer: hard-coded RCV values confirm substitution underestimates
// RCV(3,6,bi) = 18.59419264179007; RCV(5,6,bi) = 21.64890759368703
const RCV_3_6 = 18.59419264179007;
const RCV_5_6 = 21.64890759368703;
const rcvApsCva = calc.calculateClassicalRcv(3, 6, 'bidirectional-95');
const rcvActualCva = calc.calculateClassicalRcv(5, 6, 'bidirectional-95');
assert('J-07', near(rcvApsCva.value, RCV_3_6), 'Cross-layer: RCV(APS CVA=3,CVI=6) = 18.59419264179007', 'rc');
assert('J-08', near(rcvActualCva.value, RCV_5_6), 'Cross-layer: RCV(actual CVA=5,CVI=6) = 21.64890759368703', 'rc');
assert('J-09', rcvApsCva.value < rcvActualCva.value, 'Substituting APS CVA understates RCV (APS RCV < actual RCV)', 'rc');

/* -----------------------------------------------------------------------
   SECTION K: BV DATASET (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: BV dataset ===');

assert('K-01', Array.isArray(BV_DATASET) && BV_DATASET.length === 8, 'BV_DATASET: 8 records', 'sg');
const dsIds = BV_DATASET.map(r => r.id);
assert('K-02', new Set(dsIds).size === 8, 'All dataset IDs unique', 'rc');
['bv-1','bv-2','bv-3','bv-4','bv-5','bv-6','bv-7','bv-8'].forEach((id,i) => {
  assert(`K-03-${id}`, dsIds[i] === id, `Dataset[${i}]: ${id}`, 'sg');
});

// bv-1: CVA=2, CVI=6, CVG=12 (default illustrative)
const bv1 = BV_DATASET.find(r => r.id === 'bv-1');
assert('K-04', bv1.cva === 2 && bv1.cvi === 6 && bv1.cvg === 12, 'bv-1: CVA=2, CVI=6, CVG=12', 'sg');

// bv-4: TSH — CVA=null (snapshot, do not generalise)
const bv4 = BV_DATASET.find(r => r.id === 'bv-4');
assert('K-05', bv4.cva === null && bv4.cvi === 19 && bv4.cvg === 20, 'bv-4: CVA=null, CVI=19, CVG=20 (TSH snapshot)', 'sg');
assert('K-06', bv4.sourceType === 'literature-derived-snapshot', 'bv-4: sourceType = literature-derived-snapshot', 'sg');

// bv-5: CVG deliberately null
const bv5 = BV_DATASET.find(r => r.id === 'bv-5');
assert('K-07', bv5.cva === 2.5 && bv5.cvi === 8 && bv5.cvg === null, 'bv-5: CVA=2.5, CVI=8, CVG=null', 'sg');

// bv-6: CVA deliberately null
const bv6 = BV_DATASET.find(r => r.id === 'bv-6');
assert('K-08', bv6.cva === null && bv6.cvi === 7 && bv6.cvg === 10, 'bv-6: CVA=null, CVI=7, CVG=10', 'sg');

// bv-8: both CVI and CVG null (subgroup, no global pooled estimate)
const bv8 = BV_DATASET.find(r => r.id === 'bv-8');
assert('K-09', bv8.cvi === null && bv8.cvg === null, 'bv-8: CVI=null, CVG=null (no global estimate)', 'sg');
assert('K-10', bv8.sourceType === 'subgroup-records-no-global-pooled-estimate', 'bv-8: sourceType exact', 'sg');

// Cross-layer: bv-5 (CVG=null) → RCV computable, II unsupported
const bv5_rcv = calc.calculateClassicalRcv(bv5.cva, bv5.cvi, 'bidirectional-95');
const bv5_ii = calc.calculateIndexOfIndividuality(bv5.cvi, bv5.cvg);
assert('K-11', bv5_rcv.supported, 'bv-5 (CVG=null): RCV still computable from CVA+CVI', 'rc');
assert('K-12', bv5_ii.supported === false, 'bv-5 (CVG=null): II unsupported (CVG=null → cannot compute)', 'rc');

// Cross-layer: bv-6 (CVA=null) → RCV unsupported; do not treat CVA as zero
const bv6_rcv = calc.calculateClassicalRcv(bv6.cva, bv6.cvi, 'bidirectional-95');
assert('K-13', bv6_rcv.supported === false, 'bv-6 (CVA=null): RCV unsupported (never treat null as zero)', 'rc');

/* -----------------------------------------------------------------------
   SECTION L: PROVENANCE CARD AND LEARNER LEVELS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: Provenance card and learner levels ===');

assert('L-01', Array.isArray(PROVENANCE_CARD_FIELDS) && PROVENANCE_CARD_FIELDS.length === 8, 'PROVENANCE_CARD_FIELDS: 8 fields', 'sg');
const pcf = PROVENANCE_CARD_FIELDS.map(f => f.id || f);
['measurand','population','healthStatus','samplingInterval','sourceType','sourceCitation','bivacStatus','transportabilityCautions'].forEach((fid,i) => {
  assert(`L-02-${fid}`, pcf[i] === fid, `ProvenanceCardField[${i}]: ${fid}`, 'sg');
});

assert('L-03', typeof BV_LEVEL_EXPLANATION === 'object' && BV_LEVEL_EXPLANATION !== null, 'BV_LEVEL_EXPLANATION present', 'sg');
['beginner','intermediate','advanced','expert'].forEach(level => {
  assert(`L-04-${level}`, level in BV_LEVEL_EXPLANATION, `BV_LEVEL_EXPLANATION has ${level}`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION M: CHALLENGE BANK STRUCTURE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Challenge bank structure ===');

assert('M-01', Array.isArray(SERIAL_RESULT_CHALLENGE_CASES) && SERIAL_RESULT_CHALLENGE_CASES.length === 16, 'SERIAL_RESULT_CHALLENGE_CASES: 16 cases', 'sg');
const cIds = SERIAL_RESULT_CHALLENGE_CASES.map(c => c.id);
assert('M-02', new Set(cIds).size === 16, 'All challenge IDs unique', 'rc');

const expectedIds = [
  'case-ri-vs-rcv-inside', 'case-ri-vs-rcv-outside', 'case-analytical-imprecision-matters',
  'case-cvg-does-not-belong-in-rcv', 'case-cvg-changes-ii-not-rcv',
  'case-aps-target-substituted-incorrectly', 'case-healthy-to-disease',
  'case-sampling-interval-mismatch', 'case-preanalytical-confounding',
  'case-classical-vs-lognormal', 'case-missing-cvg', 'case-missing-cva',
  'case-limited-bv-evidence', 'case-database-no-global-estimate',
  'case-method-improves', 'case-different-patient-context'
];
expectedIds.forEach((id, i) => {
  assert(`M-03-${i}`, cIds[i] === id, `Challenge[${i}]: ${id}`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION N: EXACT ANSWER KEYS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: Exact answer keys ===');

const answerKeys = {
  'case-ri-vs-rcv-inside': 'yes',
  'case-ri-vs-rcv-outside': 'no',
  'case-analytical-imprecision-matters': 'no',
  'case-cvg-does-not-belong-in-rcv': 'excludes-cvg',
  'case-cvg-changes-ii-not-rcv': 'rcv-unchanged-ii-falls',
  'case-aps-target-substituted-incorrectly': 'actual-cva',
  'case-healthy-to-disease': 'no',
  'case-sampling-interval-mismatch': 'no',
  'case-preanalytical-confounding': 'no',
  'case-classical-vs-lognormal': 'classical-only',
  'case-missing-cvg': 'rcv-and-imprecision-aps-only',
  'case-missing-cva': 'no',
  'case-limited-bv-evidence': 'no',
  'case-database-no-global-estimate': 'no',
  'case-method-improves': 'no',
  'case-different-patient-context': 'yes'
};
const caseMap = Object.fromEntries(SERIAL_RESULT_CHALLENGE_CASES.map(c => [c.id, c]));
Object.entries(answerKeys).forEach(([id, expected]) => {
  assert(`N-01-${id}`, caseMap[id] && caseMap[id].correctAnswer === expected, `Answer key: ${id} → ${expected}`, 'sg');
});

/* -----------------------------------------------------------------------
   SECTION O: ANSWER KIND DISTRIBUTION (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: Answer kind distribution ===');

const kinds = SERIAL_RESULT_CHALLENGE_CASES.map(c => c.answerKind);
const kindCounts = {};
kinds.forEach(k => { kindCounts[k] = (kindCounts[k] || 0) + 1; });
assert('O-01', kindCounts['yes-no'] === 11, 'answerKind yes-no: 11 cases', 'sg');
assert('O-02', kindCounts['cvg-formula'] === 1, 'answerKind cvg-formula: 1 case', 'sg');
assert('O-03', kindCounts['rcv-ii-cvg'] === 1, 'answerKind rcv-ii-cvg: 1 case', 'sg');
assert('O-04', kindCounts['aps-cva-trap'] === 1, 'answerKind aps-cva-trap: 1 case', 'sg');
assert('O-05', kindCounts['classical-lognormal'] === 1, 'answerKind classical-lognormal: 1 case', 'sg');
assert('O-06', kindCounts['missing-scope'] === 1, 'answerKind missing-scope: 1 case', 'sg');

/* -----------------------------------------------------------------------
   SECTION P: CROSS-LAYER SCIENTIFIC VALIDATION (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION P: Cross-layer scientific validation ===');

// A. RI-vs-RCV inside: already done in I-04/I-05

// B. Analytical-imprecision case: CVA=6,CVI=6; 100→118; change=18%; RCV=23.52; 18<23.52 → no
// Hard-coded RCV(6,6,bi)=23.52
const RCV_6_6 = 23.52;
const excImp = calc.evaluateClassicalRcvExceedance(100, 118, 6, 6, 'bidirectional-95');
assert('P-01', excImp.supported && excImp.exceeds === false, 'Analytical-imprecision: 18% < RCV 23.52% → does not exceed', 'rc');
assert('P-02', near(calc.calculateClassicalRcv(6, 6, 'bidirectional-95').value, RCV_6_6, 0.001), 'RCV(6,6,bi) = 23.52 [hard-coded]', 'rc');

// C. CVG exclusion: RCV unchanged, II=0.5 for CVA=2,CVI=6,CVG=12
assert('P-03', near(calc.calculateClassicalRcv(2, 6, 'bidirectional-95').value, RCV_2_6), 'CVG exclusion: RCV(2,6) unchanged at 17.53077...', 'rc');
assert('P-04', near(calc.calculateIndexOfIndividuality(6, 12).value, 0.5), 'CVG exclusion: II(CVI=6,CVG=12) = 0.5', 'rc');

// D. Classical-vs-lognormal: CVA=2,CVI=6; 100→118.5; change=18.5%; classical=17.53%→exceeds; LN_inc=19.14%→does not exceed
// Hard-coded LN RCV(2,6,bi) increase = 19.14044252346827
const LN_INC_2_6 = 19.14044252346827;
const excCl = calc.evaluateClassicalRcvExceedance(100, 118.5, 2, 6, 'bidirectional-95');
const excLn = calc.evaluateLognormalRcvExceedance(100, 118.5, 2, 6, 'bidirectional-95');
assert('P-05', excCl.exceeds === true, 'Classical vs LN: 18.5% > classical 17.53% → exceeds classical', 'rc');
assert('P-06', excLn.exceeds === false, 'Classical vs LN: 18.5% < LN increase 19.14% → does not exceed LN', 'rc');
assert('P-07', near(calc.calculateLognormalRcv(2, 6, 'bidirectional-95').increase.value, LN_INC_2_6, 0.001), 'LN RCV(2,6,bi) increase = 19.14044252346827 [hard-coded]', 'rc');

// E. Missing-CVG: bv-5 (CVA=2.5,CVI=8,CVG=null) — RCV ok, imprecision APS ok, II fails, bias APS ok (cvgAvailable=false)
const bv5_aps = calc.calculateBvAps(bv5.cvi, bv5.cvg);
assert('P-08', bv5_aps.cvgAvailable === false, 'Missing CVG: cvgAvailable=false for bv-5', 'rc');
assert('P-09', bv5_aps.levels.optimum.imprecision.supported === true, 'Missing CVG: imprecision APS supported', 'rc');
assert('P-10', bv5_aps.levels.optimum.bias.supported === false, 'Missing CVG: bias APS unsupported', 'rc');

// F. Method-improves: CVA=1,CVI=6; 100→113; change=13%; RCV=16.86%; 13<16.86 → no
const RCV_1_6 = 16.860557523403546;
const excMethod = calc.evaluateClassicalRcvExceedance(100, 113, 1, 6, 'bidirectional-95');
assert('P-11', excMethod.exceeds === false, 'Method-improves: 13% < RCV 16.86% → does not exceed', 'rc');
assert('P-12', near(calc.calculateClassicalRcv(1, 6, 'bidirectional-95').value, RCV_1_6, 0.001), 'RCV(1,6,bi) = 16.860557523403546 [hard-coded]', 'rc');

/* -----------------------------------------------------------------------
   SECTION Q: WORKFLOW AND SCORING STRUCTURE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION Q: Workflow and scoring ===');

assert('Q-01', Array.isArray(BV_WORKFLOW_QUESTIONS) && BV_WORKFLOW_QUESTIONS.length === 8, 'BV_WORKFLOW_QUESTIONS: 8 questions', 'sg');
const qIds = BV_WORKFLOW_QUESTIONS.map(q => q.id);
['A','B','C','D','E','F','G','H'].forEach((id,i) => {
  assert(`Q-02-${id}`, qIds[i] === id, `WorkflowQuestion[${i}]: ${id}`, 'sg');
});
assert('Q-03', Array.isArray(BV_REASONING_DIMENSIONS) && BV_REASONING_DIMENSIONS.length === 5, 'BV_REASONING_DIMENSIONS: 5 dimensions', 'sg');
assert('Q-04', typeof BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE === 'string' && BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE.length > 0, 'BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE present', 'sg');
assert('Q-05', BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE.toLowerCase().includes('confidence') || BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE.toLowerCase().includes('score'), 'Confidence note references confidence/score', 'sg');

/* -----------------------------------------------------------------------
   SECTION R: NEGATIVE SAFEGUARDS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION R: Negative safeguards ===');

const forbidden = ['calculateBivac','scoreBivac','estimateCvi','estimateCvg','runAnova',
  'calculateReferenceInterval','autoCorrectPatientResult','generateRi','fetchEflm',
  'updateBvDatabase','calculateMeasurementUncertainty'];
forbidden.forEach(fn => {
  assert(`R-01-${fn}`, !(fn in d), `No forbidden function: ${fn}`, 'rc');
});
assert('R-02', !srcText.match(/fetch\(|http\.get\(|axios\./), 'No API client', 'rc');
assert('R-03', !srcText.match(/new XMLHttpRequest/), 'No XHR client', 'rc');

/* -----------------------------------------------------------------------
   SECTION S: SOURCE-FIDELITY REGRESSION (reconstructed)
   HTML lines 10734-11301 must exactly match src/bv/data.js body.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION S: Source-fidelity regression ===');

const _fs = require('fs'), _path = require('path');
const _htmlLines = _fs.readFileSync(_path.join(__dirname, '../recovery/original-v0.8.html'), 'utf8').split('\n');
const _authoritativeBlock = _htmlLines.slice(10733, 11301).join('\n') + '\n';
const _dataFull = _fs.readFileSync(_path.join(__dirname, '../src/bv/data.js'), 'utf8');
const _dataHeaderEnd = _dataFull.indexOf('\n\n') + 2;
const _dataBody = _dataFull.slice(_dataHeaderEnd);
assert('S-01', _authoritativeBlock === _dataBody,
  'src/bv/data.js body exactly matches HTML lines 10734-11301 (source fidelity)', 'rc');

/* -----------------------------------------------------------------------
   SECTION T: DISTRIBUTION-TAG REGRESSIONS (source-grounded)
   CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality verified against
   Stage 7A engine; RI_VS_RCV_SIGNATURE_CASES exact correct-answer strings.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION T: Distribution-tag regressions ===');

// CVG_SIGNATURE_EXPERIMENT: expectedIndexOfIndividuality hard-coded in source
assert('T-01', Array.isArray(CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality) && CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality.length === 3,
  'CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality: 3 entries', 'sg');
assert('T-02', CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality[0] === 1,
  'expectedII[0] = 1 (CVI=6, CVG=6) [hard-coded in source]', 'sg');
assert('T-03', CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality[1] === 0.5,
  'expectedII[1] = 0.5 (CVI=6, CVG=12) [hard-coded in source]', 'sg');
assert('T-04', CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality[2] === 0.25,
  'expectedII[2] = 0.25 (CVI=6, CVG=24) [hard-coded in source]', 'sg');

// Cross-engine validation: calc engine II values must match source-encoded expected values
const _ii_6_6 = calc.calculateIndexOfIndividuality(6, 6);
const _ii_6_12 = calc.calculateIndexOfIndividuality(6, 12);
const _ii_6_24 = calc.calculateIndexOfIndividuality(6, 24);
assert('T-05', _ii_6_6.supported && near(_ii_6_6.value, CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality[0]),
  'calc II(6,6) = 1.0 matches source-encoded expectedIndexOfIndividuality[0]', 'rc');
assert('T-06', _ii_6_12.supported && near(_ii_6_12.value, CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality[1]),
  'calc II(6,12) = 0.5 matches source-encoded expectedIndexOfIndividuality[1]', 'rc');
assert('T-07', _ii_6_24.supported && near(_ii_6_24.value, CVG_SIGNATURE_EXPERIMENT.expectedIndexOfIndividuality[2]),
  'calc II(6,24) = 0.25 matches source-encoded expectedIndexOfIndividuality[2]', 'rc');

// BV_DATASET sourceType distribution tags (source-grounded exact values)
const _st = Object.fromEntries(BV_DATASET.map(r => [r.id, r.sourceType]));
assert('T-08', _st['bv-1'] === 'illustrative-teaching-value', 'bv-1 sourceType: illustrative-teaching-value', 'sg');
assert('T-09', _st['bv-4'] === 'literature-derived-snapshot', 'bv-4 sourceType: literature-derived-snapshot', 'sg');
assert('T-10', _st['bv-7'] === 'single-small-study', 'bv-7 sourceType: single-small-study', 'sg');
assert('T-11', _st['bv-8'] === 'subgroup-records-no-global-pooled-estimate', 'bv-8 sourceType: subgroup-records-no-global-pooled-estimate', 'sg');

/* -----------------------------------------------------------------------
   SECTION U: EXACT PATHWAY / BIVAC / STATIC-TRUTH REGRESSIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION U: Exact pathway/BIVAC/static-truth regressions ===');

// BV_PATHWAY_STEPS: exact first and last steps
assert('U-01', BV_PATHWAY_STEPS[0] === 'Understand variation',
  'BV_PATHWAY_STEPS[0] = "Understand variation" (exact)', 'sg');
assert('U-02', BV_PATHWAY_STEPS[7] === 'State limitations',
  'BV_PATHWAY_STEPS[7] = "State limitations" (exact)', 'sg');

// BIVAC_QUALITY_ITEMS: all strings, exact first and last
assert('U-03', BIVAC_QUALITY_ITEMS.every(s => typeof s === 'string'),
  'BIVAC_QUALITY_ITEMS: all strings (no objects)', 'sg');
assert('U-04', BIVAC_QUALITY_ITEMS[0].startsWith('Study subjects:'),
  'BIVAC_QUALITY_ITEMS[0] starts with "Study subjects:"', 'sg');
assert('U-05', BIVAC_QUALITY_ITEMS[13].includes('independent appraisal'),
  'BIVAC_QUALITY_ITEMS[13] includes "independent appraisal"', 'sg');

// RI_VS_RCV_SIGNATURE_CASES exact correct-answer strings (source-grounded)
assert('U-06', RI_VS_RCV_SIGNATURE_CASES.caseA.correctAnswer === 'Yes.',
  'caseA correctAnswer = "Yes." (exact, with period)', 'sg');
assert('U-07', RI_VS_RCV_SIGNATURE_CASES.caseB.correctAnswer === 'No.',
  'caseB correctAnswer = "No." (exact, with period)', 'sg');
assert('U-08', RI_VS_RCV_SIGNATURE_CASES.caseA.id === 'ri-vs-rcv-case-a',
  'caseA id = "ri-vs-rcv-case-a" (exact)', 'sg');
assert('U-09', RI_VS_RCV_SIGNATURE_CASES.caseB.id === 'ri-vs-rcv-case-b',
  'caseB id = "ri-vs-rcv-case-b" (exact)', 'sg');

// EFLM_BV_DATABASE_REFERENCE exact link (source-grounded)
assert('U-10', EFLM_BV_DATABASE_REFERENCE.link === 'https://biologicalvariation.eu/',
  'EFLM link = "https://biologicalvariation.eu/" (exact)', 'sg');

// PROVENANCE_CARD_FIELDS: all plain strings (not objects)
assert('U-11', PROVENANCE_CARD_FIELDS.every(f => typeof f === 'string'),
  'PROVENANCE_CARD_FIELDS: all plain strings (not objects)', 'sg');
assert('U-12', PROVENANCE_CARD_FIELDS[0] === 'measurand',
  'PROVENANCE_CARD_FIELDS[0] = "measurand" (exact)', 'sg');
assert('U-13', PROVENANCE_CARD_FIELDS[7] === 'transportabilityCautions',
  'PROVENANCE_CARD_FIELDS[7] = "transportabilityCautions" (exact)', 'sg');

// CVA_SUBSTITUTION_TRAP_CASE: cvi not fixedCvi (structural discovery)
assert('U-14', CVA_SUBSTITUTION_TRAP_CASE.cvi === 6 && !('fixedCvi' in CVA_SUBSTITUTION_TRAP_CASE),
  'CVA trap uses .cvi=6 (not .fixedCvi) — field name confirmed', 'sg');


/* -----------------------------------------------------------------------
   SECTION V: FINAL SCIENTIFIC CORE FREEZE — Stage 7B
   Exact export order, distribution tags, pathway, lessons, component panel,
   EFLM structure, BIVAC array, scenario answers, dataset values,
   provenance card, learner levels, workflow prompts, reasoning dimensions.
   All assertions source-grounded against HTML lines 10734-11301.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION V: Final Scientific Core Freeze — Stage 7B ===');

// V-EXPORDER: exact 33-export order
const EXPECTED_BV_EXPORT_ORDER = [
  'BV_PATHWAY_STEPS','BV_PATHWAY_CAUTION','MANDATORY_LESSONS',
  'BV_SYMBOL_GLOSSARY','BV_SYMBOL_DISCIPLINE_NOTE','COMPONENT_QUESTION_PANEL',
  'CVG_NOT_IN_RCV_STATEMENT','CVG_SIGNATURE_EXPERIMENT','BV_ESTIMATE_FIELDS',
  'BV_MISSING_FIELDS_STAY_MISSING_NOTE','BV_ESTIMATES_NOT_CONSTANTS_NOTE',
  'EFLM_BV_DATABASE_REFERENCE','BIVAC_QUALITY_ITEMS','BIVAC_TEACHING_NOTE',
  'BIVAC_MISCONCEPTION_EXERCISE','TRANSPORTABILITY_HEALTHY_POPULATION_GUARDRAIL',
  'TRANSPORTABILITY_TIME_SCALE_GUARDRAIL','BIOLOGICAL_RHYTHMS_NOTE',
  'II_HEURISTIC_CAUTION','RI_VS_RCV_SIGNATURE_CASES','APS_VS_RCV_DISTINCTION_PANEL',
  'CVA_SUBSTITUTION_TRAP_CASE','RCV_NOT_DIAGNOSTIC_CUTOFF_STATEMENT',
  'PREANALYTICAL_TRAP_SCENARIO','DISEASE_POPULATION_TRANSPORTABILITY_SCENARIO',
  'SAMPLING_INTERVAL_TRANSPORTABILITY_SCENARIO','BV_DATASET','PROVENANCE_CARD_FIELDS',
  'BV_LEVEL_EXPLANATION','SERIAL_RESULT_CHALLENGE_CASES','BV_WORKFLOW_QUESTIONS',
  'BV_REASONING_DIMENSIONS','BV_CONFIDENCE_NEVER_ALTERS_SCORE_NOTE'
];
assert('V-EXPORDER', JSON.stringify(Object.keys(d)) === JSON.stringify(EXPECTED_BV_EXPORT_ORDER),
  'BV data.js: exact 33-export order matches HTML module.exports', 'sg');

// V-DIST: SERIAL_RESULT_CHALLENGE_CASES distribution-tag counts
const _srccDist = {};
SERIAL_RESULT_CHALLENGE_CASES.forEach(c => {
  (c.distribution || []).forEach(tag => { _srccDist[tag] = (_srccDist[tag]||0) + 1; });
});
assert('V-DIST-01', _srccDist['ri-vs-rcv'] === 2, 'SRCC dist: ri-vs-rcv = 2', 'sg');
assert('V-DIST-02', _srccDist['cva-cvi-cvg-distinction'] === 4, 'SRCC dist: cva-cvi-cvg-distinction = 4', 'sg');
assert('V-DIST-03', _srccDist['provenance-transportability'] === 5, 'SRCC dist: provenance-transportability = 5', 'sg');
assert('V-DIST-04', _srccDist['insufficient-information'] === 4, 'SRCC dist: insufficient-information = 4', 'sg');
assert('V-DIST-05', _srccDist['missing-component'] === 3, 'SRCC dist: missing-component = 3', 'sg');
assert('V-DIST-06', _srccDist['aps-vs-rcv-trap'] === 1, 'SRCC dist: aps-vs-rcv-trap = 1', 'sg');
assert('V-DIST-07', _srccDist['log-normal'] === 1, 'SRCC dist: log-normal = 1', 'sg');
assert('V-DIST-08', _srccDist['preanalytical'] === 1, 'SRCC dist: preanalytical = 1', 'sg');

// V-PATH: exact full BV pathway (all 8 steps)
assert('V-PATH-00', BV_PATHWAY_STEPS[0] === 'Understand variation', 'PATH[0] exact', 'sg');
assert('V-PATH-01', BV_PATHWAY_STEPS[1] === 'Identify CVA/CVI/CVG', 'PATH[1] exact', 'sg');
assert('V-PATH-02', BV_PATHWAY_STEPS[2] === 'Check data provenance', 'PATH[2] exact', 'sg');
assert('V-PATH-03', BV_PATHWAY_STEPS[3] === 'Assess individuality', 'PATH[3] exact', 'sg');
assert('V-PATH-04', BV_PATHWAY_STEPS[4] === 'Derive BV-based APS', 'PATH[4] exact', 'sg');
assert('V-PATH-05', BV_PATHWAY_STEPS[5] === 'Select an RCV model', 'PATH[5] exact', 'sg');
assert('V-PATH-06', BV_PATHWAY_STEPS[6] === 'Interpret serial change', 'PATH[6] exact', 'sg');
assert('V-PATH-07', BV_PATHWAY_STEPS[7] === 'State limitations', 'PATH[7] exact', 'sg');

// V-LESSONS: exact mandatory lessons (both strings)
assert('V-LESSONS-01', MANDATORY_LESSONS[0] === 'A population reference interval and a reference change value answer different questions.', 'MANDATORY_LESSONS[0] exact', 'sg');
assert('V-LESSONS-02', MANDATORY_LESSONS[1] === 'A change exceeding an RCV is not automatically a pathological, clinically important, or treatment-requiring change.', 'MANDATORY_LESSONS[1] exact', 'sg');

// V-CQP: exact component question panel (3 entries, exact text)
assert('V-CQP-00', COMPONENT_QUESTION_PANEL[0].component === 'CVA' &&
  COMPONENT_QUESTION_PANEL[0].question === 'How much does the measurement procedure itself add to the noise in a single result?',
  'CQP[0] CVA exact', 'sg');
assert('V-CQP-01', COMPONENT_QUESTION_PANEL[1].component === 'CVI' &&
  COMPONENT_QUESTION_PANEL[1].question.includes('matters for interpreting a change in ONE person over time'),
  'CQP[1] CVI exact', 'sg');
assert('V-CQP-02', COMPONENT_QUESTION_PANEL[2].component === 'CVG' &&
  COMPONENT_QUESTION_PANEL[2].question.includes('determines how useful a POPULATION reference interval is for THIS person'),
  'CQP[2] CVG exact', 'sg');

// V-EFLM: exact EFLM object keys and link
assert('V-EFLM-KEYS', JSON.stringify(Object.keys(EFLM_BV_DATABASE_REFERENCE)) === JSON.stringify(['name','informs','doesNotEstablish','link','linkLabel']),
  'EFLM keys exact: [name,informs,doesNotEstablish,link,linkLabel]', 'sg');
assert('V-EFLM-LINK', EFLM_BV_DATABASE_REFERENCE.link === 'https://biologicalvariation.eu/', 'EFLM link exact', 'sg');
assert('V-EFLM-LABEL', EFLM_BV_DATABASE_REFERENCE.linkLabel === 'biologicalvariation.eu — EFLM Biological Variation Database', 'EFLM linkLabel exact', 'sg');

// V-BIVAC: exact 14-item array (all strings, exact content spot-checks)
assert('V-BIVAC-00', BIVAC_QUALITY_ITEMS[0] === 'Study subjects: number, health status and selection criteria clearly described', 'BIVAC[0] exact', 'sg');
assert('V-BIVAC-04', BIVAC_QUALITY_ITEMS[4] === 'Standardised sample collection conditions (time, posture, fasting status, etc.)', 'BIVAC[4] exact', 'sg');
assert('V-BIVAC-08', BIVAC_QUALITY_ITEMS[8] === 'Samples analysed in a single analytical run/batch where relevant, to control CVA', 'BIVAC[8] exact', 'sg');
assert('V-BIVAC-11', BIVAC_QUALITY_ITEMS[11] === 'Statistical (e.g. ANOVA-based) method for deriving CVI/CVG stated', 'BIVAC[11] exact', 'sg');
assert('V-BIVAC-13', BIVAC_QUALITY_ITEMS[13] === 'Data and methodology reported with enough detail for independent appraisal', 'BIVAC[13] exact', 'sg');

// V-SCENANS: exact scenario answers (transportability cases)
const _srccMap = Object.fromEntries(SERIAL_RESULT_CHALLENGE_CASES.map(c => [c.id, c]));
assert('V-SCENANS-healthy', _srccMap['case-healthy-to-disease'].correctAnswer === 'no', 'case-healthy-to-disease: correctAnswer=no', 'sg');
assert('V-SCENANS-sampling', _srccMap['case-sampling-interval-mismatch'].correctAnswer === 'no', 'case-sampling-interval-mismatch: correctAnswer=no', 'sg');
assert('V-SCENANS-preanalytical', _srccMap['case-preanalytical-confounding'].correctAnswer === 'no', 'case-preanalytical-confounding: correctAnswer=no', 'sg');
assert('V-SCENANS-different', _srccMap['case-different-patient-context'].correctAnswer === 'yes', 'case-different-patient-context: correctAnswer=yes', 'sg');

// V-DATASET: bv-2/bv-3/bv-7 complete values
const _bvMap = Object.fromEntries(BV_DATASET.map(r => [r.id, r]));
assert('V-BV2', _bvMap['bv-2'].cva === 2 && _bvMap['bv-2'].cvi === 3 && _bvMap['bv-2'].cvg === 15 && _bvMap['bv-2'].sourceType === 'illustrative-teaching-value',
  'bv-2: cva=2, cvi=3, cvg=15, sourceType=illustrative-teaching-value', 'sg');
assert('V-BV3', _bvMap['bv-3'].cva === 2 && _bvMap['bv-3'].cvi === 15 && _bvMap['bv-3'].cvg === 8 && _bvMap['bv-3'].sourceType === 'illustrative-teaching-value',
  'bv-3: cva=2, cvi=15, cvg=8, sourceType=illustrative-teaching-value', 'sg');
assert('V-BV7', _bvMap['bv-7'].cva === 3 && _bvMap['bv-7'].cvi === 11 && _bvMap['bv-7'].cvg === 18 && _bvMap['bv-7'].sourceType === 'single-small-study',
  'bv-7: cva=3, cvi=11, cvg=18, sourceType=single-small-study', 'sg');

// V-PCF: exact provenance card (all 8 fields, exact order)
assert('V-PCF', JSON.stringify(PROVENANCE_CARD_FIELDS) === JSON.stringify(['measurand','population','healthStatus','samplingInterval','sourceType','sourceCitation','bivacStatus','transportabilityCautions']),
  'PROVENANCE_CARD_FIELDS: 8 fields, exact order', 'sg');

// V-LEVELS: exact learner-level keys
assert('V-LEVELS', JSON.stringify(Object.keys(BV_LEVEL_EXPLANATION)) === JSON.stringify(['beginner','intermediate','advanced','expert']),
  'BV_LEVEL_EXPLANATION: exact keys [beginner,intermediate,advanced,expert]', 'sg');

// V-WFPROMPTS: exact BV workflow question prompts (all 8, using .prompt field)
assert('V-WFQ-A', BV_WORKFLOW_QUESTIONS[0].prompt.startsWith('What does the population reference interval tell you here'), 'BV WFQ[A] prompt exact start', 'sg');
assert('V-WFQ-B', BV_WORKFLOW_QUESTIONS[1].prompt.startsWith('Which BV components'), 'BV WFQ[B] prompt exact start', 'sg');
assert('V-WFQ-C', BV_WORKFLOW_QUESTIONS[2].prompt.startsWith('Is the index of individuality computable'), 'BV WFQ[C] prompt exact start', 'sg');
assert('V-WFQ-D', BV_WORKFLOW_QUESTIONS[3].prompt.startsWith('Which RCV model'), 'BV WFQ[D] prompt exact start', 'sg');
assert('V-WFQ-E', BV_WORKFLOW_QUESTIONS[4].prompt.startsWith('What is the calculated RCV threshold'), 'BV WFQ[E] prompt exact start', 'sg');
assert('V-WFQ-F', BV_WORKFLOW_QUESTIONS[5].prompt.startsWith('Are there any provenance or transportability cautions'), 'BV WFQ[F] prompt exact start', 'sg');
assert('V-WFQ-G', BV_WORKFLOW_QUESTIONS[6].prompt.startsWith('What can you responsibly conclude'), 'BV WFQ[G] prompt exact start', 'sg');
assert('V-WFQ-H', BV_WORKFLOW_QUESTIONS[7].prompt.startsWith('What is your confidence'), 'BV WFQ[H] prompt exact start', 'sg');

// V-RD: exact reasoning dimensions (5, as plain strings)
assert('V-RD-00', BV_REASONING_DIMENSIONS[0] === 'Component identification', 'RD[0] exact', 'sg');
assert('V-RD-01', BV_REASONING_DIMENSIONS[1] === 'Provenance & transportability judgement', 'RD[1] exact', 'sg');
assert('V-RD-02', BV_REASONING_DIMENSIONS[2] === 'Model selection', 'RD[2] exact', 'sg');
assert('V-RD-03', BV_REASONING_DIMENSIONS[3] === 'Threshold interpretation', 'RD[3] exact', 'sg');
assert('V-RD-04', BV_REASONING_DIMENSIONS[4] === 'Guarded conclusion language', 'RD[4] exact', 'sg');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 7B BV Data Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 7B FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 7B PASSED — all tests green.');
  process.exit(0);
}
