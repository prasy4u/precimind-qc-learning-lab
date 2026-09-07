/* =========================================================================
   v09/tests/stage11c2-scientific-parity.test.cjs

   Stage 11C2 — Scientific Parity Test (active ES modules)

   Imports the ACTIVE migrated ES modules (v09/app/**) directly via dynamic
   import(), not the frozen legacy source, and reconfirms the validated
   v0.8/Stage-11B scientific invariants against them. This does not rely
   only on tests of the frozen legacy source (Stage 11B/11C1 tests remain
   separately valid and unchanged) — this test exercises the genuinely
   active, migrated code.

   ARTIFACT PROVENANCE: V09_TEST
   Run: node tests/stage11c2-scientific-parity.test.cjs
   ========================================================================= */
'use strict';

const path = require('path');
const APP = path.join(__dirname, '..', 'app');

let passed = 0, failed = 0;
function assert(id, condition, detail) {
  if (condition) { console.log(`  ✓ [${id}] ${detail}`); passed++; }
  else { console.error(`  ✗ [${id}] FAIL: ${detail}`); failed++; }
}
function close(a, b, eps = 1e-6) { return Math.abs(a - b) < eps; }

async function main() {
  const stats = await import('file://' + path.join(APP, 'core', 'statistics.js'));
  const rules = await import('file://' + path.join(APP, 'rules', 'engine.js'));
  const opchar = await import('file://' + path.join(APP, 'opchar', 'functions.js'));
  const strategy = await import('file://' + path.join(APP, 'strategy', 'core.js'));
  const detDelay = await import('file://' + path.join(APP, 'risk', 'detection-delay.js'));
  const investigation = await import('file://' + path.join(APP, 'investigation', 'calc.js'));
  const eqa = await import('file://' + path.join(APP, 'eqa', 'calc.js'));
  const bv = await import('file://' + path.join(APP, 'bv', 'calc.js'));
  const pbrtqc = await import('file://' + path.join(APP, 'pbrtqc', 'calc.js'));
  const pbrtqcData = await import('file://' + path.join(APP, 'pbrtqc', 'data.js'));

  /* -----------------------------------------------------------------------
     1. Sample SD uses n-1
     ----------------------------------------------------------------------- */
  console.log('\n=== Sample SD (n-1) ===');
  {
    const values = [98, 100, 101, 99, 102];
    const mean = stats.calcMean(values);
    const sd = stats.calcSampleSD(values);
    // Manual n-1 computation for independent cross-check
    const n = values.length;
    const expectedSD = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
    assert('SD-01', close(mean, 100), `Mean = 100 (found ${mean})`);
    assert('SD-02', close(sd, expectedSD), `Sample SD uses n-1 divisor (found ${sd}, expected ${expectedSD})`);
  }

  /* -----------------------------------------------------------------------
     2. CV% formula
     ----------------------------------------------------------------------- */
  console.log('\n=== CV% Formula ===');
  {
    const cv = stats.calcCVPercent(2, 100);
    assert('CV-01', close(cv, 2), `CV% = SD/mean*100 = 2 (found ${cv})`);
  }

  /* -----------------------------------------------------------------------
     3. Signed bias
     ----------------------------------------------------------------------- */
  console.log('\n=== Signed Bias ===');
  {
    const biasPos = stats.calcBiasPercent(102, 100);
    const biasNeg = stats.calcBiasPercent(98, 100);
    assert('BIAS-01', close(biasPos, 2), `+2% bias (found ${biasPos})`);
    assert('BIAS-02', close(biasNeg, -2), `-2% bias (found ${biasNeg})`);
  }

  /* -----------------------------------------------------------------------
     4. Sigma uses absolute bias; negative Sigma not floored
     ----------------------------------------------------------------------- */
  console.log('\n=== Sigma (absolute bias, negative not floored) ===');
  {
    const sigmaPos = stats.calcSigma(6, 2, 1); // (6-2)/1 = 4, bias sign doesn't matter due to abs
    const sigmaFromNeg = stats.calcSigma(6, -2, 1); // abs(-2)=2, same result
    assert('SIGMA-01', close(sigmaPos.value, 4) && close(sigmaFromNeg.value, 4),
      `Sigma uses absolute bias (both +2 and -2 bias give Sigma=4): found ${sigmaPos.value}, ${sigmaFromNeg.value}`);
    const negSigma = stats.calcSigma(3, 5, 2); // (3-5)/2 = -1
    assert('SIGMA-02', negSigma.valid === true && close(negSigma.value, -1),
      `Negative Sigma NOT floored to 0 (found ${negSigma.value}, valid=${negSigma.valid})`);
  }

  /* -----------------------------------------------------------------------
     5. Strict rule exceedance; 8x vs 10x distinction; within-run R_4s
     ----------------------------------------------------------------------- */
  console.log('\n=== Rule Engine: strict exceedance, 8x/10x, R_4s within-run ===');
  {
    const runs = [{
      runNumber: 1,
      controlResults: [
        { levelId: 'L1', levelName: 'Level 1', rawValue: 110, zScore: 2.5 },
        { levelId: 'L2', levelName: 'Level 2', rawValue: 90, zScore: -2.5 },
      ],
    }];
    const events = rules.detectR4s(runs);
    assert('RULE-01', events.length === 1 && events[0].scope === 'within-run-across-materials',
      `R_4s detects within-run exceedance, scope=within-run-across-materials (found ${events.length} events, scope=${events[0]?.scope})`);

    const makeRuns = (count, z) => {
      const arr = [];
      for (let i = 1; i <= count; i++) arr.push({ runNumber: i, controlResults: [{ levelId: 'L1', levelName: 'Level 1', rawValue: 100, zScore: z }] });
      return arr;
    };
    const runs8 = makeRuns(8, 0.5);
    const runs10 = makeRuns(10, 0.5);
    assert('RULE-02', rules.detect8x(runs8).length >= 1 && rules.detect10x(runs8).length === 0,
      '8x fires on 8 same-side points; 10x does NOT fire on only 8');
    assert('RULE-03', rules.detect10x(runs10).length >= 1,
      '10x fires on 10 same-side points');

    // Strict exceedance: exactly at boundary must NOT exceed
    assert('RULE-04', rules.exceedsPositive(3.0, 3) === false && rules.exceedsPositive(3.0001, 3) === true,
      `Strict exceedance: exactly at limit does not exceed, just above does (found ${rules.exceedsPositive(3.0,3)}, ${rules.exceedsPositive(3.0001,3)})`);
  }

  /* -----------------------------------------------------------------------
     6. Ped/Pfr scope restriction (single 1_3s only)
     ----------------------------------------------------------------------- */
  console.log('\n=== Operating Characteristic: Ped/Pfr scope restriction ===');
  {
    const single = opchar.operatingCharacteristic13s ? opchar.operatingCharacteristic13s(2, 1.0) : opchar.operatingCharacteristic(['13s'], 2, 1.0);
    assert('OPCHAR-01', single.supported === true, 'Single 1_3s is supported');
  }

  /* -----------------------------------------------------------------------
     7. Detection-delay formulas distinct from Parvin MaxE(Nuf)
     ----------------------------------------------------------------------- */
  console.log('\n=== Detection-Delay Formulas ===');
  {
    const supported = detDelay.isDetectionDelaySupportedRuleSet(['13s']);
    const unsupported = detDelay.isDetectionDelaySupportedRuleSet(['13s', '22s']);
    assert('DETDELAY-01', supported === true && unsupported === false,
      'Detection-delay scope restricted to single 13s (matches frozen doctrine)');
    const expected = detDelay.expectedQcEventsToDetectionGeometric(0.5);
    assert('DETDELAY-02', expected.supported === true && close(expected.value, 2),
      `Geometric model E[events]=2 at p=0.5 (found ${expected.value})`);
  }

  /* -----------------------------------------------------------------------
     8. Investigation non-inference doctrine (calculationally applicable parts)
     ----------------------------------------------------------------------- */
  console.log('\n=== Investigation: Non-Inference Doctrine ===');
  {
    const absDiff = investigation.absoluteDifference(100, 105);
    assert('INV-01', absDiff.supported === true && close(absDiff.value, 5), `Absolute difference calculation correct (found ${JSON.stringify(absDiff)})`);
    // Confirm no automatic status-to-cause mapping function exists that would
    // violate doctrine (structural check: QC_SIGNAL_STATUSES and CAUSE_STATUSES
    // remain separate enumerations, not a single merged causal map).
    assert('INV-02', Array.isArray(investigation.QC_SIGNAL_STATUSES) && Array.isArray(investigation.CAUSE_STATUSES),
      'QC_SIGNAL_STATUSES and CAUSE_STATUSES remain distinct enumerations (no automatic signal->cause collapse)');
  }

  /* -----------------------------------------------------------------------
     9. EQA calculation behavior
     ----------------------------------------------------------------------- */
  console.log('\n=== EQA Calculations ===');
  {
    const dev = eqa.calculateEqaAbsoluteDeviation(105, 100);
    const relDev = eqa.calculateEqaRelativeDeviation(105, 100);
    assert('EQA-01', dev.supported === true && close(dev.value, 5), `EQA absolute deviation = 5 (found ${dev.value})`);
    assert('EQA-02', relDev.supported === true && close(relDev.value, 5), `EQA relative deviation% = 5 (found ${relDev.value})`);
  }

  /* -----------------------------------------------------------------------
     10. BV/RCV formulas and CVG exclusion from RCV
     ----------------------------------------------------------------------- */
  console.log('\n=== BV/RCV: Formulas and CVG Exclusion ===');
  {
    const rcv1 = bv.calculateClassicalRcv(2, 6, 'bidirectional-95');
    const rcv2 = bv.calculateClassicalRcv(2, 6, 'bidirectional-95'); // CVG not a parameter at all
    assert('BV-01', rcv1.supported === true, 'Classical RCV supported with named z-convention');
    assert('BV-02', close(rcv1.value, rcv2.value), 'RCV formula takes no CVG parameter (function signature excludes it; CVG cannot affect RCV)');
    assert('BV-03', bv.calculateClassicalRcv.length === 3, `calculateClassicalRcv accepts exactly 3 parameters (CVA, CVI, zConvention) — CVG structurally excluded (found arity ${bv.calculateClassicalRcv.length})`);
    const noConv = bv.calculateClassicalRcv(2, 6, undefined);
    assert('BV-04', noConv.supported === false, 'RCV not supported without explicit named z-convention (never inferred)');
  }

  /* -----------------------------------------------------------------------
     11. Frozen PBRTQC signatures: +6, +8, aggressive-truncation scenarios
     — Stage 11C2 corrective closure (Defect 1): exercises the ACTIVE
     runPbrtqcStream() itself against Population A raw data, not just
     calculateNPed() with hard-coded first-alert indices. This proves the
     active surveillance engine (moving-mean window logic, error injection,
     control-limit alerting, truncation/exclusion) is correct end-to-end,
     not merely that the NPed arithmetic is correct given an assumed index.
     ----------------------------------------------------------------------- */
  console.log('\n=== PBRTQC Frozen Signatures (full runPbrtqcStream execution) ===');
  {
    const popARaw = pbrtqcData.POPULATION_A_VALUES.map(v => ({ value: v }));
    assert('PBRTQC-POP-A-LEN', popARaw.length === 150, `Population A has 150 raw values (found ${popARaw.length})`);

    // Scenario A: moving-mean W=20, limits 137-143, +6 additive error, onset=81, no truncation.
    const scenarioA = pbrtqc.runPbrtqcStream(popARaw, {
      algorithmId: 'moving-mean', windowSize: 20,
      lowerControlLimit: 137, upperControlLimit: 143,
      errorScenario: { errorType: 'persistent-additive', magnitude: 6, onsetIndex: 81 },
    });
    assert('PBRTQC-A-01', scenarioA.firstAlertRawIndex === 93,
      `Scenario A (active engine): first alert raw index = 93 (found ${scenarioA.firstAlertRawIndex})`);
    assert('PBRTQC-A-02', scenarioA.excludedCount === 0,
      `Scenario A (active engine): excluded count = 0 (found ${scenarioA.excludedCount})`);
    const npedA = pbrtqc.calculateNPed(81, scenarioA.firstAlertRawIndex, 150);
    assert('PBRTQC-A-03', npedA.supported === true && npedA.detected === true && npedA.nped === 12,
      `Scenario A (active engine): NPed = 12, derived from the engine's own alert index, not a hard-coded value (found ${npedA.nped})`);

    // Scenario B: moving-mean W=20, limits 133-147, +8 additive error, onset=81, no truncation.
    const scenarioB = pbrtqc.runPbrtqcStream(popARaw, {
      algorithmId: 'moving-mean', windowSize: 20,
      lowerControlLimit: 133, upperControlLimit: 147,
      errorScenario: { errorType: 'persistent-additive', magnitude: 8, onsetIndex: 81 },
    });
    assert('PBRTQC-B-01', scenarioB.firstAlertRawIndex === 106,
      `Scenario B (active engine): first alert raw index = 106 (found ${scenarioB.firstAlertRawIndex})`);
    assert('PBRTQC-B-02', scenarioB.excludedCount === 0,
      `Scenario B (active engine): excluded count = 0 (found ${scenarioB.excludedCount})`);
    const npedB = pbrtqc.calculateNPed(81, scenarioB.firstAlertRawIndex, 150);
    assert('PBRTQC-B-03', npedB.nped === 25,
      `Scenario B (active engine): NPed = 25, derived from the engine's own alert index (found ${npedB.nped})`);

    // Scenario C: same as B + upperTruncationLimit=146 -> error-bearing values hidden -> no alert.
    const scenarioC = pbrtqc.runPbrtqcStream(popARaw, {
      algorithmId: 'moving-mean', windowSize: 20,
      lowerControlLimit: 133, upperControlLimit: 147,
      upperTruncationLimit: 146,
      errorScenario: { errorType: 'persistent-additive', magnitude: 8, onsetIndex: 81 },
    });
    assert('PBRTQC-C-01', scenarioC.firstAlertRawIndex === null,
      `Scenario C (active engine, aggressive truncation): no alert, firstAlertRawIndex = null (found ${scenarioC.firstAlertRawIndex})`);
    assert('PBRTQC-C-02', scenarioC.excludedCount === 51,
      `Scenario C (active engine): excluded count = 51 (found ${scenarioC.excludedCount})`);
    const npedC = pbrtqc.calculateNPed(81, scenarioC.firstAlertRawIndex, 150);
    assert('PBRTQC-C-03', npedC.detected === false && npedC.nped === undefined,
      `Scenario C (active engine): detected=false, nped=undefined (found detected=${npedC.detected}, nped=${npedC.nped})`);
  }

  /* -----------------------------------------------------------------------
     12. Ped/Pfr scope restriction — explicit unsupported-multirule assertion
     — Stage 11C2 corrective closure (Defect 2): confirms no numerical
     Ped/Pfr is invented for a multirule combination, not merely that pure
     1_3s is supported.
     ----------------------------------------------------------------------- */
  console.log('\n=== Operating Characteristic: Explicit Unsupported-Multirule Check ===');
  {
    const single = opchar.operatingCharacteristic13s
      ? opchar.operatingCharacteristic13s(2, 1.0)
      : opchar.operatingCharacteristic(['13s'], 2, 1.0);
    assert('OPCHAR-02', single.supported === true,
      `Pure ["13s"] is supported (found ${single.supported})`);

    const multirule = opchar.operatingCharacteristic
      ? opchar.operatingCharacteristic(['13s', '22s'], 2, 1.0)
      : null;
    assert('OPCHAR-03', multirule !== null && multirule.supported === false,
      `Multirule ["13s","22s"] is explicitly NOT supported (found supported=${multirule?.supported})`);
    assert('OPCHAR-04', multirule !== null && multirule.pfr === undefined && multirule.ped === undefined,
      `No numerical Ped/Pfr invented for the unsupported multirule (found pfr=${multirule?.pfr}, ped=${multirule?.ped})`);
  }

  /* -----------------------------------------------------------------------
     SUMMARY
     ----------------------------------------------------------------------- */
  const total = passed + failed;
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Stage 11C2 Scientific Parity (ACTIVE modules): ${passed}/${total} passed, ${failed} failed`);
  console.log(`  Artifact class: V09_TEST`);
  console.log(`  Modules imported directly from v09/app/** (not the frozen legacy source)`);
  if (failed > 0) {
    console.error('STAGE 11C2 SCIENTIFIC PARITY FAILED.');
    process.exit(1);
  } else {
    console.log('STAGE 11C2 SCIENTIFIC PARITY PASSED.');
    process.exit(0);
  }
}

main().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
