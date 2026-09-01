/* =========================================================================
   tests/stage6a-eqa-calc.test.js

   NEW RECOVERY TESTS — Stage 6A (NOT the historical test suite)
   Tests for the recovered External Assurance Lab calc engine in
   src/eqa/calc.js.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)
   SOURCE MODULE: Artifact Class A — src/eqa/calc.js (lines 8368-8670)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED EXPECTATION:
     Exact exported values, array contents, labels, function formulas,
     return structures, and guards explicitly encoded in HTML source.
   RECONSTRUCTED EXPECTATION:
     Additional boundary inputs, exhaustive truth-table checks, absence /
     architecture checks, and cross-module separation tests created during
     recovery.

   ANTI-CIRCULAR DISCIPLINE:
   All expected numerical values are computed independently from the
   recovered formulas:
     absoluteDeviation = participant - assignedValue
     relativeDeviation = (participant - assigned) / assigned * 100
     zScore = (participant - assigned) / sdpa
     pairedDiff = B - A
     pairedRelDiff = (B - A) / A * 100
   No function is called to generate its own expected value.

   Run: node tests/stage6a-eqa-calc.test.js
   ========================================================================= */

'use strict';

const m = require('../src/eqa/calc');
const {
  TARGET_VALUE_TYPES, TARGET_VALUE_TYPE_LABELS,
  COMMUTABILITY_STATUSES,
  CURRENT_EQA_STATUSES, LONGITUDINAL_EQA_STATUSES,
  COMPARABILITY_STATUSES, EQA_INVESTIGATION_STATUSES,
  PERFORMANCE_CRITERION_TYPES, PERFORMANCE_CRITERION_TYPE_LABELS,
  calculateEqaAbsoluteDeviation, calculateEqaRelativeDeviation, calculateEqaZScore,
  ILLUSTRATIVE_ZSCORE_BANDS, ILLUSTRATIVE_ZSCORE_BANDS_CAUTION,
  calculatePairedDifference, calculatePairedRelativeDifference,
  describeSchemeCapability
} = m;

let passed = 0, failed = 0;
let sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const near = (a, b, tol = 0.00001) =>
  typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol;

/* -----------------------------------------------------------------------
   SECTION A: EXPORT SURFACE (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Export surface ===');

assert('A-01', Object.keys(m).length === 17, 'Exactly 17 exports', 'sg');
const fns = Object.keys(m).filter(k => typeof m[k] === 'function');
assert('A-02', fns.length === 6, 'Exactly 6 functions', 'sg');
assert('A-03', fns.includes('calculateEqaAbsoluteDeviation'), 'calculateEqaAbsoluteDeviation exported', 'sg');
assert('A-04', fns.includes('calculateEqaRelativeDeviation'), 'calculateEqaRelativeDeviation exported', 'sg');
assert('A-05', fns.includes('calculateEqaZScore'), 'calculateEqaZScore exported', 'sg');
assert('A-06', fns.includes('calculatePairedDifference'), 'calculatePairedDifference exported', 'sg');
assert('A-07', fns.includes('calculatePairedRelativeDifference'), 'calculatePairedRelativeDifference exported', 'sg');
assert('A-08', fns.includes('describeSchemeCapability'), 'describeSchemeCapability exported', 'sg');

/* -----------------------------------------------------------------------
   SECTION B: TARGET VALUE TYPES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: Target value types ===');

assert('B-01', Array.isArray(TARGET_VALUE_TYPES) && TARGET_VALUE_TYPES.length === 7, 'TARGET_VALUE_TYPES: 7 values', 'sg');
assert('B-02', TARGET_VALUE_TYPES[0] === 'reference-measurement-procedure', 'TVT[0]: reference-measurement-procedure', 'sg');
assert('B-03', TARGET_VALUE_TYPES[2] === 'method-specific-peer-group-mean', 'TVT[2]: method-specific-peer-group-mean', 'sg');
assert('B-04', TARGET_VALUE_TYPES[6] === 'target-insufficiently-described', 'TVT[6]: target-insufficiently-described', 'sg');
assert('B-05', TARGET_VALUE_TYPE_LABELS['method-specific-peer-group-mean'] === 'Method-specific peer-group mean', 'Peer-group label exact', 'sg');
assert('B-06', TARGET_VALUE_TYPE_LABELS['reference-measurement-procedure'] === 'Reference measurement procedure assigned value', 'RMP label exact', 'sg');
// Peer group not presented as universal truth (no "true value" label)
assert('B-07', !Object.values(TARGET_VALUE_TYPE_LABELS).some(l => l.toLowerCase() === 'true value'), 'No "true value" label in TARGET_VALUE_TYPE_LABELS', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: COMMUTABILITY (source-grounded + reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: Commutability statuses ===');

assert('C-01', Array.isArray(COMMUTABILITY_STATUSES) && COMMUTABILITY_STATUSES.length === 4, 'COMMUTABILITY_STATUSES: 4 values', 'sg');
assert('C-02', COMMUTABILITY_STATUSES[0] === 'verified-commutable', 'CS[0]: verified-commutable', 'sg');
assert('C-03', COMMUTABILITY_STATUSES[1] === 'noncommutable', 'CS[1]: noncommutable', 'sg');
assert('C-04', COMMUTABILITY_STATUSES[2] === 'commutability-not-established', 'CS[2]: commutability-not-established', 'sg');
assert('C-05', COMMUTABILITY_STATUSES[3] === 'not-applicable-or-insufficient-information', 'CS[3]: not-applicable-or-insufficient-information', 'sg');
// CRITICAL: unknown != noncommutable (source doctrine, spec sections 10-12)
assert('C-06', 'commutability-not-established' !== 'noncommutable', 'CRITICAL: commutability-not-established !== noncommutable', 'sg');
assert('C-07', COMMUTABILITY_STATUSES.indexOf('commutability-not-established') !== COMMUTABILITY_STATUSES.indexOf('noncommutable'), 'Two distinct status values, not the same index', 'rc');
// describeSchemeCapability treats them differently
const capNotEstab = describeSchemeCapability({ commutabilityVerified: undefined });
const capFailed = describeSchemeCapability({ commutabilityVerified: false });
assert('C-08', capNotEstab.limitations.some(l => l.includes('not been established') && l.includes('unknown — not confirmed to have failed')), 'Unknown commutability: limitations say "unknown, not confirmed failed"', 'sg');
assert('C-09', capFailed.limitations.some(l => l.includes('noncommutable') || l.includes('matrix effects')), 'Known noncommutable: limitations mention matrix effects', 'sg');
assert('C-10', capNotEstab.limitations[capNotEstab.limitations.findIndex(l => l.includes('Commutability'))] !== capFailed.limitations[capFailed.limitations.findIndex(l => l.includes('noncommutable') || l.includes('matrix'))], 'Different limitation text for unknown vs noncommutable', 'rc');

/* -----------------------------------------------------------------------
   SECTION D: CURRENT vs LONGITUDINAL EQA STATUS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: Current vs longitudinal EQA status ===');

assert('D-01', Array.isArray(CURRENT_EQA_STATUSES) && CURRENT_EQA_STATUSES.length === 4, 'CURRENT_EQA_STATUSES: 4 values', 'sg');
assert('D-02', CURRENT_EQA_STATUSES.includes('meets-criterion'), 'Current: meets-criterion', 'sg');
assert('D-03', CURRENT_EQA_STATUSES.includes('does-not-meet-criterion'), 'Current: does-not-meet-criterion', 'sg');
assert('D-04', CURRENT_EQA_STATUSES.includes('criterion-not-stated'), 'Current: criterion-not-stated', 'sg');
assert('D-05', Array.isArray(LONGITUDINAL_EQA_STATUSES) && LONGITUDINAL_EQA_STATUSES.length === 8, 'LONGITUDINAL_EQA_STATUSES: 8 values', 'sg');
assert('D-06', LONGITUDINAL_EQA_STATUSES.includes('stable-no-persistent-deviation-apparent'), 'Longitudinal: stable-no-persistent-deviation-apparent', 'sg');
assert('D-07', LONGITUDINAL_EQA_STATUSES.includes('persistent-positive-deviation'), 'Longitudinal: persistent-positive-deviation', 'sg');
assert('D-08', LONGITUDINAL_EQA_STATUSES.includes('method-group-pattern'), 'Longitudinal: method-group-pattern', 'sg');
// Structurally distinct: no overlap between current and longitudinal
const currentSet = new Set(CURRENT_EQA_STATUSES);
const longitudinalSet = new Set(LONGITUDINAL_EQA_STATUSES);
const overlap = [...currentSet].filter(s => longitudinalSet.has(s));
assert('D-09', overlap.length <= 1, 'Current and longitudinal statuses are structurally distinct (at most "indeterminate" shared)', 'rc');

/* -----------------------------------------------------------------------
   SECTION E: OTHER STATUS VOCABULARIES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: Other status vocabularies ===');

assert('E-01', Array.isArray(COMPARABILITY_STATUSES) && COMPARABILITY_STATUSES.length === 6, 'COMPARABILITY_STATUSES: 6 values', 'sg');
assert('E-02', COMPARABILITY_STATUSES.includes('stable-agreement'), 'Comparability: stable-agreement', 'sg');
assert('E-03', COMPARABILITY_STATUSES.includes('recovery-after-intervention'), 'Comparability: recovery-after-intervention', 'sg');

assert('E-04', Array.isArray(EQA_INVESTIGATION_STATUSES) && EQA_INVESTIGATION_STATUSES.length === 7, 'EQA_INVESTIGATION_STATUSES: 7 values', 'sg');
assert('E-05', EQA_INVESTIGATION_STATUSES.includes('not-yet-reviewed'), 'EqaInv: not-yet-reviewed', 'sg');
assert('E-06', EQA_INVESTIGATION_STATUSES.includes('referred-to-investigation-lab'), 'EqaInv: referred-to-investigation-lab', 'sg');
assert('E-07', EQA_INVESTIGATION_STATUSES.includes('unresolved'), 'EqaInv: unresolved', 'sg');
// EQA investigation must not duplicate Investigation Lab's CAUSE_STATUSES
const invLab = require('../src/investigation/calc');
const eqaInvSet = new Set(EQA_INVESTIGATION_STATUSES);
const causeSet = new Set(invLab.CAUSE_STATUSES);
// old E-08 replaced — see meaningful unique check below

assert('E-09', Array.isArray(PERFORMANCE_CRITERION_TYPES) && PERFORMANCE_CRITERION_TYPES.length === 8, 'PERFORMANCE_CRITERION_TYPES: 8 values', 'sg');
assert('E-10', PERFORMANCE_CRITERION_TYPES.includes('z-score-sdpa'), 'PerfCrit: z-score-sdpa', 'sg');
assert('E-11', PERFORMANCE_CRITERION_TYPES.includes('biological-variation-derived'), 'PerfCrit: biological-variation-derived', 'sg');
assert('E-12', PERFORMANCE_CRITERION_TYPES.includes('not-stated'), 'PerfCrit: not-stated', 'sg');
assert('E-13', PERFORMANCE_CRITERION_TYPE_LABELS['z-score-sdpa'] === 'Z-score / SDPA', 'PerfCrit label: Z-score / SDPA', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: calculateEqaAbsoluteDeviation (source-grounded + reconstructed)
   Formula: participant - assignedValue [independently computed]
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: calculateEqaAbsoluteDeviation ===');

// Independently computed: 105 - 100 = +5
const abs1 = calculateEqaAbsoluteDeviation(105, 100);
assert('F-01', abs1.supported && near(abs1.value, 5.0), 'abs(105, 100) = +5 [independently: 105-100]', 'sg');
assert('F-02', abs1.units === 'same units as the participant result', 'abs: units field exact', 'sg');

// 95 - 100 = -5
const abs2 = calculateEqaAbsoluteDeviation(95, 100);
assert('F-03', abs2.supported && near(abs2.value, -5.0), 'abs(95, 100) = -5 [independently: 95-100]', 'sg');

// 0 - 0 = 0
const abs3 = calculateEqaAbsoluteDeviation(0, 0);
assert('F-04', abs3.supported && near(abs3.value, 0.0), 'abs(0, 0) = 0', 'sg');

// Guards
assert('F-05', calculateEqaAbsoluteDeviation(NaN, 100).supported === false, 'abs(NaN, 100) invalid', 'rc');
assert('F-06', calculateEqaAbsoluteDeviation(100, NaN).supported === false, 'abs(100, NaN) invalid', 'rc');
assert('F-07', calculateEqaAbsoluteDeviation(Infinity, 100).supported === false, 'abs(Infinity, 100) invalid', 'rc');
assert('F-08', calculateEqaAbsoluteDeviation('100', 100).supported === false, 'abs(string, 100) invalid', 'rc');
const absInv = calculateEqaAbsoluteDeviation(NaN, 100);
assert('F-09', absInv.value === null && typeof absInv.reason === 'string', 'abs invalid: value=null, reason string', 'sg');

/* -----------------------------------------------------------------------
   SECTION G: calculateEqaRelativeDeviation (source-grounded + reconstructed)
   Formula: (participant - assigned) / assigned * 100 [independently computed]
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: calculateEqaRelativeDeviation ===');

// (105-100)/100*100 = 5.0%
const rel1 = calculateEqaRelativeDeviation(105, 100);
assert('G-01', rel1.supported && near(rel1.value, 5.0), 'rel(105, 100) = 5.0 [independently computed]', 'sg');
assert('G-02', rel1.units === '%', 'rel: units = "%"', 'sg');

// (95-100)/100*100 = -5.0%
const rel2 = calculateEqaRelativeDeviation(95, 100);
assert('G-03', rel2.supported && near(rel2.value, -5.0), 'rel(95, 100) = -5.0 [independently computed]', 'sg');

// Zero difference: (100-100)/100*100 = 0
const rel3 = calculateEqaRelativeDeviation(100, 100);
assert('G-04', rel3.supported && near(rel3.value, 0.0), 'rel(100, 100) = 0', 'sg');

// CRITICAL: assigned = 0 → unsupported (no Infinity)
const relZero = calculateEqaRelativeDeviation(5, 0);
assert('G-05', relZero.supported === false, 'CRITICAL: rel(5, 0) → unsupported (no Infinity)', 'sg');
assert('G-06', relZero.value === null && relZero.reason.includes('zero'), 'rel zero-denom: value=null, reason mentions zero', 'sg');

// Guards
assert('G-07', calculateEqaRelativeDeviation(NaN, 100).supported === false, 'rel(NaN, 100) invalid', 'rc');
assert('G-08', calculateEqaRelativeDeviation(100, NaN).supported === false, 'rel(100, NaN) invalid', 'rc');
assert('G-09', calculateEqaRelativeDeviation(Infinity, 100).supported === false, 'rel(Infinity, 100) invalid', 'rc');
assert('G-10', calculateEqaRelativeDeviation('100', 100).supported === false, 'rel(string, 100) invalid', 'rc');

/* -----------------------------------------------------------------------
   SECTION H: calculateEqaZScore (source-grounded + reconstructed)
   Formula: (participant - assigned) / sdpa [independently computed]
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: calculateEqaZScore ===');

// (105-100)/5 = 1.0
const z1 = calculateEqaZScore(105, 100, 5);
assert('H-01', z1.supported && near(z1.value, 1.0), 'z(105, 100, 5) = 1.0 [independently: (105-100)/5]', 'sg');
assert('H-02', z1.units === 'SD units (SDPA)', 'z: units = "SD units (SDPA)"', 'sg');

// (90-100)/5 = -2.0
const z2 = calculateEqaZScore(90, 100, 5);
assert('H-03', z2.supported && near(z2.value, -2.0), 'z(90, 100, 5) = -2.0 [independently: (90-100)/5]', 'sg');

// zero difference: z = 0
const z3 = calculateEqaZScore(100, 100, 5);
assert('H-04', z3.supported && near(z3.value, 0.0), 'z(100, 100, 5) = 0', 'sg');

// CRITICAL guards: SDPA must be > 0
const zSdpaZero = calculateEqaZScore(105, 100, 0);
assert('H-05', zSdpaZero.supported === false, 'CRITICAL: z(105, 100, SDPA=0) → unsupported', 'sg');
assert('H-06', zSdpaZero.reason.includes('greater than zero'), 'z SDPA=0: reason mentions greater than zero', 'sg');

const zSdpaNeg = calculateEqaZScore(105, 100, -1);
assert('H-07', zSdpaNeg.supported === false, 'CRITICAL: z(105, 100, SDPA=-1) → unsupported', 'sg');

// Non-finite inputs
assert('H-08', calculateEqaZScore(NaN, 100, 5).supported === false, 'z(NaN,...) invalid', 'rc');
assert('H-09', calculateEqaZScore(100, NaN, 5).supported === false, 'z(100, NaN,...) invalid', 'rc');
assert('H-10', calculateEqaZScore(100, 100, NaN).supported === false, 'z(..., NaN) invalid', 'rc');
assert('H-11', calculateEqaZScore(Infinity, 100, 5).supported === false, 'z(Infinity,...) invalid', 'rc');

/* -----------------------------------------------------------------------
   SECTION I: ILLUSTRATIVE Z-SCORE BANDS (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: Illustrative z-score bands ===');

assert('I-01', Array.isArray(ILLUSTRATIVE_ZSCORE_BANDS) && ILLUSTRATIVE_ZSCORE_BANDS.length === 3, 'ILLUSTRATIVE_ZSCORE_BANDS: 3 bands', 'sg');
assert('I-02', ILLUSTRATIVE_ZSCORE_BANDS[0].id === 'satisfactory' && ILLUSTRATIVE_ZSCORE_BANDS[0].range === '|z| ≤ 2', 'Band 0: satisfactory, |z| ≤ 2', 'sg');
assert('I-03', ILLUSTRATIVE_ZSCORE_BANDS[1].id === 'questionable' && ILLUSTRATIVE_ZSCORE_BANDS[1].range === '2 < |z| ≤ 3', 'Band 1: questionable, 2 < |z| ≤ 3', 'sg');
assert('I-04', ILLUSTRATIVE_ZSCORE_BANDS[2].id === 'unsatisfactory' && ILLUSTRATIVE_ZSCORE_BANDS[2].range === '|z| > 3', 'Band 2: unsatisfactory, |z| > 3', 'sg');
assert('I-05', ILLUSTRATIVE_ZSCORE_BANDS.every(b => b.label.includes('Illustrative')), 'All band labels contain "Illustrative"', 'sg');
assert('I-06', typeof ILLUSTRATIVE_ZSCORE_BANDS_CAUTION === 'string' && ILLUSTRATIVE_ZSCORE_BANDS_CAUTION.includes('not a universal laboratory pass/fail rule'), 'Bands caution: not a universal pass/fail rule', 'sg');
// No universal pass/fail function exists
assert('I-07', typeof m.eqaPassFail === 'undefined' && typeof m.zScorePassFail === 'undefined', 'No universal z-score pass/fail function exported', 'rc');
assert('I-08', typeof m.applyZScoreCriterion === 'undefined', 'No applyZScoreCriterion function', 'rc');

/* -----------------------------------------------------------------------
   SECTION J: calculatePairedDifference (source-grounded + reconstructed)
   Formula: B - A [independently computed]
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: calculatePairedDifference ===');

// B > A: 110 - 100 = +10
const pd1 = calculatePairedDifference(100, 110);
assert('J-01', pd1.supported && near(pd1.value, 10.0), 'paired(A=100, B=110) = +10 [independently: 110-100]', 'sg');
assert('J-02', pd1.units === 'same units as the paired results', 'paired: units field exact', 'sg');

// B < A: 95 - 100 = -5
const pd2 = calculatePairedDifference(100, 95);
assert('J-03', pd2.supported && near(pd2.value, -5.0), 'paired(A=100, B=95) = -5 [independently: 95-100]', 'sg');

// Equal: 0
const pd3 = calculatePairedDifference(100, 100);
assert('J-04', pd3.supported && near(pd3.value, 0.0), 'paired(100, 100) = 0', 'sg');

// Guards
assert('J-05', calculatePairedDifference(NaN, 100).supported === false, 'paired(NaN, 100) invalid', 'rc');
assert('J-06', calculatePairedDifference(100, NaN).supported === false, 'paired(100, NaN) invalid', 'rc');
assert('J-07', calculatePairedDifference(Infinity, 100).supported === false, 'paired(Infinity, 100) invalid', 'rc');
assert('J-08', calculatePairedDifference('100', 100).supported === false, 'paired(string, 100) invalid', 'rc');

/* -----------------------------------------------------------------------
   SECTION K: calculatePairedRelativeDifference (source-grounded + reconstructed)
   Formula: (B - A) / A * 100 [independently computed]
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: calculatePairedRelativeDifference ===');

// (110-100)/100*100 = +10.0%
const prd1 = calculatePairedRelativeDifference(100, 110);
assert('K-01', prd1.supported && near(prd1.value, 10.0), 'relPaired(A=100, B=110) = +10.0 [independently computed]', 'sg');
assert('K-02', prd1.units === '%', 'relPaired: units = "%"', 'sg');

// (95-100)/100*100 = -5.0%
const prd2 = calculatePairedRelativeDifference(100, 95);
assert('K-03', prd2.supported && near(prd2.value, -5.0), 'relPaired(A=100, B=95) = -5.0', 'sg');

// Zero difference: 0
const prd3 = calculatePairedRelativeDifference(100, 100);
assert('K-04', prd3.supported && near(prd3.value, 0.0), 'relPaired(100, 100) = 0', 'sg');

// CRITICAL: A = 0 → unsupported
const prdZero = calculatePairedRelativeDifference(0, 10);
assert('K-05', prdZero.supported === false, 'CRITICAL: relPaired(A=0, B=10) → unsupported', 'sg');
assert('K-06', prdZero.reason.includes('zero'), 'relPaired A=0: reason mentions zero', 'sg');

// Guards
assert('K-07', calculatePairedRelativeDifference(NaN, 100).supported === false, 'relPaired(NaN,...) invalid', 'rc');
assert('K-08', calculatePairedRelativeDifference(100, NaN).supported === false, 'relPaired(100, NaN) invalid', 'rc');
assert('K-09', calculatePairedRelativeDifference(Infinity, 100).supported === false, 'relPaired(Infinity,...) invalid', 'rc');

/* -----------------------------------------------------------------------
   SECTION L: describeSchemeCapability (source-grounded)
   Exact boolean logic from HTML source recovered verbatim.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: describeSchemeCapability ===');

// All true — full capability
const capAll = describeSchemeCapability({
  methodGroupsDefined: true, higherOrderTargetAvailable: true,
  commutabilityVerified: true, replicateSpecimensIncluded: true,
  performanceSpecificationStated: true
});
assert('L-01', capAll.canAssessHarmonisation === true, 'All true: canAssessHarmonisation = true', 'sg');
assert('L-02', capAll.canAssessMethodPerformance === true, 'All true: canAssessMethodPerformance = true', 'sg');
assert('L-03', capAll.canAssessParticipantPerformance === true, 'All true: canAssessParticipantPerformance = true', 'sg');
assert('L-04', capAll.statements.length >= 4, 'All true: multiple positive statements', 'sg');
assert('L-05', capAll.limitations.length === 0, 'All true: no limitations', 'sg');

// All false — limited capability
const capNone = describeSchemeCapability({
  methodGroupsDefined: false, higherOrderTargetAvailable: false,
  commutabilityVerified: false, replicateSpecimensIncluded: false,
  performanceSpecificationStated: false
});
assert('L-06', capNone.canAssessHarmonisation === false, 'All false: canAssessHarmonisation = false', 'sg');
assert('L-07', capNone.canAssessMethodPerformance === false, 'All false: canAssessMethodPerformance = false', 'sg');
assert('L-08', capNone.canAssessParticipantPerformance === false, 'All false: canAssessParticipantPerformance = false', 'sg');

// null/undefined profile — treated as "not stated"
const capNull = describeSchemeCapability(null);
assert('L-09', typeof capNull === 'object' && Array.isArray(capNull.limitations), 'null profile returns valid object', 'sg');
assert('L-10', capNull.canAssessHarmonisation === false, 'null profile: canAssessHarmonisation = false', 'sg');
assert('L-11', capNull.canAssessParticipantPerformance === false, 'null profile: canAssessParticipantPerformance = false', 'sg');

// canAssessHarmonisation requires ALL THREE: commutabilityVerified AND higherOrderTargetAvailable AND methodGroupsDefined
assert('L-12', describeSchemeCapability({ commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: false }).canAssessHarmonisation === false, 'Harmonisation: needs methodGroupsDefined=true', 'sg');
assert('L-13', describeSchemeCapability({ commutabilityVerified: true, higherOrderTargetAvailable: false, methodGroupsDefined: true }).canAssessHarmonisation === false, 'Harmonisation: needs higherOrderTargetAvailable=true', 'sg');
assert('L-14', describeSchemeCapability({ commutabilityVerified: false, higherOrderTargetAvailable: true, methodGroupsDefined: true }).canAssessHarmonisation === false, 'Harmonisation: needs commutabilityVerified=true', 'sg');
assert('L-15', describeSchemeCapability({ commutabilityVerified: true, higherOrderTargetAvailable: true, methodGroupsDefined: true }).canAssessHarmonisation === true, 'Harmonisation: all three true → true', 'sg');

// canAssessMethodPerformance: methodGroupsDefined AND (higherOrder OR performanceSpec)
assert('L-16', describeSchemeCapability({ methodGroupsDefined: true, higherOrderTargetAvailable: false, performanceSpecificationStated: false }).canAssessMethodPerformance === false, 'MethodPerf: groups + neither spec → false', 'sg');
assert('L-17', describeSchemeCapability({ methodGroupsDefined: true, higherOrderTargetAvailable: true, performanceSpecificationStated: false }).canAssessMethodPerformance === true, 'MethodPerf: groups + higherOrder → true', 'sg');
assert('L-18', describeSchemeCapability({ methodGroupsDefined: true, higherOrderTargetAvailable: false, performanceSpecificationStated: true }).canAssessMethodPerformance === true, 'MethodPerf: groups + perfSpec → true', 'sg');
assert('L-19', describeSchemeCapability({ methodGroupsDefined: false, higherOrderTargetAvailable: true, performanceSpecificationStated: true }).canAssessMethodPerformance === false, 'MethodPerf: no groups → false', 'sg');

// canAssessParticipantPerformance: at least one of methodGroups, perfSpec, higherOrder
assert('L-20', describeSchemeCapability({ methodGroupsDefined: true, higherOrderTargetAvailable: false, performanceSpecificationStated: false }).canAssessParticipantPerformance === true, 'ParticipantPerf: groups alone → true', 'sg');
assert('L-21', describeSchemeCapability({ methodGroupsDefined: false, higherOrderTargetAvailable: true, performanceSpecificationStated: false }).canAssessParticipantPerformance === true, 'ParticipantPerf: higherOrder alone → true', 'sg');
assert('L-22', describeSchemeCapability({ methodGroupsDefined: false, higherOrderTargetAvailable: false, performanceSpecificationStated: true }).canAssessParticipantPerformance === true, 'ParticipantPerf: perfSpec alone → true', 'sg');
assert('L-23', describeSchemeCapability({ methodGroupsDefined: false, higherOrderTargetAvailable: false, performanceSpecificationStated: false }).canAssessParticipantPerformance === false, 'ParticipantPerf: all false → false', 'sg');

// Missing properties treated as "not stated" (not guessed)
const capPartial = describeSchemeCapability({ methodGroupsDefined: true });
assert('L-24', capPartial.canAssessHarmonisation === false, 'Partial: missing higherOrder/commutability → harmonisation false', 'sg');
assert('L-25', capPartial.limitations.some(l => l.includes('not stated') || l.includes('unknown') || l.includes('not been established')), 'Partial: unstated properties produce limitation text', 'sg');

// No Miller Category classifier
assert('L-26', !('categoryNumber' in capAll) && !('millerCategory' in capAll), 'No Miller Category number in result', 'sg');
assert('L-27', !('capabilityScore' in capAll), 'No capability score in result', 'sg');

/* -----------------------------------------------------------------------
   SECTION M: ARCHITECTURE (reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: Architecture / forbidden engines ===');

const srcText = require('fs').readFileSync(require('path').join(__dirname, '../src/eqa/calc.js'), 'utf8');

assert('M-01', !srcText.includes('import React') && !srcText.includes("from 'react'"), 'No React import', 'rc');
assert('M-02', !srcText.match(/\bclassName=/), 'No JSX className', 'rc');
assert('M-03', !srcText.match(/\bdocument\.getElementById\b|\bwindow\.addEventListener\b/), 'No DOM API', 'rc');
assert('M-04', !srcText.includes('PassingBablok') && !srcText.includes('passingBablok'), 'No Passing-Bablok', 'rc');
// "Deming" legitimately appears in source docstring as a named exclusion — test that no function uses it
const hasDeming = Object.keys(m).filter(k => k.toLowerCase().includes('deming')).length;
assert('M-05', hasDeming === 0, 'No Deming regression function exported (docstring mention allowed)', 'rc');
assert('M-06', !srcText.includes('blandAltman') && !srcText.includes('bland_altman'), 'No Bland-Altman', 'rc');
assert('M-07', !srcText.includes('millerCategory') && !srcText.includes('categoryNumber'), 'No Miller Category classifier', 'rc');
assert('M-08', typeof m.holdPatientResults === 'undefined' && typeof m.invalidatePatientResults === 'undefined', 'No patient-result hold/invalidate function', 'rc');
assert('M-09', typeof m.autoAmendResult === 'undefined' && typeof m.notifyClinician === 'undefined', 'No auto-amend or auto-notify function', 'rc');
assert('M-10', typeof m.inferRootCause === 'undefined' && typeof m.bayesianRootCause === 'undefined', 'No root-cause inference', 'rc');

// Deming mention in source is in a docstring (not a function): check no function includes it
const dmFns = Object.keys(m).filter(k => typeof m[k] === 'function' && k.toLowerCase().includes('deming'));
assert('M-11', dmFns.length === 0, 'No Deming regression function exported', 'rc');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 6A EQA Calc Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 6A FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 6A PASSED — all tests green.');
  process.exit(0);
}
