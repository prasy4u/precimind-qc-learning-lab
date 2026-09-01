/* =========================================================================
   tests/stage7a-bv-calc.test.js

   NEW RECOVERY TESTS — Stage 7A (NOT the historical test suite)
   Tests for the recovered BV & RCV Lab calc engine in src/bv/calc.js.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)
   SOURCE MODULE: Artifact Class A — src/bv/calc.js (HTML lines 10405-10731)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED EXPECTATION:
     Exact exported values, exact formulas, exact return structures, exact
     guards, exact II thresholds, exact z values, exact BV APS factors,
     exact epsilon, exact directions — all directly encoded in HTML source.
   RECONSTRUCTED EXPECTATION:
     Additional NaN/Infinity/string/null cases, exhaustive boundary sweeps,
     epsilon challenge cases, CVG structural checks, cross-model regressions,
     architecture absence checks, and other tests created during recovery.

   ANTI-CIRCULAR DISCIPLINE:
   All numerical expected values are independently computed once from the
   recovered formulas and hard-coded. No function is called to generate
   its own expected value.

   Independently computed expected values (all from recovered formulas):
     II(CVI=3, CVG=5) = 3/5 = 0.6 exactly → intermediate
     Classical RCV(CVA=3, CVI=5, z=1.96):
       = 1.96 * sqrt(2) * sqrt(9+25) = 1.96 * 1.41421356 * 5.83095189 ≈ 16.1572
     Log-normal RCV(CVA=3, CVI=5, z=1.96):
       CVT = sqrt(9+25)/100 = 5.83095/100 = 0.0583095
       sigma = sqrt(ln(1 + 0.0583095^2)) = sqrt(ln(1.003400)) ≈ 0.058252
       k = 1.96 * sqrt(2) * 0.058252 ≈ 0.16140
       increase = (exp(0.16140) - 1)*100 ≈ 17.51%
       decrease = (1 - exp(-0.16140))*100 ≈ 14.91%

   Run: node tests/stage7a-bv-calc.test.js
   ========================================================================= */

'use strict';

const m = require('../src/bv/calc');
const {
  Z_CONVENTIONS, Z_CONVENTION_IDS, BV_APS_LEVELS,
  calculateIndexOfIndividuality, calculateBvAps,
  calculateClassicalRcv, calculateLognormalRcv,
  calculateSerialAbsoluteChange, calculateSerialRelativeChange,
  evaluateClassicalRcvExceedance, evaluateLognormalRcvExceedance,
  EXCEEDANCE_EPSILON
} = m;

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const near = (a, b, tol = 0.0001) =>
  typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol;

/* -----------------------------------------------------------------------
   SECTION A: EXPORT ARCHITECTURE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Export architecture ===');

assert('A-01', Object.keys(m).length === 12, 'Exactly 12 exports', 'rc');
const fns = Object.keys(m).filter(k => typeof m[k] === 'function');
assert('A-02', fns.length === 8, 'Exactly 8 exported functions', 'rc');
assert('A-03', !('isFiniteNonNegativeNumber' in m), 'Internal helper isFiniteNonNegativeNumber not exported', 'sg');
assert('A-04', !('directionOf' in m), 'Internal helper directionOf not exported', 'sg');

// calculateClassicalRcv and calculateLognormalRcv have no CVG parameter
// (they accept 3 args: cva, cvi, zConventionId)
assert('A-05', calculateClassicalRcv.length === 3, 'calculateClassicalRcv arity = 3 (no CVG)', 'sg');
assert('A-06', calculateLognormalRcv.length === 3, 'calculateLognormalRcv arity = 3 (no CVG)', 'sg');
// II and APS accept CVG
assert('A-07', calculateIndexOfIndividuality.length === 2, 'calculateIndexOfIndividuality arity = 2 (cvi, cvg)', 'sg');
assert('A-08', calculateBvAps.length === 2, 'calculateBvAps arity = 2 (cvi, cvg)', 'sg');

// No React, no scenario content
const srcText = require('fs').readFileSync(require('path').join(__dirname, '../src/bv/calc.js'), 'utf8');
assert('A-09', !srcText.match(/import React|from ['"]react['"]/), 'No React import', 'rc');
assert('A-10', !('BV_CASES' in m) && !('SERIAL_RESULT_CHALLENGE_BANK' in m), 'No scenario/challenge bank in calc module', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: Z CONVENTIONS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Z conventions ===');

assert('B-01', typeof Z_CONVENTIONS === 'object' && !Array.isArray(Z_CONVENTIONS), 'Z_CONVENTIONS is a key-value object', 'sg');
assert('B-02', Array.isArray(Z_CONVENTION_IDS) && Z_CONVENTION_IDS.length === 2, 'Z_CONVENTION_IDS: 2 entries', 'sg');
assert('B-03', Z_CONVENTION_IDS[0] === 'bidirectional-95', 'Z_CONVENTION_IDS[0] = bidirectional-95', 'sg');
assert('B-04', Z_CONVENTION_IDS[1] === 'unidirectional-95', 'Z_CONVENTION_IDS[1] = unidirectional-95', 'sg');
assert('B-05', Z_CONVENTIONS['bidirectional-95'].z === 1.96, 'bidirectional-95 z = 1.96', 'sg');
assert('B-06', Z_CONVENTIONS['unidirectional-95'].z === 1.645, 'unidirectional-95 z = 1.645', 'sg');

// Unknown convention returns unsupported
const rcvBad = calculateClassicalRcv(3, 5, 'unknown-convention');
assert('B-07', rcvBad.supported === false, 'Unknown z convention → unsupported', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: BV APS LEVELS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: BV APS levels ===');

assert('C-01', Array.isArray(BV_APS_LEVELS) && BV_APS_LEVELS.length === 3, 'BV_APS_LEVELS: 3 levels', 'sg');
assert('C-02', BV_APS_LEVELS[0].id === 'optimum', 'Level 0: optimum', 'sg');
assert('C-03', BV_APS_LEVELS[1].id === 'desirable', 'Level 1: desirable', 'sg');
assert('C-04', BV_APS_LEVELS[2].id === 'minimum', 'Level 2: minimum', 'sg');
assert('C-05', BV_APS_LEVELS[0].imprecisionFactor === 0.25 && BV_APS_LEVELS[0].biasFactor === 0.125, 'Optimum: imp=0.25, bias=0.125', 'sg');
assert('C-06', BV_APS_LEVELS[1].imprecisionFactor === 0.50 && BV_APS_LEVELS[1].biasFactor === 0.250, 'Desirable: imp=0.50, bias=0.25', 'sg');
assert('C-07', BV_APS_LEVELS[2].imprecisionFactor === 0.75 && BV_APS_LEVELS[2].biasFactor === 0.375, 'Minimum: imp=0.75, bias=0.375', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: EXCEEDANCE EPSILON (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Exceedance epsilon ===');

assert('D-01', EXCEEDANCE_EPSILON === 1e-9, 'EXCEEDANCE_EPSILON = 1e-9', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: calculateIndexOfIndividuality (source-grounded + reconstructed)
   Formula: II = CVI / CVG [independently computed hard-coded values]
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: calculateIndexOfIndividuality ===');

// II = CVI/CVG
// CVI=3, CVG=5: II = 0.6 exactly → intermediate (boundary)
const ii1 = calculateIndexOfIndividuality(3, 5);
assert('E-01', ii1.supported && near(ii1.value, 0.6), 'II(3,5) = 0.6 [independently: 3/5]', 'sg');
assert('E-02', ii1.band === 'intermediate-individuality', 'II=0.6 → intermediate (inclusive boundary)', 'sg');
assert('E-03', typeof ii1.heuristicCaveat === 'string' && ii1.heuristicCaveat.length > 0, 'II result has heuristicCaveat', 'sg');

// CVI=7, CVG=5: II = 1.4 → intermediate (upper boundary)
const ii2 = calculateIndexOfIndividuality(7, 5);
assert('E-04', ii2.supported && near(ii2.value, 1.4), 'II(7,5) = 1.4 [independently: 7/5]', 'sg');
assert('E-05', ii2.band === 'intermediate-individuality', 'II=1.4 → intermediate (inclusive boundary)', 'sg');

// Just below 0.6: marked
const ii3 = calculateIndexOfIndividuality(2.999, 5); // II = 0.5998 < 0.6
assert('E-06', ii3.band === 'marked-individuality', 'II<0.6 → marked-individuality', 'sg');

// Just above 1.4: low
const ii4 = calculateIndexOfIndividuality(7.001, 5); // II > 1.4
assert('E-07', ii4.band === 'low-individuality', 'II>1.4 → low-individuality', 'sg');

// CVI=0 with valid CVG: II=0 → marked
const ii5 = calculateIndexOfIndividuality(0, 5);
assert('E-08', ii5.supported && near(ii5.value, 0) && ii5.band === 'marked-individuality', 'II(CVI=0, CVG=5) = 0 → marked', 'sg');

// CVG=0 → unsupported (no division by zero)
const iiZ = calculateIndexOfIndividuality(5, 0);
assert('E-09', iiZ.supported === false, 'CRITICAL: II(CVG=0) → unsupported (no Infinity)', 'sg');
assert('E-10', iiZ.value === null, 'II(CVG=0) value = null', 'sg');

// Guards: negative CVI/CVG
assert('E-11', calculateIndexOfIndividuality(-1, 5).supported === false, 'II(CVI=-1) → unsupported', 'rc');
assert('E-12', calculateIndexOfIndividuality(5, -1).supported === false, 'II(CVG=-1) → unsupported', 'rc');
assert('E-13', calculateIndexOfIndividuality(NaN, 5).supported === false, 'II(NaN, 5) → unsupported', 'rc');
assert('E-14', calculateIndexOfIndividuality(5, NaN).supported === false, 'II(5, NaN) → unsupported', 'rc');
assert('E-15', calculateIndexOfIndividuality(Infinity, 5).supported === false, 'II(Infinity, 5) → unsupported', 'rc');

// Mid-band: CVI=5, CVG=5: II=1.0 → intermediate
const iiMid = calculateIndexOfIndividuality(5, 5);
assert('E-16', iiMid.band === 'intermediate-individuality', 'II=1.0 → intermediate', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: calculateBvAps (source-grounded + reconstructed)
   Imprecision = impFactor * CVI; Bias = biasFactor * sqrt(CVI^2 + CVG^2)
   TEa = 1.65 * imprecision + bias; TEa.disclosureOnly = true
   All expected values independently computed and hard-coded.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: calculateBvAps ===');

// CVI=5, CVG=3 — independently computed:
// Optimum: imp = 0.25*5 = 1.25; bias = 0.125*sqrt(25+9) = 0.125*5.831 = 0.7289
// TEa = 1.65*1.25 + 0.7289 = 2.0625 + 0.7289 = 2.7914
const aps = calculateBvAps(5, 3);
assert('F-01', aps.supported === true, 'APS(5,3) supported', 'sg');
assert('F-02', aps.levels.optimum.imprecision.supported && near(aps.levels.optimum.imprecision.value, 1.25), 'Optimum imprecision = 1.25 [independently: 0.25*5]', 'sg');
// Hard-coded: 0.125 * sqrt(CVI^2 + CVG^2) = 0.125 * sqrt(25+9) = 0.125 * sqrt(34) = 0.7288689868556626
assert('F-03', aps.levels.optimum.bias.supported && near(aps.levels.optimum.bias.value, 0.7288689868556626, 0.0000001), 'Optimum bias = 0.7288689868556626 [independently hard-coded: 0.125*sqrt(34)]', 'sg');
assert('F-04', aps.levels.desirable.imprecision.supported && near(aps.levels.desirable.imprecision.value, 2.5), 'Desirable imprecision = 2.5 [independently: 0.50*5]', 'sg');
assert('F-05', aps.levels.minimum.imprecision.supported && near(aps.levels.minimum.imprecision.value, 3.75), 'Minimum imprecision = 3.75 [independently: 0.75*5]', 'sg');
assert('F-06', aps.levels.optimum.tea.supported && aps.levels.optimum.tea.disclosureOnly === true, 'TEa disclosureOnly = true', 'sg');

// CVG=0 is USABLE for BV-derived APS calculations (cvgAvailable=true, >=0 semantics).
// For CVI=5, CVG=0:
//   cvgAvailable = true
//   optimum imprecision = 0.25 * 5 = 1.25 (unchanged)
//   optimum bias = 0.125 * sqrt(5^2 + 0^2) = 0.125 * 5 = 0.625 (hard-coded)
//   optimum optional TEa = 1.65 * 1.25 + 0.625 = 2.0625 + 0.625 = 2.6875 (hard-coded)
// This is DELIBERATELY DISTINCT from II where CVG=0 → unsupported (II=CVI/CVG would be infinite).
const apsZ = calculateBvAps(5, 0);
assert('F-07', apsZ.supported === true, 'APS(CVI=5, CVG=0) overall supported (cvgAvailable>=0)', 'sg');
assert('F-08', apsZ.levels.optimum.imprecision.supported === true && near(apsZ.levels.optimum.imprecision.value, 1.25), 'APS(CVG=0): imprecision=1.25 [hard-coded: 0.25*5]', 'sg');
// Strengthened F-09: verify numeric bias value 0.625
assert('F-09', apsZ.levels.optimum.bias.supported === true && apsZ.cvgAvailable === true && near(apsZ.levels.optimum.bias.value, 0.625, 0.0000001),
  'APS(CVG=0): bias=0.625 supported [hard-coded: 0.125*5]; cvgAvailable=true', 'sg');

// CVG=0 is USABLE for APS but NOT for II — verify the distinction
// The II guard: CVG > 0 strictly required (II = CVI/CVG would be infinite)
// The APS guard: CVG >= 0 acceptable (bias still computable from sqrt(CVI^2+0))
assert('F-10', iiZ.supported === false && apsZ.supported === true,
  'CRITICAL: CVG=0 → II unsupported (strict >0) BUT APS supported (>=0); do not harmonise', 'sg');

// CVI=0 — valid edge case
const apsCVI0 = calculateBvAps(0, 5);
assert('F-11', apsCVI0.supported === true && apsCVI0.levels.optimum.imprecision.value === 0, 'APS(CVI=0): imprecision=0 supported', 'sg');

// Guards
assert('F-12', calculateBvAps(-1, 5).supported === false, 'APS(CVI=-1) unsupported', 'rc');
assert('F-13', calculateBvAps(NaN, 5).supported === false, 'APS(NaN, 5) unsupported', 'rc');

// Missing CVG (undefined) — source-grounded regression: distinct from CVG=0
// calculateBvAps(5, undefined) → overall supported (imprecision ok), cvgAvailable=false
const apsMissing = calculateBvAps(5, undefined);
assert('F-14', apsMissing.supported === true && apsMissing.cvgAvailable === false,
  'APS(CVG=undefined): overall supported=true, cvgAvailable=false', 'sg');
assert('F-15', apsMissing.inputs.cvg === null,
  'APS(CVG=undefined): inputs.cvg === null', 'sg');
assert('F-16', apsMissing.levels.optimum.imprecision.supported === true && near(apsMissing.levels.optimum.imprecision.value, 1.25),
  'APS(CVG=undefined): imprecision=1.25 remains supported [0.25*5]', 'sg');
assert('F-17', apsMissing.levels.optimum.bias.supported === false && apsMissing.levels.optimum.bias.value === null,
  'APS(CVG=undefined): bias unsupported, value=null', 'sg');
assert('F-18', apsMissing.levels.optimum.tea.supported === false && apsMissing.levels.optimum.tea.value === null && apsMissing.levels.optimum.tea.disclosureOnly === true,
  'APS(CVG=undefined): TEa unsupported, value=null, disclosureOnly=true', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: calculateClassicalRcv (source-grounded + reconstructed)
   Formula: RCV = z * sqrt(2) * sqrt(CVA^2 + CVI^2)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: calculateClassicalRcv ===');

// CVA=3, CVI=5, bidirectional z=1.96
// Hard-coded reference value: 1.96 * sqrt(2) * sqrt(9+25) = 16.16257405242123
const CLASSICAL_RCV_BI_35 = 16.16257405242123;
const rcvBi = calculateClassicalRcv(3, 5, 'bidirectional-95');
assert('G-01', rcvBi.supported && near(rcvBi.value, CLASSICAL_RCV_BI_35, 0.00001), 'Classical RCV(3,5,bi) = 16.16257405242123 [hard-coded reference value]', 'sg');
assert('G-02', rcvBi.units === '%', 'Classical RCV units = %', 'sg');
assert('G-03', typeof rcvBi.modelId === 'string' && rcvBi.modelId.length > 0, 'Classical RCV has modelId', 'sg');

// CVA=3, CVI=5, unidirectional z=1.645
// Hard-coded reference value: 1.645 * sqrt(2) * sqrt(9+25) = 13.565017508282104
const CLASSICAL_RCV_UNI_35 = 13.565017508282104;
const rcvUni = calculateClassicalRcv(3, 5, 'unidirectional-95');
assert('G-04', rcvUni.supported && near(rcvUni.value, CLASSICAL_RCV_UNI_35, 0.00001), 'Classical RCV(3,5,uni) = 13.565017508282104 [hard-coded reference value]', 'sg');

// Bidirectional > unidirectional for same CVA/CVI (larger z)
assert('G-05', rcvBi.value > rcvUni.value, 'Bidirectional z gives larger threshold than unidirectional', 'rc');

// Symmetry: classical RCV is a single value (not direction-specific)
assert('G-06', typeof rcvBi.value === 'number' && !('increase' in rcvBi) && !('decrease' in rcvBi), 'Classical RCV is symmetric (single value, no increase/decrease)', 'sg');

// CVG absent from returned inputs
assert('G-07', !('cvg' in (rcvBi.inputs || {})), 'CVG absent from classical RCV inputs field', 'sg');

// CVA=0, CVI=0 → RCV=0
const rcvZero = calculateClassicalRcv(0, 0, 'bidirectional-95');
assert('G-08', rcvZero.supported && near(rcvZero.value, 0), 'Classical RCV(0,0) = 0', 'sg');

// Guards
assert('G-09', calculateClassicalRcv(-1, 5, 'bidirectional-95').supported === false, 'Classical RCV(CVA=-1) unsupported', 'rc');
assert('G-10', calculateClassicalRcv(3, -1, 'bidirectional-95').supported === false, 'Classical RCV(CVI=-1) unsupported', 'rc');
assert('G-11', calculateClassicalRcv(NaN, 5, 'bidirectional-95').supported === false, 'Classical RCV(NaN, 5) unsupported', 'rc');
assert('G-12', calculateClassicalRcv(3, 5, 'bad-convention').supported === false, 'Classical RCV(bad z) unsupported', 'rc');

/* -----------------------------------------------------------------------
   SECTION H: calculateLognormalRcv (source-grounded + reconstructed)
   Formula: CVT=sqrt(CVA^2+CVI^2)/100; sigma=sqrt(ln(1+CVT^2)); k=z*sqrt(2)*sigma
            increase=(exp(k)-1)*100; decrease=(1-exp(-k))*100
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: calculateLognormalRcv ===');

// Hard-coded reference values (independently computed):
// CVT = sqrt(9+25)/100 = 0.05830951894845301
// sigma = sqrt(ln(1 + CVT^2)) = 0.05826004692768121
// k = 1.96 * sqrt(2) * sigma = 0.16148861107885468
// increase = (exp(k) - 1)*100 = 17.52590731492456
// decrease = (1 - exp(-k))*100 = 14.912377802761245
const LN_SIGMA_35 = 0.05826004692768121;
const LN_K_35 = 0.16148861107885468;
const LN_INC_35 = 17.52590731492456;
const LN_DEC_35 = 14.912377802761245;

const lnRcv = calculateLognormalRcv(3, 5, 'bidirectional-95');
assert('H-01', lnRcv.supported, 'Log-normal RCV(3,5,bi) supported', 'sg');
assert('H-02', near(lnRcv.increase.value, LN_INC_35, 0.00001), 'LN RCV increase = 17.52590731492456 [hard-coded reference value]', 'sg');
assert('H-03', near(lnRcv.decrease.value, LN_DEC_35, 0.00001), 'LN RCV decrease = 14.912377802761245 [hard-coded reference value]', 'sg');
assert('H-04', lnRcv.increase.value !== lnRcv.decrease.value, 'LN RCV: increase ≠ decrease (asymmetric)', 'sg');
assert('H-05', lnRcv.increase.value > lnRcv.decrease.value, 'LN RCV: increase > decrease for positive variation', 'sg');
assert('H-06', lnRcv.decrease.value < 100, 'LN RCV decrease magnitude < 100%', 'sg');
// increase.units = '%', decrease.units = '% (magnitude of the allowable fall)'
assert('H-07', lnRcv.increase.units === '%', 'LN RCV increase.units = %', 'sg');
assert('H-07b', lnRcv.decrease.units === '% (magnitude of the allowable fall)', 'LN RCV decrease.units exact: "% (magnitude of the allowable fall)"', 'sg');

// CVG absent from inputs
assert('H-08', !('cvg' in (lnRcv.inputs || {})), 'CVG absent from log-normal RCV inputs', 'sg');

// Classical vs log-normal: distinct models
assert('H-09', rcvBi.value !== lnRcv.increase.value, 'Classical and log-normal models give different values', 'rc');

// Zero variation → zero thresholds
const lnZero = calculateLognormalRcv(0, 0, 'bidirectional-95');
assert('H-10', lnZero.supported && near(lnZero.increase.value, 0) && near(lnZero.decrease.value, 0), 'LN RCV(0,0) = 0 both directions', 'sg');

// Guards
assert('H-11', calculateLognormalRcv(-1, 5, 'bidirectional-95').supported === false, 'LN RCV(CVA=-1) unsupported', 'rc');
assert('H-12', calculateLognormalRcv(3, 5, 'bad').supported === false, 'LN RCV(bad z) unsupported', 'rc');

/* -----------------------------------------------------------------------
   SECTION I: calculateSerialAbsoluteChange (source-grounded + reconstructed)
   Formula: current - previous
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: calculateSerialAbsoluteChange ===');

// 105 - 100 = +5
const abs1 = calculateSerialAbsoluteChange(100, 105);
assert('I-01', abs1.supported && near(abs1.value, 5.0), 'serialAbs(100, 105) = +5 [independently: 105-100]', 'sg');

// 95 - 100 = -5
const abs2 = calculateSerialAbsoluteChange(100, 95);
assert('I-02', abs2.supported && near(abs2.value, -5.0), 'serialAbs(100, 95) = -5 [independently: 95-100]', 'sg');

// 100 - 100 = 0
const abs3 = calculateSerialAbsoluteChange(100, 100);
assert('I-03', abs3.supported && near(abs3.value, 0), 'serialAbs(100, 100) = 0', 'sg');

// Guards
assert('I-04', calculateSerialAbsoluteChange(NaN, 100).supported === false, 'serialAbs(NaN, 100) unsupported', 'rc');
assert('I-05', calculateSerialAbsoluteChange(100, NaN).supported === false, 'serialAbs(100, NaN) unsupported', 'rc');
assert('I-06', calculateSerialAbsoluteChange(Infinity, 100).supported === false, 'serialAbs(Infinity, 100) unsupported', 'rc');

/* -----------------------------------------------------------------------
   SECTION J: calculateSerialRelativeChange (source-grounded + reconstructed)
   Formula: (current - previous) / previous * 100
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: calculateSerialRelativeChange ===');

// (105-100)/100*100 = 5.0%
const rel1 = calculateSerialRelativeChange(100, 105);
assert('J-01', rel1.supported && near(rel1.value, 5.0), 'serialRel(100, 105) = +5.0 [independently: (105-100)/100*100]', 'sg');

// (95-100)/100*100 = -5.0%
const rel2 = calculateSerialRelativeChange(100, 95);
assert('J-02', rel2.supported && near(rel2.value, -5.0), 'serialRel(100, 95) = -5.0', 'sg');

// previous=0 → unsupported
const relZ = calculateSerialRelativeChange(0, 10);
assert('J-03', relZ.supported === false, 'CRITICAL: serialRel(previous=0) → unsupported', 'sg');
assert('J-04', relZ.value === null, 'serialRel(previous=0) value = null', 'sg');

// Guards
assert('J-05', calculateSerialRelativeChange(NaN, 100).supported === false, 'serialRel(NaN, 100) unsupported', 'rc');
assert('J-06', calculateSerialRelativeChange(Infinity, 100).supported === false, 'serialRel(Infinity, 100) unsupported', 'rc');

/* -----------------------------------------------------------------------
   SECTION K: evaluateClassicalRcvExceedance — strict semantics (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: evaluateClassicalRcvExceedance — strict semantics ===');

// Hard-coded oracle CLASSICAL_RCV_BI_35 = 16.16257405242123 (defined in Section G)

// Clearly above threshold: relChange=25% > 16.16257...% → exceeds=true
const exc1 = evaluateClassicalRcvExceedance(100, 125, 3, 5, 'bidirectional-95');
assert('K-01', exc1.supported && exc1.exceeds === true, 'Classical: 25% change > threshold → exceeds', 'sg');

// Clearly below threshold: relChange=10% < 16.16% → exceeds=false
const exc2 = evaluateClassicalRcvExceedance(100, 110, 3, 5, 'bidirectional-95');
assert('K-02', exc2.supported && exc2.exceeds === false, 'Classical: 10% change < threshold → not exceeded', 'sg');

// Exact threshold equality: use hard-coded CLASSICAL_RCV_BI_35 = 16.16257405242123
// prev=100, curr=100*(1+16.16257405242123/100) = 116.16257405242123
const currExact = 100 * (1 + CLASSICAL_RCV_BI_35 / 100);
const excExact = evaluateClassicalRcvExceedance(100, currExact, 3, 5, 'bidirectional-95');
assert('K-03', excExact.supported && excExact.exceeds === false,
  'CRITICAL: Classical exact threshold equality → exceeds=false (hard-coded oracle)', 'sg');

// Decrease: |relChange| clearly above threshold
const excDec = evaluateClassicalRcvExceedance(125, 100, 3, 5, 'bidirectional-95');
assert('K-04', excDec.supported && excDec.exceeds === true, 'Classical: decrease > threshold → exceeds', 'sg');
assert('K-05', excDec.direction === 'decrease', 'Classical: decrease direction recorded', 'sg');

// Increase direction preserved
assert('K-06', exc1.direction === 'increase', 'Classical: increase direction recorded', 'sg');

// No change
const excNC = evaluateClassicalRcvExceedance(100, 100, 3, 5, 'bidirectional-95');
assert('K-07', excNC.supported && excNC.exceeds === false && excNC.direction === 'no-change', 'Classical: no change → not exceeded', 'sg');

// Invalid previous result
assert('K-08', evaluateClassicalRcvExceedance(NaN, 110, 3, 5, 'bidirectional-95').supported === false, 'Classical exc: NaN previous → unsupported', 'rc');
assert('K-09', evaluateClassicalRcvExceedance(0, 110, 3, 5, 'bidirectional-95').supported === false, 'Classical exc: previous=0 → unsupported (rel change undefined)', 'rc');

// Invalid z
assert('K-10', evaluateClassicalRcvExceedance(100, 110, 3, 5, 'bad').supported === false, 'Classical exc: bad z → unsupported', 'rc');

/* -----------------------------------------------------------------------
   SECTION L: evaluateLognormalRcvExceedance — direction-specific (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: evaluateLognormalRcvExceedance — direction-specific ===');

// Increase clearly above increase threshold
const lnExcInc = evaluateLognormalRcvExceedance(100, 125, 3, 5, 'bidirectional-95');
assert('L-01', lnExcInc.supported && lnExcInc.exceeds === true, 'LN: 25% increase > increase threshold → exceeds', 'sg');
assert('L-02', lnExcInc.direction === 'increase', 'LN: increase direction recorded', 'sg');

// Decrease clearly below (magnitude) decrease threshold
// For CVA=3,CVI=5,z=1.96: hard-coded decrease = 14.912377802761245 %
// A decrease of 20% should exceed (|change| > decrease_threshold)
const lnExcDec = evaluateLognormalRcvExceedance(125, 100, 3, 5, 'bidirectional-95');
assert('L-03', lnExcDec.supported && lnExcDec.exceeds === true, 'LN: 20% decrease > decrease threshold → exceeds', 'sg');
assert('L-04', lnExcDec.direction === 'decrease', 'LN: decrease direction recorded', 'sg');

// Direction-specific threshold: increase and decrease use different limits
assert('L-05', lnExcInc.threshold !== lnExcDec.threshold,
  'LN exc: increase and decrease use different thresholds (asymmetric)', 'sg');

// No change → exceeds=false
const lnExcNC = evaluateLognormalRcvExceedance(100, 100, 3, 5, 'bidirectional-95');
assert('L-06', lnExcNC.supported && lnExcNC.exceeds === false && lnExcNC.direction === 'no-change', 'LN: no change → not exceeded', 'sg');

// Exact threshold equality: use hard-coded LN_INC_35 = 17.52590731492456
// prev=100, curr=100*(1+17.52590731492456/100) = 117.52590731492456
const currLnExact = 100 * (1 + LN_INC_35 / 100);
const lnExcExact = evaluateLognormalRcvExceedance(100, currLnExact, 3, 5, 'bidirectional-95');
assert('L-07', lnExcExact.supported && lnExcExact.exceeds === false,
  'CRITICAL: LN exact threshold equality → exceeds=false (hard-coded oracle)', 'sg');

// Invalid inputs
assert('L-08', evaluateLognormalRcvExceedance(NaN, 110, 3, 5, 'bidirectional-95').supported === false, 'LN exc: NaN previous → unsupported', 'rc');
assert('L-09', evaluateLognormalRcvExceedance(0, 110, 3, 5, 'bidirectional-95').supported === false, 'LN exc: previous=0 → unsupported', 'rc');
assert('L-10', evaluateLognormalRcvExceedance(100, 110, 3, 5, 'bad').supported === false, 'LN exc: bad z → unsupported', 'rc');

/* -----------------------------------------------------------------------
   SECTION M: CROSS-MODEL REGRESSIONS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Cross-model regressions ===');

// Classical is symmetric: same CVA/CVI/z gives equal ± threshold
assert('M-01', typeof rcvBi.value === 'number' && !('increase' in rcvBi), 'Classical RCV: single symmetric value', 'rc');

// Log-normal is asymmetric: increase ≠ decrease
assert('M-02', lnRcv.increase.value !== lnRcv.decrease.value, 'LN RCV: asymmetric (increase ≠ decrease)', 'rc');

// Neither uses CVG
const rcvBiInputs = rcvBi.inputs || {};
const lnRcvInputs = lnRcv.inputs || {};
assert('M-03', !('cvg' in rcvBiInputs) && !('cvg' in lnRcvInputs), 'Neither RCV function uses CVG', 'sg');

// Bidirectional > unidirectional for same inputs (already in G-05, repeat as cross-model)
assert('M-04', calculateClassicalRcv(3,5,'bidirectional-95').value > calculateClassicalRcv(3,5,'unidirectional-95').value, 'Bidirectional z always gives larger threshold', 'rc');

// No automatic model-selection function exported
assert('M-05', typeof m.selectRcvModel === 'undefined' && typeof m.chooseRcvModel === 'undefined', 'No automatic RCV model selection function', 'rc');

// Exceedance result does not contain clinical diagnosis
assert('M-06', !('clinicalSignificance' in exc1) && !('diagnosis' in exc1) && !('diseaseProgression' in exc1), 'Classical exc: no clinical diagnosis fields', 'sg');
assert('M-07', !('clinicalSignificance' in lnExcInc) && !('diagnosis' in lnExcInc), 'LN exc: no clinical diagnosis fields', 'sg');

/* -----------------------------------------------------------------------
   SECTION N: ARCHITECTURAL ABSENCE TESTS (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: Architectural absence ===');

// No BV estimation from raw data
const noBvEst = ['estimateCvi', 'estimateCvg', 'runAnova', 'runCvAnova', 'estimateBvBayesian'];
noBvEst.forEach(fn => {
  assert(`N-01-${fn}`, !(fn in m), `No BV estimation function: ${fn}`, 'rc');
});

// No BIVAC scoring
assert('N-02', typeof m.calculateBivac === 'undefined' && typeof m.scoreBivac === 'undefined', 'No BIVAC scoring function', 'rc');

// No RI generation
assert('N-03', typeof m.calculateReferenceInterval === 'undefined', 'No reference interval function', 'rc');

// No MU engine
assert('N-04', typeof m.calculateMeasurementUncertainty === 'undefined', 'No measurement uncertainty function', 'rc');

// No auto patient correction
assert('N-05', typeof m.autoCorrectPatientResult === 'undefined', 'No auto patient correction', 'rc');

// No personalised CVI
assert('N-06', typeof m.personalizedCvi === 'undefined' && typeof m.diseaseSpecificCvi === 'undefined', 'No personalised CVI function', 'rc');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 7A BV Calc Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 7A FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 7A PASSED — all tests green.');
  process.exit(0);
}
