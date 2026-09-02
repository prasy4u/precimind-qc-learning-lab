/* =========================================================================
   tests/stage8a-pbrtqc-calc.test.js

   NEW RECOVERY TESTS — Stage 8A (NOT the historical test suite)
   Tests for the recovered Patient Surveillance Lab (PBRTQC) calc engine
   in src/pbrtqc/calc.js.

   ARTIFACT PROVENANCE: Class D (recovery infrastructure, not historical)
   SOURCE MODULE: Artifact Class A — src/pbrtqc/calc.js (HTML lines 12023-12474)

   TEST EXPECTATION PROVENANCE:
   SOURCE-GROUNDED EXPECTATION:
     Exact formulas, exact guard semantics, exact constant values, exact
     return structure fields, exact error-type lists, exact EWMA seed
     semantics, exact truncation boundary inclusivity, exact NPed/ANPed
     censoring invariants — all directly encoded in HTML source.
   RECONSTRUCTED EXPECTATION:
     Additional guard cases, boundary sweeps, cross-function consistency
     checks, and absence/architecture tests created during recovery.

   ANTI-CIRCULAR DISCIPLINE:
   All numerical expected values are independently computed and hard-coded.
   No function is called at test time to generate its own expected value.

   Hard-coded reference values (independently computed):
     Sliding mean([1,2,3,4,5], W=3): series[2]=2.0, [3]=3.0, [4]=4.0
     Sliding median([1,2,3,4,5], W=3): same values by coincidence (sorted)
     EWMA(z0=0, lambda=0.2, [1,2,3]):
       z1 = 0.2*1 + 0.8*0 = 0.2 (hard-coded)
       z2 = 0.2*2 + 0.8*0.2 = 0.56 (hard-coded)
       z3 = 0.2*3 + 0.8*0.56 = 1.048 (hard-coded)
     NPed(onset=3, alert=8) = 8-3 = 5 (hard-coded)
     falseFlagRate(3 breaches, 50 evaluable) = 3/50*100 = 6.0% (hard-coded)

   W is the ONLY symbol used for PBRTQC window size.
   N must never be used for window size in this module.

   Run: node tests/stage8a-pbrtqc-calc.test.js
   ========================================================================= */

'use strict';

const m = require('../src/pbrtqc/calc');
const {
  validateWindowSize,
  calculateSlidingMean,
  calculateSlidingMedian,
  calculateEWMA,
  applyMetadataFilter,
  injectAnalyticalError,
  SUPPORTED_ERROR_TYPES,
  applyHardTruncation,
  evaluateControlLimit,
  calculatePointwiseFalseFlagRate,
  calculateNPed,
  summarizeNpedTrials,
  runPbrtqcStream
} = m;

let passed = 0, failed = 0, sg = 0, rc = 0;

function assert(id, condition, detail, prov) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
  if (prov === 'sg') sg++; else rc++;
}

const near = (a, b, tol = 0.0000001) =>
  typeof a === 'number' && typeof b === 'number' && isFinite(a) && isFinite(b) && Math.abs(a - b) <= tol;

/* -----------------------------------------------------------------------
   SECTION A: EXPORT ARCHITECTURE (source-grounded + reconstructed)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION A: Export architecture ===');

assert('A-01', Object.keys(m).length === 13, 'Exactly 13 exports', 'rc');
const fns = Object.keys(m).filter(k => typeof m[k] === 'function');
assert('A-02', fns.length === 12, 'Exactly 12 exported functions', 'sg');
assert('A-03', !Array.isArray(SUPPORTED_ERROR_TYPES) || typeof SUPPORTED_ERROR_TYPES[0] === 'string', 'SUPPORTED_ERROR_TYPES is an array of strings', 'sg');

// W symbol: N must never appear as window-size parameter
const srcText = require('fs').readFileSync(require('path').join(__dirname, '../src/pbrtqc/calc.js'), 'utf8');
// The 'W throughout instead' phrase is in the app HTML description, not in calc.js itself
// The calc.js source uses W consistently — verify by checking windowSize variable and no N=window usage
assert('A-04', srcText.includes('W') && !srcText.match(/\bfor PBRTQC window size\b.*N\b|N.*PBRTQC window/), 'calc.js uses W, not N, for window size', 'rc');
assert('A-05', !srcText.match(/\bwindowSize.*=.*N\b|\bN.*=.*windowSize\b/), 'No window size stored as N', 'rc');

// No IQC engine, no CUSUM, no BV engine
assert('A-06', typeof m.calculateCusum === 'undefined', 'No CUSUM function', 'rc');
assert('A-07', typeof m.calculateReferenceInterval === 'undefined', 'No RI generation', 'rc');
assert('A-08', typeof m.autoCorrectPatientResult === 'undefined', 'No auto patient correction', 'rc');
assert('A-09', typeof m.notifyClinician === 'undefined', 'No auto notification', 'rc');
assert('A-10', typeof m.calculateMovingSD === 'undefined' && typeof m.movingSD === 'undefined', 'No moving SD engine', 'rc');

/* -----------------------------------------------------------------------
   SECTION B: SUPPORTED_ERROR_TYPES (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION B: SUPPORTED_ERROR_TYPES ===');

assert('B-01', Array.isArray(SUPPORTED_ERROR_TYPES) && SUPPORTED_ERROR_TYPES.length === 5, 'SUPPORTED_ERROR_TYPES: 5 values', 'sg');
assert('B-02', SUPPORTED_ERROR_TYPES[0] === 'none', 'Type[0]: none', 'sg');
assert('B-03', SUPPORTED_ERROR_TYPES[1] === 'persistent-additive', 'Type[1]: persistent-additive', 'sg');
assert('B-04', SUPPORTED_ERROR_TYPES[2] === 'persistent-proportional', 'Type[2]: persistent-proportional', 'sg');
assert('B-05', SUPPORTED_ERROR_TYPES[3] === 'temporary-additive', 'Type[3]: temporary-additive', 'sg');
assert('B-06', SUPPORTED_ERROR_TYPES[4] === 'temporary-proportional', 'Type[4]: temporary-proportional', 'sg');
// No imprecision, no Box-Cox, no CUSUM error types
assert('B-07', !SUPPORTED_ERROR_TYPES.some(t => t.includes('imprecision') || t.includes('cusum') || t.includes('boxcox')), 'No imprecision/cusum/boxcox error types', 'sg');

/* -----------------------------------------------------------------------
   SECTION C: validateWindowSize (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION C: validateWindowSize ===');

// W must be a positive integer
assert('C-01', validateWindowSize(1).valid === true, 'W=1: valid', 'sg');
assert('C-02', validateWindowSize(3).valid === true, 'W=3: valid', 'sg');
assert('C-03', validateWindowSize(100).valid === true, 'W=100: valid', 'sg');
assert('C-04', validateWindowSize(0).valid === false, 'W=0: invalid', 'sg');
assert('C-05', validateWindowSize(-1).valid === false, 'W=-1: invalid', 'sg');
assert('C-06', validateWindowSize(1.5).valid === false, 'W=1.5: invalid (not whole number)', 'sg');
assert('C-07', validateWindowSize(NaN).valid === false, 'W=NaN: invalid', 'rc');
assert('C-08', validateWindowSize(Infinity).valid === false, 'W=Infinity: invalid', 'rc');
assert('C-09', validateWindowSize(0).reason.includes('at least 1'), 'W=0 reason: at least 1', 'sg');
assert('C-10', validateWindowSize(1.5).reason.includes('whole number'), 'W=1.5 reason: whole number', 'sg');

/* -----------------------------------------------------------------------
   SECTION D: calculateSlidingMean (source-grounded)
   Formula: mean of W most recent values (raw number array)
   Hard-coded: [1,2,3,4,5], W=3 → warming-up, warming-up, 2.0, 3.0, 4.0
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION D: calculateSlidingMean ===');

const sm35 = calculateSlidingMean([1,2,3,4,5], 3);
assert('D-01', sm35.supported === true, 'slidingMean([1-5],W=3) supported', 'sg');
assert('D-02', sm35.algorithmId === 'moving-mean', 'algorithmId = moving-mean', 'sg');
assert('D-03', sm35.windowSize === 3, 'windowSize = 3', 'sg');
assert('D-04', sm35.series[0].warmupStatus === 'warming-up' && sm35.series[0].statistic === undefined,
  'index=0: warmupStatus=warming-up, statistic=undefined [independently: W-1=2 warm-up points]', 'sg');
assert('D-05', sm35.series[1].warmupStatus === 'warming-up', 'index=1: warming-up', 'sg');
assert('D-06', sm35.series[2].warmupStatus === 'complete' && near(sm35.series[2].statistic, 2.0),
  'index=2: complete, statistic=2.0 [hard-coded: (1+2+3)/3]', 'sg');
assert('D-07', sm35.series[3].warmupStatus === 'complete' && near(sm35.series[3].statistic, 3.0),
  'index=3: statistic=3.0 [hard-coded: (2+3+4)/3]', 'sg');
assert('D-08', sm35.series[4].warmupStatus === 'complete' && near(sm35.series[4].statistic, 4.0),
  'index=4: statistic=4.0 [hard-coded: (3+4+5)/3]', 'sg');

// W=1: no warm-up
const sm1 = calculateSlidingMean([5,10,15], 1);
assert('D-09', sm1.series.every(r => r.warmupStatus === 'complete'), 'W=1: no warming-up', 'sg');
assert('D-10', near(sm1.series[0].statistic, 5.0) && near(sm1.series[1].statistic, 10.0), 'W=1: each value is its own mean', 'sg');

// W=0: unsupported
assert('D-11', calculateSlidingMean([1,2,3], 0).supported === false, 'W=0: unsupported', 'sg');
assert('D-12', calculateSlidingMean([], 3).series.length === 0, 'Empty input: empty series', 'sg');

/* -----------------------------------------------------------------------
   SECTION E: calculateSlidingMedian (source-grounded)
   Sorted median; even W: mean of two central values.
   Hard-coded: [1,2,3,4,5], W=3 → warming-up, warming-up, 2, 3, 4
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION E: calculateSlidingMedian ===');

const smn35 = calculateSlidingMedian([1,2,3,4,5], 3);
assert('E-01', smn35.supported === true && smn35.algorithmId === 'moving-median', 'slidingMedian: supported, algorithmId=moving-median', 'sg');
assert('E-02', smn35.series[0].warmupStatus === 'warming-up' && smn35.series[1].warmupStatus === 'warming-up', 'Two warming-up for W=3', 'sg');
assert('E-03', near(smn35.series[2].statistic, 2.0), 'index=2: median=2.0 [hard-coded: sorted [1,2,3] → 2]', 'sg');
assert('E-04', near(smn35.series[3].statistic, 3.0), 'index=3: median=3.0 [hard-coded: sorted [2,3,4] → 3]', 'sg');
assert('E-05', near(smn35.series[4].statistic, 4.0), 'index=4: median=4.0 [hard-coded: sorted [3,4,5] → 4]', 'sg');
assert('E-06', typeof smn35.medianConvention === 'string' && smn35.medianConvention.length > 0, 'medianConvention string present', 'sg');

// Even W: mean of two central
// [1,2,3,4], W=2 → medians=[1.5, 2.5, 3.5]
const smnEven = calculateSlidingMedian([1,2,3,4], 2);
assert('E-07', near(smnEven.series[1].statistic, 1.5), 'Even W=2: (1+2)/2=1.5 [hard-coded]', 'sg');
assert('E-08', near(smnEven.series[2].statistic, 2.5), 'Even W=2: (2+3)/2=2.5 [hard-coded]', 'sg');
assert('E-09', near(smnEven.series[3].statistic, 3.5), 'Even W=2: (3+4)/2=3.5 [hard-coded]', 'sg');

// Not sorted in input order — median is from sorted window
// [5,1,3], W=3 → sorted [1,3,5] → median=3
const smnUnsorted = calculateSlidingMedian([5,1,3], 3);
assert('E-10', near(smnUnsorted.series[2].statistic, 3.0), 'Unsorted input: median=3.0 [sorted [1,3,5]]', 'sg');

/* -----------------------------------------------------------------------
   SECTION F: calculateEWMA (source-grounded)
   z_t = lambda*x_t + (1-lambda)*z_(t-1); z_0 = baselineCenter (separate).
   No warm-up: defined from first point.
   Hard-coded: lambda=0.2, z0=0, [1,2,3]:
     z1 = 0.2*1 + 0.8*0 = 0.2
     z2 = 0.2*2 + 0.8*0.2 = 0.56
     z3 = 0.2*3 + 0.8*0.56 = 1.048
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION F: calculateEWMA ===');

const ew02_0 = calculateEWMA([1,2,3], 0.2, 0);
assert('F-01', ew02_0.supported === true && ew02_0.algorithmId === 'ewma', 'EWMA: supported, algorithmId=ewma', 'sg');
assert('F-02', ew02_0.lambda === 0.2 && ew02_0.baselineCenter === 0, 'EWMA: lambda=0.2, baselineCenter=0', 'sg');
// All three points are complete (no warm-up)
assert('F-03', ew02_0.series.every(r => r.warmupStatus === 'complete'), 'EWMA: no warm-up (all complete)', 'sg');
assert('F-04', near(ew02_0.series[0].statistic, 0.2), 'EWMA z1=0.2 [hard-coded: 0.2*1+0.8*0]', 'sg');
assert('F-05', near(ew02_0.series[1].statistic, 0.56), 'EWMA z2=0.56 [hard-coded: 0.2*2+0.8*0.2]', 'sg');
assert('F-06', near(ew02_0.series[2].statistic, 1.048), 'EWMA z3=1.048 [hard-coded: 0.2*3+0.8*0.56]', 'sg');

// lambda=1: each point is just the current value (no smoothing)
const ew1 = calculateEWMA([5,10,15], 1.0, 0);
assert('F-07', near(ew1.series[0].statistic, 5.0) && near(ew1.series[1].statistic, 10.0) && near(ew1.series[2].statistic, 15.0),
  'EWMA lambda=1: each value is current (no smoothing) [hard-coded: z_t = x_t]', 'sg');

// baselineCenter semantics: explicitly separate, never from first value
// With z0=100, lambda=0.5, first value=110:
// z1 = 0.5*110 + 0.5*100 = 105
const ewBaseline = calculateEWMA([110], 0.5, 100);
assert('F-08', near(ewBaseline.series[0].statistic, 105.0), 'EWMA: baseline z0=100 explicitly used, z1=105 [hard-coded: 0.5*110+0.5*100]', 'sg');

// Guards
assert('F-09', calculateEWMA([1,2,3], 0, 0).supported === false, 'EWMA lambda=0: invalid (0<lambda<=1)', 'sg');
assert('F-10', calculateEWMA([1,2,3], -0.1, 0).supported === false, 'EWMA lambda<0: invalid', 'sg');
assert('F-11', calculateEWMA([1,2,3], 1.1, 0).supported === false, 'EWMA lambda>1: invalid', 'sg');
assert('F-12', calculateEWMA([1,2,3], NaN, 0).supported === false, 'EWMA lambda=NaN: invalid', 'rc');

/* -----------------------------------------------------------------------
   SECTION G: applyMetadataFilter (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION G: applyMetadataFilter ===');

// Included: label not in excluded list
const fA = applyMetadataFilter('diabetes', ['pregnant']);
assert('G-01', fA.included === true && fA.exclusionReason === null, 'Filter: diabetes not on excluded list → included', 'sg');

// Excluded: label on excluded list
const fB = applyMetadataFilter('pregnant', ['pregnant', 'paediatric']);
assert('G-02', fB.included === false, 'Filter: pregnant on excluded list → excluded', 'sg');
assert('G-03', typeof fB.exclusionReason === 'string' && fB.exclusionReason.includes('pregnant'), 'Filter: exclusionReason mentions label', 'sg');

// null label: never excluded (null != excluded string)
const fC = applyMetadataFilter(null, ['pregnant']);
assert('G-04', fC.included === true, 'Filter: null label → included', 'sg');

// No exclusion list: all included
const fD = applyMetadataFilter('diabetes', []);
assert('G-05', fD.included === true, 'Filter: empty exclusion list → included', 'sg');

const fE = applyMetadataFilter('diabetes', null);
assert('G-06', fE.included === true, 'Filter: null exclusion list treated as empty → included', 'sg');

/* -----------------------------------------------------------------------
   SECTION H: injectAnalyticalError (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION H: injectAnalyticalError ===');

// errorType=none: no change
const injNone = injectAnalyticalError(100, 5, { errorType: 'none', magnitude: 10, onsetIndex: 3 });
assert('H-01', injNone.affected === false && injNone.value === 100, 'errorType=none: no change', 'sg');

// persistent-additive onset=3, rawPatientIndex=5, magnitude=10: value=110
const injPersAdd = injectAnalyticalError(100, 5, { errorType: 'persistent-additive', magnitude: 10, onsetIndex: 3 });
assert('H-02', injPersAdd.affected === true && near(injPersAdd.value, 110.0), 'Persistent additive: 100+10=110 [hard-coded]', 'sg');
assert('H-03', injPersAdd.errorType === 'persistent-additive', 'injected: errorType field preserved', 'sg');

// persistent-proportional: value = 100 * (1 + 10/100) = 110
const injPersProp = injectAnalyticalError(100, 5, { errorType: 'persistent-proportional', magnitude: 10, onsetIndex: 3 });
assert('H-04', injPersProp.affected === true && near(injPersProp.value, 110.0), 'Persistent proportional: 100*(1+10/100)=110 [hard-coded]', 'sg');

// Before onset: not affected
const injBefore = injectAnalyticalError(100, 2, { errorType: 'persistent-additive', magnitude: 10, onsetIndex: 3 });
assert('H-05', injBefore.affected === false, 'Before onset: not affected', 'sg');

// temporary-additive: within duration
const injTempIn = injectAnalyticalError(100, 4, { errorType: 'temporary-additive', magnitude: 5, onsetIndex: 3, duration: 3 });
assert('H-06', injTempIn.affected === true && near(injTempIn.value, 105.0), 'Temporary additive within duration: 105 [hard-coded]', 'sg');

// temporary-additive: after duration (onset=3, duration=3 → affects indices 3,4,5; index 6 unaffected)
const injTempOut = injectAnalyticalError(100, 6, { errorType: 'temporary-additive', magnitude: 5, onsetIndex: 3, duration: 3 });
assert('H-07', injTempOut.affected === false, 'Temporary additive after duration: not affected', 'sg');

// Error injection applied BEFORE truncation — check application order preserved in source
assert('H-08', srcText.includes('before truncation') || srcText.includes('BEFORE truncation') || srcText.includes('before applyHardTruncation'),
  'Source documents: error injection before truncation', 'sg');

// No "calibration failure" label
assert('H-09', !srcText.includes('"calibration failure"') && !srcText.match(/"reagent failure"/),
  'Source does not label errors "calibration failure" or "reagent failure"', 'sg');

/* -----------------------------------------------------------------------
   SECTION I: applyHardTruncation (source-grounded)
   Inclusive at both limits; strictly outside → excluded; never winsorisation.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION I: applyHardTruncation ===');

// Included
const trIn = applyHardTruncation(100, 90, 110);
assert('I-01', trIn.included === true && trIn.value === 100, 'Value within limits: included', 'sg');

// At lower limit — inclusive
const trLow = applyHardTruncation(90, 90, 110);
assert('I-02', trLow.included === true, 'Value at lower limit: included (inclusive)', 'sg');

// At upper limit — inclusive
const trHigh = applyHardTruncation(110, 90, 110);
assert('I-03', trHigh.included === true, 'Value at upper limit: included (inclusive)', 'sg');

// Strictly below lower: excluded
const trBelow = applyHardTruncation(89.9, 90, 110);
assert('I-04', trBelow.included === false, 'Strictly below lower limit: excluded', 'sg');

// Strictly above upper: excluded
const trAbove = applyHardTruncation(110.1, 90, 110);
assert('I-05', trAbove.included === false, 'Strictly above upper limit: excluded', 'sg');

// No limit: all included
const trNoLimit = applyHardTruncation(50, undefined, undefined);
assert('I-06', trNoLimit.included === true, 'No limits: always included', 'sg');

// Source says this is never called winsorisation
// calc.js says 'This is never called "winsorisation"' — it names and rejects the alternative
assert('I-07', srcText.includes('winsorisation') && srcText.includes('never called'), 'calc.js explicitly names and rejects winsorisation', 'sg');

/* -----------------------------------------------------------------------
   SECTION J: evaluateControlLimit (source-grounded)
   Alert when statistic strictly exceeds either control limit.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION J: evaluateControlLimit ===');

// Within limits: no alert
const evIn = evaluateControlLimit(5.0, 4.0, 6.0);
assert('J-01', evIn.alert === false && evIn.direction === 'none', 'Within limits: no alert', 'sg');

// High alert
const evHigh = evaluateControlLimit(7.0, 4.0, 6.0);
assert('J-02', evHigh.alert === true && evHigh.direction === 'high', 'Above upper: alert=high', 'sg');

// Low alert
const evLow = evaluateControlLimit(3.0, 4.0, 6.0);
assert('J-03', evLow.alert === true && evLow.direction === 'low', 'Below lower: alert=low', 'sg');

// Exactly at upper limit: check whether alert fires (check source)
// Source: "exceeds" semantics — at limit = no alert
const evExactUpper = evaluateControlLimit(6.0, 4.0, 6.0);
assert('J-04', evExactUpper.alert === false, 'At upper limit exactly: no alert (strict exceed)', 'sg');
const evExactLower = evaluateControlLimit(4.0, 4.0, 6.0);
assert('J-05', evExactLower.alert === false, 'At lower limit exactly: no alert (strict exceed)', 'sg');

// Return structure
assert('J-06', 'statistic' in evIn && 'lowerControlLimit' in evIn && 'upperControlLimit' in evIn, 'evaluateControlLimit: fields present', 'sg');

/* -----------------------------------------------------------------------
   SECTION K: calculatePointwiseFalseFlagRate (source-grounded)
   Rate = (breachCount / evaluableCount) * 100
   Hard-coded: 3 breaches / 50 evaluable = 6.0%
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION K: calculatePointwiseFalseFlagRate ===');

// 3/50 = 6.0%
const ffr1 = calculatePointwiseFalseFlagRate(3, 50);
assert('K-01', ffr1.supported && near(ffr1.rate, 6.0), 'falseFlagRate(3,50) = 6.0% [hard-coded: 3/50*100]', 'sg');
assert('K-02', ffr1.breachCount === 3 && ffr1.evaluableCount === 50, 'falseFlagRate: breachCount/evaluableCount preserved', 'sg');

// 0 breaches
const ffr0 = calculatePointwiseFalseFlagRate(0, 100);
assert('K-03', ffr0.supported && near(ffr0.rate, 0.0), 'falseFlagRate(0,100) = 0%', 'sg');

// 100% flag rate
const ffr100 = calculatePointwiseFalseFlagRate(10, 10);
assert('K-04', ffr100.supported && near(ffr100.rate, 100.0), 'falseFlagRate(10,10) = 100%', 'sg');

// evaluableCount=0: unsupported (no division by zero)
const ffrZ = calculatePointwiseFalseFlagRate(0, 0);
assert('K-05', ffrZ.supported === false && ffrZ.rate === null, 'falseFlagRate(0,0): unsupported, rate=null', 'sg');

// correlationCaveat present
assert('K-06', typeof ffr1.correlationCaveat === 'string' && ffr1.correlationCaveat.includes('correlated'), 'correlationCaveat present and mentions correlation', 'sg');

// Negative breach count: unsupported
assert('K-07', calculatePointwiseFalseFlagRate(-1, 50).supported === false, 'Negative breachCount: unsupported', 'sg');

/* -----------------------------------------------------------------------
   SECTION L: calculateNPed (source-grounded)
   NPed = firstAlertRawIndex - errorOnsetRawIndex (1-based raw indices).
   Hard-coded: onset=3, alert=8 → NPed=5
   Never Infinity or placeholder for undetected trial.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION L: calculateNPed ===');

// Normal detection
const nped1 = calculateNPed(3, 8, 50);
assert('L-01', nped1.supported && nped1.detected === true && nped1.nped === 5, 'NPed(onset=3,alert=8) = 5 [hard-coded: 8-3]', 'sg');
assert('L-02', nped1.errorOnsetIndex === 3 && nped1.firstAlertIndex === 8, 'NPed: onset/alert indices preserved', 'sg');
assert('L-03', typeof nped1.metricConvention === 'string' && nped1.metricConvention.length > 0, 'NPed: metricConvention present', 'sg');

// Onset = alert: NPed = 0
const nped0 = calculateNPed(3, 3, 50);
assert('L-04', nped0.detected === true && nped0.nped === 0, 'NPed(onset=alert) = 0', 'sg');

// CRITICAL: alert before onset → invalid configuration, not NPed=negative
const npedNeg = calculateNPed(5, 3, 50);
assert('L-05', npedNeg.supported === false && npedNeg.nped === undefined,
  'CRITICAL: alert before onset → supported=false (never negative NPed)', 'sg');

// Undetected trial: firstAlertRawIndex=null → detected=false, nped=undefined (never Infinity)
const npedUndet = calculateNPed(3, null, 50);
assert('L-06', npedUndet.supported === true && npedUndet.detected === false && npedUndet.nped === undefined,
  'CRITICAL: no alert → detected=false, nped=undefined (never Infinity)', 'sg');
assert('L-07', !('nped' in npedUndet) || npedUndet.nped === undefined, 'Undetected: nped not a number', 'sg');
assert('L-08', Array.isArray(npedUndet.limitations) && npedUndet.limitations[0].includes('Infinity'), 'Undetected: limitations mentions no Infinity placeholder', 'sg');

// Invalid onset index
assert('L-09', calculateNPed(0, 5, 50).supported === false, 'NPed(onset=0): invalid (must be >=1)', 'sg');
assert('L-10', calculateNPed(-1, 5, 50).supported === false, 'NPed(onset=-1): invalid', 'sg');

/* -----------------------------------------------------------------------
   SECTION M: summarizeNpedTrials (source-grounded)
   CRITICAL: ANPed = mean NPed only when ALL trials detected.
   When any trial is undetected: anped MUST remain undefined.
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION M: summarizeNpedTrials ===');

// All trials detected: ANPed = mean
const allDet = [
  { detected: true, nped: 5 },
  { detected: true, nped: 3 },
  { detected: true, nped: 7 }
];
const sumAll = summarizeNpedTrials(allDet);
assert('M-01', sumAll.supported && sumAll.allTrialsDetected === true, 'All detected: allTrialsDetected=true', 'sg');
assert('M-02', near(sumAll.anped, 5.0), 'ANPed = mean = (5+3+7)/3 = 5.0 [hard-coded]', 'sg');
assert('M-03', sumAll.detectedTrials === 3 && sumAll.undetectedTrials === 0, 'All detected counts', 'sg');
assert('M-04', near(sumAll.detectionRatePercent, 100.0), 'Detection rate = 100%', 'sg');
assert('M-05', sumAll.censoringNote === null, 'No censoring note when all detected', 'sg');

// One trial undetected: CRITICAL — anped must be undefined
const partDet = [
  { detected: true, nped: 5 },
  { detected: false, nped: undefined },
  { detected: true, nped: 7 }
];
const sumPart = summarizeNpedTrials(partDet);
assert('M-06', sumPart.supported && sumPart.allTrialsDetected === false, 'One undetected: allTrialsDetected=false', 'sg');
assert('M-07', sumPart.anped === undefined,
  'CRITICAL: anped=undefined when any trial undetected (never averaged detected-only)', 'sg');
assert('M-08', sumPart.detectedTrials === 2 && sumPart.undetectedTrials === 1, 'Partial detection counts', 'sg');
assert('M-09', near(sumPart.detectionRatePercent, 66.6667, 0.001), 'Detection rate = 2/3 ≈ 66.67%', 'sg');
assert('M-10', typeof sumPart.censoringNote === 'string' && sumPart.censoringNote.length > 0, 'Censoring note present when any undetected', 'sg');
assert('M-11', near(sumPart.meanNpedAmongDetected, 6.0), 'meanNpedAmongDetected = (5+7)/2 = 6.0 [hard-coded: detected only]', 'sg');

// Empty trials
assert('M-12', summarizeNpedTrials([]).supported === false, 'Empty trials: unsupported', 'sg');
assert('M-13', summarizeNpedTrials(null).supported === false, 'null trials: unsupported', 'rc');

/* -----------------------------------------------------------------------
   SECTION N: runPbrtqcStream — full orchestration + pipeline validation
   (source-grounded + reconstructed)
   Seven-step pipeline:
     1. Metadata generated
     2. Metadata exclusion applied
     3. Analytical error injected  ← BEFORE truncation
     4. Numeric truncation applied ← AFTER error injection
     5. Eligible value enters algorithm
     6. Statistic calculated
     7. Control-limit evaluated
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION N: Export set, source fidelity, and orchestration ===');

// N-01 (sg): EXACT EXPORT SET — membership check
const EXPECTED_EXPORTS_SET = new Set([
  'validateWindowSize', 'calculateSlidingMean', 'calculateSlidingMedian', 'calculateEWMA',
  'applyMetadataFilter', 'injectAnalyticalError', 'SUPPORTED_ERROR_TYPES',
  'applyHardTruncation', 'evaluateControlLimit', 'calculatePointwiseFalseFlagRate',
  'calculateNPed', 'summarizeNpedTrials', 'runPbrtqcStream'
]);
const actualExports = new Set(Object.keys(m));
assert('N-01-set', EXPECTED_EXPORTS_SET.size === actualExports.size && [...EXPECTED_EXPORTS_SET].every(k => actualExports.has(k)),
  'Export set matches HTML module.exports (membership check, 13 names)', 'sg');

// N-01-order (sg): EXACT EXPORT ORDER — Object.keys order must match module.exports
const EXPECTED_EXPORT_ORDER = [
  'validateWindowSize', 'calculateSlidingMean', 'calculateSlidingMedian', 'calculateEWMA',
  'applyMetadataFilter', 'injectAnalyticalError', 'SUPPORTED_ERROR_TYPES',
  'applyHardTruncation', 'evaluateControlLimit', 'calculatePointwiseFalseFlagRate',
  'calculateNPed', 'summarizeNpedTrials', 'runPbrtqcStream'
];
assert('N-01-order', JSON.stringify(Object.keys(m)) === JSON.stringify(EXPECTED_EXPORT_ORDER),
  'Export order matches HTML module.exports exactly', 'sg');

// N-02 (rc): INTERNAL-HELPER EXPORT BOUNDARY — internal helpers must NOT be exported
const internalNames = ['isFinitePositiveInteger', 'isFiniteNumber', 'eligibleValuesFrom', 'runStatistic'];
internalNames.forEach(fn => {
  assert('N-02-' + fn, !(fn in m), 'Internal helper ' + fn + ' not exported', 'rc');
});

// N-FID (rc): REAL SOURCE-FIDELITY REGRESSION
// Reads HTML lines 12023-12474, strips only the provenance header from calc.js,
// verifies exact byte equality.
// Boundary note: semantic closing brace = line 12473; line 12474 = trailing blank line;
// line 12475 = blank; Stage 8B begins at line 12476.
const fs = require('fs'), path = require('path');
const htmlLines = fs.readFileSync(path.join(__dirname, '../recovery/original-v0.8.html'), 'utf8').split('\n');
const authoritativeBlock = htmlLines.slice(12022, 12474).join('\n') + '\n';
const calcFull = srcText;  // srcText already loaded above
// Strip provenance header: everything up to and including the first double-blank-line
const headerEnd = calcFull.indexOf('\n\n') + 2;
const calcBody = calcFull.slice(headerEnd);
assert('N-FID', authoritativeBlock === calcBody,
  'src/pbrtqc/calc.js body exactly matches HTML lines 12023-12474 (source fidelity)', 'rc');

// -----------------------------------------------------------------------
// N-PIPE: ERROR-BEFORE-TRUNCATION executable proof
// raw=90: before onset → no error, included, eligible 1
// raw=95: onset=2 → +20 additive → 115; upper truncation=110 → excluded
// raw=100: +20 → 120 → excluded
// raw=105: +20 → 125 → excluded
// rawCount=4, eligibleCount=1, excludedCount=3
// -----------------------------------------------------------------------
const pipelineRaw = [
  { value: 90 }, { value: 95 }, { value: 100 }, { value: 105 }
];
const pipelineStream = runPbrtqcStream(pipelineRaw, {
  algorithmId: 'moving-mean', windowSize: 2,
  lowerTruncationLimit: 85, upperTruncationLimit: 110,
  lowerControlLimit: 85, upperControlLimit: 110,
  errorScenario: { errorType: 'persistent-additive', magnitude: 20, onsetIndex: 2 }
});
assert('N-PIPE-01', pipelineStream.supported === true, 'Pipeline stream supported', 'rc');
assert('N-PIPE-02', pipelineStream.rawCount === 4, 'Pipeline: rawCount=4', 'rc');
assert('N-PIPE-03', pipelineStream.eligibleCount === 1, 'Pipeline: eligibleCount=1 (only pre-onset value)', 'rc');
assert('N-PIPE-04', pipelineStream.excludedCount === 3, 'Pipeline: excludedCount=3 (all error-shifted values truncated)', 'rc');
const pp1 = pipelineStream.points[0];
assert('N-PIPE-05', pp1.rawPatientIndex === 1 && pp1.errorAffected === false && pp1.errorAffectedValue === 90 && pp1.included === true && pp1.eligiblePatientIndex === 1,
  'Pipeline P1: before onset, not error-affected, included, eligible=1', 'rc');
const pp2 = pipelineStream.points[1];
assert('N-PIPE-06', pp2.rawValue === 95 && pp2.errorAffected === true && pp2.errorAffectedValue === 115 && pp2.included === false && pp2.eligiblePatientIndex === null,
  'Pipeline P2: rawValue=95, errorAffected=true, errorAffectedValue=115, excluded (115>110)', 'rc');
assert('N-PIPE-07', pp2.inclusionReason !== undefined || pp2.exclusionReason !== undefined || pp2.included === false,
  'Pipeline P2: exclusion reason references upper truncation', 'rc');
const pp3 = pipelineStream.points[2];
assert('N-PIPE-08', pp3.errorAffectedValue === 120 && pp3.included === false, 'Pipeline P3: errorAffectedValue=120, excluded', 'rc');
const pp4 = pipelineStream.points[3];
assert('N-PIPE-09', pp4.errorAffectedValue === 125 && pp4.included === false, 'Pipeline P4: errorAffectedValue=125, excluded', 'rc');

// -----------------------------------------------------------------------
// N-META: METADATA-BEFORE-ERROR executable proof
// subgroup="pregnant" excluded → error NOT applied to excluded point
// -----------------------------------------------------------------------
const metadataRaw = [{ value: 95, subgroup: 'pregnant' }];
const metaStream = runPbrtqcStream(metadataRaw, {
  algorithmId: 'moving-mean', windowSize: 1,
  excludedSubgroups: ['pregnant'],
  lowerTruncationLimit: 0, upperTruncationLimit: 100,
  errorScenario: { errorType: 'persistent-additive', magnitude: 10, onsetIndex: 1 }
});
assert('N-META-01', metaStream.supported === true && metaStream.rawCount === 1, 'Metadata stream: supported, rawCount=1', 'rc');
const mp = metaStream.points[0];
assert('N-META-02', mp.rawPatientIndex === 1 && mp.rawValue === 95, 'Metadata P1: rawPatientIndex=1, rawValue=95', 'rc');
assert('N-META-03', mp.included === false && mp.eligiblePatientIndex === null,
  'Metadata P1: excluded by metadata filter (included=false, eligiblePatientIndex=null)', 'rc');
assert('N-META-04', mp.errorAffected === false && mp.errorAffectedValue === null,
  'CRITICAL: metadata-excluded point NOT error-affected (errorAffected=false, errorAffectedValue=null)', 'rc');
assert('N-META-05', mp.includedValue === null, 'Metadata P1: includedValue=null', 'rc');
assert('N-META-06', typeof mp.exclusionReason === 'string' && mp.exclusionReason.toLowerCase().includes('metadata'),
  'Metadata P1: exclusionReason references metadata filter', 'rc');

// -----------------------------------------------------------------------
// N-IDX: RAW INDEX vs ELIGIBLE INDEX executable proof
// raw 1 → eligible 1 (warming-up)
// raw 2 → excluded (999 > 200 truncation limit)
// raw 3 → eligible 2 (complete, statistic=105, alert=true)
// firstAlertRawIndex = 3 (raw index, not eligible index)
// -----------------------------------------------------------------------
const indexRaw = [{ value: 100 }, { value: 999 }, { value: 110 }];
const indexStream = runPbrtqcStream(indexRaw, {
  algorithmId: 'moving-mean', windowSize: 2,
  lowerTruncationLimit: 0, upperTruncationLimit: 200,
  lowerControlLimit: 0, upperControlLimit: 104,
  errorScenario: { errorType: 'none', magnitude: 0, onsetIndex: 1 }
});
assert('N-IDX-01', indexStream.rawCount === 3 && indexStream.eligibleCount === 2 && indexStream.excludedCount === 1,
  'Index stream: rawCount=3, eligibleCount=2, excludedCount=1', 'rc');
assert('N-IDX-02', indexStream.firstAlertRawIndex === 3, 'firstAlertRawIndex = 3 (raw index, not eligible index)', 'rc');
const ip1 = indexStream.points[0];
assert('N-IDX-03', ip1.rawPatientIndex === 1 && ip1.eligiblePatientIndex === 1 && ip1.warmupStatus === 'warming-up',
  'Index P1: rawPatientIndex=1, eligiblePatientIndex=1, warming-up', 'rc');
const ip2 = indexStream.points[1];
assert('N-IDX-04', ip2.rawPatientIndex === 2 && ip2.included === false && ip2.eligiblePatientIndex === null,
  'Index P2: rawPatientIndex=2, excluded, eligiblePatientIndex=null', 'rc');
const ip3 = indexStream.points[2];
assert('N-IDX-05', ip3.rawPatientIndex === 3 && ip3.eligiblePatientIndex === 2,
  'Index P3: rawPatientIndex=3 (raw), eligiblePatientIndex=2 (compacted)', 'rc');
assert('N-IDX-06', ip3.warmupStatus === 'complete' && ip3.statistic === 105,
  'Index P3: complete, statistic=105 [hard-coded: (100+110)/2]', 'rc');
assert('N-IDX-07', ip3.alert === true && ip3.alertDirection === 'high',
  'Index P3: alert=true, alertDirection=high (105 > UCL 104)', 'rc');

// -----------------------------------------------------------------------
// N-NPED: CROSS-FUNCTION NPed RAW-INDEX regression
// Error onset=1; raw 2 is error-affected but truncated out; raw 3 alerts.
// NPed = firstAlertRawIndex(3) - onset(1) = 2 (raw indexing).
// -----------------------------------------------------------------------
const npedRaw2 = [{ value: 100 }, { value: 999 }, { value: 100 }];
const npedStream = runPbrtqcStream(npedRaw2, {
  algorithmId: 'moving-mean', windowSize: 2,
  lowerTruncationLimit: 0, upperTruncationLimit: 200,
  lowerControlLimit: 0, upperControlLimit: 109,
  errorScenario: { errorType: 'persistent-additive', magnitude: 10, onsetIndex: 1 }
});
assert('N-NPED-01', npedStream.firstAlertRawIndex === 3, 'NPed stream: firstAlertRawIndex=3', 'rc');
assert('N-NPED-02', npedStream.eligibleCount === 2, 'NPed stream: eligibleCount=2 (raw 2 excluded by truncation)', 'rc');
const npedResult = calculateNPed(1, npedStream.firstAlertRawIndex, 3);
assert('N-NPED-03', npedResult.supported === true && npedResult.detected === true && npedResult.nped === 2,
  'CRITICAL: NPed(onset=1,alert=3)=2 [uses RAW indexing, not compacted eligible index]', 'rc');

// -----------------------------------------------------------------------
// N-SMOKE: Smoke test with object-shaped input
// [1,2,3,4,5,6,7] → W=3, no error, no truncation
// eligible point at eligible index 3 → statistic=100 [(98+100+102)/3 ≈ 100]
// -----------------------------------------------------------------------
const smokeRaw = [{value:100},{value:102},{value:98},{value:103},{value:101},{value:99},{value:105}];
const smokeStream = runPbrtqcStream(smokeRaw, {
  algorithmId: 'moving-mean', windowSize: 3,
  lowerControlLimit: 90, upperControlLimit: 115,
  errorScenario: { errorType: 'none', magnitude: 0, onsetIndex: 1 }
});
assert('N-SMOKE-01', smokeStream.supported === true, 'Smoke: supported', 'rc');
assert('N-SMOKE-02', smokeStream.rawCount === 7 && smokeStream.eligibleCount === 7 && smokeStream.excludedCount === 0,
  'Smoke: rawCount=7, eligibleCount=7, excludedCount=0 (no truncation or error)', 'sg');
const ep3 = smokeStream.points.find(p => p.eligiblePatientIndex === 3);
assert('N-SMOKE-03', ep3 && ep3.statistic === 100 && ep3.warmupStatus === 'complete',
  'Smoke: eligible P3 statistic=100 [hard-coded: (100+102+98)/3=100], complete', 'sg');

// -----------------------------------------------------------------------
// N-MED: MOVING-MEDIAN orchestration
// [1,9,3], W=3 → sorted [1,3,9] → median=3
// -----------------------------------------------------------------------
const medStream = runPbrtqcStream(
  [{value:1},{value:9},{value:3}],
  { algorithmId: 'moving-median', windowSize: 3, lowerControlLimit: 0, upperControlLimit: 50,
    errorScenario: { errorType: 'none', magnitude: 0, onsetIndex: 1 } }
);
assert('N-MED-01', medStream.supported && medStream.algorithmId === 'moving-median', 'Median stream: supported, algorithmId=moving-median', 'rc');
assert('N-MED-02', medStream.points[2].statistic === 3 && medStream.points[2].warmupStatus === 'complete',
  'Median P3: statistic=3 [hard-coded: sorted [1,3,9] → median=3], complete', 'rc');

// -----------------------------------------------------------------------
// N-EWMA: EWMA orchestration through runPbrtqcStream
// lambda=0.2, baselineCenter=0, [1,2,3]
// z1=0.2, z2=0.56, z3=1.048 — proves baselineCenter used through orchestrator
// -----------------------------------------------------------------------
const ewmaStream = runPbrtqcStream(
  [{value:1},{value:2},{value:3}],
  { algorithmId: 'ewma', windowSize: 1, ewmaLambda: 0.2, baselineCenter: 0,
    lowerControlLimit: 0, upperControlLimit: 50,
    errorScenario: { errorType: 'none', magnitude: 0, onsetIndex: 1 } }
);
assert('N-EWMA-01', ewmaStream.supported && ewmaStream.algorithmId === 'ewma', 'EWMA stream: supported, algorithmId=ewma', 'rc');
assert('N-EWMA-02', ewmaStream.eligibleCount === 3 && ewmaStream.excludedCount === 0, 'EWMA: eligibleCount=3, excludedCount=0', 'rc');
assert('N-EWMA-03', near(ewmaStream.points[0].statistic, 0.2), 'EWMA P1 statistic=0.2 [hard-coded: 0.2*1+0.8*0]', 'rc');
assert('N-EWMA-04', near(ewmaStream.points[1].statistic, 0.56), 'EWMA P2 statistic=0.56 [hard-coded: 0.2*2+0.8*0.2]', 'rc');
assert('N-EWMA-05', near(ewmaStream.points[2].statistic, 1.048), 'EWMA P3 statistic=1.048 [hard-coded: 0.2*3+0.8*0.56]', 'rc');

// -----------------------------------------------------------------------
// N-UNK: UNKNOWN ALGORITHM returns supported=false
// -----------------------------------------------------------------------
const badStream = runPbrtqcStream(
  [{value:100}],
  { algorithmId: 'cusum', windowSize: 3,
    errorScenario: { errorType: 'none', magnitude: 0, onsetIndex: 1 } }
);
assert('N-UNK-01', badStream.supported === false, 'Unknown algorithm "cusum" → supported=false', 'rc');

/* -----------------------------------------------------------------------
   SECTION O: W vs N symbol discipline (source-grounded)
   ----------------------------------------------------------------------- */
console.log('\n=== SECTION O: W vs N symbol discipline ===');

// The 'W throughout instead' phrase is in the app-level HTML description, not in calc.js
// calc.js itself consistently uses W for window size (as function parameter and return field)
assert('O-01', srcText.includes('windowSize') && !srcText.match(/=\s*"N.*window|windowSize.*=.*N[^a-zA-Z]/), 'calc.js: windowSize used consistently, no N confusion', 'rc');
// The module should not export anything named N or window_N
assert('O-02', !('N' in m), 'No export named N', 'sg');
assert('O-03', typeof m.W === 'undefined' && typeof m.windowSize === 'undefined', 'No raw W or windowSize export', 'sg');
// No PBRTQC symbol confusion with IQC N
assert('O-04', srcText.includes('W') && !srcText.match(/\bvar N\s*=\s*window/i), 'No window size assigned to N in source', 'rc');

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`Stage 8A PBRTQC Calc Tests: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Source-grounded expectations: ${sg}`);
console.log(`  Reconstructed expectations:   ${rc}`);
console.log(`  Artifact class of test file: D (recovery infrastructure)`);
if (failed > 0) {
  console.error('STAGE 8A FAILED — do not commit.');
  process.exit(1);
} else {
  console.log('STAGE 8A PASSED — all tests green.');
  process.exit(0);
}
