/* =========================================================================
   v09/tests/unit/v09-scientific-compat.test.js

   Stage 11B — v0.9 Unit Compatibility Gate (Layer 1)

   Purpose: verify the copied/unchanged scientific functions in v09/src
   still satisfy the critical frozen v0.8 signatures. This is NOT a
   replacement for the full 3849-assertion v0.8 historical suite (root
   tests/), which continues to run unchanged and remains authoritative.
   This is a fast compatibility smoke gate for v0.9 development.

   ARTIFACT PROVENANCE: V09_TEST
   Run: node v09/tests/unit/v09-scientific-compat.test.js
   ========================================================================= */
'use strict';

const path = require('path');
const V09_SRC = path.join(__dirname, '..', '..', 'src');

let passed = 0, failed = 0;
function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}
function close(a, b, eps = 1e-6) { return Math.abs(a - b) < eps; }

/* -----------------------------------------------------------------------
   1. Sample SD
   ----------------------------------------------------------------------- */
console.log('\n=== Sample SD ===');
const stats = require(path.join(V09_SRC, 'core', 'statistics.js'));
{
  const values = [98, 100, 101, 99, 102];
  const mean = stats.calcMean(values);
  const sd = stats.calcSampleSD(values);
  assert('SD-01', close(mean, 100), `Mean of [98,100,101,99,102] = 100 (found ${mean})`);
  assert('SD-02', sd > 0 && isFinite(sd), `Sample SD is a positive finite number (found ${sd})`);
}

/* -----------------------------------------------------------------------
   2. Signed bias
   ----------------------------------------------------------------------- */
console.log('\n=== Signed Bias ===');
{
  const bias = stats.calcBiasPercent(102, 100);
  assert('BIAS-01', close(bias, 2), `Bias% of observed=102, target=100 = +2% (found ${bias})`);
  const biasNeg = stats.calcBiasPercent(98, 100);
  assert('BIAS-02', close(biasNeg, -2), `Bias% of observed=98, target=100 = -2% (found ${biasNeg})`);
}

/* -----------------------------------------------------------------------
   3. Negative Sigma preservation (not clamped to zero)
   ----------------------------------------------------------------------- */
console.log('\n=== Negative Sigma Preservation ===');
{
  const result = stats.calcSigma(3, 5, 2); // TEa=3%, |bias|=5%, CV=2% => (3-5)/2 = -1
  assert('SIGMA-01', result.valid === true, 'calcSigma remains valid=true for negative result');
  assert('SIGMA-02', close(result.value, -1), `Sigma = -1 (not clamped to 0) (found ${result.value})`);
  assert('SIGMA-03', typeof result.warning === 'string' && result.warning.length > 0,
    'Negative-Sigma warning text present');
}

/* -----------------------------------------------------------------------
   4. Rule engine R_4s within-run
   ----------------------------------------------------------------------- */
console.log('\n=== Rule Engine: R_4s Within-Run ===');
const rules = require(path.join(V09_SRC, 'rules', 'engine.js'));
{
  const runs = [{
    runNumber: 1,
    controlResults: [
      { levelId: 'L1', levelName: 'Level 1', rawValue: 110, zScore: 2.5 },
      { levelId: 'L2', levelName: 'Level 2', rawValue: 90, zScore: -2.5 },
    ],
  }];
  const events = rules.detectR4s(runs);
  assert('R4S-01', events.length === 1, `R_4s detects within-run opposite-side exceedance (found ${events.length} events)`);
  assert('R4S-02', events[0]?.scope === 'within-run-across-materials',
    `R_4s scope = "within-run-across-materials" (found "${events[0]?.scope}")`);
}

/* -----------------------------------------------------------------------
   5. 8x vs 10x distinction
   ----------------------------------------------------------------------- */
console.log('\n=== 8x vs 10x Distinction ===');
{
  const makeRuns = (count, z) => {
    const runs = [];
    for (let i = 1; i <= count; i++) {
      runs.push({ runNumber: i, controlResults: [{ levelId: 'L1', levelName: 'Level 1', rawValue: 100, zScore: z }] });
    }
    return runs;
  };
  const runs8 = makeRuns(8, 0.5);
  const runs10 = makeRuns(10, 0.5);
  const events8x_on8 = rules.detect8x(runs8);
  const events10x_on8 = rules.detect10x(runs8);
  const events10x_on10 = rules.detect10x(runs10);
  assert('8X10X-01', events8x_on8.length >= 1, `8x fires on 8 same-side points (found ${events8x_on8.length})`);
  assert('8X10X-02', events10x_on8.length === 0, `10x does NOT fire on only 8 same-side points (found ${events10x_on8.length})`);
  assert('8X10X-03', events10x_on10.length >= 1, `10x fires on 10 same-side points (found ${events10x_on10.length})`);
}

/* -----------------------------------------------------------------------
   6. Single 1_3s operating characteristic support
   ----------------------------------------------------------------------- */
console.log('\n=== Operating Characteristic: Single 1_3s ===');
const opchar = require(path.join(V09_SRC, 'opchar', 'functions.js'));
{
  const supported = opchar.operatingCharacteristic(['13s'], 2, 1.0);
  assert('OPCHAR-01', supported.supported === true, 'Single 1_3s is supported');
  assert('OPCHAR-02', typeof supported.pfr === 'number' && typeof supported.ped === 'number',
    'Single 1_3s returns numeric pfr and ped');
  const unsupportedMulti = opchar.operatingCharacteristic(['13s', '22s'], 2, 1.0);
  assert('OPCHAR-03', unsupportedMulti.supported === false, 'Multirule (13s+22s) is NOT supported');
  const unsupported8x = opchar.operatingCharacteristic(['8x'], 2, 1.0);
  assert('OPCHAR-04', unsupported8x.supported === false, '8x alone is NOT supported (validated only for 13s)');
}

/* -----------------------------------------------------------------------
   7. Detection delay model
   ----------------------------------------------------------------------- */
console.log('\n=== Detection Delay Model ===');
const detDelay = require(path.join(V09_SRC, 'risk', 'detection-delay.js'));
{
  const supported = detDelay.isDetectionDelaySupportedRuleSet(['13s']);
  const unsupported = detDelay.isDetectionDelaySupportedRuleSet(['13s', '22s']);
  assert('DETDELAY-01', supported === true, 'Single 13s is detection-delay supported');
  assert('DETDELAY-02', unsupported === false, 'Multirule is NOT detection-delay supported');
  const expected = detDelay.expectedQcEventsToDetectionGeometric(0.5);
  assert('DETDELAY-03', expected.supported === true && close(expected.value, 2),
    `E[events to detection] at p=0.5 is 2 (found ${expected.value})`);
}

/* -----------------------------------------------------------------------
   8. EQA safeguards (calc functions load and behave)
   ----------------------------------------------------------------------- */
console.log('\n=== EQA Safeguards ===');
const eqa = require(path.join(V09_SRC, 'eqa', 'calc.js'));
{
  const dev = eqa.calculateEqaAbsoluteDeviation(105, 100);
  assert('EQA-01', dev.supported === true && close(dev.value, 5), `EQA absolute deviation = 5 (found ${dev.value})`);
  const relDev = eqa.calculateEqaRelativeDeviation(105, 100);
  assert('EQA-02', relDev.supported === true && close(relDev.value, 5), `EQA relative deviation% = 5 (found ${relDev.value})`);
}

/* -----------------------------------------------------------------------
   9. RCV (classical, named z-convention required)
   ----------------------------------------------------------------------- */
console.log('\n=== RCV ===');
const bv = require(path.join(V09_SRC, 'bv', 'calc.js'));
{
  const rcv = bv.calculateClassicalRcv(2, 3, 'bidirectional-95');
  assert('RCV-01', rcv.supported === true, 'Classical RCV supported with named z-convention');
  assert('RCV-02', rcv.value > 0, `RCV value is positive (found ${rcv.value})`);
  const rcvNoConv = bv.calculateClassicalRcv(2, 3, undefined);
  assert('RCV-03', rcvNoConv.supported === false,
    'RCV NOT supported without an explicit named z-convention (never inferred)');
}

/* -----------------------------------------------------------------------
   10. PBRTQC frozen signatures (via calc functions directly)
   ----------------------------------------------------------------------- */
console.log('\n=== PBRTQC Frozen Signatures (direct calc) ===');
const pbrtqc = require(path.join(V09_SRC, 'pbrtqc', 'calc.js'));
{
  // Case A: onset=81, firstAlert=93 -> NPed=12
  const nA = pbrtqc.calculateNPed(81, 93, 150);
  assert('PBRTQC-01', nA.supported === true && nA.detected === true, 'Case A: NPed calculation supported/detected');
  assert('PBRTQC-02', nA.nped === 12, `Case A: NPed = 12 (found ${nA.nped})`);

  // Case B: onset=81, firstAlert=106 -> NPed=25
  const nB = pbrtqc.calculateNPed(81, 106, 150);
  assert('PBRTQC-03', nB.nped === 25, `Case B: NPed = 25 (found ${nB.nped})`);

  // Case C: no alert -> nped undefined, detected=false
  const nC = pbrtqc.calculateNPed(81, null, 150);
  assert('PBRTQC-04', nC.detected === false && nC.nped === undefined,
    `Case C: no alert => detected=false, nped=undefined (found detected=${nC.detected}, nped=${nC.nped})`);
}

/* -----------------------------------------------------------------------
   SUMMARY
   ----------------------------------------------------------------------- */
const total = passed + failed;
console.log(`\n${'='.repeat(60)}`);
console.log(`v0.9 Scientific Compatibility Gate: ${passed}/${total} passed, ${failed} failed`);
console.log(`  Artifact class: V09_TEST`);
console.log(`  Purpose: fast compatibility smoke gate, NOT a replacement for the`);
console.log(`  full 3849-assertion v0.8 historical suite (root tests/), which`);
console.log(`  remains the authoritative scientific validation record.`);
if (failed > 0) {
  console.error('v0.9 SCIENTIFIC COMPATIBILITY GATE FAILED.');
  process.exit(1);
} else {
  console.log('v0.9 SCIENTIFIC COMPATIBILITY GATE PASSED.');
  process.exit(0);
}
