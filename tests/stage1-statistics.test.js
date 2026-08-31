/* =========================================================================
   tests/stage1-statistics.test.js

   NEW RECOVERY TESTS — Stage 1
   These are newly written tests for the recovered statistics engine.
   They are NOT the historical test suite (which was lost during account
   migration). They validate invariants consistent with the recovered
   implementation in src/core/statistics.js.

   Run: node tests/stage1-statistics.test.js
   ========================================================================= */

'use strict';

const {
  calcMean,
  calcSampleSD,
  calcCVPercent,
  calcBiasPercent,
  calcSigma,
  roundTo,
  fmt,
  fmtSigned,
  runFixtureChecks,
} = require('../src/core/statistics');

let passed = 0;
let failed = 0;

function assert(id, condition, detail) {
  if (condition) {
    console.log(`  ✓ [${id}] ${detail}`);
    passed++;
  } else {
    console.error(`  ✗ [${id}] FAIL: ${detail}`);
    failed++;
  }
}

const near = (a, b, tol = 0.0001) => isFinite(a) && Math.abs(a - b) <= tol;

/* -----------------------------------------------------------------------
   SECTION 1: DIRECTLY RECOVERED RUNTIME FIXTURES (Class A)
   Verbatim from recovery/original-v0.8.html runFixtureChecks()
   ----------------------------------------------------------------------- */
console.log('\n=== DIRECTLY RECOVERED RUNTIME FIXTURES (Class A) ===');
const fixtureResults = runFixtureChecks();
for (const [label, result] of fixtureResults) {
  assert('FIXTURE', result, label);
}

/* -----------------------------------------------------------------------
   SECTION 2: NEW RECOVERY TESTS (not historical)
   ----------------------------------------------------------------------- */
console.log('\n=== NEW RECOVERY TESTS — calcMean ===');

// T-MEAN-01: Arithmetic mean of a uniform array
assert('T-MEAN-01', near(calcMean([10, 10, 10]), 10), 'Mean of [10,10,10] = 10');

// T-MEAN-02: Mean of single element
assert('T-MEAN-02', near(calcMean([42]), 42), 'Mean of [42] = 42');

// T-MEAN-03: Empty array returns NaN
assert('T-MEAN-03', isNaN(calcMean([])), 'Mean of [] = NaN');

// T-MEAN-04: Non-array input returns NaN
assert('T-MEAN-04', isNaN(calcMean(null)), 'Mean of null = NaN');
assert('T-MEAN-04b', isNaN(calcMean(5)), 'Mean of scalar = NaN');

// T-MEAN-05: Known five-value set (matches Fixture A data)
assert('T-MEAN-05', near(calcMean([98, 100, 101, 99, 102]), 100, 0.0001), 'Mean [98,100,101,99,102] = 100');

console.log('\n=== NEW RECOVERY TESTS — calcSampleSD ===');

// T-SD-01: Sample SD requires n >= 2
assert('T-SD-01', isNaN(calcSampleSD([5])), 'Sample SD of single value = NaN');
assert('T-SD-01b', isNaN(calcSampleSD([])), 'Sample SD of empty = NaN');

// T-SD-02: Two-element SD
// SD([0,2]) = sqrt(((0-1)^2 + (2-1)^2) / 1) = sqrt(2) ≈ 1.4142
assert('T-SD-02', near(calcSampleSD([0, 2]), Math.sqrt(2), 0.0001), 'Sample SD [0,2] ≈ 1.4142 (n-1 denominator)');

// T-SD-03: Fixture A dataset
assert('T-SD-03', near(calcSampleSD([98, 100, 101, 99, 102]), 1.5811, 0.0005), 'Sample SD Fixture A ≈ 1.5811');

// T-SD-04: Uses n-1 not n (population would give ~1.4142 for [98,100,101,99,102] scaled)
// For [0, 2]: sample SD = sqrt(2) ≈ 1.4142; population SD = 1.0 — confirm sample
assert('T-SD-04', near(calcSampleSD([0, 2]), 1.4142, 0.001) && !near(calcSampleSD([0, 2]), 1.0, 0.001),
  'Sample SD uses n-1 denominator (not population n)');

console.log('\n=== NEW RECOVERY TESTS — calcCVPercent ===');

// T-CV-01: Basic CV
assert('T-CV-01', near(calcCVPercent(2, 100), 2.0), 'CV% = 2/100*100 = 2.0');

// T-CV-02: Zero mean → NaN (guard)
assert('T-CV-02', isNaN(calcCVPercent(2, 0)), 'CV% with mean=0 → NaN');

// T-CV-03: Negative mean → NaN (guard)
assert('T-CV-03', isNaN(calcCVPercent(2, -5)), 'CV% with mean=-5 → NaN');

// T-CV-04: Non-finite inputs
assert('T-CV-04', isNaN(calcCVPercent(NaN, 100)), 'CV% with SD=NaN → NaN');
assert('T-CV-04b', isNaN(calcCVPercent(2, Infinity)), 'CV% with mean=Infinity → NaN');

console.log('\n=== NEW RECOVERY TESTS — calcBiasPercent ===');

// T-BIAS-01: Positive bias
assert('T-BIAS-01', near(calcBiasPercent(102, 100), 2.0), 'Bias (102,100) = +2.0%');

// T-BIAS-02: Negative bias
assert('T-BIAS-02', near(calcBiasPercent(98, 100), -2.0), 'Bias (98,100) = -2.0%');

// T-BIAS-03: Zero target → NaN (guard)
assert('T-BIAS-03', isNaN(calcBiasPercent(5, 0)), 'Bias with target=0 → NaN');

// T-BIAS-04: Signed (not absolute)
assert('T-BIAS-04',
  calcBiasPercent(98, 100) < 0 && calcBiasPercent(102, 100) > 0,
  'Bias is signed: negative when observed < target');

console.log('\n=== NEW RECOVERY TESTS — calcSigma ===');

// T-SIG-01: Standard positive case
const s1 = calcSigma(10, 2, 2);
assert('T-SIG-01', s1.valid && near(s1.value, 4.0), 'Sigma(TEa=10,bias=+2,CV=2) = 4.0');

// T-SIG-02: Negative bias — absolute bias used in numerator
const s2 = calcSigma(10, -2, 2);
assert('T-SIG-02', s2.valid && near(s2.value, 4.0), 'Sigma(TEa=10,bias=-2,CV=2) = 4.0 (|bias| used)');

// T-SIG-03: Sigma with opposite-sign bias gives same magnitude
assert('T-SIG-03', near(s1.value, s2.value, 1e-9), 'Sigma is equal for +bias and -bias of same magnitude');

// T-SIG-04: Negative Sigma is allowed — not floored to zero
const sNeg = calcSigma(5, 8, 2);
assert('T-SIG-04', sNeg.valid && sNeg.value < 0, 'Negative Sigma permitted when |bias| > TEa');
assert('T-SIG-04b', !!sNeg.warning, 'Negative Sigma carries a warning message');

// T-SIG-05: CV=0 → invalid
const sBad = calcSigma(10, 2, 0);
assert('T-SIG-05', !sBad.valid && sBad.value === null, 'Sigma invalid when CV=0');

// T-SIG-06: Non-finite inputs → invalid
const sBad2 = calcSigma(NaN, 2, 2);
assert('T-SIG-06', !sBad2.valid, 'Sigma invalid when TEa=NaN');

// T-SIG-07: No warning when TEa > |bias|
assert('T-SIG-07', s1.warning === null, 'No warning when TEa > |bias|');

// T-SIG-08: Exact zero Sigma when TEa = |bias|
const sZero = calcSigma(5, 5, 2);
assert('T-SIG-08', sZero.valid && near(sZero.value, 0.0), 'Sigma=0 when TEa exactly equals |bias|');

console.log('\n=== NEW RECOVERY TESTS — roundTo / fmt / fmtSigned ===');

// T-FMT-01: roundTo
assert('T-FMT-01', roundTo(3.14159, 2) === 3.14, 'roundTo(3.14159, 2) = 3.14');
assert('T-FMT-01b', roundTo(2.005, 2) === 2.01 || roundTo(2.005, 2) === 2.00,
  'roundTo handles boundary rounding (JS float behaviour)');

// T-FMT-02: fmt returns em-dash for null/undefined/NaN/Infinity
assert('T-FMT-02', fmt(null, 2) === '—', 'fmt(null) = —');
assert('T-FMT-02b', fmt(NaN, 2) === '—', 'fmt(NaN) = —');
assert('T-FMT-02c', fmt(Infinity, 2) === '—', 'fmt(Infinity) = —');

// T-FMT-03: fmt formats valid numbers
assert('T-FMT-03', fmt(3.14159, 2) === '3.14', 'fmt(3.14159, 2) = "3.14"');

// T-FMT-04: fmtSigned prefixes "+" for non-negative
assert('T-FMT-04', fmtSigned(2.0, 1) === '+2.0', 'fmtSigned(2.0, 1) = "+2.0"');
assert('T-FMT-04b', fmtSigned(-2.0, 1) === '-2.0', 'fmtSigned(-2.0, 1) = "-2.0"');
assert('T-FMT-04c', fmtSigned(NaN, 1) === '—', 'fmtSigned(NaN) = —');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 1 Statistics Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`Directly recovered runtime fixtures: ${fixtureResults.filter(r=>r[1]).length}/${fixtureResults.length} passed`);
if (failed > 0) {
  console.error('STAGE 1 FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 1 PASSED — all tests green.');
  process.exit(0);
}
